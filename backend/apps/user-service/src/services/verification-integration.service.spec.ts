import { Test, TestingModule } from '@nestjs/testing';
import { VerificationIntegrationService } from './verification-integration.service';
import { NinVerificationService } from './nin-verification.service';
import { TrustScoreService } from './trust-score.service';
import { BadgeService } from './badge.service';
import { DocumentService } from './document.service';
import { AuditTrailService } from './audit-trail.service';
import { VerificationStatus } from '@app/database';

describe('VerificationIntegrationService', () => {
  let service: VerificationIntegrationService;
  let ninVerificationService: jest.Mocked<NinVerificationService>;
  let trustScoreService: jest.Mocked<TrustScoreService>;
  let badgeService: jest.Mocked<BadgeService>;
  let documentService: jest.Mocked<DocumentService>;
  let auditTrailService: jest.Mocked<AuditTrailService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationIntegrationService,
        {
          provide: NinVerificationService,
          useValue: {
            getVerificationStatus: jest.fn(),
            initiateVerification: jest.fn(),
          },
        },
        {
          provide: TrustScoreService,
          useValue: {
            calculateTrustScore: jest.fn(),
          },
        },
        {
          provide: BadgeService,
          useValue: {
            getBadgeStats: jest.fn(),
            autoAwardVerificationBadges: jest.fn(),
            awardBadge: jest.fn(),
          },
        },
        {
          provide: DocumentService,
          useValue: {
            getDocumentStats: jest.fn(),
            uploadDocument: jest.fn(),
          },
        },
        {
          provide: AuditTrailService,
          useValue: {
            getAuditSummary: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VerificationIntegrationService>(VerificationIntegrationService);
    ninVerificationService = module.get(NinVerificationService);
    trustScoreService = module.get(TrustScoreService);
    badgeService = module.get(BadgeService);
    documentService = module.get(DocumentService);
    auditTrailService = module.get(AuditTrailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserVerificationStatus', () => {
    it('should return comprehensive verification status', async () => {
      const userId = 'test-user-id';
      const mockNinStatus = {
        status: VerificationStatus.VERIFIED,
        verifiedAt: new Date(),
        ninNumber: '12345678901',
      };
      const mockDocumentStats = {
        totalDocuments: 2,
        verifiedDocuments: 2,
        pendingDocuments: 0,
        rejectedDocuments: 0,
        documentsByType: {},
        recentUploads: [],
      };
      const mockBadgeStats = {
        totalBadges: 3,
        badgesByCategory: {},
        recentBadges: [],
        topBadgeTypes: [],
      };
      const mockTrustScore = {
        score: 85,
        breakdown: {},
      };

      ninVerificationService.getVerificationStatus.mockResolvedValue(mockNinStatus);
      documentService.getDocumentStats.mockResolvedValue(mockDocumentStats);
      badgeService.getBadgeStats.mockResolvedValue(mockBadgeStats);
      trustScoreService.calculateTrustScore.mockResolvedValue(mockTrustScore);

      const result = await service.getUserVerificationStatus(userId);

      expect(result).toEqual({
        userId,
        ninVerification: {
          status: VerificationStatus.VERIFIED,
          verifiedAt: mockNinStatus.verifiedAt,
          ninNumber: mockNinStatus.ninNumber,
        },
        documents: {
          total: 2,
          verified: 2,
          pending: 0,
          rejected: 0,
          types: {},
        },
        badges: {
          total: 3,
          categories: {},
          recent: [],
        },
        trustScore: {
          score: 85,
          breakdown: {},
          level: 'Very Good',
        },
        overallStatus: 'highly_verified',
        lastUpdated: expect.any(Date),
      });
    });
  });

  describe('getVerificationWorkflow', () => {
    it('should return verification workflow with steps', async () => {
      const userId = 'test-user-id';
      const mockStatus = {
        userId,
        ninVerification: {
          status: VerificationStatus.VERIFIED,
          verifiedAt: new Date(),
          ninNumber: '12345678901',
        },
        documents: {
          total: 2,
          verified: 2,
          pending: 0,
          rejected: 0,
          types: {},
        },
        badges: {
          total: 3,
          categories: {},
          recent: [],
        },
        trustScore: {
          score: 85,
          breakdown: {},
          level: 'Very Good',
        },
        overallStatus: 'highly_verified' as const,
        lastUpdated: new Date(),
      };

      jest.spyOn(service, 'getUserVerificationStatus').mockResolvedValue(mockStatus);

      const result = await service.getVerificationWorkflow(userId);

      expect(result.userId).toBe(userId);
      expect(result.steps).toHaveLength(5);
      expect(result.progress).toBe(100);
      expect(result.nextStep).toBeUndefined();
    });
  });

  describe('completeVerificationStep', () => {
    it('should complete NIN verification step', async () => {
      const userId = 'test-user-id';
      const stepId = 'nin_verification';
      const data = { ninNumber: '12345678901' };

      ninVerificationService.initiateVerification.mockResolvedValue({
        success: true,
        message: 'NIN verification initiated',
      });

      jest.spyOn(service, 'getVerificationWorkflow').mockResolvedValue({
        userId,
        steps: [],
        progress: 50,
        nextStep: 'document_upload',
      });

      const result = await service.completeVerificationStep(userId, stepId, data);

      expect(result.success).toBe(true);
      expect(ninVerificationService.initiateVerification).toHaveBeenCalledWith(userId, '12345678901');
    });

    it('should complete document upload step', async () => {
      const userId = 'test-user-id';
      const stepId = 'document_upload';
      const data = {
        documentType: 'NIN_CARD',
        file: { buffer: Buffer.from('test') },
      };

      documentService.uploadDocument.mockResolvedValue({
        success: true,
        message: 'Document uploaded successfully',
      });

      jest.spyOn(service, 'getVerificationWorkflow').mockResolvedValue({
        userId,
        steps: [],
        progress: 75,
        nextStep: 'phone_verification',
      });

      const result = await service.completeVerificationStep(userId, stepId, data);

      expect(result.success).toBe(true);
      expect(documentService.uploadDocument).toHaveBeenCalled();
    });

    it('should throw error for unknown step', async () => {
      const userId = 'test-user-id';
      const stepId = 'unknown_step';
      const data = {};

      await expect(service.completeVerificationStep(userId, stepId, data))
        .rejects
        .toThrow('Unknown verification step: unknown_step');
    });
  });

  describe('autoAwardBadges', () => {
    it('should award badges based on verification status', async () => {
      const userId = 'test-user-id';
      const mockStatus = {
        userId,
        ninVerification: {
          status: VerificationStatus.VERIFIED,
          verifiedAt: new Date(),
          ninNumber: '12345678901',
        },
        documents: {
          total: 2,
          verified: 2,
          pending: 0,
          rejected: 0,
          types: {},
        },
        badges: {
          total: 0,
          categories: {},
          recent: [],
        },
        trustScore: {
          score: 85,
          breakdown: {},
          level: 'Very Good',
        },
        overallStatus: 'highly_verified' as const,
        lastUpdated: new Date(),
      };

      jest.spyOn(service, 'getUserVerificationStatus').mockResolvedValue(mockStatus);
      badgeService.autoAwardVerificationBadges.mockResolvedValue();
      badgeService.awardBadge.mockResolvedValue({
        success: true,
        message: 'Badge awarded',
      });

      const result = await service.autoAwardBadges(userId);

      expect(result.awarded).toContain('NIN Verified');
      expect(result.awarded).toContain('Document Verified');
      expect(result.awarded).toContain('High Trust Score');
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('getVerificationDashboard', () => {
    it('should return dashboard data', async () => {
      const mockAuditSummary = {
        totalAudits: 1000,
        todayAudits: 50,
        failedAudits: 100,
        topActions: [],
        recentActivity: [],
      };

      auditTrailService.getAuditSummary.mockResolvedValue(mockAuditSummary);

      const result = await service.getVerificationDashboard();

      expect(result.totalUsers).toBe(1000);
      expect(result.verifiedUsers).toBe(750);
      expect(result.pendingVerifications).toBe(150);
      expect(result.recentActivity).toEqual([]);
      expect(result.trustScoreDistribution).toHaveLength(5);
    });
  });
});
