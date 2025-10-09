import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { NinVerificationService } from './nin-verification.service';
import { TrustScoreService } from './trust-score.service';
import { BadgeService } from './badge.service';
import { DocumentService } from './document.service';
import { AuditTrailService } from './audit-trail.service';
import { VerificationStatus, DocumentType } from '@app/database';

export interface UserVerificationStatus {
  userId: string;
  ninVerification: {
    status: VerificationStatus;
    verifiedAt?: Date;
    ninNumber?: string;
  };
  documents: {
    total: number;
    verified: number;
    pending: number;
    rejected: number;
    types: Record<DocumentType, number>;
  };
  badges: {
    total: number;
    categories: Record<string, number>;
    recent: any[];
  };
  trustScore: {
    score: number;
    breakdown: any;
    level: string;
  };
  overallStatus: 'unverified' | 'partial' | 'verified' | 'highly_verified';
  lastUpdated: Date;
}

export interface VerificationWorkflow {
  userId: string;
  steps: Array<{
    id: string;
    name: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    required: boolean;
    completedAt?: Date;
    data?: any;
  }>;
  progress: number;
  nextStep?: string;
}

@Injectable()
export class VerificationIntegrationService {
  private readonly logger = new Logger(VerificationIntegrationService.name);

  constructor(
    private readonly ninVerificationService: NinVerificationService,
    private readonly trustScoreService: TrustScoreService,
    private readonly badgeService: BadgeService,
    private readonly documentService: DocumentService,
    private readonly auditTrailService: AuditTrailService,
  ) {}

