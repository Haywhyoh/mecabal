import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessService } from '@app/database/entities/business-service.entity';
import { BusinessProfile } from '@app/database/entities/business-profile.entity';
import { BusinessServicesService } from './business-services.service';
import { BusinessServicesController } from './business-services.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessService, BusinessProfile])],
  controllers: [BusinessServicesController],
  providers: [BusinessServicesService],
  exports: [BusinessServicesService],
})
export class BusinessServicesModule {}
