import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule as SharedAuthModule } from '@app/auth';
import { DatabaseModule } from '@app/database';
import { User } from '@app/database';
import { AuthController } from './auth.controller';
import { GoogleTokenVerifierService } from '../services/google-token-verifier.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute for general endpoints
      },
      {
        name: 'otp-send',
        ttl: 60000, // 1 minute
        limit: 3, // 3 OTP sends per minute per IP
      },
      {
        name: 'otp-verify',
        ttl: 300000, // 5 minutes
        limit: 10, // 10 OTP verification attempts per 5 minutes per IP
      },
      {
        name: 'auth-strict',
        ttl: 900000, // 15 minutes
        limit: 5, // 5 login attempts per 15 minutes per IP
      },
    ]),
    DatabaseModule,
    TypeOrmModule.forFeature([User]),
    SharedAuthModule,
  ],
  controllers: [AuthController],
  providers: [GoogleTokenVerifierService],
  exports: [GoogleTokenVerifierService],
})
export class AuthServiceModule {}
