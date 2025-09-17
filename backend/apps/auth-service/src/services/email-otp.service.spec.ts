import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { EmailOtpService } from './email-otp.service';
import { MockEmailService } from './mock-email.service';
import { OtpVerification } from '@app/database/entities/otp-verification.entity';
import { User } from '@app/database/entities/user.entity';

describe('EmailOtpService', () => {
  let service: EmailOtpService;
  let mockEmailService: MockEmailService;

  const mockOtpVerificationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue(undefined), // No email credentials by default
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailOtpService,
        {
          provide: getRepositoryToken(OtpVerification),
          useValue: mockOtpVerificationRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        MockEmailService,
      ],
    }).compile();

    service = module.get<EmailOtpService>(EmailOtpService);
    mockEmailService = module.get<MockEmailService>(MockEmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendEmailOTP', () => {
    it('should send OTP for registration', async () => {
      const email = 'test@example.com';
      const purpose = 'registration';
      
      // Mock user creation for registration
      const mockUser = { id: 'user-123', email };
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockOtpVerificationRepository.create.mockReturnValue({});
      mockOtpVerificationRepository.save.mockResolvedValue({});

      const result = await service.sendEmailOTP(email, purpose);

      expect(result.success).toBe(true);
      expect(result.message).toBe('OTP code sent successfully');
      expect(result.expiresAt).toBeDefined();
    });

    it('should handle login OTP for existing user', async () => {
      const email = 'existing@example.com';
      const purpose = 'login';
      
      // Mock existing user
      const mockUser = { id: 'user-123', email, isActive: true };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockOtpVerificationRepository.create.mockReturnValue({});
      mockOtpVerificationRepository.save.mockResolvedValue({});

      const result = await service.sendEmailOTP(email, purpose);

      expect(result.success).toBe(true);
      expect(result.message).toBe('OTP code sent successfully');
    });

    it('should return error for login OTP with non-existent user', async () => {
      const email = 'nonexistent@example.com';
      const purpose = 'login';
      
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.sendEmailOTP(email, purpose);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found. Please register first.');
    });
  });

  describe('verifyEmailOTP', () => {
    it('should verify valid OTP', async () => {
      const email = 'test@example.com';
      const otpCode = '123456';
      const purpose = 'registration';
      
      const mockUser = { id: 'user-123', email };
      const mockOtpRecord = {
        id: 'otp-123',
        otpCode,
        isExpired: jest.fn().mockReturnValue(false),
        isUsed: false,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockOtpVerificationRepository.findOne.mockResolvedValue(mockOtpRecord);
      mockOtpVerificationRepository.save.mockResolvedValue({});

      const result = await service.verifyEmailOTP(email, otpCode, purpose);

      expect(result.success).toBe(true);
      expect(result.verified).toBe(true);
    });

    it('should return error for invalid OTP', async () => {
      const email = 'test@example.com';
      const otpCode = '123456';
      const purpose = 'registration';
      
      const mockUser = { id: 'user-123', email };
      const mockOtpRecord = {
        id: 'otp-123',
        otpCode: '654321', // Different OTP
        isExpired: jest.fn().mockReturnValue(false),
        isUsed: false,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockOtpVerificationRepository.findOne.mockResolvedValue(mockOtpRecord);

      const result = await service.verifyEmailOTP(email, otpCode, purpose);

      expect(result.success).toBe(false);
      expect(result.verified).toBe(false);
      expect(result.error).toBe('Invalid OTP code');
    });

    it('should return error for expired OTP', async () => {
      const email = 'test@example.com';
      const otpCode = '123456';
      const purpose = 'registration';
      
      const mockUser = { id: 'user-123', email };
      const mockOtpRecord = {
        id: 'otp-123',
        otpCode,
        isExpired: jest.fn().mockReturnValue(true),
        isUsed: false,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockOtpVerificationRepository.findOne.mockResolvedValue(mockOtpRecord);
      mockOtpVerificationRepository.delete.mockResolvedValue({});

      const result = await service.verifyEmailOTP(email, otpCode, purpose);

      expect(result.success).toBe(false);
      expect(result.verified).toBe(false);
      expect(result.error).toBe('OTP code has expired. Please request a new code.');
    });
  });
});

