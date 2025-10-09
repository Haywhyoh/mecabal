import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { 
  Achievement, 
  UserAchievement, 
  UserActivityLog, 
  ActivityType,
  AchievementCategory,
  AchievementRarity 
} from '@app/database';
import { PointsService } from './points.service';

export interface AchievementProgress {
  achievementId: string;
  progress: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
  requirements: any;
}

export interface AchievementUnlockResult {
  unlocked: boolean;
  achievement?: Achievement;
  pointsAwarded?: number;
}

@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(
    @InjectRepository(Achievement)
    private readonly achievementRepo: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private readonly userAchievementRepo: Repository<UserAchievement>,
    @InjectRepository(UserActivityLog)
    private readonly activityRepo: Repository<UserActivityLog>,
    private readonly pointsService: PointsService,
  ) {}

  /**
   * Initialize achievements for a new user
   */
  async initializeUserAchievements(userId: string): Promise<void> {
    const achievements = await this.achievementRepo.find({
      where: { isActive: true },
    });

    const userAchievements = achievements.map(achievement => 
      this.userAchievementRepo.create({
        userId,
        achievementId: achievement.id,
        progress: 0,
        isUnlocked: false,
      })
    );

    await this.userAchievementRepo.save(userAchievements);
    this.logger.log(`Initialized ${userAchievements.length} achievements for user ${userId}`);
  }

  /**
   * Check and update achievement progress for user activity
   */
  async checkAchievementProgress(
    userId: string,
    activityType: ActivityType,
    referenceType?: string,
    referenceId?: string,
  ): Promise<AchievementUnlockResult[]> {
    const results: AchievementUnlockResult[] = [];
    
    // Get user's achievements
    const userAchievements = await this.userAchievementRepo.find({
      where: { userId, isUnlocked: false },
      relations: ['achievement'],
    });

    for (const userAchievement of userAchievements) {
      const achievement = userAchievement.achievement;
      if (!achievement) continue;

      const newProgress = await this.calculateProgress(
        userId,
        achievement,
        activityType,
        referenceType,
        referenceId,
      );

      if (newProgress > userAchievement.progress) {
        userAchievement.progress = newProgress;
        
        // Check if achievement is unlocked
        if (newProgress >= 100) {
          userAchievement.isUnlocked = true;
          userAchievement.unlockedAt = new Date();
          
          // Award points for unlocking achievement
          const pointsResult = await this.pointsService.awardPoints(
            userId,
            ActivityType.DAILY_LOGIN, // Use a generic activity type for achievement points
            achievement.points,
            {
              referenceType: 'achievement',
              referenceId: achievement.id,
              metadata: { achievementName: achievement.name },
            }
          );

          results.push({
            unlocked: true,
            achievement,
            pointsAwarded: pointsResult.pointsEarned,
          });

          this.logger.log(
            `🎉 User ${userId} unlocked achievement: ${achievement.name} (+${achievement.points} points)`,
          );
        }

        await this.userAchievementRepo.save(userAchievement);
      }
    }

    return results;
  }

  /**
   * Calculate achievement progress based on activity
   */
  private async calculateProgress(
    userId: string,
    achievement: Achievement,
    activityType: ActivityType,
    referenceType?: string,
    referenceId?: string,
  ): Promise<number> {
    const requirements = achievement.requirements;
    
    switch (requirements.type) {
      case 'profile_completion':
        return await this.calculateProfileCompletionProgress(userId);
      
      case 'post_created':
        return await this.calculatePostCreatedProgress(userId, requirements.count);
      
      case 'comment_created':
        return await this.calculateCommentCreatedProgress(userId, requirements.count);
      
      case 'event_created':
        return await this.calculateEventCreatedProgress(userId, requirements.count);
      
      case 'event_attended':
        return await this.calculateEventAttendedProgress(userId, requirements.count);
      
      case 'safety_report':
        return await this.calculateSafetyReportProgress(userId, requirements.count);
      
      case 'listing_created':
        return await this.calculateListingCreatedProgress(userId, requirements.count);
      
      case 'listing_sold':
        return await this.calculateListingSoldProgress(userId, requirements.count);
      
      case 'help_provided':
        return await this.calculateHelpProvidedProgress(userId, requirements.count);
      
      case 'daily_login':
        return await this.calculateDailyLoginProgress(userId, requirements.count);
      
      case 'level_reached':
        return await this.calculateLevelReachedProgress(userId, requirements.count);
      
      case 'points_earned':
        return await this.calculatePointsEarnedProgress(userId, requirements.count);
      
      default:
        return 0;
    }
  }

  /**
   * Calculate profile completion progress
   */
  private async calculateProfileCompletionProgress(userId: string): Promise<number> {
    // This would typically check user profile completeness
    // For now, return 100 if user has any activity
    const activityCount = await this.activityRepo.count({
      where: { userId },
    });
    
    return activityCount > 0 ? 100 : 0;
  }

  /**
   * Calculate post creation progress
   */
  private async calculatePostCreatedProgress(userId: string, requiredCount: number): Promise<number> {
    const postCount = await this.activityRepo.count({
      where: {
        userId,
        activityType: ActivityType.POST,
      },
    });
    
    return Math.min((postCount / requiredCount) * 100, 100);
  }

  /**
   * Calculate comment creation progress
   */
  private async calculateCommentCreatedProgress(userId: string, requiredCount: number): Promise<number> {
    const commentCount = await this.activityRepo.count({
      where: {
        userId,
        activityType: ActivityType.COMMENT,
      },
    });
    
    return Math.min((commentCount / requiredCount) * 100, 100);
  }

  /**
   * Calculate event creation progress
   */
  private async calculateEventCreatedProgress(userId: string, requiredCount: number): Promise<number> {
    const eventCount = await this.activityRepo.count({
      where: {
        userId,
        activityType: ActivityType.EVENT_CREATED,
      },
    });
    
    return Math.min((eventCount / requiredCount) * 100, 100);
  }

  /**
   * Calculate event attendance progress
   */
  private async calculateEventAttendedProgress(userId: string, requiredCount: number): Promise<number> {
    const attendedCount = await this.activityRepo.count({
      where: {
        userId,
        activityType: ActivityType.EVENT_ATTENDED,
      },
    });
    
    return Math.min((attendedCount / requiredCount) * 100, 100);
  }

  /**
   * Calculate safety report progress
   */
  private async calculateSafetyReportProgress(userId: string, requiredCount: number): Promise<number> {
    const safetyCount = await this.activityRepo.count({
      where: {
        userId,
        activityType: ActivityType.SAFETY_ALERT,
      },
    });
    
    return Math.min((safetyCount / requiredCount) * 100, 100);
  }

  /**
   * Calculate listing creation progress
   */
  private async calculateListingCreatedProgress(userId: string, requiredCount: number): Promise<number> {
    const listingCount = await this.activityRepo.count({
      where: {
        userId,
        activityType: ActivityType.LISTING_CREATED,
      },
    });
    
    return Math.min((listingCount / requiredCount) * 100, 100);
  }

  /**
   * Calculate listing sold progress
   */
  private async calculateListingSoldProgress(userId: string, requiredCount: number): Promise<number> {
    const soldCount = await this.activityRepo.count({
      where: {
        userId,
        activityType: ActivityType.LISTING_PURCHASED,
      },
    });
    
    return Math.min((soldCount / requiredCount) * 100, 100);
  }

  /**
   * Calculate help provided progress
   */
  private async calculateHelpProvidedProgress(userId: string, requiredCount: number): Promise<number> {
    const helpCount = await this.activityRepo.count({
      where: {
        userId,
        activityType: ActivityType.HELP_PROVIDED,
      },
    });
    
    return Math.min((helpCount / requiredCount) * 100, 100);
  }

  /**
   * Calculate daily login progress
   */
  private async calculateDailyLoginProgress(userId: string, requiredCount: number): Promise<number> {
    const loginCount = await this.activityRepo.count({
      where: {
        userId,
        activityType: ActivityType.DAILY_LOGIN,
      },
    });
    
    return Math.min((loginCount / requiredCount) * 100, 100);
  }

  /**
   * Calculate level reached progress
   */
  private async calculateLevelReachedProgress(userId: string, requiredLevel: number): Promise<number> {
    const userPoints = await this.pointsService.getUserPoints(userId);
    if (!userPoints) return 0;
    
    return userPoints.level >= requiredLevel ? 100 : 0;
  }

  /**
   * Calculate points earned progress
   */
  private async calculatePointsEarnedProgress(userId: string, requiredPoints: number): Promise<number> {
    const userPoints = await this.pointsService.getUserPoints(userId);
    if (!userPoints) return 0;
    
    return Math.min((userPoints.totalPoints / requiredPoints) * 100, 100);
  }

  /**
   * Get user's achievement progress
   */
  async getUserAchievements(userId: string): Promise<AchievementProgress[]> {
    const userAchievements = await this.userAchievementRepo.find({
      where: { userId },
      relations: ['achievement'],
      order: { createdAt: 'ASC' },
    });

    return userAchievements.map(ua => ({
      achievementId: ua.achievementId,
      progress: ua.progress,
      isUnlocked: ua.isUnlocked,
      unlockedAt: ua.unlockedAt,
      requirements: ua.achievement?.requirements,
    }));
  }

  /**
   * Get unlocked achievements for user
   */
  async getUnlockedAchievements(userId: string): Promise<Achievement[]> {
    const userAchievements = await this.userAchievementRepo.find({
      where: { userId, isUnlocked: true },
      relations: ['achievement'],
    });

    return userAchievements.map(ua => ua.achievement).filter(Boolean);
  }

  /**
   * Get achievements by category
   */
  async getAchievementsByCategory(category: AchievementCategory): Promise<Achievement[]> {
    return this.achievementRepo.find({
      where: { category, isActive: true },
      order: { points: 'ASC' },
    });
  }

  /**
   * Get achievements by rarity
   */
  async getAchievementsByRarity(rarity: AchievementRarity): Promise<Achievement[]> {
    return this.achievementRepo.find({
      where: { rarity, isActive: true },
      order: { points: 'ASC' },
    });
  }

  /**
   * Get achievement statistics for user
   */
  async getUserAchievementStats(userId: string): Promise<{
    total: number;
    unlocked: number;
    progress: number;
    byCategory: Record<string, { total: number; unlocked: number }>;
    byRarity: Record<string, { total: number; unlocked: number }>;
  }> {
    const userAchievements = await this.userAchievementRepo.find({
      where: { userId },
      relations: ['achievement'],
    });

    const total = userAchievements.length;
    const unlocked = userAchievements.filter(ua => ua.isUnlocked).length;
    const progress = total > 0 ? (unlocked / total) * 100 : 0;

    const byCategory: Record<string, { total: number; unlocked: number }> = {};
    const byRarity: Record<string, { total: number; unlocked: number }> = {};

    userAchievements.forEach(ua => {
      const achievement = ua.achievement;
      if (!achievement) return;

      // Category stats
      if (!byCategory[achievement.category]) {
        byCategory[achievement.category] = { total: 0, unlocked: 0 };
      }
      byCategory[achievement.category].total++;
      if (ua.isUnlocked) {
        byCategory[achievement.category].unlocked++;
      }

      // Rarity stats
      if (!byRarity[achievement.rarity]) {
        byRarity[achievement.rarity] = { total: 0, unlocked: 0 };
      }
      byRarity[achievement.rarity].total++;
      if (ua.isUnlocked) {
        byRarity[achievement.rarity].unlocked++;
      }
    });

    return {
      total,
      unlocked,
      progress,
      byCategory,
      byRarity,
    };
  }

  /**
   * Get recent achievement unlocks
   */
  async getRecentUnlocks(limit: number = 10): Promise<UserAchievement[]> {
    return this.userAchievementRepo.find({
      where: { isUnlocked: true },
      relations: ['achievement', 'user'],
      order: { unlockedAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Check if user has specific achievement
   */
  async hasAchievement(userId: string, achievementId: string): Promise<boolean> {
    const userAchievement = await this.userAchievementRepo.findOne({
      where: { userId, achievementId, isUnlocked: true },
    });

    return !!userAchievement;
  }

  /**
   * Get achievement by ID
   */
  async getAchievementById(achievementId: string): Promise<Achievement | null> {
    return this.achievementRepo.findOne({
      where: { id: achievementId },
    });
  }
}
