import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { 
  NinVerification, 
  VerificationStatus, 
  IdentityDocument, 
  CommunityEndorsement,
  UserBadge,
  User
} from '@app/database';

export interface TrustScoreBreakdown {
  totalScore: number;
  maxScore: number;
  percentage: number;
  breakdown: {
    phoneVerification: { score: number; maxScore: number; status: boolean };
    identityVerification: { score: number; maxScore: number; status: boolean };
    addressVerification: { score: number; maxScore: number; status: boolean };
    communityEndorsements: { score: number; maxScore: number; count: number };
    badges: { score: number; maxScore: number; count: number };
    accountAge: { score: number; maxScore: number; days: number };
    activityLevel: { score: number; maxScore: number; level: string };
  };
}

export interface TrustScoreConfig {
  phoneVerificationPoints: number;
  identityVerificationPoints: number;
  addressVerificationPoints: number;
  endorsementPointsEach: number;
  maxEndorsementPoints: number;
  badgePointsEach: number;
  maxBadgePoints: number;
  accountAgePoints: number;
  maxAccountAgePoints: number;
  activityLevelPoints: number;
  maxActivityLevelPoints: number;
}

@Injectable()
export class TrustScoreService {
  private readonly logger = new Logger(TrustScoreService.name);
  private readonly config: TrustScoreConfig = {
    phoneVerificationPoints: 20,
    identityVerificationPoints: 30,
    addressVerificationPoints: 30,
    endorsementPointsEach: 2,
    maxEndorsementPoints: 20,
    badgePointsEach: 1,
    maxBadgePoints: 10,
    accountAgePoints: 0.1, // 0.1 points per day
    maxAccountAgePoints: 30,
    activityLevelPoints: 5,
    maxActivityLevelPoints: 20,
  };

