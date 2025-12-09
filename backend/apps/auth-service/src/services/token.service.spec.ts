import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';
import { UserSession } from '@app/database/entities/user-session.entity';
import { User } from '@app/database/entities/user.entity';
import * as crypto from 'crypto';

jest.mock('crypto');

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockSessionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        JWT_SECRET: 'test-secret',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_ACCESS_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: getRepositoryToken(UserSession),
          useValue: mockSessionRepository,
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

    service = module.get<TokenService>(TokenService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateTokenPair', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      phoneNumber: '+2348012345678',
    } as User;

    it('should generate token pair successfully', async () => {
      const mockSession = {
        id: 'session-123',
        userId: mockUser.id,
        isActive: true,
        expiresAt: new Date(),
      };

      mockSessionRepository.create.mockReturnValue(mockSession);
      mockSessionRepository.save.mockResolvedValueOnce(mockSession);
      mockSessionRepository.save.mockResolvedValueOnce({ ...mockSession, refreshTokenHash: 'hashed' });
      mockJwtService.sign.mockReturnValueOnce('access_token');
      mockJwtService.sign.mockReturnValueOnce('refresh_token');
      (crypto.createHmac as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('hashed_refresh_token'),
      });

      const result = await service.generateTokenPair(mockUser);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('access_token');
      expect(result.refreshToken).toBe('refresh_token');
      expect(result.sessionId).toBe('session-123');
      expect(mockSessionRepository.create).toHaveBeenCalled();
      expect(mockSessionRepository.save).toHaveBeenCalledTimes(2);
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should generate tokens with device info', async () => {
      const deviceInfo = {
        deviceId: 'device-123',
        deviceType: 'mobile',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      const mockSession = {
        id: 'session-123',
        userId: mockUser.id,
        ...deviceInfo,
        isActive: true,
      };

      mockSessionRepository.create.mockReturnValue(mockSession);
      mockSessionRepository.save.mockResolvedValueOnce(mockSession);
      mockSessionRepository.save.mockResolvedValueOnce({ ...mockSession, refreshTokenHash: 'hashed' });
      mockJwtService.sign.mockReturnValueOnce('access_token');
      mockJwtService.sign.mockReturnValueOnce('refresh_token');
      (crypto.createHmac as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('hashed_refresh_token'),
      });

      const result = await service.generateTokenPair(mockUser, deviceInfo);

      expect(result).toBeDefined();
      expect(mockSessionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          deviceId: deviceInfo.deviceId,
          deviceType: deviceInfo.deviceType,
        })
      );
    });

    it('should set correct expiration times', async () => {
      const mockSession = { id: 'session-123', userId: mockUser.id };
      mockSessionRepository.create.mockReturnValue(mockSession);
      mockSessionRepository.save.mockResolvedValueOnce(mockSession);
      mockSessionRepository.save.mockResolvedValueOnce({ ...mockSession, refreshTokenHash: 'hashed' });
      mockJwtService.sign.mockReturnValue('token');
      (crypto.createHmac as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('hashed'),
      });

      const result = await service.generateTokenPair(mockUser);

      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ expiresIn: '15m' })
      );
    });
  });

  describe('refreshTokens', () => {
    const refreshToken = 'valid_refresh_token';
    const mockPayload = {
      sub: 'user-123',
      userId: 'user-123',
      email: 'test@example.com',
      sessionId: 'session-123',
      type: 'refresh',
    };

    it('should refresh tokens successfully', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        isActive: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        refreshTokenHash: 'hashed_refresh_token',
        isValidSession: jest.fn().mockReturnValue(true),
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      };

      mockJwtService.verify.mockReturnValue(mockPayload);
      mockSessionRepository.findOne.mockResolvedValue(mockSession);
      (crypto.createHmac as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('hashed_refresh_token'),
      });

      mockSessionRepository.create.mockReturnValue({ id: 'new-session' });
      mockSessionRepository.save.mockResolvedValue({ id: 'new-session' });
      mockJwtService.sign.mockReturnValue('new_token');
      mockSessionRepository.update.mockResolvedValue({});

      const result = await service.refreshTokens(refreshToken);

      expect(result).toBeDefined();
      expect(result?.accessToken).toBeDefined();
      expect(mockJwtService.verify).toHaveBeenCalled();
      expect(mockSessionRepository.update).toHaveBeenCalled();
    });

    it('should return null for invalid token type', async () => {
      mockJwtService.verify.mockReturnValue({ ...mockPayload, type: 'access' });

      const result = await service.refreshTokens(refreshToken);

      expect(result).toBeNull();
    });

    it('should return null if session not found', async () => {
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockSessionRepository.findOne.mockResolvedValue(null);

      const result = await service.refreshTokens(refreshToken);

      expect(result).toBeNull();
    });

    it('should return null if session is invalid', async () => {
      const mockSession = {
        id: 'session-123',
        isValidSession: jest.fn().mockReturnValue(false),
      };

      mockJwtService.verify.mockReturnValue(mockPayload);
      mockSessionRepository.findOne.mockResolvedValue(mockSession);

      const result = await service.refreshTokens(refreshToken);

      expect(result).toBeNull();
    });

    it('should return null if refresh token hash mismatch', async () => {
      const mockSession = {
        id: 'session-123',
        refreshTokenHash: 'different_hash',
        isValidSession: jest.fn().mockReturnValue(true),
      };

      mockJwtService.verify.mockReturnValue(mockPayload);
      mockSessionRepository.findOne.mockResolvedValue(mockSession);
      (crypto.createHmac as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('hashed_refresh_token'),
      });
      mockSessionRepository.update.mockResolvedValue({});

      const result = await service.refreshTokens(refreshToken);

      expect(result).toBeNull();
      expect(mockSessionRepository.update).toHaveBeenCalled();
    });

    it('should handle JWT verification errors', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await service.refreshTokens('invalid_token');

      expect(result).toBeNull();
    });
  });

  describe('validateAccessToken', () => {
    const accessToken = 'valid_access_token';
    const mockPayload = {
      sub: 'user-123',
      userId: 'user-123',
      email: 'test@example.com',
      sessionId: 'session-123',
      type: 'access',
    };

    it('should validate access token successfully', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        isActive: true,
        isValidSession: jest.fn().mockReturnValue(true),
      };

      mockJwtService.verify.mockReturnValue(mockPayload);
      mockSessionRepository.findOne.mockResolvedValue(mockSession);

      const result = await service.validateAccessToken(accessToken);

      expect(result).toEqual(mockPayload);
      expect(mockJwtService.verify).toHaveBeenCalledWith(accessToken, expect.any(Object));
    });

    it('should return null if session not found', async () => {
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockSessionRepository.findOne.mockResolvedValue(null);

      const result = await service.validateAccessToken(accessToken);

      expect(result).toBeNull();
    });

    it('should return null if session is invalid', async () => {
      const mockSession = {
        id: 'session-123',
        isValidSession: jest.fn().mockReturnValue(false),
      };

      mockJwtService.verify.mockReturnValue(mockPayload);
      mockSessionRepository.findOne.mockResolvedValue(mockSession);

      const result = await service.validateAccessToken(accessToken);

      expect(result).toBeNull();
    });

    it('should handle JWT verification errors', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await service.validateAccessToken('invalid_token');

      expect(result).toBeNull();
    });

    it('should support both sub and userId fields', async () => {
      const payloadWithSub = { ...mockPayload, userId: undefined };
      const mockSession = {
        id: 'session-123',
        isValidSession: jest.fn().mockReturnValue(true),
      };

      mockJwtService.verify.mockReturnValue(payloadWithSub);
      mockSessionRepository.findOne.mockResolvedValue(mockSession);

      const result = await service.validateAccessToken(accessToken);

      expect(result).toBeDefined();
    });
  });

  describe('invalidateSession', () => {
    it('should invalidate session successfully', async () => {
      mockSessionRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.invalidateSession('session-123');

      expect(result).toBe(true);
      expect(mockSessionRepository.update).toHaveBeenCalledWith(
        { id: 'session-123' },
        expect.objectContaining({ isActive: false, refreshTokenHash: null })
      );
    });

    it('should return false if session not found', async () => {
      mockSessionRepository.update.mockResolvedValue({ affected: 0 });

      const result = await service.invalidateSession('invalid-session');

      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      mockSessionRepository.update.mockRejectedValue(new Error('Database error'));

      const result = await service.invalidateSession('session-123');

      expect(result).toBe(false);
    });
  });

  describe('invalidateUserSessions', () => {
    it('should invalidate all user sessions', async () => {
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 3 }),
      };

      mockSessionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.invalidateUserSessions('user-123');

      expect(result).toBe(3);
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });

    it('should invalidate sessions except current one', async () => {
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 2 }),
      };

      mockSessionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.invalidateUserSessions('user-123', 'session-current');

      expect(result).toBe(2);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('id != :exceptSessionId', { exceptSessionId: 'session-current' });
    });

    it('should handle errors gracefully', async () => {
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      mockSessionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.invalidateUserSessions('user-123');

      expect(result).toBe(0);
    });
  });

  describe('getUserActiveSessions', () => {
    it('should get user active sessions', async () => {
      const mockSessions = [
        { id: 'session-1', userId: 'user-123', isActive: true },
        { id: 'session-2', userId: 'user-123', isActive: true },
      ];

      mockSessionRepository.find.mockResolvedValue(mockSessions);

      const result = await service.getUserActiveSessions('user-123');

      expect(result).toEqual(mockSessions);
      expect(mockSessionRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-123', isActive: true },
        })
      );
    });

    it('should return empty array if no active sessions', async () => {
      mockSessionRepository.find.mockResolvedValue([]);

      const result = await service.getUserActiveSessions('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should cleanup expired and inactive sessions', async () => {
      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 5 }),
      };

      mockSessionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.cleanupExpiredSessions();

      expect(result).toBe(5);
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });

    it('should return 0 if no sessions to cleanup', async () => {
      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
      };

      mockSessionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.cleanupExpiredSessions();

      expect(result).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      mockSessionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.cleanupExpiredSessions();

      expect(result).toBe(0);
    });
  });

  describe('generateUserResponse', () => {
    it('should generate user response with token pair', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+2348012345678',
        phoneVerified: true,
        isVerified: true,
        getVerificationLevel: jest.fn().mockReturnValue('verified'),
        isProfileComplete: jest.fn().mockReturnValue(true),
      } as any;

      const mockTokenPair = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        expiresAt: new Date(),
        sessionId: 'session-123',
      };

      const result = service.generateUserResponse(mockUser, mockTokenPair);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(mockUser.id);
      expect(result.user.email).toBe(mockUser.email);
      expect(result.accessToken).toBe(mockTokenPair.accessToken);
      expect(result.refreshToken).toBe(mockTokenPair.refreshToken);
      expect(result.expiresAt).toBe(mockTokenPair.expiresAt);
    });

    it('should include verification level and profile complete status', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+2348012345678',
        phoneVerified: false,
        isVerified: false,
        getVerificationLevel: jest.fn().mockReturnValue('partial'),
        isProfileComplete: jest.fn().mockReturnValue(false),
      } as any;

      const mockTokenPair = {
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: new Date(),
        sessionId: 'session-123',
      };

      const result = service.generateUserResponse(mockUser, mockTokenPair);

      expect(result.user.verificationLevel).toBe('partial');
      expect(result.user.profileComplete).toBe(false);
    });
  });
});
