import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IsValidCategoryConstraint } from './custom-validators';
import { BusinessRulesService } from './business-rules.service';
import { DataIntegrityService } from './data-integrity.service';
import { ListingCategory, Listing, User, BusinessProfile } from '@app/database';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ListingCategory,
      Listing,
      User,
      BusinessProfile,
    ]),
  ],
  providers: [
    IsValidCategoryConstraint,
    BusinessRulesService,
    DataIntegrityService,
  ],
  exports: [
    IsValidCategoryConstraint,
    BusinessRulesService,
    DataIntegrityService,
  ],
})
export class ValidationModule {}