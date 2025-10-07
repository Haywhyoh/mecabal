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
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}
