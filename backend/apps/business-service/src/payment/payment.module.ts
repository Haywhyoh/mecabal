import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaystackService } from './paystack/paystack.service';
import { Payment, Booking } from '@app/database/entities';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([Payment, Booking]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PaystackService],
  exports: [PaymentService, PaystackService],
})
export class PaymentModule {}









