import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessReview } from '@app/database/entities/business-review.entity';
import { BusinessProfile } from '@app/database/entities/business-profile.entity';
import { BusinessReviewService } from './business-review.service';
import { BusinessReviewController } from './business-review.controller';
import { AuthModule } from '@app/auth';

@Module({
  imports: [
    TypeOrmModule.forFeature([BusinessReview, BusinessProfile]),
    AuthModule,
  ],
  providers: [BusinessReviewService],
  controllers: [BusinessReviewController],
  exports: [BusinessReviewService],
})
export class BusinessReviewModule {}
