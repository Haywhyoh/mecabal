import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { EmailOtpService } from './email-otp.service';
import { PhoneOtpService } from './phone-otp.service';
import { TokenService } from './token.service';
import { User } from '@app/database/entities/user.entity';
import { UserLocation } from '@app/database/entities/user-location.entity';
import { Neighborhood, NeighborhoodType } from '@app/database/entities/neighborhood.entity';
import { UserNeighborhood } from '@app/database/entities/user-neighborhood.entity';
import { State } from '@app/database/entities/state.entity';
import { CulturalBackground } from '@app/database/entities/cultural-background.entity';
import { ProfessionalCategory } from '@app/database/entities/professional-category.entity';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let emailOtpService: EmailOtpService;
  let phoneOtpService: PhoneOtpService;
  let tokenService: TokenService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockUserLocationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    findOne: jest.fn(),
  };

  const mockNeighborhoodRepository = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockUserNeighborhoodRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockStateRepository = {
    findOne: jest.fn(),
  };

  const mockCulturalBackgroundRepository = {
    findOne: jest.fn(),
  };

  const mockProfessionalCategoryRepository = {
    findOne: jest.fn(),
  };

  const mockEmailOtpService = {
    sendEmailOTP: jest.fn(),
    verifyEmailOTP: jest.fn(),
    markOTPAsUsed: jest.fn(),
  };

  const mockPhoneOtpService = {
    sendPhoneOTP: jest.fn(),
    verifyPhoneOTP: jest.fn(),
  };

  const mockTokenService = {
    generateTokenPair: jest.fn(),
    refreshTokens: jest.fn(),
    validateAccessToken: jest.fn(),
    invalidateSession: jest.fn(),
    invalidateUserSessions: jest.fn(),
    generateUserResponse: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(UserLocation),
          useValue: mockUserLocationRepository,
        },
        {
          provide: getRepositoryToken(Neighborhood),
          useValue: mockNeighborhoodRepository,
        },
        {
          provide: getRepositoryToken(UserNeighborhood),
          useValue: mockUserNeighborhoodRepository,
        },
        {
          provide: getRepositoryToken(State),
          useValue: mockStateRepository,
        },
        {
          provide: getRepositoryToken(CulturalBackground),
          useValue: mockCulturalBackgroundRepository,
        },
        {
          provide: getRepositoryToken(ProfessionalCategory),
          useValue: mockProfessionalCategoryRepository,
        },
        {
          provide: EmailOtpService,
          useValue: mockEmailOtpService,
        },
        {
          provide: PhoneOtpService,
          useValue: mockPhoneOtpService,
        },
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    emailOtpService = module.get<EmailOtpService>(EmailOtpService);
    phoneOtpService = module.get<PhoneOtpService>(PhoneOtpService);
    tokenService = module.get<TokenService>(TokenService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerUser', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+2348012345678',
      estateId: 'estate-123',
      stateOfOriginId: 'state-123',
      culturalBackgroundId: 'culture-123',
      professionalCategoryId: 'prof-123',
      professionalTitle: 'Engineer',
      occupation: 'Software Developer',
      preferredLanguage: 'en',
    };

    const mockEstate = {
      id: 'estate-123',
      name: 'Test Estate',
      type: NeighborhoodType.ESTATE,
      isGated: true,
      lgaId: 'lga-123',
      wardId: 'ward-123',
      lga: {
        id: 'lga-123',
        name: 'Test LGA',
        state: { id: 'state-123', name: 'Lagos' },
      },
    };

    beforeEach(() => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockNeighborhoodRepository.findOne.mockResolvedValue(mockEstate);
      mockStateRepository.findOne.mockResolvedValue({ id: 'state-123' });
      mockCulturalBackgroundRepository.findOne.mockResolvedValue({ id: 'culture-123' });
      mockProfessionalCategoryRepository.findOne.mockResolvedValue({ id: 'prof-123' });
    });

    it('should register a new user successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      const mockUser = { id: 'user-123', ...registerDto, getVerificationLevel: jest.fn().mockReturnValue('unverified') };
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockUserLocationRepository.create.mockReturnValue({});
      mockUserLocationRepository.save.mockResolvedValue({ id: 'location-123' });
      mockUserNeighborhoodRepository.findOne.mockResolvedValue(null);
      mockUserNeighborhoodRepository.create.mockReturnValue({});
      mockUserNeighborhoodRepository.save.mockResolvedValue({});

      const result = await service.registerUser(registerDto);

      expect(result.success).toBe(true);
      expect(result.message).toContain('User registered successfully');
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should return error if estate is not provided', async () => {
      const dtoWithoutEstate = { ...registerDto, estateId: '' };

      const result = await service.registerUser(dtoWithoutEstate as any);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Estate selection is required');
    });

    it('should return error if profile fields are missing', async () => {
      const dtoWithoutProfile = { ...registerDto, stateOfOriginId: '' };

      const result = await service.registerUser(dtoWithoutProfile as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('State of origin');
    });

    it('should return error if user with email already exists', async () => {
      const existingUser = { id: 'existing-123', email: registerDto.email };
      mockUserRepository.findOne.mockResolvedValue(existingUser);

      const result = await service.registerUser(registerDto);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should handle database constraint violations', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({});
      mockUserRepository.save.mockRejectedValue({ code: '23505', detail: 'duplicate key value violates unique constraint "UQ_email"' });

      const result = await service.registerUser(registerDto);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already registered');
    });
  });

  describe('loginUser', () => {
    const loginDto = {
      identifier: 'test@example.com',
      password: 'password123',
    };

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      isActive: true,
      lastLoginAt: null,
    };

    beforeEach(() => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    });

    it('should login user successfully with valid credentials', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({ ...mockUser, lastLoginAt: new Date() });
      const mockTokenPair = { accessToken: 'token', refreshToken: 'refresh', expiresAt: new Date(), sessionId: 'session-123' };
      mockTokenService.generateTokenPair.mockResolvedValue(mockTokenPair);
      mockTokenService.generateUserResponse.mockReturnValue({ success: true, user: mockUser, ...mockTokenPair });

      const result = await service.loginUser(loginDto);

      expect(result.success).toBe(true);
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockTokenService.generateTokenPair).toHaveBeenCalledWith(mockUser, undefined);
    });

    it('should return error if user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.loginUser(loginDto);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('should return error if password is invalid', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.loginUser(loginDto);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('should return error if account is deactivated', async () => {
      mockUserRepository.findOne.mockResolvedValue({ ...mockUser, isActive: false });

      const result = await service.loginUser(loginDto);

      expect(result.success).toBe(false);
      expect(result.error).toContain('deactivated');
    });

    it('should handle login with device info', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({ ...mockUser, lastLoginAt: new Date() });
      const mockTokenPair = { accessToken: 'token', refreshToken: 'refresh', expiresAt: new Date(), sessionId: 'session-123' };
      mockTokenService.generateTokenPair.mockResolvedValue(mockTokenPair);
      mockTokenService.generateUserResponse.mockReturnValue({ success: true, user: mockUser, ...mockTokenPair });

      const deviceInfo = {
        deviceId: 'device-123',
        deviceType: 'mobile',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      await service.loginUser(loginDto, deviceInfo);

      expect(mockTokenService.generateTokenPair).toHaveBeenCalledWith(mockUser, deviceInfo);
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      const refreshToken = 'valid_refresh_token';
      const mockTokenPair = { accessToken: 'new_token', refreshToken: 'new_refresh', expiresAt: new Date(), sessionId: 'session-123' };
      const mockPayload = { userId: 'user-123', email: 'test@example.com' };
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      mockTokenService.refreshTokens.mockResolvedValue(mockTokenPair);
      mockTokenService.validateAccessToken.mockResolvedValue(mockPayload);
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockTokenService.generateUserResponse.mockReturnValue({ success: true, user: mockUser, ...mockTokenPair });

      const result = await service.refreshTokens(refreshToken);

      expect(result.success).toBe(true);
      expect(mockTokenService.refreshTokens).toHaveBeenCalledWith(refreshToken);
    });

    it('should return error for invalid refresh token', async () => {
      mockTokenService.refreshTokens.mockResolvedValue(null);

      const result = await service.refreshTokens('invalid_token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid refresh token');
    });

    it('should return error if user not found', async () => {
      const mockTokenPair = { accessToken: 'new_token', refreshToken: 'new_refresh', expiresAt: new Date(), sessionId: 'session-123' };
      const mockPayload = { userId: 'user-123', email: 'test@example.com' };

      mockTokenService.refreshTokens.mockResolvedValue(mockTokenPair);
      mockTokenService.validateAccessToken.mockResolvedValue(mockPayload);
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.refreshTokens('token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });

  describe('logoutUser', () => {
    it('should logout user successfully', async () => {
      const sessionId = 'session-123';
      mockTokenService.invalidateSession.mockResolvedValue(true);

      const result = await service.logoutUser(sessionId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Logged out successfully');
      expect(mockTokenService.invalidateSession).toHaveBeenCalledWith(sessionId);
    });

    it('should return error if session not found', async () => {
      mockTokenService.invalidateSession.mockResolvedValue(false);

      const result = await service.logoutUser('invalid-session');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Session not found');
    });
  });

  describe('logoutAllDevices', () => {
    it('should logout from all devices successfully', async () => {
      const userId = 'user-123';
      mockTokenService.invalidateUserSessions.mockResolvedValue(3);

      const result = await service.logoutAllDevices(userId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Logged out from 3 devices');
      expect(result.loggedOutSessions).toBe(3);
    });

    it('should logout from all devices except current session', async () => {
      const userId = 'user-123';
      const exceptSessionId = 'session-current';
      mockTokenService.invalidateUserSessions.mockResolvedValue(2);

      const result = await service.logoutAllDevices(userId, exceptSessionId);

      expect(result.success).toBe(true);
      expect(mockTokenService.invalidateUserSessions).toHaveBeenCalledWith(userId, exceptSessionId);
    });
  });

  describe('initiatePasswordReset', () => {
    it('should send password reset OTP for existing user', async () => {
      const email = 'test@example.com';
      const mockUser = { id: 'user-123', email };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockEmailOtpService.sendEmailOTP.mockResolvedValue({
        success: true,
        expiresAt: new Date(),
      });

      const result = await service.initiatePasswordReset({ email });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Password reset code sent');
      expect(mockEmailOtpService.sendEmailOTP).toHaveBeenCalledWith(email, 'password_reset');
    });

    it('should not reveal if user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.initiatePasswordReset({ email: 'nonexistent@example.com' });

      expect(result.success).toBe(true);
      expect(result.message).toContain('If an account with this email exists');
    });

    it('should handle OTP sending failure', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockEmailOtpService.sendEmailOTP.mockResolvedValue({
        success: false,
        error: 'Email service unavailable',
      });

      const result = await service.initiatePasswordReset({ email: 'test@example.com' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to send reset code');
    });
  });

  describe('confirmPasswordReset', () => {
    const confirmResetDto = {
      email: 'test@example.com',
      resetCode: '123456',
      newPassword: 'newPassword123',
    };

    beforeEach(() => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed_password');
    });

    it('should reset password successfully', async () => {
      const mockUser = { id: 'user-123', email: confirmResetDto.email, updatedAt: new Date() };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockEmailOtpService.verifyEmailOTP.mockResolvedValue({
        success: true,
        verified: true,
      });
      mockUserRepository.save.mockResolvedValue(mockUser);

      const result = await service.confirmPasswordReset(confirmResetDto);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Password reset successfully');
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should return error if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.confirmPasswordReset(confirmResetDto);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should return error for invalid OTP', async () => {
      const mockUser = { id: 'user-123', email: confirmResetDto.email };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockEmailOtpService.verifyEmailOTP.mockResolvedValue({
        success: false,
        verified: false,
        error: 'Invalid OTP code',
      });

      const result = await service.confirmPasswordReset(confirmResetDto);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid or expired reset code');
    });
  });

  describe('validateGoogleUser', () => {
    const googleProfile = {
      googleId: 'google-123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      profilePicture: 'https://example.com/pic.jpg',
      emailVerified: true,
    };

    it('should login existing Google user', async () => {
      const existingUser = {
        id: 'user-123',
        email: googleProfile.email,
        googleId: googleProfile.googleId,
        firstName: googleProfile.firstName,
        lastName: googleProfile.lastName,
        isVerified: true,
      };
      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.save.mockResolvedValue({ ...existingUser, lastLoginAt: new Date() });
      const mockTokenPair = { accessToken: 'token', refreshToken: 'refresh', expiresAt: new Date(), sessionId: 'session-123' };
      mockTokenService.generateTokenPair.mockResolvedValue(mockTokenPair);

      const result = await service.validateGoogleUser(googleProfile);

      expect(result.isNewUser).toBe(false);
      expect(result.user.email).toBe(googleProfile.email);
    });

    it('should create new Google user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      const newUser = {
        id: 'user-123',
        ...googleProfile,
        isVerified: true,
        isActive: true,
      };
      mockUserRepository.create.mockReturnValue(newUser);
      mockUserRepository.save.mockResolvedValue(newUser);
      const mockTokenPair = { accessToken: 'token', refreshToken: 'refresh', expiresAt: new Date(), sessionId: 'session-123' };
      mockTokenService.generateTokenPair.mockResolvedValue(mockTokenPair);

      const result = await service.validateGoogleUser(googleProfile);

      expect(result.isNewUser).toBe(true);
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    it('should throw error if email exists with different Google account', async () => {
      const existingUser = {
        id: 'user-123',
        email: googleProfile.email,
        googleId: 'different-google-id',
      };
      mockUserRepository.findOne.mockResolvedValue(existingUser);

      await expect(service.validateGoogleUser(googleProfile)).rejects.toThrow(ConflictException);
    });
  });

  describe('searchEstates', () => {
    it('should search estates by query', async () => {
      const mockEstates = [
        { id: 'estate-1', name: 'Test Estate 1', type: NeighborhoodType.ESTATE, isGated: true },
        { id: 'estate-2', name: 'Test Estate 2', type: NeighborhoodType.ESTATE, isGated: true },
      ];

      const mockQueryBuilder = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockEstates),
      };

      mockNeighborhoodRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.searchEstates({ query: 'Test', limit: 10 });

      expect(result).toEqual(mockEstates);
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
    });

    it('should apply state filter', async () => {
      const mockQueryBuilder = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockNeighborhoodRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.searchEstates({ stateId: 'state-123', limit: 10 });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('lga.stateId = :stateId', { stateId: 'state-123' });
    });
  });

  describe('validateEstateSelection', () => {
    it('should validate gated estate successfully', async () => {
      const mockEstate = {
        id: 'estate-123',
        name: 'Test Estate',
        type: NeighborhoodType.ESTATE,
        isGated: true,
        lga: { id: 'lga-123', state: { id: 'state-123' } },
      };
      mockNeighborhoodRepository.findOne.mockResolvedValue(mockEstate);

      const result = await service.validateEstateSelection('estate-123');

      expect(result).toEqual(mockEstate);
    });

    it('should throw error if estate not found', async () => {
      mockNeighborhoodRepository.findOne.mockResolvedValue(null);

      await expect(service.validateEstateSelection('invalid-id')).rejects.toThrow(BadRequestException);
    });

    it('should throw error if location is not an estate', async () => {
      const mockNeighborhood = {
        id: 'neighborhood-123',
        type: NeighborhoodType.DISTRICT,
        isGated: false,
      };
      mockNeighborhoodRepository.findOne.mockResolvedValue(mockNeighborhood);

      await expect(service.validateEstateSelection('neighborhood-123')).rejects.toThrow(BadRequestException);
    });

    it('should throw error if estate is not gated', async () => {
      const mockEstate = {
        id: 'estate-123',
        name: 'Open Estate',
        type: NeighborhoodType.ESTATE,
        isGated: false,
      };
      mockNeighborhoodRepository.findOne.mockResolvedValue(mockEstate);

      await expect(service.validateEstateSelection('estate-123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('completeRegistrationWithLocation', () => {
    const locationData = {
      neighborhoodId: 'estate-123',
      stateId: 'state-123',
      lgaId: 'lga-123',
      address: '123 Test Street',
      latitude: 6.5244,
      longitude: 3.3792,
    };

    const mockEstate = {
      id: 'estate-123',
      name: 'Test Estate',
      type: NeighborhoodType.ESTATE,
      isGated: true,
      lgaId: 'lga-123',
      wardId: 'ward-123',
      requiresVerification: false,
      lga: {
        id: 'lga-123',
        name: 'Test LGA',
        state: { id: 'state-123', name: 'Lagos' },
      },
    };

    beforeEach(() => {
      mockNeighborhoodRepository.findOne.mockResolvedValue(mockEstate);
    });

    it('should complete registration with location successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        phoneNumber: '+2348012345678',
        phoneVerified: true,
      };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserLocationRepository.update.mockResolvedValue({});
      mockUserLocationRepository.create.mockReturnValue({});
      mockUserLocationRepository.save.mockResolvedValue({ id: 'location-123' });
      mockUserRepository.update.mockResolvedValue({});
      mockUserNeighborhoodRepository.findOne.mockResolvedValue(null);
      mockUserNeighborhoodRepository.update.mockResolvedValue({});
      mockUserNeighborhoodRepository.create.mockReturnValue({});
      mockUserNeighborhoodRepository.save.mockResolvedValue({});
      mockUserRepository.save.mockResolvedValue({ ...mockUser, isVerified: true, addressVerified: true });
      const mockTokenPair = { accessToken: 'token', refreshToken: 'refresh', expiresAt: new Date(), sessionId: 'session-123' };
      mockTokenService.generateTokenPair.mockResolvedValue(mockTokenPair);
      mockTokenService.generateUserResponse.mockReturnValue({ success: true, user: mockUser, ...mockTokenPair });

      const result = await service.completeRegistrationWithLocation('user-123', locationData);

      expect(result.success).toBe(true);
      expect(mockUserLocationRepository.save).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should return error if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.completeRegistrationWithLocation('invalid-id', locationData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should return error if neighborhood ID is missing', async () => {
      const mockUser = { id: 'user-123' };
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.completeRegistrationWithLocation('user-123', { ...locationData, neighborhoodId: '' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Estate selection is required');
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        phoneNumber: '+2348012345678',
        getVerificationLevel: jest.fn().mockReturnValue('verified'),
        isProfileComplete: jest.fn().mockReturnValue(true),
      };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({ ...mockUser, phoneVerified: true });

      const result = await service.updateUserProfile('user-123', { phoneVerified: true });

      expect(result.success).toBe(true);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should return error if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.updateUserProfile('invalid-id', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });

  describe('getUserProfile', () => {
    it('should get user profile successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+2348012345678',
        phoneVerified: true,
        isVerified: true,
        getVerificationLevel: jest.fn().mockReturnValue('verified'),
      };
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getUserProfile('user-123');

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe(mockUser.email);
    });

    it('should return error if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.getUserProfile('invalid-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });
});
