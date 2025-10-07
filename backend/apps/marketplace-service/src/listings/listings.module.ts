import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Listing,
  ListingCategory,
  ListingMedia,
  ListingSave,
  User,
} from '@app/database';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';
import { MarketplaceAuthGuard } from '../guards/marketplace-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Listing,
      ListingCategory,
      ListingMedia,
      ListingSave,
      User,
    ]),
  ],
  controllers: [ListingsController],
  providers: [ListingsService, MarketplaceAuthGuard],
  exports: [ListingsService],
})
export class ListingsModule {}
