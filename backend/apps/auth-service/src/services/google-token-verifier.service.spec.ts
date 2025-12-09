import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { GoogleTokenVerifierService } from './google-token-verifier.service';
import { OAuth2Client } from 'google-auth-library';

jest.mock('google-auth-library');

describe('GoogleTokenVerifierService', () => {
  let service: GoogleTokenVerifierService;
  let mockOAuth2Client: jest.Mocked<OAuth2Client>;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        GOOGLE_CLIENT_ID: 'test-client-id.apps.googleusercontent.com',
        GOOGLE_WEB_CLIENT_ID: 'test-web-client-id.apps.googleusercontent.com',
        GOOGLE_IOS_CLIENT_ID: 'test-ios-client-id.apps.googleusercontent.com',
        GOOGLE_ANDROID_CLIENT_ID: 'test-android-client-id.apps.googleusercontent.com',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Reset mock config service to return values
    mockConfigService.get.mockImplementation((key: string) => {
      const config = {
        GOOGLE_CLIENT_ID: 'test-client-id.apps.googleusercontent.com',
        GOOGLE_WEB_CLIENT_ID: 'test-web-client-id.apps.googleusercontent.com',
        GOOGLE_IOS_CLIENT_ID: 'test-ios-client-id.apps.googleusercontent.com',
        GOOGLE_ANDROID_CLIENT_ID: 'test-android-client-id.apps.googleusercontent.com',
      };
      return config[key];
    });

    mockOAuth2Client = {
      verifyIdToken: jest.fn(),
      getTokenInfo: jest.fn(),
    } as any;

    (OAuth2Client as jest.MockedClass<typeof OAuth2Client>).mockImplementation(
      () => mockOAuth2Client,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleTokenVerifierService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<GoogleTokenVerifierService>(GoogleTokenVerifierService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw error if GOOGLE_CLIENT_ID not configured', () => {
    mockConfigService.get.mockReturnValue(undefined);

    expect(() => {
      new GoogleTokenVerifierService(mockConfigService as any);
    }).toThrow('GOOGLE_CLIENT_ID is not configured');
  });

  describe('verifyIdToken', () => {
    const validIdToken = 'valid.google.id.token';
    const mockPayload = {
      sub: 'google-user-123',
      email: 'test@example.com',
      email_verified: true,
      name: 'Test User',
      given_name: 'Test',
      family_name: 'User',
      picture: 'https://example.com/picture.jpg',
      aud: 'test-client-id.apps.googleusercontent.com',
      iss: 'https://accounts.google.com',
      iat: 1234567890,
      exp: 1234571490,
    };

    it('should verify valid ID token successfully', async () => {
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue(mockPayload),
      };

      mockOAuth2Client.verifyIdToken.mockResolvedValue(mockTicket as any);

      const result = await service.verifyIdToken(validIdToken);

      expect(result).toEqual(mockPayload);
      expect(mockOAuth2Client.verifyIdToken).toHaveBeenCalledWith({
        idToken: validIdToken,
        audience: expect.arrayContaining([
          'test-client-id.apps.googleusercontent.com',
          'test-web-client-id.apps.googleusercontent.com',
        ]),
      });
    });

    it('should throw error if payload is missing', async () => {
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue(null),
      };

      mockOAuth2Client.verifyIdToken.mockResolvedValue(mockTicket as any);

      await expect(service.verifyIdToken(validIdToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw error if required fields are missing', async () => {
      const invalidPayload = { ...mockPayload, sub: undefined, email: undefined };
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue(invalidPayload),
      };

      mockOAuth2Client.verifyIdToken.mockResolvedValue(mockTicket as any);

      await expect(service.verifyIdToken(validIdToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle verification errors', async () => {
      mockOAuth2Client.verifyIdToken.mockRejectedValue(
        new Error('Token verification failed'),
      );

      await expect(service.verifyIdToken(validIdToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle audience mismatch errors', async () => {
      mockOAuth2Client.verifyIdToken.mockRejectedValue(
        new Error('Wrong recipient: expected audience'),
      );

      await expect(service.verifyIdToken(validIdToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should verify token with all configured client IDs', async () => {
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue(mockPayload),
      };

      mockOAuth2Client.verifyIdToken.mockResolvedValue(mockTicket as any);

      await service.verifyIdToken(validIdToken);

      expect(mockOAuth2Client.verifyIdToken).toHaveBeenCalledWith({
        idToken: validIdToken,
        audience: [
          'test-client-id.apps.googleusercontent.com',
          'test-web-client-id.apps.googleusercontent.com',
          'test-ios-client-id.apps.googleusercontent.com',
          'test-android-client-id.apps.googleusercontent.com',
        ],
      });
    });

    it('should handle missing optional fields gracefully', async () => {
      const minimalPayload = {
        sub: 'google-user-123',
        email: 'test@example.com',
        aud: 'test-client-id.apps.googleusercontent.com',
        iss: 'https://accounts.google.com',
      };

      const mockTicket = {
        getPayload: jest.fn().mockReturnValue(minimalPayload),
      };

      mockOAuth2Client.verifyIdToken.mockResolvedValue(mockTicket as any);

      const result = await service.verifyIdToken(validIdToken);

      expect(result.sub).toBe(minimalPayload.sub);
      expect(result.email).toBe(minimalPayload.email);
      expect(result.email_verified).toBe(false);
    });

    it('should throw error when no client IDs are configured', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      await expect(service.verifyIdToken(validIdToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('verifyAccessToken', () => {
    const validAccessToken = 'valid.google.access.token';
    const mockTokenInfo = {
      sub: 'google-user-123',
      email: 'test@example.com',
      email_verified: true,
      name: 'Test User',
      given_name: 'Test',
      family_name: 'User',
      picture: 'https://example.com/picture.jpg',
      aud: 'test-client-id.apps.googleusercontent.com',
      iss: 'https://accounts.google.com',
      iat: 1234567890,
      exp: 1234571490,
    };

    it('should verify valid access token successfully', async () => {
      mockOAuth2Client.getTokenInfo.mockResolvedValue(mockTokenInfo as any);

      const result = await service.verifyAccessToken(validAccessToken);

      expect(result.sub).toBe(mockTokenInfo.sub);
      expect(result.email).toBe(mockTokenInfo.email);
      expect(mockOAuth2Client.getTokenInfo).toHaveBeenCalledWith(validAccessToken);
    });

    it('should throw error if token info is invalid', async () => {
      mockOAuth2Client.getTokenInfo.mockResolvedValue({
        sub: undefined,
        email: undefined,
      } as any);

      await expect(service.verifyAccessToken(validAccessToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle verification errors', async () => {
      mockOAuth2Client.getTokenInfo.mockRejectedValue(
        new Error('Token info retrieval failed'),
      );

      await expect(service.verifyAccessToken(validAccessToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle missing optional fields', async () => {
      const minimalTokenInfo = {
        sub: 'google-user-123',
        email: 'test@example.com',
        aud: 'test-client-id.apps.googleusercontent.com',
      };

      mockOAuth2Client.getTokenInfo.mockResolvedValue(minimalTokenInfo as any);

      const result = await service.verifyAccessToken(validAccessToken);

      expect(result.sub).toBe(minimalTokenInfo.sub);
      expect(result.email).toBe(minimalTokenInfo.email);
      expect(result.name).toBe('');
      expect(result.given_name).toBe('');
      expect(result.family_name).toBe('');
    });
  });

  describe('getUserInfo', () => {
    const validAccessToken = 'valid.google.access.token';
    const mockUserInfo = {
      id: 'google-user-123',
      email: 'test@example.com',
      verified_email: true,
      name: 'Test User',
      given_name: 'Test',
      family_name: 'User',
      picture: 'https://example.com/picture.jpg',
    };

    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should fetch user info successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockUserInfo),
      });

      const result = await service.getUserInfo(validAccessToken);

      expect(result).toEqual(mockUserInfo);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${validAccessToken}`,
          },
        },
      );
    });

    it('should throw error if API request fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(service.getUserInfo(validAccessToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw error if user info is invalid', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: undefined,
          email: undefined,
        }),
      });

      await expect(service.getUserInfo(validAccessToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(service.getUserInfo(validAccessToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle JSON parsing errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      });

      await expect(service.getUserInfo(validAccessToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return user info with all fields', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockUserInfo),
      });

      const result = await service.getUserInfo(validAccessToken);

      expect(result.id).toBe(mockUserInfo.id);
      expect(result.email).toBe(mockUserInfo.email);
      expect(result.name).toBe(mockUserInfo.name);
      expect(result.given_name).toBe(mockUserInfo.given_name);
      expect(result.family_name).toBe(mockUserInfo.family_name);
      expect(result.picture).toBe(mockUserInfo.picture);
      expect(result.verified_email).toBe(mockUserInfo.verified_email);
    });
  });
});
