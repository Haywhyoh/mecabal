import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessLicense } from '@app/database/entities/business-license.entity';
import { BusinessProfile } from '@app/database/entities/business-profile.entity';
import { BusinessLicensesService } from './business-licenses.service';
import { BusinessLicensesController } from './business-licenses.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessLicense, BusinessProfile])],
  controllers: [BusinessLicensesController],
  providers: [BusinessLicensesService],
  exports: [BusinessLicensesService],
})
export class BusinessLicensesModule {}
