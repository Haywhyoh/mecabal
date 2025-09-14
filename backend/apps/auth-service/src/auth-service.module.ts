import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthServiceController } from './auth-service.controller';
import { AuthServiceService } from './auth-service.service';

// Import entities
import { 
  User, 
  OtpVerification, 
  EmailOtp,
  UserSession 
} from '@app/database/entities';

// Import services
import { AuthService } from './services/auth.service';
import { EmailOtpService } from './services/email-otp.service';
import { PhoneOtpService } from './services/phone-otp.service';
import { TokenService } from './services/token.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.register({
      global: true,
    }),
    TypeOrmModule.forFeature([
      User,
      OtpVerification,
      EmailOtp,
      UserSession,
    ]),
  ],
  controllers: [AuthServiceController],
  providers: [
    AuthServiceService,
    AuthService,
    EmailOtpService,
    PhoneOtpService,
    TokenService,
  ],
  exports: [
    AuthService,
    EmailOtpService,
    PhoneOtpService,
    TokenService,
  ],
})
export class AuthServiceModule {}
