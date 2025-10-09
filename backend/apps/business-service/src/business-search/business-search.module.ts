import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessProfile } from '@app/database/entities/business-profile.entity';
import { BusinessSearchService } from './business-search.service';
import { BusinessSearchController } from './business-search.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessProfile])],
  controllers: [BusinessSearchController],
  providers: [BusinessSearchService],
  exports: [BusinessSearchService],
})
export class BusinessSearchModule {}
