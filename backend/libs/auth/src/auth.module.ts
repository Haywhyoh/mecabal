import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtConfigService } from './services/jwt-config.service';
import { User } from '@app/database';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([User])],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    LocalStrategy,
    JwtConfigService,
  ],
  exports: [AuthService, JwtConfigService],
})
export class AuthModule {}
