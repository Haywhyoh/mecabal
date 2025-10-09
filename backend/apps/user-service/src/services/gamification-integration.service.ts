import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PointsService } from './points.service';
import { AchievementsService } from './achievements.service';
import { BadgesService } from './badges.service';

/**
 * Service to handle gamification events from other services
 */
@Injectable()
export class GamificationIntegrationService {
  private readonly logger = new Logger(GamificationIntegrationService.name);

  constructor(
    private readonly pointsService: PointsService,
    private readonly achievementsService: AchievementsService,
    private readonly badgesService: BadgesService,
  ) {}

  /**
   * Handle user activity events from other services
   */
  @OnEvent('user.activity')
  async handleUserActivity(payload: {
    userId: string;
    activityType: string;
    points: number;
    metadata?: any;
  }) {
    // Award points
    await this.pointsService.awardPoints(
      payload.userId,
      payload.activityType,
      payload.points,
      { metadata: payload.metadata },
    );

    // Check achievement progress
    await this.achievementsService.checkAchievementProgress(
      payload.userId,
      payload.activityType,
      payload.metadata,
    );

    this.logger.log(`Activity processed for user ${payload.userId}: ${payload.activityType}`);
  }

  /**
   * Handle achievement unlocked events
   */
  @OnEvent('achievement.unlocked')
  async handleAchievementUnlocked(payload: {
    userId: string;
    achievementId: string;
    points: number;
  }) {
    // Award points for achievement
    await this.pointsService.awardPoints(
      payload.userId,
      'achievement_unlocked',
      payload.points,
      {
        referenceType: 'achievement',
        referenceId: payload.achievementId,
      },
    );

    this.logger.log(`Achievement points awarded to user ${payload.userId}`);
  }

  /**
   * Handle user verification events
   */
  @OnEvent('user.verified')
  async handleUserVerified(payload: {
    userId: string;
    verificationType: string;
  }) {
    // Check and award verification badges
    await this.badgesService.checkAndAwardEligibleBadges(payload.userId);

    this.logger.log(`Verification badges checked for user ${payload.userId}`);
  }

  /**
   * Handle profile completion events
   */
  @OnEvent('user.profile.completed')
  async handleProfileCompleted(payload: { userId: string }) {
    // Award points for profile completion
    await this.pointsService.awardPoints(
      payload.userId,
      'profile_completed',
      50,
    );

    // Check achievements
    await this.achievementsService.checkAchievementProgress(
      payload.userId,
      'profile_completed',
    );

    this.logger.log(`Profile completion processed for user ${payload.userId}`);
  }
}