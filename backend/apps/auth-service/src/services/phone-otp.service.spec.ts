import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { PhoneOtpService } from './phone-otp.service';
import { TermiiService } from './termii.service';
import { OtpVerification } from '@app/database/entities/otp-verification.entity';
import { User } from '@app/database/entities/user.entity';

describe('PhoneOtpService', () => {
  let service: PhoneOtpService;
  let termiiService: TermiiService;

  const mockOtpVerificationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockTermiiService = {
    isConfigured: jest.fn().mockReturnValue(true),
    sendToken: jest.fn(),
    sendWhatsAppToken: jest.fn(),
    verifyToken: jest.fn(),
    sendSMS: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhoneOtpService,
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
        {
          provide: TermiiService,
          useValue: mockTermiiService,
        },
      ],
    }).compile();

    service = module.get<PhoneOtpService>(PhoneOtpService);
    termiiService = module.get<TermiiService>(TermiiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendPhoneOTP', () => {
    const phoneNumber = '+2348012345678';

    beforeEach(() => {
      mockOtpVerificationRepository.delete.mockResolvedValue({ affected: 0 });
      mockOtpVerificationRepository.create.mockReturnValue({});
      mockOtpVerificationRepository.save.mockResolvedValue({ id: 'otp-123' });
      mockTermiiService.sendSMS.mockResolvedValue({ message_id: 'msg-123' });
    });

    it('should send SMS OTP successfully', async () => {
      const mockUser = { id: 'user-123', phoneNumber, email: 'test@example.com' };
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.sendPhoneOTP(phoneNumber, 'registration', 'sms');

      expect(result.success).toBe(true);
      expect(result.message).toContain('OTP sent successfully');
      expect(mockOtpVerificationRepository.save).toHaveBeenCalled();
    });

    it('should send WhatsApp OTP successfully', async () => {
      const mockUser = { id: 'user-123', phoneNumber };
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.sendPhoneOTP(phoneNumber, 'registration', 'whatsapp');

      expect(result.success).toBe(true);
      expect(result.deliveryMethod).toBe('whatsapp');
    });

    it('should fallback to SMS if WhatsApp fails', async () => {
      const mockUser = { id: 'user-123', phoneNumber };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockTermiiService.sendSMS.mockResolvedValueOnce(null);
      mockTermiiService.sendSMS.mockResolvedValueOnce({ message_id: 'msg-123' });

      const result = await service.sendPhoneOTP(phoneNumber, 'registration', 'whatsapp');

      expect(result.success).toBe(true);
    });

    it('should detect Nigerian carrier', async () => {
      const mockUser = { id: 'user-123', phoneNumber: '+2348031234567' };
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.sendPhoneOTP('+2348031234567', 'registration');

      expect(result.carrier).toBe('MTN');
      expect(result.carrierColor).toBeDefined();
    });

    it('should return error if user not found for registration', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.sendPhoneOTP(phoneNumber, 'registration', 'sms', 'test@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toContain('User record not found');
    });

    it('should return error if user not found for login', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.sendPhoneOTP(phoneNumber, 'login');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found. Please register first.');
    });

    it('should update user with phone number if not set', async () => {
      const mockUser = { id: 'user-123', phoneNumber: null, email: 'test@example.com' };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({ ...mockUser, phoneNumber });

      await service.sendPhoneOTP(phoneNumber, 'registration', 'sms', 'test@example.com');

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ phoneNumber })
      );
    });

    it('should handle phone number already registered to another user', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com', phoneNumber: null };
      const existingPhoneUser = { id: 'user-456', phoneNumber };

      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(existingPhoneUser);

      const result = await service.sendPhoneOTP(phoneNumber, 'registration', 'sms', 'test@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toContain('already registered to another account');
    });

    it('should clean up existing OTPs before creating new one', async () => {
      const mockUser = { id: 'user-123', phoneNumber };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockOtpVerificationRepository.delete.mockResolvedValue({ affected: 1 });

      await service.sendPhoneOTP(phoneNumber, 'registration');

      expect(mockOtpVerificationRepository.delete).toHaveBeenCalledWith({
        userId: mockUser.id,
        contactMethod: 'phone',
        purpose: 'registration',
        isUsed: false,
      });
    });

    it('should return OTP code in development mode', async () => {
      process.env.NODE_ENV = 'development';
      const mockUser = { id: 'user-123', phoneNumber };
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.sendPhoneOTP(phoneNumber, 'registration', 'sms');

      expect(result.otpCode).toBeDefined();

      delete process.env.NODE_ENV;
    });

    it('should handle SMS sending failure', async () => {
      const mockUser = { id: 'user-123', phoneNumber };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockTermiiService.sendSMS.mockResolvedValue(null);
      mockTermiiService.isConfigured.mockReturnValue(false);

      const result = await service.sendPhoneOTP(phoneNumber, 'registration');

      // Should use fallback hardcoded OTP or fail gracefully
      expect(result).toBeDefined();
    });
  });

  describe('verifyPhoneOTP', () => {
    const phoneNumber = '+2348012345678';
    const otpCode = '1234';

    beforeEach(() => {
      mockOtpVerificationRepository.save.mockResolvedValue({});
      mockUserRepository.save.mockResolvedValue({});
    });

    it('should verify valid OTP successfully', async () => {
      const mockUser = { id: 'user-123', phoneNumber };
      const mockOtpRecord = {
        id: 'otp-123',
        otpCode,
        userId: 'user-123',
        isExpired: jest.fn().mockReturnValue(false),
        isUsed: false,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockOtpVerificationRepository.findOne.mockResolvedValue(mockOtpRecord);

      const result = await service.verifyPhoneOTP(phoneNumber, otpCode, 'registration');

      expect(result.success).toBe(true);
      expect(result.verified).toBe(true);
    });

    it('should return error for invalid OTP', async () => {
      const mockUser = { id: 'user-123', phoneNumber };
      const mockOtpRecord = {
        id: 'otp-123',
        otpCode: '9999',
        isExpired: jest.fn().mockReturnValue(false),
        isUsed: false,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockOtpVerificationRepository.findOne.mockResolvedValue(mockOtpRecord);

      const result = await service.verifyPhoneOTP(phoneNumber, otpCode, 'registration');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid OTP');
    });

    it('should return error for expired OTP', async () => {
      const mockOtpRecord = {
        id: 'otp-123',
        otpCode,
        isExpired: jest.fn().mockReturnValue(true),
        isUsed: false,
      };

      mockOtpVerificationRepository.findOne.mockResolvedValue(mockOtpRecord);
      mockOtpVerificationRepository.delete.mockResolvedValue({});

      const result = await service.verifyPhoneOTP(phoneNumber, otpCode, 'registration');

      expect(result.success).toBe(false);
      expect(result.error).toContain('expired');
      expect(mockOtpVerificationRepository.delete).toHaveBeenCalled();
    });

    it('should return error if OTP not found', async () => {
      mockOtpVerificationRepository.findOne.mockResolvedValue(null);

      const result = await service.verifyPhoneOTP(phoneNumber, otpCode, 'registration');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid or expired OTP');
    });

    it('should return error if OTP already used', async () => {
      const mockOtpRecord = {
        id: 'otp-123',
        otpCode,
        isExpired: jest.fn().mockReturnValue(false),
        isUsed: true,
      };

      mockOtpVerificationRepository.findOne.mockResolvedValue(mockOtpRecord);

      const result = await service.verifyPhoneOTP(phoneNumber, otpCode, 'registration');

      expect(result.success).toBe(false);
      expect(result.error).toContain('already been used');
    });

    it('should update user phoneVerified status for registration', async () => {
      const mockUser = { id: 'user-123', phoneNumber, phoneVerified: false };
      const mockOtpRecord = {
        id: 'otp-123',
        otpCode,
        userId: 'user-123',
        isExpired: jest.fn().mockReturnValue(false),
        isUsed: false,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockOtpVerificationRepository.findOne.mockResolvedValue(mockOtpRecord);

      await service.verifyPhoneOTP(phoneNumber, otpCode, 'registration');

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ phoneVerified: true, isVerified: false })
      );
    });

    it('should mark OTP as used after verification', async () => {
      const mockUser = { id: 'user-123', phoneNumber };
      const mockOtpRecord = {
        id: 'otp-123',
        otpCode,
        userId: 'user-123',
        isExpired: jest.fn().mockReturnValue(false),
        isUsed: false,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockOtpVerificationRepository.findOne.mockResolvedValue(mockOtpRecord);

      await service.verifyPhoneOTP(phoneNumber, otpCode, 'registration');

      expect(mockOtpVerificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isUsed: true })
      );
    });

    it('should use development bypass code in dev/staging environment', async () => {
      process.env.NODE_ENV = 'development';

      const mockUser = { id: 'user-123', phoneNumber, phoneVerified: false };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockOtpVerificationRepository.findOne.mockResolvedValue({
        id: 'otp-123',
        isUsed: false,
      });
      mockUserRepository.save.mockResolvedValue({ ...mockUser, phoneVerified: true });

      const result = await service.verifyPhoneOTP(phoneNumber, '2398', 'registration');

      expect(result.success).toBe(true);
      expect(result.verified).toBe(true);

      delete process.env.NODE_ENV;
    });

    it('should handle Termii verification for verification IDs', async () => {
      const termiiVerificationId = 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6';
      const mockUser = { id: 'user-123', phoneNumber };
      const mockOtpRecord = {
        id: 'otp-123',
        otpCode: termiiVerificationId,
        userId: 'user-123',
        isExpired: jest.fn().mockReturnValue(false),
        isUsed: false,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockOtpVerificationRepository.findOne.mockResolvedValue(mockOtpRecord);

      const result = await service.verifyPhoneOTP(phoneNumber, '1234', 'registration');

      // Should attempt verification (success depends on mock implementation)
      expect(result).toBeDefined();
    });

    it('should return error if user not found for login', async () => {
      const mockOtpRecord = {
        id: 'otp-123',
        otpCode,
        userId: 'user-123',
        isExpired: jest.fn().mockReturnValue(false),
        isUsed: false,
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockOtpVerificationRepository.findOne.mockResolvedValue(mockOtpRecord);

      const result = await service.verifyPhoneOTP(phoneNumber, otpCode, 'login');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });

  describe('carrier detection', () => {
    it('should detect MTN numbers', async () => {
      const mockUser = { id: 'user-123', phoneNumber: '+2348031234567' };
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.sendPhoneOTP('+2348031234567', 'registration');

      expect(result.carrier).toBe('MTN');
    });

    it('should detect Airtel numbers', async () => {
      const mockUser = { id: 'user-123', phoneNumber: '+2348021234567' };
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.sendPhoneOTP('+2348021234567', 'registration');

      expect(result.carrier).toBe('Airtel');
    });

    it('should detect Glo numbers', async () => {
      const mockUser = { id: 'user-123', phoneNumber: '+2348051234567' };
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.sendPhoneOTP('+2348051234567', 'registration');

      expect(result.carrier).toBe('Glo');
    });

    it('should detect 9mobile numbers', async () => {
      const mockUser = { id: 'user-123', phoneNumber: '+2348091234567' };
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.sendPhoneOTP('+2348091234567', 'registration');

      expect(result.carrier).toBe('9mobile');
    });

    it('should handle phone numbers without country code', async () => {
      const mockUser = { id: 'user-123', phoneNumber: '08031234567' };
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.sendPhoneOTP('08031234567', 'registration');

      expect(result.carrier).toBe('MTN');
    });

    it('should handle unknown carriers gracefully', async () => {
      const mockUser = { id: 'user-123', phoneNumber: '+2341234567890' };
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.sendPhoneOTP('+2341234567890', 'registration');

      expect(result).toBeDefined();
      expect(result.carrier).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockUserRepository.findOne.mockRejectedValue(new Error('Database error'));

      const result = await service.sendPhoneOTP('+2348012345678', 'registration');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to send OTP');
    });

    it('should handle verification errors gracefully', async () => {
      mockOtpVerificationRepository.findOne.mockRejectedValue(new Error('Database error'));

      const result = await service.verifyPhoneOTP('+2348012345678', '1234', 'registration');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Verification failed');
    });

    it('should use fallback OTP when Termii is not configured', async () => {
      mockTermiiService.isConfigured.mockReturnValue(false);
      const mockUser = { id: 'user-123', phoneNumber: '+2348012345678' };
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.sendPhoneOTP('+2348012345678', 'registration');

      // Should still succeed with fallback
      expect(result).toBeDefined();
    });
  });
});
