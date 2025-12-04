import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Booking, BookingStatus } from '@app/database/entities/booking.entity';
import { BusinessProfile } from '@app/database/entities/business-profile.entity';
import { BusinessService } from '@app/database/entities/business-service.entity';
import { BankAccount } from '@app/database/entities/bank-account.entity';
import {
  CreateBookingDto,
  UpdateBookingStatusDto,
  BookingFilterDto,
} from '../dto/create-booking.dto';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
    @InjectRepository(BusinessProfile)
    private businessRepo: Repository<BusinessProfile>,
    @InjectRepository(BusinessService)
    private serviceRepo: Repository<BusinessService>,
    @InjectRepository(BankAccount)
    private bankAccountRepo: Repository<BankAccount>,
  ) {}

  async create(userId: string, createDto: CreateBookingDto): Promise<Booking> {
    // Verify business exists
    const business = await this.businessRepo.findOne({
      where: { id: createDto.businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Check if business owner has a verified bank account
    const bankAccount = await this.bankAccountRepo.findOne({
      where: {
        userId: business.userId,
        isVerified: true,
      },
    });

    if (!bankAccount) {
      throw new BadRequestException(
        'This business owner has not set up a verified bank account. Please contact the business owner to add a bank account before booking.',
      );
    }

    // Verify service exists if serviceId is provided
    if (createDto.serviceId) {
      const service = await this.serviceRepo.findOne({
        where: { id: createDto.serviceId, businessId: createDto.businessId },
      });

      if (!service) {
        throw new NotFoundException('Service not found for this business');
      }
    }

    // Create booking
    const booking = this.bookingRepo.create({
      userId,
      ...createDto,
      status: BookingStatus.PENDING,
    });

    return await this.bookingRepo.save(booking);
  }

  async findUserBookings(
    userId: string,
    filter: BookingFilterDto = {},
  ): Promise<{ data: Booking[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Booking> = { userId };

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.businessId) {
      where.businessId = filter.businessId;
    }

    if (filter.startDate || filter.endDate) {
      // This would need a more complex query builder for date filtering
      // For now, we'll filter in memory or use query builder
    }

    const [data, total] = await this.bookingRepo.findAndCount({
      where,
      relations: ['business', 'service'],
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

  async findBusinessBookings(
    businessId: string,
    filter: BookingFilterDto = {},
  ): Promise<{ data: Booking[]; total: number; page: number; limit: number; totalPages: number }> {
    // Verify business exists
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Booking> = { businessId };

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.userId) {
      where.userId = filter.userId;
    }

    const [data, total] = await this.bookingRepo.findAndCount({
      where,
      relations: ['user', 'service'],
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

  async findById(bookingId: string): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: ['business', 'service', 'user'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async updateStatus(
    bookingId: string,
    userId: string,
    updateDto: UpdateBookingStatusDto,
  ): Promise<Booking> {
    const booking = await this.findById(bookingId);

    // Check if user is the business owner or the customer
    const business = await this.businessRepo.findOne({
      where: { id: booking.businessId },
    });

    if (business.userId !== userId && booking.userId !== userId) {
      throw new ForbiddenException('You do not have permission to update this booking');
    }

    // Update status
    booking.status = updateDto.status;

    if (updateDto.status === BookingStatus.COMPLETED) {
      booking.completedAt = new Date();
      booking.canReview = true;
    }

    if (updateDto.status === BookingStatus.CANCELLED) {
      booking.cancelledAt = new Date();
      booking.cancellationReason = updateDto.cancellationReason;
    }

    return await this.bookingRepo.save(booking);
  }

  async cancel(bookingId: string, userId: string): Promise<void> {
    const booking = await this.findById(bookingId);

    // Only customer or business owner can cancel
    const business = await this.businessRepo.findOne({
      where: { id: booking.businessId },
    });

    if (business.userId !== userId && booking.userId !== userId) {
      throw new ForbiddenException('You do not have permission to cancel this booking');
    }

    // Check if booking can be cancelled
    if (
      booking.status === BookingStatus.COMPLETED ||
      booking.status === BookingStatus.CANCELLED
    ) {
      throw new BadRequestException('Cannot cancel a completed or already cancelled booking');
    }

    booking.status = BookingStatus.CANCELLED;
    booking.cancelledAt = new Date();

    await this.bookingRepo.save(booking);
  }

  async findReviewableBookings(userId: string): Promise<Booking[]> {
    return await this.bookingRepo.find({
      where: {
        userId,
        status: BookingStatus.COMPLETED,
        canReview: true,
        hasReviewed: false,
      },
      relations: ['business', 'service'],
      order: { completedAt: 'DESC' },
    });
  }
}

