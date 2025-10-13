import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MarketplaceServiceController } from './marketplace-service.controller';
import { MarketplaceServiceService } from './marketplace-service.service';
import { ListingsModule } from './listings/listings.module';
import { ListingCategoriesModule } from './listing-categories/listing-categories.module';
import { SearchModule } from './search/search.module';
import { BusinessModule } from './business/business.module';
import { JobsModule } from './jobs/jobs.module';
import { DatabaseModule } from '@app/database';
import { AuthModule } from '@app/auth';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    ListingsModule,
    ListingCategoriesModule,
    SearchModule,
    BusinessModule,
    JobsModule,
  ],
  controllers: [MarketplaceServiceController],
  providers: [MarketplaceServiceService],
})
export class MarketplaceServiceModule {}
