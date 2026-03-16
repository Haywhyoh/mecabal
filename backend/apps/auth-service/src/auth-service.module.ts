import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@app/auth';
import { DatabaseModule } from '@app/database';
import { AuthController } from './auth/auth.controller';

// Import entities
import {
  User,
  OtpVerification,
  EmailOtp,
  UserSession,
  Role,
  State,
  UserLocation,
  Neighborhood,
  UserNeighborhood,
  CulturalBackground,
  ProfessionalCategory,
} from '@app/database/entities';

// Import services
import { AuthService } from './services/auth.service';
import { EmailOtpService } from './services/email-otp.service';
import { PhoneOtpService } from './services/phone-otp.service';
import { TokenService } from './services/token.service';
import { GoogleTokenVerifierService } from './services/google-token-verifier.service';
import { TermiiService } from './services/termii.service';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    TypeOrmModule.forFeature([
      User,
      OtpVerification,
      EmailOtp,
      UserSession,
      Role,
      State,
      UserLocation,
      Neighborhood,
      UserNeighborhood,
      CulturalBackground,
      ProfessionalCategory,
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, EmailOtpService, PhoneOtpService, TokenService, GoogleTokenVerifierService, TermiiService],
  exports: [AuthService, EmailOtpService, PhoneOtpService, TokenService, GoogleTokenVerifierService, TermiiService],
})
export class AuthServiceModule {}
