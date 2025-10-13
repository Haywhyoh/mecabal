import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IsValidCategoryConstraint, BusinessRulesService, DataIntegrityService } from './custom-validators';
import { BusinessRulesService as BusinessRulesServiceImpl } from './business-rules.service';
import { DataIntegrityService as DataIntegrityServiceImpl } from './data-integrity.service';
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
    BusinessRulesServiceImpl,
    DataIntegrityServiceImpl,
  ],
  exports: [
    IsValidCategoryConstraint,
    BusinessRulesServiceImpl,
    DataIntegrityServiceImpl,
  ],
})
export class ValidationModule {}