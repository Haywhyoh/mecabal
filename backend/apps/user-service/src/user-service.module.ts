import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
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
import { PointsController } from './controllers/points.controller';
import { AchievementsController } from './controllers/achievements.controller';
import { BadgesController } from './controllers/badges.controller';
import { LeaderboardController } from './controllers/leaderboard.controller';
import { GamificationController } from './controllers/gamification.controller';
import { UserProfileService } from './services/user-profile.service';
import { UserStatisticsService } from './services/user-statistics.service';
import { UserSearchService } from './services/user-search.service';
import { NinVerificationService } from './services/nin-verification.service';
import { TrustScoreService } from './services/trust-score.service';
import { BadgeService } from './services/badge.service';
import { DocumentService } from './services/document.service';
import { AuditTrailService } from './services/audit-trail.service';
import { VerificationIntegrationService } from './services/verification-integration.service';
import { PointsService } from './services/points.service';
import { AchievementsService } from './services/achievements.service';
import { BadgesService } from './services/badges.service';
import { LeaderboardService } from './services/leaderboard.service';
import { GamificationIntegrationService } from './services/gamification-integration.service';
import { SeederService } from '@app/database';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(), // For CRON jobs
    EventEmitterModule.forRoot(), // For event handling
    DatabaseModule, // Database configuration
    AuthModule, // For JWT guards
    StorageModule, // For file uploads
  ],
  controllers: [UserServiceController, UserProfileController, UserDashboardController, NinVerificationController, TrustScoreController, BadgeController, DocumentController, AuditTrailController, VerificationIntegrationController, PointsController, AchievementsController, BadgesController, LeaderboardController, GamificationController],
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
    PointsService,
    AchievementsService,
    BadgesService,
    LeaderboardService,
    GamificationIntegrationService,
    SeederService,
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
    PointsService,
    AchievementsService,
    BadgesService,
    LeaderboardService,
    GamificationIntegrationService,
  ],
})
export class UserServiceModule {}
