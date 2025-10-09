import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  User,
  UserBookmark,
  UserDashboardStats,
  Post,
  Event,
} from '@app/database';

export interface DashboardStatsResponse {
  bookmarks: {
    count: number;
    items: Array<{
      id: string;
      type: 'post' | 'listing' | 'event';
      itemId: string;
      createdAt: Date;
    }>;
  };
  savedDeals: {
    count: number;
  };
  events: {
    attending: number;
    organized: number;
    joined: number;
  };
  posts: {
    shared: number;
  };
  community: {
    neighborsHelped: number;
    trustScore: number;
  };
  lastUpdated: Date;
}

@Injectable()
export class UserStatisticsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserBookmark)
    private readonly bookmarkRepository: Repository<UserBookmark>,
    @InjectRepository(UserDashboardStats)
    private readonly statsRepository: Repository<UserDashboardStats>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  /**
   * Get user dashboard statistics
   */
  async getDashboardStats(userId: string): Promise<DashboardStatsResponse> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Get cached stats or calculate
    let stats = await this.statsRepository.findOne({
      where: { userId },
    });

    // If stats don't exist or are stale (>1 hour), recalculate
    const isStale =
      !stats ||
      !stats.lastCalculatedAt ||
      Date.now() - stats.lastCalculatedAt.getTime() > 3600000; // 1 hour

    if (isStale) {
      stats = await this.calculateAndCacheStats(userId);
    }

    // Ensure stats is not null
    if (!stats) {
      stats = await this.calculateAndCacheStats(userId);
    }

    // Get recent bookmarks for preview
    const bookmarks = await this.bookmarkRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    // Get event counts
    const attendingEvents = await this.eventRepository.count({
      where: {
        attendees: { id: userId },
      },
    });

    // TODO: Update when Event entity has organizerId field
    const organizedEvents = 0; // Placeholder

    return {
      bookmarks: {
        count: stats.bookmarksCount,
        items: bookmarks.map(b => ({
          id: b.id,
          type: b.itemType,
          itemId: b.itemId,
          createdAt: b.createdAt,
        })),
      },
      savedDeals: {
        count: stats.savedDealsCount,
      },
      events: {
        attending: attendingEvents,
        organized: organizedEvents,
        joined: stats.eventsJoinedCount,
      },
      posts: {
        shared: stats.postsSharedCount,
      },
      community: {
        neighborsHelped: stats.neighborsHelpedCount,
        trustScore: user.trustScore,
      },
      lastUpdated: stats.updatedAt,
    };
  }

  /**
   * Calculate and cache dashboard statistics
   */
  async calculateAndCacheStats(
    userId: string,
  ): Promise<UserDashboardStats> {
    // Count bookmarks
    const bookmarksCount = await this.bookmarkRepository.count({
      where: { userId },
    });

    // Count bookmarks of type 'listing' (deals)
    const savedDealsCount = await this.bookmarkRepository.count({
      where: { userId, itemType: 'listing' },
    });

    // Count posts
    const postsSharedCount = await this.postRepository.count({
      where: { userId },
    });

    // Count events joined (from event attendees)
    const eventsJoinedCount = await this.eventRepository
      .createQueryBuilder('event')
      .innerJoin('event.attendees', 'attendee')
      .where('attendee.id = :userId', { userId })
      .getCount();

    // TODO: Calculate neighbors helped (requires activity tracking implementation)
    const neighborsHelpedCount = 0; // Placeholder

    // Upsert stats
    let stats = await this.statsRepository.findOne({
      where: { userId },
    });

    if (!stats) {
      stats = this.statsRepository.create({
        userId,
        bookmarksCount,
        savedDealsCount,
        postsSharedCount,
        eventsJoinedCount,
        neighborsHelpedCount,
        attendingEventsCount: 0, // Will be calculated in real-time
        lastCalculatedAt: new Date(),
      });
    } else {
      stats.bookmarksCount = bookmarksCount;
      stats.savedDealsCount = savedDealsCount;
      stats.postsSharedCount = postsSharedCount;
      stats.eventsJoinedCount = eventsJoinedCount;
      stats.neighborsHelpedCount = neighborsHelpedCount;
      stats.lastCalculatedAt = new Date();
    }

    return this.statsRepository.save(stats);
  }

  /**
   * Add bookmark
   */
  async addBookmark(
    userId: string,
    itemType: 'post' | 'listing' | 'event',
    itemId: string,
  ): Promise<UserBookmark> {
    // Check if bookmark already exists
    const existing = await this.bookmarkRepository.findOne({
      where: { userId, itemType, itemId },
    });

    if (existing) {
      return existing;
    }

    // Create new bookmark
    const bookmark = this.bookmarkRepository.create({
      userId,
      itemType,
      itemId,
    });

    const savedBookmark = await this.bookmarkRepository.save(bookmark);

    // Update cached stats
    await this.incrementBookmarkCount(userId, itemType);

    return savedBookmark;
  }

  /**
   * Remove bookmark
   */
  async removeBookmark(
    userId: string,
    itemType: 'post' | 'listing' | 'event',
    itemId: string,
  ): Promise<{ message: string }> {
    const bookmark = await this.bookmarkRepository.findOne({
      where: { userId, itemType, itemId },
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    await this.bookmarkRepository.remove(bookmark);

    // Update cached stats
    await this.decrementBookmarkCount(userId, itemType);

    return { message: 'Bookmark removed successfully' };
  }

  /**
   * Get user bookmarks by type
   */
  async getBookmarksByType(
    userId: string,
    itemType: 'post' | 'listing' | 'event',
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    bookmarks: UserBookmark[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await this.bookmarkRepository.findAndCount({
      where: { userId, itemType },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      bookmarks,
      total,
      page,
      totalPages,
    };
  }

  /**
   * Check if item is bookmarked
   */
  async isBookmarked(
    userId: string,
    itemType: 'post' | 'listing' | 'event',
    itemId: string,
  ): Promise<boolean> {
    const count = await this.bookmarkRepository.count({
      where: { userId, itemType, itemId },
    });

    return count > 0;
  }

  /**
   * Increment bookmark count in cache
   */
  private async incrementBookmarkCount(
    userId: string,
    itemType: 'post' | 'listing' | 'event',
  ): Promise<void> {
    let stats = await this.statsRepository.findOne({
      where: { userId },
    });

    if (!stats) {
      stats = this.statsRepository.create({
        userId,
        bookmarksCount: 1,
        savedDealsCount: itemType === 'listing' ? 1 : 0,
      });
    } else {
      stats.bookmarksCount++;
      if (itemType === 'listing') {
        stats.savedDealsCount++;
      }
    }

    await this.statsRepository.save(stats);
  }

  /**
   * Decrement bookmark count in cache
   */
  private async decrementBookmarkCount(
    userId: string,
    itemType: 'post' | 'listing' | 'event',
  ): Promise<void> {
    const stats = await this.statsRepository.findOne({
      where: { userId },
    });

    if (stats) {
      stats.bookmarksCount = Math.max(0, stats.bookmarksCount - 1);
      if (itemType === 'listing') {
        stats.savedDealsCount = Math.max(0, stats.savedDealsCount - 1);
      }
      await this.statsRepository.save(stats);
    }
  }

  /**
   * Refresh all user statistics (can be run as cron job)
   */
  async refreshAllUserStats(): Promise<{ updated: number }> {
    const users = await this.userRepository.find({
      where: { isActive: true },
      select: ['id'],
    });

    let updated = 0;
    for (const user of users) {
      try {
        await this.calculateAndCacheStats(user.id);
        updated++;
      } catch (error) {
        console.error(`Failed to update stats for user ${user.id}:`, error);
      }
    }

    return { updated };
  }
}
