import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@app/database';

export interface JwtRefreshPayload {
  sub: string;
  userId?: string; // For backward compatibility
  email: string;
  phoneNumber?: string;
  sessionId: string;
  type: 'refresh';
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET') || 'your-super-secret-refresh-key-change-this-in-production',
    });
  }

  async validate(payload: JwtRefreshPayload): Promise<User> {
    // Only validate refresh tokens
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type - refresh token required');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub || payload.userId }, // Support both sub and userId
      relations: ['userNeighborhoods', 'userNeighborhoods.neighborhood'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    return user;
  }
}
