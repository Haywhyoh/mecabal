import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListingCategory } from '@app/database';
import { ListingCategoriesService } from './listing-categories.service';
import { ListingCategoriesController } from './listing-categories.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ListingCategory])],
  controllers: [ListingCategoriesController],
  providers: [ListingCategoriesService],
  exports: [ListingCategoriesService],
})
export class ListingCategoriesModule {}
