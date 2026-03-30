import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtConfigService } from './services/jwt-config.service';
import { User } from '@app/database';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([User])],
  providers: [
    JwtStrategy,
    JwtRefreshStrategy,
    GoogleStrategy,
    JwtConfigService,
  ],
  exports: [JwtConfigService],
})
export class AuthModule {}
