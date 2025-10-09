import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessInquiry } from '@app/database/entities/business-inquiry.entity';
import { BusinessProfile } from '@app/database/entities/business-profile.entity';
import { BusinessInquiryService } from './business-inquiry.service';
import { BusinessInquiryController, UserInquiryController } from './business-inquiry.controller';
import { BusinessActivityModule } from '../business-activity/business-activity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BusinessInquiry, BusinessProfile]),
    BusinessActivityModule,
  ],
  providers: [BusinessInquiryService],
  controllers: [BusinessInquiryController, UserInquiryController],
  exports: [BusinessInquiryService],
})
export class BusinessInquiryModule {}
