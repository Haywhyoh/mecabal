import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Payment, PaymentStatus, PaymentType } from '@app/database/entities/payment.entity';
import { Booking, PaymentStatus as BookingPaymentStatus } from '@app/database/entities/booking.entity';
import { PaystackService } from './paystack/paystack.service';
import { InitializePaymentDto, PaymentFilterDto, RefundPaymentDto } from '../dto/payment.dto';
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
    private paystackService: PaystackService,
  ) {}

  async initializePayment(
    userId: string,
    initializeDto: InitializePaymentDto,
  ): Promise<{ authorizationUrl: string; accessCode: string; reference: string }> {
    // Generate unique reference
    const reference = `MCB_${crypto.randomUUID().replace(/-/g, '').toUpperCase()}`;

    // Verify booking exists if bookingId is provided
    if (initializeDto.bookingId) {
      const booking = await this.bookingRepo.findOne({
        where: { id: initializeDto.bookingId, userId },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      if (booking.paymentStatus === BookingPaymentStatus.PAID) {
        throw new BadRequestException('Booking is already paid');
      }
    }

    // Initialize payment with Paystack
    const paystackResponse = await this.paystackService.initializePayment({
      email: initializeDto.email,
      amount: initializeDto.amount,
      currency: initializeDto.currency || 'NGN',
      reference,
      metadata: {
        ...initializeDto.metadata,
        userId,
        bookingId: initializeDto.bookingId,
        billId: initializeDto.billId,
        eventId: initializeDto.eventId,
      },
      callback_url: initializeDto.callbackUrl,
    });

    // Create payment record
    const payment = this.paymentRepo.create({
      userId,
      amount: initializeDto.amount,
      currency: initializeDto.currency || 'NGN',
      type: initializeDto.type,
      status: PaymentStatus.PENDING,
      reference,
      paystackReference: paystackResponse.data.reference,
      description: initializeDto.description,
      metadata: initializeDto.metadata,
      bookingId: initializeDto.bookingId,
      billId: initializeDto.billId,
      eventId: initializeDto.eventId,
    });

    await this.paymentRepo.save(payment);

    return {
      authorizationUrl: paystackResponse.data.authorization_url,
      accessCode: paystackResponse.data.access_code,
      reference,
    };
  }

  async verifyPayment(reference: string): Promise<Payment> {
    // Find payment by reference or paystackReference
    let payment = await this.paymentRepo.findOne({
      where: { reference },
      relations: ['booking'],
    });

    // If not found by reference, try paystackReference
    if (!payment) {
      payment = await this.paymentRepo.findOne({
        where: { paystackReference: reference },
        relations: ['booking'],
      });
    }

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Verify with Paystack - use paystackReference if available, otherwise use the provided reference
    const paystackReference = payment.paystackReference || payment.reference;
    const paystackResponse = await this.paystackService.verifyPayment(
      paystackReference,
    );

    // Update payment status
    if (paystackResponse.status && paystackResponse.data.status === 'success') {
      payment.status = PaymentStatus.SUCCESS;
      payment.paidAt = new Date(paystackResponse.data.paid_at || paystackResponse.data.paidAt);

      // Update booking payment status if applicable
      if (payment.bookingId && payment.booking) {
        payment.booking.paymentStatus = BookingPaymentStatus.PAID;
        payment.booking.paymentId = payment.id;
        await this.bookingRepo.save(payment.booking);
      }
    } else {
      payment.status = PaymentStatus.FAILED;
    }

    return await this.paymentRepo.save(payment);
  }

  async findUserPayments(
    userId: string,
    filter: PaymentFilterDto = {},
  ): Promise<{ data: Payment[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Payment> = { userId };

    if (filter.type) {
      where.type = filter.type;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    const [data, total] = await this.paymentRepo.findAndCount({
      where,
      relations: ['booking'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
      relations: ['booking'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async refundPayment(
    paymentId: string,
    userId: string,
    refundDto: RefundPaymentDto,
  ): Promise<Payment> {
    const payment = await this.findById(paymentId);

    // Verify user owns the payment
    if (payment.userId !== userId) {
      throw new ForbiddenException('You do not have permission to refund this payment');
    }

    // Check if payment can be refunded
    if (payment.status !== PaymentStatus.SUCCESS) {
      throw new BadRequestException('Only successful payments can be refunded');
    }

    // Update payment status
    payment.status = PaymentStatus.REFUNDED;

    // Update booking payment status if applicable
    if (payment.bookingId && payment.booking) {
      payment.booking.paymentStatus = BookingPaymentStatus.REFUNDED;
      await this.bookingRepo.save(payment.booking);
    }

    return await this.paymentRepo.save(payment);
  }
}

