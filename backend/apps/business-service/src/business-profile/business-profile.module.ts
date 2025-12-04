import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessProfile } from '@app/database/entities/business-profile.entity';
import { BusinessProfileService } from './business-profile.service';
import { BusinessProfileController } from './business-profile.controller';
import { StorageModule } from '@app/storage';

@Module({
  imports: [
    TypeOrmModule.forFeature([BusinessProfile]),
    StorageModule,
  ],
  controllers: [BusinessProfileController],
  providers: [BusinessProfileService],
  exports: [BusinessProfileService],
})
export class BusinessProfileModule {}
