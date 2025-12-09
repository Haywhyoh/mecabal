import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { EmailOtpService } from './email-otp.service';
import { OtpVerification } from '@app/database/entities/otp-verification.entity';
import { User } from '@app/database/entities/user.entity';

describe('EmailOtpService', () => {
  let service: EmailOtpService;

  const mockOtpVerificationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        EMAIL_HOST: 'smtp.example.com',
        EMAIL_PORT: '465',
        EMAIL_SENDER: 'noreply@mecabal.com',
        EMAIL_HOST_USER: 'user@example.com',
        EMAIL_HOST_PASSWORD: 'password123',
        CLIENT_URL: 'https://mecabal.com',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

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
      ],
    }).compile();

    service = module.get<EmailOtpService>(EmailOtpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendEmailOTP', () => {
    beforeEach(() => {
      mockOtpVerificationRepository.delete.mockResolvedValue({ affected: 0 });
      mockOtpVerificationRepository.create.mockReturnValue({});
      mockOtpVerificationRepository.save.mockResolvedValue({ id: 'otp-123' });
    });

    it('should send OTP for registration for new user', async () => {
      const email = 'test@example.com';
      const purpose = 'registration';

      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.sendEmailOTP(email, purpose);

      expect(result.success).toBe(true);
      expect(result.message).toBe('OTP code sent successfully');
      expect(result.expiresAt).toBeDefined();
      expect(mockOtpVerificationRepository.save).toHaveBeenCalled();
    });

    it('should send OTP for existing user during login', async () => {
      const email = 'existing@example.com';
      const purpose = 'login';

      const mockUser = { id: 'user-123', email, isActive: true };
      mockUserRepository.findOne.mockResolvedValue(mockUser);

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

    it('should clean up existing OTPs before creating new one', async () => {
      const email = 'test@example.com';
      const mockUser = { id: 'user-123', email };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockOtpVerificationRepository.delete.mockResolvedValue({ affected: 2 });

      await service.sendEmailOTP(email, 'registration');

      expect(mockOtpVerificationRepository.delete).toHaveBeenCalled();
    });

    it('should handle password reset OTP', async () => {
      const email = 'test@example.com';
      const mockUser = { id: 'user-123', email };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.sendEmailOTP(email, 'password_reset');

      expect(result.success).toBe(true);
    });

    it('should include OTP code in development mode', async () => {
      process.env.NODE_ENV = 'development';
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.sendEmailOTP('test@example.com', 'registration');

      expect(result.otpCode).toBeDefined();

      delete process.env.NODE_ENV;
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
        createdAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockOtpVerificationRepository.findOne.mockResolvedValue(mockOtpRecord);
      mockOtpVerificationRepository.save.mockResolvedValue({});

      const result = await service.verifyEmailOTP(email, otpCode, purpose);

      expect(result.success).toBe(true);
      expect(result.verified).toBe(true);
      expect(mockOtpVerificationRepository.save).toHaveBeenCalled();
    });

    it('should verify registration OTP without user', async () => {
      const email = 'newuser@example.com';
      const otpCode = '123456';
      const purpose = 'registration';

      const mockOtpRecord = {
        id: 'otp-123',
        otpCode,
        isExpired: jest.fn().mockReturnValue(false),
        isUsed: false,
        createdAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(null);
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
        otpCode: '654321',
        isExpired: jest.fn().mockReturnValue(false),
        isUsed: false,
        createdAt: new Date(),
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
        createdAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockOtpVerificationRepository.findOne.mockResolvedValue(mockOtpRecord);
      mockOtpVerificationRepository.delete.mockResolvedValue({});

      const result = await service.verifyEmailOTP(email, otpCode, purpose);

      expect(result.success).toBe(false);
      expect(result.verified).toBe(false);
      expect(result.error).toBe('OTP code has expired. Please request a new code.');
      expect(mockOtpVerificationRepository.delete).toHaveBeenCalledWith({ id: mockOtpRecord.id });
    });

    it('should return error if OTP not found', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: 'user-123' });
      mockOtpVerificationRepository.findOne.mockResolvedValue(null);

      const result = await service.verifyEmailOTP('test@example.com', '123456', 'registration');

      expect(result.success).toBe(false);
      expect(result.error).toBe('OTP not found');
    });

    it('should return error if user not found for login/password reset', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.verifyEmailOTP('test@example.com', '123456', 'login');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should allow reuse within grace period', async () => {
      const mockOtpRecord = {
        id: 'otp-123',
        otpCode: '123456',
        isExpired: jest.fn().mockReturnValue(false),
        isUsed: true,
        createdAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue({ id: 'user-123' });
      mockOtpVerificationRepository.findOne.mockResolvedValue(mockOtpRecord);

      const result = await service.verifyEmailOTP('test@example.com', '123456', 'registration');

      expect(result.success).toBe(true);
      expect(result.verified).toBe(true);
    });

    it('should not mark as used when markAsUsed is false', async () => {
      const mockOtpRecord = {
        id: 'otp-123',
        otpCode: '123456',
        isExpired: jest.fn().mockReturnValue(false),
        isUsed: false,
        createdAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue({ id: 'user-123' });
      mockOtpVerificationRepository.findOne.mockResolvedValue(mockOtpRecord);

      await service.verifyEmailOTP('test@example.com', '123456', 'registration', false);

      expect(mockOtpVerificationRepository.save).not.toHaveBeenCalled();
    });

    it('should use development bypass code in dev/staging environment', async () => {
      process.env.NODE_ENV = 'development';

      mockUserRepository.findOne.mockResolvedValue({ id: 'user-123' });
      mockOtpVerificationRepository.findOne.mockResolvedValue({
        id: 'otp-123',
        isUsed: false,
      });
      mockOtpVerificationRepository.save.mockResolvedValue({});

      const result = await service.verifyEmailOTP('test@example.com', '2398', 'registration');

      expect(result.success).toBe(true);
      expect(result.verified).toBe(true);

      delete process.env.NODE_ENV;
    });
  });

  describe('markOTPAsUsed', () => {
    it('should mark OTP as used successfully', async () => {
      mockOtpVerificationRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.markOTPAsUsed('otp-123');

      expect(result.success).toBe(true);
      expect(mockOtpVerificationRepository.update).toHaveBeenCalledWith(
        { id: 'otp-123' },
        { isUsed: true }
      );
    });

    it('should return error if OTP not found', async () => {
      mockOtpVerificationRepository.update.mockResolvedValue({ affected: 0 });

      const result = await service.markOTPAsUsed('invalid-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('OTP record not found');
    });

    it('should handle errors gracefully', async () => {
      mockOtpVerificationRepository.update.mockRejectedValue(new Error('Database error'));

      const result = await service.markOTPAsUsed('otp-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to mark OTP as used');
    });
  });
});
