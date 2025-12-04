import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '@app/auth/strategies/jwt.strategy';
import { BusinessServiceController } from './business-service.controller';
import { BusinessServiceService } from './business-service.service';
import { DatabaseModule } from '@app/database/database.module';
import { AuthModule } from '@app/auth';
import { BusinessProfileModule } from './business-profile/business-profile.module';
import { BusinessCategoryModule } from './business-category/business-category.module';
import { BusinessServicesModule } from './business-services/business-services.module';
import { BusinessLicenseModule } from './business-license/business-license.module';
import { BusinessSearchModule } from './business-search/business-search.module';
import { BusinessReviewModule } from './business-review/business-review.module';
import { BusinessActivityModule } from './business-activity/business-activity.module';
import { BusinessInquiryModule } from './business-inquiry/business-inquiry.module';
import { BookingModule } from './booking/booking.module';
import { PaymentModule } from './payment/payment.module';
import { BankAccountModule } from './bank-account/bank-account.module';
import {
  BusinessProfile,
  BusinessCategory,
  BusinessLicense,
  BusinessService,
  BusinessReview,
  BusinessInquiry,
  BusinessActivityLog,
  Booking,
  Payment,
  BankAccount,
} from '@app/database/entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
    DatabaseModule,
    AuthModule,
    // Import specific route modules before BusinessProfileModule to ensure
    // specific routes are registered before the catch-all :id route
    BusinessCategoryModule,
    BusinessSearchModule, // Must be before BusinessProfileModule to handle /search routes
    BookingModule, // Must be before BusinessProfileModule to handle /bookings routes
    PaymentModule, // Must be before BusinessProfileModule to handle /payments routes
    BankAccountModule, // Must be before BusinessProfileModule to handle /bank-accounts routes
    BusinessProfileModule,
    BusinessServicesModule,
    BusinessLicenseModule,
    BusinessReviewModule,
    BusinessActivityModule,
    BusinessInquiryModule,
    TypeOrmModule.forFeature([
      BusinessProfile,
      BusinessCategory,
      BusinessLicense,
      BusinessService,
      BusinessReview,
      BusinessInquiry,
      BusinessActivityLog,
      Booking,
      Payment,
      BankAccount,
    ]),
  ],
  controllers: [BusinessServiceController],
  providers: [BusinessServiceService, JwtStrategy],
  exports: [BusinessServiceService],
})
export class BusinessServiceModule {}
