import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NinVerificationService } from './nin-verification.service';
import { NinVerification, VerificationStatus } from '@app/database';

describe('NinVerificationService', () => {
  let service: NinVerificationService;
  let ninVerificationRepository: jest.Mocked<Repository<NinVerification>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NinVerificationService,
        {
          provide: getRepositoryToken(NinVerification),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NinVerificationService>(NinVerificationService);
    ninVerificationRepository = module.get(getRepositoryToken(NinVerification));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initiateVerification', () => {
    it('should initiate NIN verification successfully', async () => {
      const userId = 'test-user-id';
      const ninNumber = '12345678901';
      const mockVerification = {
        id: 'verification-id',
        userId,
        ninNumber: 'encrypted-nin',
        status: VerificationStatus.PENDING,
        createdAt: new Date(),
      };

      ninVerificationRepository.findOne.mockResolvedValue(null);
      ninVerificationRepository.create.mockReturnValue(mockVerification as any);
      ninVerificationRepository.save.mockResolvedValue(mockVerification as any);

      const result = await service.initiateVerification(userId, ninNumber);

      expect(result.success).toBe(true);
      expect(result.message).toContain('NIN verification initiated');
      expect(ninVerificationRepository.create).toHaveBeenCalledWith({
        userId,
        ninNumber: expect.any(String),
        status: VerificationStatus.PENDING,
        verificationMethod: 'api',
      });
    });

    it('should throw error if verification already exists', async () => {
      const userId = 'test-user-id';
      const ninNumber = '12345678901';
      const existingVerification = {
        id: 'existing-id',
        userId,
        ninNumber: 'encrypted-nin',
        status: VerificationStatus.PENDING,
      };

      ninVerificationRepository.findOne.mockResolvedValue(existingVerification as any);

      await expect(service.initiateVerification(userId, ninNumber))
        .rejects
        .toThrow('NIN verification already initiated for this user');
    });
  });

  describe('getVerificationStatus', () => {
    it('should return verification status', async () => {
      const userId = 'test-user-id';
      const mockVerification = {
        id: 'verification-id',
        userId,
        ninNumber: 'encrypted-nin',
        status: VerificationStatus.VERIFIED,
        verifiedAt: new Date(),
        createdAt: new Date(),
      };

      ninVerificationRepository.findOne.mockResolvedValue(mockVerification as any);

      const result = await service.getVerificationStatus(userId);

      expect(result.status).toBe(VerificationStatus.VERIFIED);
      expect(result.verifiedAt).toBeDefined();
    });

    it('should return not started status if no verification exists', async () => {
      const userId = 'test-user-id';

      ninVerificationRepository.findOne.mockResolvedValue(null);

      const result = await service.getVerificationStatus(userId);

      expect(result.status).toBe(VerificationStatus.NOT_STARTED);
      expect(result.verifiedAt).toBeUndefined();
    });
  });

  describe('getVerificationDetails', () => {
    it('should return verification details', async () => {
      const userId = 'test-user-id';
      const mockVerification = {
        id: 'verification-id',
        userId,
        ninNumber: 'encrypted-nin',
        status: VerificationStatus.VERIFIED,
        verifiedAt: new Date(),
        verificationMethod: 'api',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      ninVerificationRepository.findOne.mockResolvedValue(mockVerification as any);

      const result = await service.getVerificationDetails(userId);

      expect(result.status).toBe(VerificationStatus.VERIFIED);
      expect(result.verificationMethod).toBe('api');
      expect(result.verifiedAt).toBeDefined();
    });

    it('should throw error if verification not found', async () => {
      const userId = 'test-user-id';

      ninVerificationRepository.findOne.mockResolvedValue(null);

      await expect(service.getVerificationDetails(userId))
        .rejects
        .toThrow('NIN verification not found');
    });
  });

  describe('checkVerificationStatus', () => {
    it('should check and update verification status', async () => {
      const userId = 'test-user-id';
      const mockVerification = {
        id: 'verification-id',
        userId,
        ninNumber: 'encrypted-nin',
        status: VerificationStatus.PENDING,
        createdAt: new Date(),
        save: jest.fn(),
      };

      ninVerificationRepository.findOne.mockResolvedValue(mockVerification as any);
      mockVerification.save.mockResolvedValue({
        ...mockVerification,
        status: VerificationStatus.VERIFIED,
        verifiedAt: new Date(),
      });

      const result = await service.checkVerificationStatus(userId);

      expect(result.status).toBe(VerificationStatus.VERIFIED);
      expect(mockVerification.save).toHaveBeenCalled();
    });

    it('should throw error if verification not found', async () => {
      const userId = 'test-user-id';

      ninVerificationRepository.findOne.mockResolvedValue(null);

      await expect(service.checkVerificationStatus(userId))
        .rejects
        .toThrow('NIN verification not found');
    });
  });

  describe('encryptNinNumber', () => {
    it('should encrypt NIN number', () => {
      const ninNumber = '12345678901';
      const encrypted = service['encryptNinNumber'](ninNumber);
      
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(ninNumber);
    });
  });

  describe('decryptNinNumber', () => {
    it('should decrypt NIN number', () => {
      const ninNumber = '12345678901';
      const encrypted = service['encryptNinNumber'](ninNumber);
      const decrypted = service['decryptNinNumber'](encrypted);
      
      expect(decrypted).toBe(ninNumber);
    });
  });

  describe('callMockNinApi', () => {
    it('should call mock NIN API and return success response', async () => {
      const ninNumber = '12345678901';
      
      const result = await service['callMockNinApi'](ninNumber);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.ninNumber).toBe(ninNumber);
    });
  });
});
