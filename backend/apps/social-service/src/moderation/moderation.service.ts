import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Post, PostComment, User } from '@mecabal/database';
import {
  ReportContentDto,
  ModerateContentDto,
  ModerationQueueItemDto,
  ModerationStatsDto,
  ContentReportDto,
  ModerationStatus,
  ReportReason,
} from './dto';

@Injectable()
export class ModerationService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostComment)
    private readonly commentRepository: Repository<PostComment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async reportContent(
    contentId: string,
    contentType: 'post' | 'comment',
    reporterId: string,
    reportDto: ReportContentDto,
  ): Promise<void> {
    // Check if content exists
    const content = await this.getContentById(contentId, contentType);
    if (!content) {
      throw new NotFoundException(`${contentType} not found`);
    }

    // Check if user already reported this content
    // TODO: Implement report tracking in database
    // For now, we'll just log the report
    console.log(`Content ${contentId} reported by ${reporterId}:`, reportDto);

    // Update content moderation status if needed
    if (content.moderationStatus === 'approved') {
      await this.updateContentModerationStatus(contentId, contentType, ModerationStatus.PENDING);
    }
  }

  async moderateContent(
    contentId: string,
    contentType: 'post' | 'comment',
    moderatorId: string,
    moderationDto: ModerateContentDto,
  ): Promise<void> {
    const content = await this.getContentById(contentId, contentType);
    if (!content) {
      throw new NotFoundException(`${contentType} not found`);
    }

    // Update content moderation status
    await this.updateContentModerationStatus(contentId, contentType, moderationDto.status);

    // TODO: Log moderation action
    console.log(`Content ${contentId} moderated by ${moderatorId}:`, moderationDto);
  }

  async getModerationQueue(
    limit: number = 20,
    offset: number = 0,
  ): Promise<ModerationQueueItemDto[]> {
    // Get posts that need moderation
    const postsQuery = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .where('post.moderationStatus = :status', { status: 'pending' })
      .orWhere('post.isApproved = :isApproved', { isApproved: false })
      .orderBy('post.createdAt', 'ASC')
      .limit(limit)
      .offset(offset);

    const posts = await postsQuery.getMany();

    // Get comments that need moderation
    const commentsQuery = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .where('comment.isApproved = :isApproved', { isApproved: false })
      .orderBy('comment.createdAt', 'ASC')
      .limit(limit)
      .offset(offset);

    const comments = await commentsQuery.getMany();

    // Format queue items
    const queueItems: ModerationQueueItemDto[] = [];

    // Add posts to queue
    for (const post of posts) {
      queueItems.push({
        id: post.id,
        contentType: 'post',
        contentPreview: post.content.substring(0, 100) + '...',
        author: {
          id: post.user.id,
          firstName: post.user.firstName,
          lastName: post.user.lastName,
          trustScore: post.user.trustScore || 0,
        },
        status: post.moderationStatus as ModerationStatus,
        reportCount: 0, // TODO: Implement report counting
        createdAt: post.createdAt,
        lastReportedAt: post.createdAt, // TODO: Track last report time
      });
    }

    // Add comments to queue
    for (const comment of comments) {
      queueItems.push({
        id: comment.id,
        contentType: 'comment',
        contentPreview: comment.content.substring(0, 100) + '...',
        author: {
          id: comment.user.id,
          firstName: comment.user.firstName,
          lastName: comment.user.lastName,
          trustScore: comment.user.trustScore || 0,
        },
        status: comment.isApproved ? ModerationStatus.APPROVED : ModerationStatus.PENDING,
        reportCount: 0, // TODO: Implement report counting
        createdAt: comment.createdAt,
        lastReportedAt: comment.createdAt, // TODO: Track last report time
      });
    }

    // Sort by creation date
    return queueItems.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getModerationStats(): Promise<ModerationStatsDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get pending counts
    const pendingPosts = await this.postRepository.count({
      where: { moderationStatus: 'pending' },
    });

    const pendingComments = await this.commentRepository.count({
      where: { isApproved: false },
    });

    // Get today's moderation counts
    const approvedToday = await this.postRepository.count({
      where: {
        moderationStatus: 'approved',
        moderatedAt: today,
      },
    });

    const rejectedToday = await this.postRepository.count({
      where: {
        moderationStatus: 'rejected',
        moderatedAt: today,
      },
    });

    // TODO: Implement average moderation time calculation
    const averageModerationTime = 0;

    // TODO: Implement top report reasons
    const topReportReasons: Array<{ reason: ReportReason; count: number }> = [];

    return {
      pendingCount: pendingPosts + pendingComments,
      approvedToday,
      rejectedToday,
      averageModerationTime,
      topReportReasons,
    };
  }

  async getContentReports(
    contentId: string,
    contentType: 'post' | 'comment',
  ): Promise<ContentReportDto[]> {
    // TODO: Implement report tracking
    // For now, return empty array
    return [];
  }

  async autoModerateContent(contentId: string, contentType: 'post' | 'comment'): Promise<ModerationStatus> {
    const content = await this.getContentById(contentId, contentType);
    if (!content) {
      throw new NotFoundException(`${contentType} not found`);
    }

    // Basic content moderation rules
    const contentText = contentType === 'post' ? content.content : content.content;
    
    // Check for spam patterns
    if (this.isSpam(contentText)) {
      await this.updateContentModerationStatus(contentId, contentType, ModerationStatus.REJECTED);
      return ModerationStatus.REJECTED;
    }

    // Check for inappropriate content
    if (this.containsInappropriateContent(contentText)) {
      await this.updateContentModerationStatus(contentId, contentType, ModerationStatus.PENDING);
      return ModerationStatus.PENDING;
    }

    // Auto-approve if content looks good
    await this.updateContentModerationStatus(contentId, contentType, ModerationStatus.APPROVED);
    return ModerationStatus.APPROVED;
  }

  private async getContentById(contentId: string, contentType: 'post' | 'comment'): Promise<Post | PostComment | null> {
    if (contentType === 'post') {
      return this.postRepository.findOne({ where: { id: contentId } });
    } else {
      return this.commentRepository.findOne({ where: { id: contentId } });
    }
  }

  private async updateContentModerationStatus(
    contentId: string,
    contentType: 'post' | 'comment',
    status: ModerationStatus,
  ): Promise<void> {
    if (contentType === 'post') {
      await this.postRepository.update(contentId, {
        moderationStatus: status,
        moderatedAt: new Date(),
      });
    } else {
      await this.commentRepository.update(contentId, {
        isApproved: status === ModerationStatus.APPROVED,
      });
    }
  }

  private isSpam(content: string): boolean {
    // Basic spam detection patterns
    const spamPatterns = [
      /(.)\1{4,}/, // Repeated characters
      /https?:\/\/[^\s]+/g, // Multiple URLs
      /[A-Z]{10,}/, // Excessive caps
      /(free|win|click|now|urgent|limited|offer)/gi, // Spam keywords
    ];

    return spamPatterns.some(pattern => pattern.test(content));
  }

  private containsInappropriateContent(content: string): boolean {
    // Basic inappropriate content detection
    const inappropriatePatterns = [
      /(fuck|shit|damn|bitch|asshole)/gi, // Profanity
      /(hate|kill|violence)/gi, // Violence
      /(nazi|racist|sexist)/gi, // Hate speech
    ];

    return inappropriatePatterns.some(pattern => pattern.test(content));
  }
}
