import { Module } from '@nestjs/common';
import { MarketplaceServiceController } from './marketplace-service.controller';
import { MarketplaceServiceService } from './marketplace-service.service';
import { ListingsModule } from './listings/listings.module';
import { ListingCategoriesModule } from './listing-categories/listing-categories.module';

@Module({
  imports: [ListingsModule, ListingCategoriesModule],
  controllers: [MarketplaceServiceController],
  providers: [MarketplaceServiceService],
})
export class MarketplaceServiceModule {}
