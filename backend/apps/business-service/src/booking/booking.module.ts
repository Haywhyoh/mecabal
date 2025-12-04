import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingController, BusinessBookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { Booking } from '@app/database/entities/booking.entity';
import { BusinessProfile } from '@app/database/entities/business-profile.entity';
import { BusinessService } from '@app/database/entities/business-service.entity';
import { BankAccount } from '@app/database/entities/bank-account.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, BusinessProfile, BusinessService, BankAccount]),
  ],
  controllers: [BookingController, BusinessBookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}