  constructor(
    @InjectRepository(NinVerification)
    private readonly ninVerificationRepository: Repository<NinVerification>,
    @InjectRepository(IdentityDocument)
    private readonly identityDocumentRepository: Repository<IdentityDocument>,
    @InjectRepository(CommunityEndorsement)
    private readonly communityEndorsementRepository: Repository<CommunityEndorsement>,
    @InjectRepository(UserBadge)
    private readonly userBadgeRepository: Repository<UserBadge>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Calculate comprehensive trust score for a user
   */
  async calculateTrustScore(userId: string): Promise<TrustScoreBreakdown> {
    try {
      this.logger.log(`Calculating trust score for user ${userId}`);

      // Get user data
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      // Calculate individual components
      const phoneVerification = await this.calculatePhoneVerificationScore(userId);
      const identityVerification = await this.calculateIdentityVerificationScore(userId);
      const addressVerification = await this.calculateAddressVerificationScore(userId);
      const communityEndorsements = await this.calculateCommunityEndorsementScore(userId);
      const badges = await this.calculateBadgeScore(userId);
      const accountAge = this.calculateAccountAgeScore(user);
      const activityLevel = await this.calculateActivityLevelScore(userId);

      // Calculate totals
      const totalScore = 
        phoneVerification.score +
        identityVerification.score +
        addressVerification.score +
        communityEndorsements.score +
        badges.score +
        accountAge.score +
        activityLevel.score;

      const maxScore = 
        phoneVerification.maxScore +
        identityVerification.maxScore +
        addressVerification.maxScore +
        communityEndorsements.maxScore +
        badges.maxScore +
        accountAge.maxScore +
        activityLevel.maxScore;

      const percentage = Math.round((totalScore / maxScore) * 100);

      const breakdown: TrustScoreBreakdown = {
        totalScore: Math.round(totalScore),
        maxScore: Math.round(maxScore),
        percentage,
        breakdown: {
          phoneVerification,
          identityVerification,
          addressVerification,
          communityEndorsements,
          badges,
          accountAge,
          activityLevel,
        },
      };

      this.logger.log(`Trust score calculated for user ${userId}: ${breakdown.percentage}%`);
      return breakdown;
    } catch (error) {
      this.logger.error(`Error calculating trust score for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate phone verification score
   */
  private async calculatePhoneVerificationScore(userId: string): Promise<{
    score: number;
    maxScore: number;
    status: boolean;
  }> {
    // Check if user has verified phone number
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const hasVerifiedPhone = user?.phoneVerified || false;

    return {
      score: hasVerifiedPhone ? this.config.phoneVerificationPoints : 0,
      maxScore: this.config.phoneVerificationPoints,
      status: hasVerifiedPhone,
    };
  }

  /**
   * Calculate identity verification score
   */
  private async calculateIdentityVerificationScore(userId: string): Promise<{
    score: number;
    maxScore: number;
    status: boolean;
  }> {
    // Check NIN verification
    const ninVerification = await this.ninVerificationRepository.findOne({
      where: { userId, verificationStatus: VerificationStatus.VERIFIED },
    });

    // Check identity documents
    const verifiedDocuments = await this.identityDocumentRepository.count({
      where: { userId, isVerified: true },
    });

    let score = 0;
    if (ninVerification) {
      score += this.config.identityVerificationPoints * 0.7; // 70% for NIN
    }
    if (verifiedDocuments > 0) {
      score += Math.min(verifiedDocuments * 5, this.config.identityVerificationPoints * 0.3); // 30% for documents
    }

    return {
      score: Math.min(score, this.config.identityVerificationPoints),
      maxScore: this.config.identityVerificationPoints,
      status: ninVerification !== null || verifiedDocuments > 0,
    };
  }

  /**
   * Calculate address verification score
   */
  private async calculateAddressVerificationScore(userId: string): Promise<{
    score: number;
    maxScore: number;
    status: boolean;
  }> {
    // Check if user has verified address (neighborhood membership)
    const user = await this.userRepository.findOne({ 
      where: { id: userId },
      relations: ['neighborhoods']
    });
    
    const hasVerifiedAddress = user?.neighborhoods && user.neighborhoods.length > 0;

    return {
      score: hasVerifiedAddress ? this.config.addressVerificationPoints : 0,
      maxScore: this.config.addressVerificationPoints,
      status: hasVerifiedAddress || false,
    };
  }

  /**
   * Calculate community endorsement score
   */
  private async calculateCommunityEndorsementScore(userId: string): Promise<{
    score: number;
    maxScore: number;
    count: number;
  }> {
    const endorsements = await this.communityEndorsementRepository.count({
      where: { endorseeUserId: userId, isVerified: true },
    });

    const score = Math.min(
      endorsements * this.config.endorsementPointsEach,
      this.config.maxEndorsementPoints
    );

    return {
      score,
      maxScore: this.config.maxEndorsementPoints,
      count: endorsements,
    };
  }

  /**
   * Calculate badge score
   */
  private async calculateBadgeScore(userId: string): Promise<{
    score: number;
    maxScore: number;
    count: number;
  }> {
    const badges = await this.userBadgeRepository.count({
      where: { userId, isActive: true },
    });

    const score = Math.min(
      badges * this.config.badgePointsEach,
      this.config.maxBadgePoints
    );

    return {
      score,
      maxScore: this.config.maxBadgePoints,
      count: badges,
    };
  }

  /**
   * Calculate account age score
   */
  private calculateAccountAgeScore(user: User): {
    score: number;
    maxScore: number;
    days: number;
  } {
    const now = new Date();
    const accountAge = now.getTime() - user.createdAt.getTime();
    const days = Math.floor(accountAge / (1000 * 60 * 60 * 24));

    const score = Math.min(
      days * this.config.accountAgePoints,
      this.config.maxAccountAgePoints
    );

    return {
      score,
      maxScore: this.config.maxAccountAgePoints,
      days,
    };
  }

  /**
   * Calculate activity level score
   */
  private async calculateActivityLevelScore(userId: string): Promise<{
    score: number;
    maxScore: number;
    level: string;
  }> {
    // This is a simplified calculation
    // In a real implementation, you'd analyze user activity patterns
    const daysSinceLastLogin = await this.getDaysSinceLastLogin(userId);
    
    let level: string;
    let score: number;

    if (daysSinceLastLogin <= 1) {
      level = 'very_active';
      score = this.config.maxActivityLevelPoints;
    } else if (daysSinceLastLogin <= 7) {
      level = 'active';
      score = this.config.maxActivityLevelPoints * 0.8;
    } else if (daysSinceLastLogin <= 30) {
      level = 'moderate';
      score = this.config.maxActivityLevelPoints * 0.6;
    } else if (daysSinceLastLogin <= 90) {
      level = 'low';
      score = this.config.maxActivityLevelPoints * 0.3;
    } else {
      level = 'inactive';
      score = 0;
    }

    return {
      score,
      maxScore: this.config.maxActivityLevelPoints,
      level,
    };
  }

  /**
   * Get days since last login (simplified)
   */
  private async getDaysSinceLastLogin(userId: string): Promise<number> {
    // This is a simplified implementation
    // In a real system, you'd track login sessions
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return 999;

    const now = new Date();
    const lastLogin = user.updatedAt; // Using updatedAt as proxy for last activity
    const diffTime = now.getTime() - lastLogin.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get trust score configuration
   */
  getTrustScoreConfig(): TrustScoreConfig {
    return { ...this.config };
  }

  /**
   * Update trust score configuration
   */
  updateTrustScoreConfig(newConfig: Partial<TrustScoreConfig>): void {
    Object.assign(this.config, newConfig);
    this.logger.log('Trust score configuration updated');
  }
}
