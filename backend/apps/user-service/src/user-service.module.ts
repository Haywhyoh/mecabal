import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
import { AuthModule } from '@app/auth';
import { StorageModule } from '@app/storage';
import { UserServiceController } from './user-service.controller';
import { UserProfileController } from './controllers/user-profile.controller';
import { UserDashboardController } from './controllers/user-dashboard.controller';
import { NinVerificationController } from './controllers/nin-verification.controller';
import { TrustScoreController } from './controllers/trust-score.controller';
import { BadgeController } from './controllers/badge.controller';
import { DocumentController } from './controllers/document.controller';
import { AuditTrailController } from './controllers/audit-trail.controller';
import { VerificationIntegrationController } from './controllers/verification-integration.controller';
import { UserProfileService } from './services/user-profile.service';
import { UserStatisticsService } from './services/user-statistics.service';
import { UserSearchService } from './services/user-search.service';
import { NinVerificationService } from './services/nin-verification.service';
import { TrustScoreService } from './services/trust-score.service';
import { BadgeService } from './services/badge.service';
import { DocumentService } from './services/document.service';
import { AuditTrailService } from './services/audit-trail.service';
import { VerificationIntegrationService } from './services/verification-integration.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule, // Database configuration
    AuthModule, // For JWT guards
    StorageModule, // For file uploads
  ],
  controllers: [UserServiceController, UserProfileController, UserDashboardController, NinVerificationController, TrustScoreController, BadgeController, DocumentController, AuditTrailController, VerificationIntegrationController],
  providers: [
    UserProfileService,
    UserStatisticsService,
    UserSearchService,
    NinVerificationService,
    TrustScoreService,
    BadgeService,
    DocumentService,
    AuditTrailService,
    VerificationIntegrationService,
  ],
  exports: [
    UserProfileService,
    UserStatisticsService,
    NinVerificationService,
    TrustScoreService,
    BadgeService,
    DocumentService,
    AuditTrailService,
    VerificationIntegrationService,
  ],
})
export class UserServiceModule {}
