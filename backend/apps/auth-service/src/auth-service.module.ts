import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from '@app/auth';
import { AuthController } from './auth/auth.controller';

// Import entities
import {
  User,
  OtpVerification,
  EmailOtp,
  UserSession,
  Role,
  UserNeighborhood,
  Post,
  PostCategory,
  PostMedia,
  PostReaction,
  PostComment,
  State,
  LocalGovernmentArea,
  Neighborhood,
  UserLanguage,
  UserPrivacySettings,
  NigerianState,
  NigerianLanguage,
  CulturalBackground,
  ProfessionalCategory,
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
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute
      },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    AuthModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USERNAME', 'MeCabal_user'),
        password: configService.get('DATABASE_PASSWORD', 'MeCabal_password'),
        database: configService.get('DATABASE_NAME', 'MeCabal_dev'),
        entities: [
          User,
          OtpVerification,
          EmailOtp,
          UserSession,
          Role,
          UserNeighborhood,
          Post,
          PostCategory,
          PostMedia,
          PostReaction,
          PostComment,
          State,
          LocalGovernmentArea,
          Neighborhood,
          UserLanguage,
          UserPrivacySettings,
          NigerianState,
          NigerianLanguage,
          CulturalBackground,
          ProfessionalCategory,
        ],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
        ssl:
          configService.get('NODE_ENV') === 'production'
            ? {
                rejectUnauthorized: false,
              }
            : false,
      }),
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '24h'),
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      User,
      OtpVerification,
      EmailOtp,
      UserSession,
      Role,
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, EmailOtpService, PhoneOtpService, TokenService],
  exports: [AuthService, EmailOtpService, PhoneOtpService, TokenService],
})
export class AuthServiceModule {}
