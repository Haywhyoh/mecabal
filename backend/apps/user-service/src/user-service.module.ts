import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
import { AuthModule } from '@app/auth';
import { StorageModule } from '@app/storage';
import { UserServiceController } from './user-service.controller';
import { UserProfileController } from './controllers/user-profile.controller';
import { UserProfileService } from './services/user-profile.service';
import { UserStatisticsService } from './services/user-statistics.service';
import { UserSearchService } from './services/user-search.service';

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
  controllers: [UserServiceController, UserProfileController],
  providers: [
    UserProfileService,
    UserStatisticsService,
    UserSearchService,
  ],
  exports: [
    UserProfileService,
    UserStatisticsService,
  ],
})
export class UserServiceModule {}
