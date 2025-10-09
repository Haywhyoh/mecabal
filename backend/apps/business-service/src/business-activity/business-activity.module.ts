import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessActivityLog } from '@app/database/entities/business-activity-log.entity';
import { BusinessProfile } from '@app/database/entities/business-profile.entity';
import { BusinessActivityService } from './business-activity.service';
import { BusinessActivityController } from './business-activity.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([BusinessActivityLog, BusinessProfile]),
  ],
  providers: [BusinessActivityService],
  controllers: [BusinessActivityController],
  exports: [BusinessActivityService],
})
export class BusinessActivityModule {}