  /**
   * Get comprehensive verification status for a user
   */
  async getUserVerificationStatus(userId: string): Promise<UserVerificationStatus> {
    try {
      this.logger.log(`Getting comprehensive verification status for user ${userId}`);

      // Get NIN verification status
      const ninStatus = await this.ninVerificationService.getVerificationStatus(userId);

      // Get document statistics
      const documentStats = await this.documentService.getDocumentStats(userId);

      // Get badge statistics
      const badgeStats = await this.badgeService.getBadgeStats(userId);

      // Get trust score
      const trustScore = await this.trustScoreService.calculateTrustScore(userId);

      // Determine overall verification status
      const overallStatus = this.determineOverallStatus(
        ninStatus.status,
        documentStats.verifiedDocuments,
        badgeStats.totalBadges,
        trustScore.score,
      );

      return {
        userId,
        ninVerification: {
          status: ninStatus.status,
          verifiedAt: ninStatus.verifiedAt,
          ninNumber: ninStatus.ninNumber,
        },
        documents: {
          total: documentStats.totalDocuments,
          verified: documentStats.verifiedDocuments,
          pending: documentStats.pendingDocuments,
          rejected: documentStats.rejectedDocuments,
          types: documentStats.documentsByType,
        },
        badges: {
          total: badgeStats.totalBadges,
          categories: badgeStats.badgesByCategory,
          recent: badgeStats.recentBadges,
        },
        trustScore: {
          score: trustScore.score,
          breakdown: trustScore.breakdown,
          level: this.getTrustLevel(trustScore.score),
        },
        overallStatus,
        lastUpdated: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error getting verification status for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get verification workflow for a user
   */
  async getVerificationWorkflow(userId: string): Promise<VerificationWorkflow> {
    try {
      this.logger.log(`Getting verification workflow for user ${userId}`);

      const status = await this.getUserVerificationStatus(userId);
      const steps = this.buildVerificationSteps(status);
      const completedSteps = steps.filter(step => step.status === 'completed').length;
      const progress = Math.round((completedSteps / steps.length) * 100);

      const nextStep = steps.find(step => step.status === 'pending' && step.required);

      return {
        userId,
        steps,
        progress,
        nextStep: nextStep?.id,
      };
    } catch (error) {
      this.logger.error(`Error getting verification workflow for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Complete verification workflow step
   */
  async completeVerificationStep(
    userId: string,
    stepId: string,
    data?: any,
  ): Promise<{ success: boolean; message: string; nextStep?: string }> {
    try {
      this.logger.log(`Completing verification step ${stepId} for user ${userId}`);

      switch (stepId) {
        case 'nin_verification':
          if (!data?.ninNumber) {
            throw new BadRequestException('NIN number is required for NIN verification');
          }
          await this.ninVerificationService.initiateVerification(userId, data.ninNumber);
          break;

        case 'document_upload':
          if (!data?.documentType || !data?.file) {
            throw new BadRequestException('Document type and file are required for document upload');
          }
          await this.documentService.uploadDocument({
            userId,
            documentType: data.documentType,
            documentNumber: data.documentNumber,
            file: data.file,
            expiryDate: data.expiryDate,
          });
          break;

        case 'profile_completion':
          // This would integrate with user profile service
          this.logger.log('Profile completion step - integration with user profile service needed');
          break;

        default:
          throw new BadRequestException(`Unknown verification step: ${stepId}`);
      }

      // Get updated workflow
      const workflow = await this.getVerificationWorkflow(userId);
      const nextStep = workflow.nextStep;

      return {
        success: true,
        message: `Verification step ${stepId} completed successfully`,
        nextStep,
      };
    } catch (error) {
      this.logger.error(`Error completing verification step ${stepId} for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get verification dashboard data
   */
  async getVerificationDashboard(): Promise<{
    totalUsers: number;
    verifiedUsers: number;
    pendingVerifications: number;
    recentActivity: any[];
    trustScoreDistribution: Array<{ range: string; count: number }>;
    verificationTypes: Array<{ type: string; count: number }>;
  }> {
    try {
      this.logger.log('Getting verification dashboard data');

      // Get audit summary
      const auditSummary = await this.auditTrailService.getAuditSummary();

      // Get recent activity
      const recentActivity = auditSummary.recentActivity;

      // Get verification types from recent activity
      const verificationTypes = recentActivity.reduce((acc, activity) => {
        acc[activity.verificationType] = (acc[activity.verificationType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const verificationTypesArray = Object.entries(verificationTypes).map(([type, count]) => ({
        type,
        count,
      }));

      // Mock data for dashboard (in real implementation, these would come from database queries)
      const totalUsers = 1000; // This would be a database query
      const verifiedUsers = 750; // This would be a database query
      const pendingVerifications = 150; // This would be a database query

      // Mock trust score distribution
      const trustScoreDistribution = [
        { range: '0-20', count: 50 },
        { range: '21-40', count: 100 },
        { range: '41-60', count: 200 },
        { range: '61-80', count: 300 },
        { range: '81-100', count: 350 },
      ];

      return {
        totalUsers,
        verifiedUsers,
        pendingVerifications,
        recentActivity,
        trustScoreDistribution,
        verificationTypes: verificationTypesArray,
      };
    } catch (error) {
      this.logger.error('Error getting verification dashboard data:', error);
      throw error;
    }
  }

  /**
   * Auto-award badges based on verification status
   */
  async autoAwardBadges(userId: string): Promise<{ awarded: string[]; errors: string[] }> {
    try {
      this.logger.log(`Auto-awarding badges for user ${userId}`);

      const status = await this.getUserVerificationStatus(userId);
      const awarded: string[] = [];
      const errors: string[] = [];

      // Award verification badges
      if (status.ninVerification.status === VerificationStatus.VERIFIED) {
        try {
          await this.badgeService.autoAwardVerificationBadges(
            userId,
            'nin',
            true,
          );
          awarded.push('NIN Verified');
        } catch (error) {
          errors.push(`Failed to award NIN badge: ${error.message}`);
        }
      }

      // Award document verification badges
      if (status.documents.verified > 0) {
        try {
          await this.badgeService.autoAwardVerificationBadges(
            userId,
            'document',
            true,
          );
          awarded.push('Document Verified');
        } catch (error) {
          errors.push(`Failed to award document badge: ${error.message}`);
        }
      }

      // Award trust score badges
      if (status.trustScore.score >= 80) {
        try {
          await this.badgeService.awardBadge({
            userId,
            badgeType: 'High Trust Score',
            badgeCategory: 'verification' as any,
            awardedBy: 'system',
            metadata: { trustScore: status.trustScore.score },
          });
          awarded.push('High Trust Score');
        } catch (error) {
          errors.push(`Failed to award trust score badge: ${error.message}`);
        }
      }

      return { awarded, errors };
    } catch (error) {
      this.logger.error(`Error auto-awarding badges for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Build verification steps based on user status
   */
  private buildVerificationSteps(status: UserVerificationStatus): Array<{
    id: string;
    name: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    required: boolean;
    completedAt?: Date;
    data?: any;
  }> {
    const steps = [
      {
        id: 'profile_completion',
        name: 'Complete Profile',
        description: 'Fill in your basic profile information',
        status: status.ninVerification.status !== VerificationStatus.NOT_STARTED ? 'completed' : 'pending',
        required: true,
        completedAt: status.ninVerification.status !== VerificationStatus.NOT_STARTED ? new Date() : undefined,
      },
      {
        id: 'nin_verification',
        name: 'NIN Verification',
        description: 'Verify your National Identification Number',
        status: status.ninVerification.status === VerificationStatus.VERIFIED ? 'completed' : 
                status.ninVerification.status === VerificationStatus.PENDING ? 'in_progress' : 'pending',
        required: true,
        completedAt: status.ninVerification.verifiedAt,
      },
      {
        id: 'document_upload',
        name: 'Upload Documents',
        description: 'Upload identity documents for verification',
        status: status.documents.verified > 0 ? 'completed' : 
                status.documents.pending > 0 ? 'in_progress' : 'pending',
        required: true,
        completedAt: status.documents.verified > 0 ? new Date() : undefined,
      },
      {
        id: 'phone_verification',
        name: 'Phone Verification',
        description: 'Verify your phone number',
        status: 'pending', // This would be determined by actual phone verification status
        required: false,
      },
      {
        id: 'address_verification',
        name: 'Address Verification',
        description: 'Verify your residential address',
        status: 'pending', // This would be determined by actual address verification status
        required: false,
      },
    ];

    return steps;
  }

  /**
   * Determine overall verification status
   */
  private determineOverallStatus(
    ninStatus: VerificationStatus,
    verifiedDocuments: number,
    totalBadges: number,
    trustScore: number,
  ): 'unverified' | 'partial' | 'verified' | 'highly_verified' {
    if (ninStatus === VerificationStatus.VERIFIED && verifiedDocuments >= 2 && trustScore >= 80) {
      return 'highly_verified';
    }
    
    if (ninStatus === VerificationStatus.VERIFIED && verifiedDocuments >= 1) {
      return 'verified';
    }
    
    if (ninStatus === VerificationStatus.PENDING || verifiedDocuments > 0) {
      return 'partial';
    }
    
    return 'unverified';
  }

  /**
   * Get trust level based on score
   */
  private getTrustLevel(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 50) return 'Poor';
    return 'Very Poor';
  }
}
