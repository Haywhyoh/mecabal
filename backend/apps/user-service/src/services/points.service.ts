import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPoints, UserActivityLog } from '@app/database';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class PointsService {
  private readonly logger = new Logger(PointsService.name);

  constructor(
    @InjectRepository(UserPoints)
    private readonly pointsRepo: Repository<UserPoints>,
    @InjectRepository(UserActivityLog)
    private readonly activityRepo: Repository<UserActivityLog>,
  ) {}

  /**
   * Award points for user activity
   */
  async awardPoints(
    userId: string,
    activityType: string,
    basePoints: number,
    options?: {
      multiplier?: number;
      referenceType?: string;
      referenceId?: string;
      metadata?: any;
    },
  ): Promise<{ totalPoints: number; pointsEarned: number }> {
    const multiplier = options?.multiplier || 1.0;
    const pointsEarned = Math.round(basePoints * multiplier);

    // Log activity
    await this.activityRepo.save({
      userId,
      activityType,
      pointsEarned,
      multiplier,
      referenceType: options?.referenceType,
      referenceId: options?.referenceId,
      metadata: options?.metadata,
    });

    // Update user points
    let userPoints = await this.pointsRepo.findOne({
      where: { userId },
    });

    if (!userPoints) {
      userPoints = this.pointsRepo.create({
        userId,
        totalPoints: pointsEarned,
        dailyPoints: pointsEarned,
        weeklyPoints: pointsEarned,
        monthlyPoints: pointsEarned,
        level: 1,
        levelName: 'New Neighbor',
        lastActivityAt: new Date(),
      });
    } else {
      userPoints.totalPoints += pointsEarned;
      userPoints.dailyPoints += pointsEarned;
      userPoints.weeklyPoints += pointsEarned;
      userPoints.monthlyPoints += pointsEarned;
      userPoints.lastActivityAt = new Date();
    }

    // Check for level up
    await this.checkLevelUp(userPoints);

    await this.pointsRepo.save(userPoints);

    return {
      totalPoints: userPoints.totalPoints,
      pointsEarned,
    };
  }

  /**
   * Check and update user level
   */
  private async checkLevelUp(userPoints: UserPoints): Promise<void> {
    const levels = [
      { level: 1, name: 'New Neighbor', minPoints: 0 },
      { level: 2, name: 'Active Neighbor', minPoints: 100 },
      { level: 3, name: 'Helpful Neighbor', minPoints: 250 },
      { level: 4, name: 'Community Builder', minPoints: 500 },
      { level: 5, name: 'Estate Champion', minPoints: 1000 },
      { level: 6, name: 'Community Legend', minPoints: 2000 },
    ];

    const currentLevel = levels
      .reverse()
      .find(l => userPoints.totalPoints >= l.minPoints);

    if (currentLevel && currentLevel.level > userPoints.level) {
      userPoints.level = currentLevel.level;
      userPoints.levelName = currentLevel.name;
      // TODO: Trigger level-up notification
    }
  }

  /**
   * Get user points
   */
  async getUserPoints(userId: string): Promise<UserPoints> {
    let userPoints = await this.pointsRepo.findOne({
      where: { userId },
    });

    if (!userPoints) {
      userPoints = this.pointsRepo.create({
        userId,
        totalPoints: 0,
        dailyPoints: 0,
        weeklyPoints: 0,
        monthlyPoints: 0,
        level: 1,
        levelName: 'New Neighbor',
        lastActivityAt: new Date(),
      });
      await this.pointsRepo.save(userPoints);
    }

    return userPoints;
  }

  /**
   * Get activity history for user
   */
  async getActivityHistory(userId: string, limit = 50) {
    return this.activityRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Reset daily points (runs at midnight)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resetDailyPoints() {
    await this.pointsRepo.update(
      {},
      {
        dailyPoints: 0,
        lastResetDaily: new Date(),
      },
    );
    this.logger.log('✅ Daily points reset');
  }

  /**
   * Reset weekly points (runs every Monday at midnight)
   */
  @Cron('0 0 * * 1')
  async resetWeeklyPoints() {
    await this.pointsRepo.update(
      {},
      {
        weeklyPoints: 0,
        lastResetWeekly: new Date(),
      },
    );
    this.logger.log('✅ Weekly points reset');
  }

  /**
   * Reset monthly points (runs on 1st of every month at midnight)
   */
  @Cron('0 0 1 * *')
  async resetMonthlyPoints() {
    await this.pointsRepo.update(
      {},
      {
        monthlyPoints: 0,
        lastResetMonthly: new Date(),
      },
    );
    this.logger.log('✅ Monthly points reset');
  }
}