import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import {
  Listing,
  User,
  ListingCategory,
} from '@app/database';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Listing,
      User,
      ListingCategory,
    ]),
  ],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
