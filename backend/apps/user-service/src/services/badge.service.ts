import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserBadge, BadgeCategory } from '@app/database';
import { VerificationAudit } from '@app/database';

export interface BadgeAwardRequest {
  userId: string;
  badgeType: string;
  badgeCategory: BadgeCategory;
  awardedBy?: string;
  metadata?: any;
}

export interface BadgeRevokeRequest {
  badgeId: string;
  revokedBy: string;
  revocationReason: string;
}

export interface BadgeStats {
  totalBadges: number;
  badgesByCategory: Record<BadgeCategory, number>;
  recentBadges: UserBadge[];
  topBadgeTypes: Array<{ badgeType: string; count: number }>;
}

@Injectable()
export class BadgeService {
  private readonly logger = new Logger(BadgeService.name);

  // Predefined badge types for different categories
  private readonly predefinedBadges = {
    [BadgeCategory.VERIFICATION]: [
      'NIN Verified',
      'Identity Verified',
      'Address Verified',
      'Phone Verified',
      'Document Verified',
    ],
    [BadgeCategory.LEADERSHIP]: [
      'Estate Manager',
      'Community Leader',
      'Religious Leader',
      'Youth Leader',
      'Women Leader',
      'Elder',
    ],
    [BadgeCategory.CONTRIBUTION]: [
      'Event Organizer',
      'Community Helper',
      'Volunteer',
      'Donor',
      'Mentor',
      'Active Member',
    ],
    [BadgeCategory.SAFETY]: [
      'Security Volunteer',
      'Neighborhood Watch',
      'Emergency Responder',
      'Safety Advocate',
      'Crime Reporter',
    ],
    [BadgeCategory.BUSINESS]: [
      'Local Business Owner',
      'Service Provider',
      'Market Vendor',
      'Artisan',
      'Professional',
    ],
  };

  constructor(
    @InjectRepository(UserBadge)
    private readonly userBadgeRepository: Repository<UserBadge>,
    @InjectRepository(VerificationAudit)
    private readonly verificationAuditRepository: Repository<VerificationAudit>,
  ) {}

  /**
   * Award a badge to a user
   */
  async awardBadge(
    request: BadgeAwardRequest,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ success: boolean; message: string; badgeId?: string }> {
    try {
      const { userId, badgeType, badgeCategory, awardedBy, metadata } = request;

      // Check if user already has this badge
      const existingBadge = await this.userBadgeRepository.findOne({
        where: { userId, badgeType, isActive: true },
      });

      if (existingBadge) {
        throw new BadRequestException('User already has this badge');
      }

      // Validate badge type
      if (!this.isValidBadgeType(badgeType, badgeCategory)) {
        throw new BadRequestException(`Invalid badge type '${badgeType}' for category '${badgeCategory}'`);
      }

      // Create badge
      const badge = this.userBadgeRepository.create({
        userId,
        badgeType,
        badgeCategory,
        awardedBy,
        metadata,
        awardedAt: new Date(),
        isActive: true,
      });

      const savedBadge = await this.userBadgeRepository.save(badge);

      // Create audit log
      await this.createAuditLog(
        userId,
        'badge',
        'awarded',
        'success',
        null,
        { badgeId: savedBadge.id, badgeType, badgeCategory },
        { ipAddress, userAgent },
        awardedBy || 'system',
      );

      this.logger.log(`Badge '${badgeType}' awarded to user ${userId}`);
      return {
        success: true,
        message: `Badge '${badgeType}' awarded successfully`,
        badgeId: savedBadge.id,
      };
    } catch (error) {
      this.logger.error(`Error awarding badge:`, error);
      throw error;
    }
  }

