import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPoints, LeaderboardSnapshot } from '@app/database';
import { Cron, CronExpression } from '@nestjs/schedule';

export enum LeaderboardCategory {
  OVERALL = 'overall',
  SAFETY = 'safety',
  EVENTS = 'events',
  HELPFUL = 'helpful',
  BUSINESS = 'business',
}

export enum LeaderboardPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALL_TIME = 'all-time',
}

interface LeaderboardEntry {
  userId: string;
  rank: number;
  points: number;
  change: number; // +/- change from previous rank
  user?: {
    firstName: string;
    lastName: string;
    avatar: string;
    verificationBadge: string;
  };
}

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(
    @InjectRepository(UserPoints)
    private readonly pointsRepo: Repository<UserPoints>,
    @InjectRepository(LeaderboardSnapshot)
    private readonly snapshotRepo: Repository<LeaderboardSnapshot>,
  ) {}

  /**
   * Get leaderboard rankings
   */
  async getLeaderboard(
    category: LeaderboardCategory,
    period: LeaderboardPeriod,
    limit = 100,
    userId?: string,
  ): Promise<{
    rankings: LeaderboardEntry[];
    userRank?: LeaderboardEntry;
    totalParticipants: number;
  }> {
    // For now, we'll focus on overall rankings
    // Category-specific rankings would require additional tracking
    const pointsField = this.getPointsFieldForPeriod(period);

    const query = this.pointsRepo
      .createQueryBuilder('up')
      .leftJoinAndSelect('up.user', 'user')
      .select([
        'up.userId',
        `up.${pointsField} as points`,
        'user.firstName',
        'user.lastName',
        'user.avatar',
        'user.verificationBadge',
      ])
      .where(`up.${pointsField} > 0`)
      .orderBy(`up.${pointsField}`, 'DESC')
      .limit(limit);

    const results = await query.getRawMany();

    // Calculate ranks and changes
    const rankings: LeaderboardEntry[] = results.map((row, index) => ({
      userId: row.up_userId,
      rank: index + 1,
      points: parseInt(row.points),
      change: 0, // TODO: Calculate from previous snapshot
      user: {
        firstName: row.user_firstName,
        lastName: row.user_lastName,
        avatar: row.user_avatar,
        verificationBadge: row.user_verificationBadge,
      },
    }));

    // Get total participants
    const totalParticipants = await this.pointsRepo
      .createQueryBuilder('up')
      .where(`up.${pointsField} > 0`)
      .getCount();

    // Get current user's rank if requested
    let userRank: LeaderboardEntry | undefined;
    if (userId) {
      const userRankResult = await this.pointsRepo
        .createQueryBuilder('up')
        .leftJoinAndSelect('up.user', 'user')
        .select([
          'up.userId',
          `up.${pointsField} as points`,
          'user.firstName',
          'user.lastName',
          'user.avatar',
          'user.verificationBadge',
        ])
        .where('up.userId = :userId', { userId })
        .getRawOne();

      if (userRankResult) {
        const userPoints = parseInt(userRankResult.points);
        const rank = await this.pointsRepo
          .createQueryBuilder('up')
          .where(`up.${pointsField} > :points`, { points: userPoints })
          .getCount();

        userRank = {
          userId: userRankResult.up_userId,
          rank: rank + 1,
          points: userPoints,
          change: 0,
          user: {
            firstName: userRankResult.user_firstName,
            lastName: userRankResult.user_lastName,
            avatar: userRankResult.user_avatar,
            verificationBadge: userRankResult.user_verificationBadge,
          },
        };
      }
    }

    return {
      rankings,
      userRank,
      totalParticipants,
    };
  }

  /**
   * Get points field based on period
   */
  private getPointsFieldForPeriod(period: LeaderboardPeriod): string {
    switch (period) {
      case LeaderboardPeriod.DAILY:
        return 'dailyPoints';
      case LeaderboardPeriod.WEEKLY:
        return 'weeklyPoints';
      case LeaderboardPeriod.MONTHLY:
        return 'monthlyPoints';
      case LeaderboardPeriod.ALL_TIME:
      default:
        return 'totalPoints';
    }
  }

  /**
   * Create leaderboard snapshot (runs daily)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async createDailySnapshot() {
    const categories = Object.values(LeaderboardCategory);
    const periods = [
      LeaderboardPeriod.DAILY,
      LeaderboardPeriod.WEEKLY,
      LeaderboardPeriod.MONTHLY,
    ];

    for (const category of categories) {
      for (const period of periods) {
        const { rankings } = await this.getLeaderboard(category, period, 100);

        await this.snapshotRepo.save({
          category,
          period,
          snapshotDate: new Date(),
          rankings: rankings.map(r => ({
            userId: r.userId,
            rank: r.rank,
            points: r.points,
            change: r.change,
          })),
        });
      }
    }

    this.logger.log('✅ Leaderboard snapshots created');
  }

  /**
   * Get historical leaderboard data
   */
  async getHistoricalLeaderboard(
    category: LeaderboardCategory,
    period: LeaderboardPeriod,
    date: Date,
  ) {
    const snapshot = await this.snapshotRepo.findOne({
      where: {
        category,
        period,
        snapshotDate: date,
      },
    });

    return snapshot?.rankings || [];
  }
}
