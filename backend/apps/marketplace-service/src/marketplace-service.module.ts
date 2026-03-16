import { Module } from '@nestjs/common';
import { MarketplaceServiceController } from './marketplace-service.controller';
import { MarketplaceServiceService } from './marketplace-service.service';
import { ListingsModule } from './listings/listings.module';
import { ListingCategoriesModule } from './listing-categories/listing-categories.module';
import { SearchModule } from './search/search.module';
import { BusinessModule } from './business/business.module';
import { JobsModule } from './jobs/jobs.module';
import { AppCacheModule } from './cache/cache.module';
import { RateLimitingModule } from './rate-limiting/rate-limiting.module';
import { DatabaseModule } from '@app/database';
import { AuthModule } from '@app/auth';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    ListingsModule,
    ListingCategoriesModule,
    SearchModule,
    BusinessModule,
    JobsModule,
    AppCacheModule,
    RateLimitingModule,
  ],
  controllers: [MarketplaceServiceController],
  providers: [MarketplaceServiceService],
})
export class MarketplaceServiceModule {}