  /**
   * Revoke a badge from a user
   */
  async revokeBadge(
    request: BadgeRevokeRequest,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { badgeId, revokedBy, revocationReason } = request;

      const badge = await this.userBadgeRepository.findOne({
        where: { id: badgeId, isActive: true },
      });

      if (!badge) {
        throw new NotFoundException('Badge not found or already revoked');
      }

      // Update badge
      badge.isActive = false;
      badge.revokedAt = new Date();
      badge.revokedBy = revokedBy;
      badge.revocationReason = revocationReason;

      await this.userBadgeRepository.save(badge);

      // Create audit log
      await this.createAuditLog(
        badge.userId,
        'badge',
        'revoked',
        'success',
        { badgeId, badgeType: badge.badgeType },
        { revocationReason },
        { ipAddress, userAgent },
        revokedBy,
      );

      this.logger.log(`Badge '${badge.badgeType}' revoked from user ${badge.userId}`);
      return {
        success: true,
        message: `Badge '${badge.badgeType}' revoked successfully`,
      };
    } catch (error) {
      this.logger.error(`Error revoking badge:`, error);
      throw error;
    }
  }

  /**
   * Get all badges for a user
   */
  async getUserBadges(userId: string): Promise<{
    activeBadges: UserBadge[];
    revokedBadges: UserBadge[];
    stats: BadgeStats;
  }> {
    const [activeBadges, revokedBadges] = await Promise.all([
      this.userBadgeRepository.find({
        where: { userId, isActive: true },
        order: { awardedAt: 'DESC' },
      }),
      this.userBadgeRepository.find({
        where: { userId, isActive: false },
        order: { revokedAt: 'DESC' },
      }),
    ]);

    const stats = await this.calculateBadgeStats(userId);

    return {
      activeBadges,
      revokedBadges,
      stats,
    };
  }

  /**
   * Get badge statistics for a user
   */
  async getBadgeStats(userId: string): Promise<BadgeStats> {
    return this.calculateBadgeStats(userId);
  }

  /**
   * Get all available badge types by category
   */
  getAvailableBadgeTypes(): Record<BadgeCategory, string[]> {
    return { ...this.predefinedBadges };
  }

  /**
   * Auto-award badges based on user verification status
   */
  async autoAwardVerificationBadges(
    userId: string,
    verificationType: string,
    isVerified: boolean,
  ): Promise<void> {
    if (!isVerified) return;

    try {
      let badgeType: string;
      let badgeCategory = BadgeCategory.VERIFICATION;

      switch (verificationType) {
        case 'nin':
          badgeType = 'NIN Verified';
          break;
        case 'phone':
          badgeType = 'Phone Verified';
          break;
        case 'address':
          badgeType = 'Address Verified';
          break;
        case 'document':
          badgeType = 'Document Verified';
          break;
        default:
          return;
      }

      // Check if user already has this badge
      const existingBadge = await this.userBadgeRepository.findOne({
        where: { userId, badgeType, isActive: true },
      });

      if (!existingBadge) {
        await this.awardBadge({
          userId,
          badgeType,
          badgeCategory,
          awardedBy: 'system',
          metadata: { autoAwarded: true, verificationType },
        });
      }
    } catch (error) {
      this.logger.error(`Error auto-awarding badge for user ${userId}:`, error);
    }
  }

  /**
   * Award community leadership badges
   */
  async awardLeadershipBadge(
    userId: string,
    leadershipType: string,
    awardedBy: string,
    metadata?: any,
  ): Promise<{ success: boolean; message: string; badgeId?: string }> {
    const validLeadershipTypes = this.predefinedBadges[BadgeCategory.LEADERSHIP];
    
    if (!validLeadershipTypes.includes(leadershipType)) {
      throw new BadRequestException(`Invalid leadership type: ${leadershipType}`);
    }

    return this.awardBadge({
      userId,
      badgeType: leadershipType,
      badgeCategory: BadgeCategory.LEADERSHIP,
      awardedBy,
      metadata,
    });
  }

  /**
   * Award contribution badges
   */
  async awardContributionBadge(
    userId: string,
    contributionType: string,
    awardedBy: string,
    metadata?: any,
  ): Promise<{ success: boolean; message: string; badgeId?: string }> {
    const validContributionTypes = this.predefinedBadges[BadgeCategory.CONTRIBUTION];
    
    if (!validContributionTypes.includes(contributionType)) {
      throw new BadRequestException(`Invalid contribution type: ${contributionType}`);
    }

    return this.awardBadge({
      userId,
      badgeType: contributionType,
      badgeCategory: BadgeCategory.CONTRIBUTION,
      awardedBy,
      metadata,
    });
  }

  /**
   * Calculate badge statistics for a user
   */
  private async calculateBadgeStats(userId: string): Promise<BadgeStats> {
    const activeBadges = await this.userBadgeRepository.find({
      where: { userId, isActive: true },
    });

    const badgesByCategory = activeBadges.reduce((acc, badge) => {
      acc[badge.badgeCategory] = (acc[badge.badgeCategory] || 0) + 1;
      return acc;
    }, {} as Record<BadgeCategory, number>);

    const badgeTypeCounts = activeBadges.reduce((acc, badge) => {
      acc[badge.badgeType] = (acc[badge.badgeType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topBadgeTypes = Object.entries(badgeTypeCounts)
      .map(([badgeType, count]) => ({ badgeType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const recentBadges = activeBadges
      .sort((a, b) => b.awardedAt.getTime() - a.awardedAt.getTime())
      .slice(0, 10);

    return {
      totalBadges: activeBadges.length,
      badgesByCategory,
      recentBadges,
      topBadgeTypes,
    };
  }

  /**
   * Validate if badge type is valid for category
   */
  private isValidBadgeType(badgeType: string, category: BadgeCategory): boolean {
    const validTypes = this.predefinedBadges[category];
    return validTypes.includes(badgeType);
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(
    userId: string,
    verificationType: string,
    action: string,
    status: string,
    previousValue: any,
    newValue: any,
    metadata: any,
    performedBy: string,
  ): Promise<void> {
    try {
      const auditLog = this.verificationAuditRepository.create({
        userId,
        verificationType,
        action,
        status,
        previousValue,
        newValue,
        metadata,
        performedBy,
      });

      await this.verificationAuditRepository.save(auditLog);
    } catch (error) {
      this.logger.error('Failed to create audit log:', error);
    }
  }
}
