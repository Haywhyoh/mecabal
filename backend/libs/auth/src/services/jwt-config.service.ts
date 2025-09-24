import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtConfigService {
  constructor(private configService: ConfigService) {}

  getAccessTokenSecret(): string {
    return this.configService.get<string>('JWT_SECRET') || 'your-super-secret-jwt-key-change-this-in-production';
  }

  getRefreshTokenSecret(): string {
    return this.configService.get<string>('JWT_REFRESH_SECRET') || 'your-super-secret-refresh-key-change-this-in-production';
  }

  getAccessTokenExpiration(): string {
    return this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m');
  }

  getRefreshTokenExpiration(): string {
    return this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
  }

  validateSecrets(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    const accessSecret = this.getAccessTokenSecret();
    const refreshSecret = this.getRefreshTokenSecret();

    // Check if secrets are the default values
    if (accessSecret === 'your-super-secret-jwt-key-change-this-in-production') {
      issues.push('JWT_SECRET is using default value - change in production');
    }

    if (refreshSecret === 'your-super-secret-refresh-key-change-this-in-production') {
      issues.push('JWT_REFRESH_SECRET is using default value - change in production');
    }

    // Check if secrets are the same (security risk)
    if (accessSecret === refreshSecret) {
      issues.push('JWT_SECRET and JWT_REFRESH_SECRET are the same - use different secrets for security');
    }

    // Check secret length (should be at least 32 characters)
    if (accessSecret.length < 32) {
      issues.push('JWT_SECRET should be at least 32 characters long');
    }

    if (refreshSecret.length < 32) {
      issues.push('JWT_REFRESH_SECRET should be at least 32 characters long');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  generateSecureSecrets(): { accessSecret: string; refreshSecret: string } {
    const crypto = require('crypto');
    
    return {
      accessSecret: crypto.randomBytes(64).toString('hex'),
      refreshSecret: crypto.randomBytes(64).toString('hex'),
    };
  }
}
