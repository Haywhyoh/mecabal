import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule as SharedAuthModule } from '@app/auth';
import { DatabaseModule } from '@app/database';
import { AuthController } from './auth.controller';

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
    SharedAuthModule,
  ],
  controllers: [AuthController],
})
export class AuthServiceModule {}
