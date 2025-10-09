import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Badge, GamificationBadge, User, BadgeType } from '@app/database';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class BadgesService {
  private readonly logger = new Logger(BadgesService.name);

  constructor(
    @InjectRepository(Badge)
    private readonly badgeRepo: Repository<Badge>,
    @InjectRepository(GamificationBadge)
    private readonly gamificationBadgeRepo: Repository<GamificationBadge>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Get all available badges
   */
  async getAllBadges(type?: BadgeType): Promise<Badge[]> {
    const query = this.badgeRepo.createQueryBuilder('badge')
      .where('badge.isActive = :isActive', { isActive: true });

    if (type) {
      query.andWhere('badge.type = :type', { type });
    }

    return query.orderBy('badge.type', 'ASC').getMany();
  }

  /**
   * Get user's earned badges
   */
  async getUserBadges(userId: string, includeHidden = false) {
    const query = this.gamificationBadgeRepo
      .createQueryBuilder('gb')
      .leftJoinAndSelect('gb.badge', 'badge')
      .where('gb.userId = :userId', { userId })
      .andWhere('badge.isActive = :isActive', { isActive: true });

    if (!includeHidden) {
      query.andWhere('gb.isDisplayed = :isDisplayed', { isDisplayed: true });
    }

    return query
      .orderBy('gb.earnedAt', 'DESC')
      .getMany();
  }

  /**
   * Award a badge to user
   */
  async awardBadge(userId: string, badgeId: string): Promise<GamificationBadge> {
    // Check if user already has this badge
    const existing = await this.gamificationBadgeRepo.findOne({
      where: { userId, badgeId },
    });

    if (existing) {
      this.logger.warn(`User ${userId} already has badge ${badgeId}`);
      return existing;
    }

    // Verify badge exists
    const badge = await this.badgeRepo.findOne({ where: { id: badgeId } });
    if (!badge) {
      throw new NotFoundException('Badge not found');
    }

    // Award badge
    const gamificationBadge = this.gamificationBadgeRepo.create({
      userId,
      badgeId,
      earnedAt: new Date(),
      isClaimed: false,
      isDisplayed: true,
    });

    await this.gamificationBadgeRepo.save(gamificationBadge);

    // Emit event for notification
    this.eventEmitter.emit('badge.awarded', {
      userId,
      badgeId,
      badgeName: badge.name,
    });

    this.logger.log(`🎖️ Badge awarded to user ${userId}: ${badge.name}`);

    return gamificationBadge;
  }

  /**
   * Claim a badge (mark as claimed)
   */
  async claimBadge(userId: string, badgeId: string): Promise<GamificationBadge> {
    const gamificationBadge = await this.gamificationBadgeRepo.findOne({
      where: { userId, badgeId },
    });

    if (!gamificationBadge) {
      throw new NotFoundException('Badge not awarded to this user');
    }

    if (!gamificationBadge.isClaimed) {
      gamificationBadge.isClaimed = true;
      gamificationBadge.claimedAt = new Date();
      await this.gamificationBadgeRepo.save(gamificationBadge);
    }

    return gamificationBadge;
  }

  /**
   * Toggle badge visibility
   */
  async toggleBadgeVisibility(
    userId: string,
    badgeId: string,
  ): Promise<GamificationBadge> {
    const gamificationBadge = await this.gamificationBadgeRepo.findOne({
      where: { userId, badgeId },
    });

    if (!gamificationBadge) {
      throw new NotFoundException('Badge not found');
    }

    gamificationBadge.isDisplayed = !gamificationBadge.isDisplayed;
    await this.gamificationBadgeRepo.save(gamificationBadge);

    return gamificationBadge;
  }

  /**
   * Check if user is eligible for badge
   */
  async checkBadgeEligibility(userId: string, badgeId: string): Promise<boolean> {
    const badge = await this.badgeRepo.findOne({ where: { id: badgeId } });
    if (!badge) return false;

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return false;

    // Check requirements based on badge type
    switch (badge.type) {
      case BadgeType.VERIFIED:
        return user.phoneVerified && user.identityVerified;

      case BadgeType.CONTRIBUTION:
        // Check if user has minimum community contributions
        const config = badge.requirementsConfig;
        return user.trustScore >= (config?.minTrustScore || 50);

      case BadgeType.LEADERSHIP:
        // Check if user has organized events or is community leader
        return (user as any).eventsOrganized >= 3; // Would need proper field

      case BadgeType.SAFETY:
        // Check safety alerts created
        return (user as any).safetyAlertsCreated >= 5; // Would need proper field

      case BadgeType.SOCIAL:
        // Check social engagement
        return user.trustScore >= 30;

      case BadgeType.BUSINESS:
        // Check if user has business profile
        return !!(user as any).businessProfileId; // Would need proper relation

      default:
        return false;
    }
  }

  /**
   * Check and award eligible badges to user
   */
  async checkAndAwardEligibleBadges(userId: string): Promise<GamificationBadge[]> {
    const allBadges = await this.getAllBadges();
    const userBadgeIds = (await this.getUserBadges(userId, true))
      .map(gb => gb.badgeId);

    const awardedBadges: GamificationBadge[] = [];

    for (const badge of allBadges) {
      // Skip if user already has this badge
      if (userBadgeIds.includes(badge.id)) continue;

      // Check eligibility
      const isEligible = await this.checkBadgeEligibility(userId, badge.id);

      if (isEligible) {
        const awarded = await this.awardBadge(userId, badge.id);
        awardedBadges.push(awarded);
      }
    }

    return awardedBadges;
  }
}
