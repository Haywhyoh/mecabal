import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessController } from './business.controller';
import { BusinessApiService } from './business.service';
import {
  BusinessProfile,
  BusinessService,
  BusinessReview,
  BusinessInquiry,
  ServiceInquiry,
  User,
  ListingCategory,
} from '@app/database';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BusinessProfile,
      BusinessService,
      BusinessReview,
      BusinessInquiry,
      ServiceInquiry,
      User,
      ListingCategory,
    ]),
  ],
  controllers: [BusinessController],
  providers: [BusinessApiService],
  exports: [BusinessApiService],
})
export class BusinessModule {}
