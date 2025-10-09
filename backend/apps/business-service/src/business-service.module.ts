import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '@app/auth/strategies/jwt.strategy';
import { BusinessServiceController } from './business-service.controller';
import { BusinessServiceService } from './business-service.service';
import { DatabaseModule } from '@app/database/database.module';
import { BusinessProfileModule } from './business-profile/business-profile.module';
import { BusinessCategoryModule } from './business-category/business-category.module';
import { BusinessServicesModule } from './business-services/business-services.module';
import { BusinessLicensesModule } from './business-licenses/business-licenses.module';
import { BusinessSearchModule } from './business-search/business-search.module';
import {
  BusinessProfile,
  BusinessCategory,
  BusinessLicense,
  BusinessService,
  BusinessReview,
  BusinessInquiry,
  BusinessActivityLog
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
    BusinessProfileModule,
    BusinessCategoryModule,
    BusinessServicesModule,
    BusinessLicensesModule,
    BusinessSearchModule,
    TypeOrmModule.forFeature([
      BusinessProfile,
      BusinessCategory,
      BusinessLicense,
      BusinessService,
      BusinessReview,
      BusinessInquiry,
      BusinessActivityLog,
    ]),
  ],
  controllers: [BusinessServiceController],
  providers: [BusinessServiceService, JwtStrategy],
  exports: [BusinessServiceService],
})
export class BusinessServiceModule {}
