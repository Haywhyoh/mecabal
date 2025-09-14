import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { UserSession } from '@app/database/entities/user-session.entity';
import { User } from '@app/database/entities/user.entity';

export interface TokenPayload {
  userId: string;
  email: string;
  phoneNumber?: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  sessionId: string;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private jwtService: JwtService,
    @InjectRepository(UserSession)
    private sessionRepository: Repository<UserSession>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
  ) {}

  async generateTokenPair(
    user: User, 
    deviceInfo?: {
      deviceId?: string;
      deviceType?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<TokenPair> {
    // Create user session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days for refresh token

    const session = this.sessionRepository.create({
      userId: user.id,
      deviceId: deviceInfo?.deviceId,
      deviceType: deviceInfo?.deviceType,
      ipAddress: deviceInfo?.ipAddress,
      userAgent: deviceInfo?.userAgent,
      expiresAt,
      isActive: true,
    });

    const savedSession = await this.sessionRepository.save(session);

    // Generate tokens
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      sessionId: savedSession.id,
    };

    // Access token (15 minutes)
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
    });

    // Refresh token (7 days)
    const refreshToken = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      }
    );

    // Hash and store refresh token
    const refreshTokenHash = this.hashToken(refreshToken);
    session.refreshTokenHash = refreshTokenHash;
    await this.sessionRepository.save(session);

    this.logger.log(`Tokens generated for user ${user.id}, session ${savedSession.id}`);

    return {
      accessToken,
      refreshToken,
      expiresAt,
      sessionId: savedSession.id,
    };
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair | null> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      }) as TokenPayload & { type: string };

      if (payload.type !== 'refresh') {
        this.logger.warn('Invalid token type for refresh');
        return null;
      }

      // Get session
      const session = await this.sessionRepository.findOne({
        where: { 
          id: payload.sessionId,
          userId: payload.userId,
          isActive: true 
        },
        relations: ['user']
      });

      if (!session || !session.isValidSession()) {
        this.logger.warn('Invalid or expired session for refresh');
        return null;
      }

      // Verify refresh token hash
      const refreshTokenHash = this.hashToken(refreshToken);
      if (session.refreshTokenHash !== refreshTokenHash) {
        this.logger.warn('Refresh token hash mismatch');
        // Invalidate session for security
        await this.invalidateSession(session.id);
        return null;
      }

      // Generate new token pair
      const newTokenPair = await this.generateTokenPair(session.user, {
        deviceId: session.deviceId,
        deviceType: session.deviceType,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      });

      // Invalidate old session
      await this.invalidateSession(session.id);

      this.logger.log(`Tokens refreshed for user ${payload.userId}`);
      return newTokenPair;

    } catch (error) {
      this.logger.error('Error refreshing tokens:', error);
      return null;
    }
  }

  async validateAccessToken(token: string): Promise<TokenPayload | null> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      }) as TokenPayload;

      // Check if session is still valid
      const session = await this.sessionRepository.findOne({
        where: { 
          id: payload.sessionId,
          userId: payload.userId,
          isActive: true 
        }
      });

      if (!session || !session.isValidSession()) {
        this.logger.warn(`Invalid session ${payload.sessionId} for user ${payload.userId}`);
        return null;
      }

      return payload;

    } catch (error) {
      this.logger.debug('Invalid access token:', error.message);
      return null;
    }
  }

  async invalidateSession(sessionId: string): Promise<boolean> {
    try {
      const result = await this.sessionRepository.update(
        { id: sessionId },
        { 
          isActive: false,
          refreshTokenHash: null
        }
      );

      const invalidated = result.affected > 0;
      if (invalidated) {
        this.logger.log(`Session ${sessionId} invalidated`);
      }

      return invalidated;

    } catch (error) {
      this.logger.error('Error invalidating session:', error);
      return false;
    }
  }

  async invalidateUserSessions(userId: string, exceptSessionId?: string): Promise<number> {
    try {
      const queryBuilder = this.sessionRepository
        .createQueryBuilder()
        .update(UserSession)
        .set({ 
          isActive: false,
          refreshTokenHash: null
        })
        .where('userId = :userId', { userId })
        .andWhere('isActive = true');

      if (exceptSessionId) {
        queryBuilder.andWhere('id != :exceptSessionId', { exceptSessionId });
      }

      const result = await queryBuilder.execute();
      const invalidatedCount = result.affected || 0;

      this.logger.log(`Invalidated ${invalidatedCount} sessions for user ${userId}`);
      return invalidatedCount;

    } catch (error) {
      this.logger.error('Error invalidating user sessions:', error);
      return 0;
    }
  }

  async getUserActiveSessions(userId: string): Promise<UserSession[]> {
    return this.sessionRepository.find({
      where: { 
        userId, 
        isActive: true 
      },
      order: { createdAt: 'DESC' }
    });
  }

  async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await this.sessionRepository
        .createQueryBuilder()
        .delete()
        .from(UserSession)
        .where('expiresAt < :now', { now: new Date() })
        .orWhere('isActive = false')
        .execute();

      const deletedCount = result.affected || 0;
      
      if (deletedCount > 0) {
        this.logger.log(`Cleaned up ${deletedCount} expired/inactive sessions`);
      }

      return deletedCount;

    } catch (error) {
      this.logger.error('Error cleaning up expired sessions:', error);
      return 0;
    }
  }

  private hashToken(token: string): string {
    return crypto
      .createHmac('sha256', this.configService.get<string>('JWT_REFRESH_SECRET'))
      .update(token)
      .digest('hex');
  }

  // Helper method to extract user info from token for responses
  generateUserResponse(user: User, tokenPair: TokenPair) {
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        phoneVerified: user.phoneVerified,
        isVerified: user.isVerified,
        verificationLevel: user.getVerificationLevel(),
        profileComplete: user.isProfileComplete(),
      },
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresAt: tokenPair.expiresAt,
    };
  }
}