import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessLicense } from '@app/database/entities/business-license.entity';
import { BusinessProfile } from '@app/database/entities/business-profile.entity';
import { BusinessLicenseService } from './business-license.service';
import { BusinessLicenseController } from './business-license.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([BusinessLicense, BusinessProfile]),
  ],
  providers: [BusinessLicenseService],
  controllers: [BusinessLicenseController],
  exports: [BusinessLicenseService],
})
export class BusinessLicenseModule {}
