import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IsValidCategoryConstraint } from './custom-validators';
import { ListingCategory } from '@app/database';

@Module({
  imports: [TypeOrmModule.forFeature([ListingCategory])],
  providers: [IsValidCategoryConstraint],
  exports: [IsValidCategoryConstraint],
})
export class ValidationModule {}
