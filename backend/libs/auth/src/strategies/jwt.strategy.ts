import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@app/database';

export interface JwtPayload {
  sub: string;
  userId?: string; // For backward compatibility
  email: string;
  phoneNumber?: string;
  roles?: string[];
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    // Only validate access tokens for regular requests
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    // Get user ID from token payload
    const userId = payload.sub || payload.userId;

    const user = await this.userRepository.findOne({
      where: { id: userId },
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
