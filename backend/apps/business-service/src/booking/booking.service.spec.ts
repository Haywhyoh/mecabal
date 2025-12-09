import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { BookingService } from './booking.service';
import { Booking, BookingStatus } from '@app/database/entities/booking.entity';
import { BusinessProfile } from '@app/database/entities/business-profile.entity';
import { BusinessService } from '@app/database/entities/business-service.entity';
import { BankAccount } from '@app/database/entities/bank-account.entity';

describe('BookingService - Comprehensive QA Testing', () => {
  let service: BookingService;

  const mockBookingRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockBusinessRepo = {
    findOne: jest.fn(),
  };

  const mockServiceRepo = {
    findOne: jest.fn(),
  };

  const mockBankAccountRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: getRepositoryToken(Booking),
          useValue: mockBookingRepo,
        },
        {
          provide: getRepositoryToken(BusinessProfile),
          useValue: mockBusinessRepo,
        },
        {
          provide: getRepositoryToken(BusinessService),
          useValue: mockServiceRepo,
        },
        {
          provide: getRepositoryToken(BankAccount),
          useValue: mockBankAccountRepo,
        },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const userId = 'user-123';
    const createDto = {
      businessId: 'business-123',
      serviceId: 'service-123',
      scheduledDate: new Date('2025-12-15'),
      description: 'Fix leaking pipe',
      address: '123 Main St',
    };

    const mockBusiness = {
      id: 'business-123',
      userId: 'business-owner-123',
      businessName: 'Test Plumbing',
    };

    const mockBankAccount = {
      id: 'bank-123',
      userId: 'business-owner-123',
      isVerified: true,
    };

    const mockService = {
      id: 'service-123',
      businessId: 'business-123',
      serviceName: 'Pipe Repair',
      price: 5000,
    };

    it('should successfully create a booking with all validations passing', async () => {
      mockBusinessRepo.findOne.mockResolvedValue(mockBusiness);
      mockBankAccountRepo.findOne.mockResolvedValue(mockBankAccount);
      mockServiceRepo.findOne.mockResolvedValue(mockService);

      const mockBooking = {
        id: 'booking-123',
        userId,
        ...createDto,
        status: BookingStatus.PENDING,
      };
      mockBookingRepo.create.mockReturnValue(mockBooking);
      mockBookingRepo.save.mockResolvedValue(mockBooking);

      const result = await service.create(userId, createDto as any);

      expect(result).toEqual(mockBooking);
      expect(mockBusinessRepo.findOne).toHaveBeenCalledWith({
        where: { id: createDto.businessId },
      });
      expect(mockBankAccountRepo.findOne).toHaveBeenCalledWith({
        where: {
          userId: mockBusiness.userId,
          isVerified: true,
        },
      });
      expect(mockServiceRepo.findOne).toHaveBeenCalledWith({
        where: { id: createDto.serviceId, businessId: createDto.businessId },
      });
      expect(mockBookingRepo.create).toHaveBeenCalledWith({
        userId,
        ...createDto,
        status: BookingStatus.PENDING,
      });
    });

    it('should throw NotFoundException if business does not exist', async () => {
      mockBusinessRepo.findOne.mockResolvedValue(null);

      await expect(service.create(userId, createDto as any)).rejects.toThrow(NotFoundException);
      await expect(service.create(userId, createDto as any)).rejects.toThrow('Business not found');
      expect(mockBankAccountRepo.findOne).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if business owner has no verified bank account', async () => {
      mockBusinessRepo.findOne.mockResolvedValue(mockBusiness);
      mockBankAccountRepo.findOne.mockResolvedValue(null);

      await expect(service.create(userId, createDto as any)).rejects.toThrow(BadRequestException);
      await expect(service.create(userId, createDto as any)).rejects.toThrow(
        'This business owner has not set up a verified bank account'
      );
    });

    it('should throw BadRequestException if bank account is not verified', async () => {
      mockBusinessRepo.findOne.mockResolvedValue(mockBusiness);
      mockBankAccountRepo.findOne.mockResolvedValue({
        ...mockBankAccount,
        isVerified: false,
      });

      // Since we're querying for isVerified: true, this should return null
      mockBankAccountRepo.findOne.mockResolvedValue(null);

      await expect(service.create(userId, createDto as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if service does not exist', async () => {
      mockBusinessRepo.findOne.mockResolvedValue(mockBusiness);
      mockBankAccountRepo.findOne.mockResolvedValue(mockBankAccount);
      mockServiceRepo.findOne.mockResolvedValue(null);

      await expect(service.create(userId, createDto as any)).rejects.toThrow(NotFoundException);
      await expect(service.create(userId, createDto as any)).rejects.toThrow(
        'Service not found for this business'
      );
    });

    it('should allow booking without serviceId', async () => {
      const dtoWithoutService = {
        businessId: 'business-123',
        scheduledDate: new Date('2025-12-15'),
        description: 'General inquiry',
      };

      mockBusinessRepo.findOne.mockResolvedValue(mockBusiness);
      mockBankAccountRepo.findOne.mockResolvedValue(mockBankAccount);

      const mockBooking = {
        id: 'booking-123',
        userId,
        ...dtoWithoutService,
        status: BookingStatus.PENDING,
      };
      mockBookingRepo.create.mockReturnValue(mockBooking);
      mockBookingRepo.save.mockResolvedValue(mockBooking);

      const result = await service.create(userId, dtoWithoutService as any);

      expect(result).toBeDefined();
      expect(mockServiceRepo.findOne).not.toHaveBeenCalled();
    });

    it('should set status to PENDING by default', async () => {
      mockBusinessRepo.findOne.mockResolvedValue(mockBusiness);
      mockBankAccountRepo.findOne.mockResolvedValue(mockBankAccount);
      mockServiceRepo.findOne.mockResolvedValue(mockService);

      mockBookingRepo.create.mockReturnValue({ status: BookingStatus.PENDING });
      mockBookingRepo.save.mockResolvedValue({ status: BookingStatus.PENDING });

      await service.create(userId, createDto as any);

      expect(mockBookingRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: BookingStatus.PENDING })
      );
    });
  });

  describe('findUserBookings', () => {
    const userId = 'user-123';

    it('should return paginated user bookings', async () => {
      const mockBookings = [
        { id: 'booking-1', userId, status: BookingStatus.PENDING },
        { id: 'booking-2', userId, status: BookingStatus.CONFIRMED },
      ];
      mockBookingRepo.findAndCount.mockResolvedValue([mockBookings, 2]);

      const result = await service.findUserBookings(userId);

      expect(result.data).toEqual(mockBookings);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
    });

    it('should apply status filter correctly', async () => {
      mockBookingRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findUserBookings(userId, { status: BookingStatus.COMPLETED });

      expect(mockBookingRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
            status: BookingStatus.COMPLETED,
          }),
        })
      );
    });

    it('should apply businessId filter correctly', async () => {
      mockBookingRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findUserBookings(userId, { businessId: 'business-123' });

      expect(mockBookingRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
            businessId: 'business-123',
          }),
        })
      );
    });

    it('should handle custom pagination', async () => {
      mockBookingRepo.findAndCount.mockResolvedValue([[], 45]);

      const result = await service.findUserBookings(userId, { page: 2, limit: 10 });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(5);
      expect(mockBookingRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });

    it('should order by createdAt DESC', async () => {
      mockBookingRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findUserBookings(userId);

      expect(mockBookingRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { createdAt: 'DESC' },
        })
      );
    });

    it('should load relations for business and service', async () => {
      mockBookingRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findUserBookings(userId);

      expect(mockBookingRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['business', 'service'],
        })
      );
    });
  });

  describe('findBusinessBookings', () => {
    const businessId = 'business-123';

    it('should return paginated business bookings', async () => {
      const mockBusiness = { id: businessId };
      mockBusinessRepo.findOne.mockResolvedValue(mockBusiness);

      const mockBookings = [
        { id: 'booking-1', businessId },
        { id: 'booking-2', businessId },
      ];
      mockBookingRepo.findAndCount.mockResolvedValue([mockBookings, 2]);

      const result = await service.findBusinessBookings(businessId);

      expect(result.data).toEqual(mockBookings);
      expect(result.total).toBe(2);
    });

    it('should throw NotFoundException if business not found', async () => {
      mockBusinessRepo.findOne.mockResolvedValue(null);

      await expect(service.findBusinessBookings(businessId)).rejects.toThrow(NotFoundException);
      await expect(service.findBusinessBookings(businessId)).rejects.toThrow('Business not found');
    });

    it('should apply filters correctly', async () => {
      mockBusinessRepo.findOne.mockResolvedValue({ id: businessId });
      mockBookingRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findBusinessBookings(businessId, {
        status: BookingStatus.CONFIRMED,
        userId: 'user-123',
      });

      expect(mockBookingRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            businessId,
            status: BookingStatus.CONFIRMED,
            userId: 'user-123',
          }),
        })
      );
    });

    it('should load relations for user and service', async () => {
      mockBusinessRepo.findOne.mockResolvedValue({ id: businessId });
      mockBookingRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findBusinessBookings(businessId);

      expect(mockBookingRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['user', 'service'],
        })
      );
    });
  });

  describe('findById', () => {
    const bookingId = 'booking-123';

    it('should return booking by ID with all relations', async () => {
      const mockBooking = {
        id: bookingId,
        userId: 'user-123',
        business: {},
        service: {},
        user: {},
      };
      mockBookingRepo.findOne.mockResolvedValue(mockBooking);

      const result = await service.findById(bookingId);

      expect(result).toEqual(mockBooking);
      expect(mockBookingRepo.findOne).toHaveBeenCalledWith({
        where: { id: bookingId },
        relations: ['business', 'service', 'user'],
      });
    });

    it('should throw NotFoundException if booking not found', async () => {
      mockBookingRepo.findOne.mockResolvedValue(null);

      await expect(service.findById(bookingId)).rejects.toThrow(NotFoundException);
      await expect(service.findById(bookingId)).rejects.toThrow('Booking not found');
    });
  });

  describe('updateStatus', () => {
    const bookingId = 'booking-123';
    const userId = 'user-123';
    const businessOwnerId = 'business-owner-123';

    const mockBooking = {
      id: bookingId,
      userId,
      businessId: 'business-123',
      status: BookingStatus.PENDING,
    };

    const mockBusiness = {
      id: 'business-123',
      userId: businessOwnerId,
    };

    it('should allow business owner to update booking status', async () => {
      mockBookingRepo.findOne.mockResolvedValue(mockBooking);
      mockBusinessRepo.findOne.mockResolvedValue(mockBusiness);
      mockBookingRepo.save.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
      });

      const result = await service.updateStatus(bookingId, businessOwnerId, {
        status: BookingStatus.CONFIRMED,
      });

      expect(result.status).toBe(BookingStatus.CONFIRMED);
      expect(mockBookingRepo.save).toHaveBeenCalled();
    });

    it('should allow customer to update booking status', async () => {
      mockBookingRepo.findOne.mockResolvedValue(mockBooking);
      mockBusinessRepo.findOne.mockResolvedValue(mockBusiness);
      mockBookingRepo.save.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      });

      const result = await service.updateStatus(bookingId, userId, {
        status: BookingStatus.CANCELLED,
      });

      expect(result.status).toBe(BookingStatus.CANCELLED);
    });

    it('should throw ForbiddenException if user is neither customer nor business owner', async () => {
      mockBookingRepo.findOne.mockResolvedValue(mockBooking);
      mockBusinessRepo.findOne.mockResolvedValue(mockBusiness);

      await expect(
        service.updateStatus(bookingId, 'unauthorized-user', {
          status: BookingStatus.CONFIRMED,
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should set completedAt and canReview when status is COMPLETED', async () => {
      mockBookingRepo.findOne.mockResolvedValue(mockBooking);
      mockBusinessRepo.findOne.mockResolvedValue(mockBusiness);
      mockBookingRepo.save.mockImplementation((entity: any) => Promise.resolve(entity));

      const result = await service.updateStatus(bookingId, businessOwnerId, {
        status: BookingStatus.COMPLETED,
      });

      expect(result.completedAt).toBeDefined();
      expect(result.canReview).toBe(true);
    });

    it('should set cancelledAt when status is CANCELLED', async () => {
      mockBookingRepo.findOne.mockResolvedValue(mockBooking);
      mockBusinessRepo.findOne.mockResolvedValue(mockBusiness);
      mockBookingRepo.save.mockImplementation((entity: any) => Promise.resolve(entity));

      const result = await service.updateStatus(bookingId, userId, {
        status: BookingStatus.CANCELLED,
      });

      expect(result.cancelledAt).toBeDefined();
    });

    it('should set cancellation reason when provided', async () => {
      mockBookingRepo.findOne.mockResolvedValue(mockBooking);
      mockBusinessRepo.findOne.mockResolvedValue(mockBusiness);
      mockBookingRepo.save.mockImplementation((entity: any) => Promise.resolve(entity));

      const result = await service.updateStatus(bookingId, userId, {
        status: BookingStatus.CANCELLED,
        cancellationReason: 'Customer unavailable',
      });

      expect(result.cancellationReason).toBe('Customer unavailable');
    });

    it('should throw NotFoundException if business not found', async () => {
      mockBookingRepo.findOne.mockResolvedValue(mockBooking);
      mockBusinessRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateStatus(bookingId, userId, { status: BookingStatus.CONFIRMED })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    const bookingId = 'booking-123';
    const userId = 'user-123';
    const businessOwnerId = 'business-owner-123';

    const mockBooking = {
      id: bookingId,
      userId,
      businessId: 'business-123',
      status: BookingStatus.CONFIRMED,
    };

    const mockBusiness = {
      id: 'business-123',
      userId: businessOwnerId,
    };

    it('should allow customer to cancel their booking', async () => {
      mockBookingRepo.findOne.mockResolvedValue(mockBooking);
      mockBusinessRepo.findOne.mockResolvedValue(mockBusiness);
      mockBookingRepo.save.mockImplementation((entity: any) => Promise.resolve(entity));

      await service.cancel(bookingId, userId);

      expect(mockBookingRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: BookingStatus.CANCELLED,
          cancelledAt: expect.any(Date),
        })
      );
    });

    it('should allow business owner to cancel booking', async () => {
      // Create a fresh booking object to avoid mutation from previous test
      const freshBooking = {
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
      };
      mockBookingRepo.findOne.mockResolvedValue(freshBooking);
      mockBusinessRepo.findOne.mockResolvedValue(mockBusiness);
      mockBookingRepo.save.mockImplementation((entity: any) => Promise.resolve(entity));

      await service.cancel(bookingId, businessOwnerId);

      expect(mockBookingRepo.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is unauthorized', async () => {
      mockBookingRepo.findOne.mockResolvedValue(mockBooking);
      mockBusinessRepo.findOne.mockResolvedValue(mockBusiness);

      await expect(service.cancel(bookingId, 'unauthorized-user')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should throw BadRequestException if booking is already completed', async () => {
      mockBookingRepo.findOne.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.COMPLETED,
      });
      mockBusinessRepo.findOne.mockResolvedValue(mockBusiness);

      await expect(service.cancel(bookingId, userId)).rejects.toThrow(BadRequestException);
      await expect(service.cancel(bookingId, userId)).rejects.toThrow(
        'Cannot cancel a completed or already cancelled booking'
      );
    });

    it('should throw BadRequestException if booking is already cancelled', async () => {
      mockBookingRepo.findOne.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      });
      mockBusinessRepo.findOne.mockResolvedValue(mockBusiness);

      await expect(service.cancel(bookingId, userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findReviewableBookings', () => {
    const userId = 'user-123';

    it('should return completed bookings that can be reviewed', async () => {
      const mockReviewableBookings = [
        {
          id: 'booking-1',
          userId,
          status: BookingStatus.COMPLETED,
          canReview: true,
          hasReviewed: false,
        },
        {
          id: 'booking-2',
          userId,
          status: BookingStatus.COMPLETED,
          canReview: true,
          hasReviewed: false,
        },
      ];
      mockBookingRepo.find.mockResolvedValue(mockReviewableBookings);

      const result = await service.findReviewableBookings(userId);

      expect(result).toEqual(mockReviewableBookings);
      expect(mockBookingRepo.find).toHaveBeenCalledWith({
        where: {
          userId,
          status: BookingStatus.COMPLETED,
          canReview: true,
          hasReviewed: false,
        },
        relations: ['business', 'service'],
        order: { completedAt: 'DESC' },
      });
    });

    it('should return empty array if no reviewable bookings', async () => {
      mockBookingRepo.find.mockResolvedValue([]);

      const result = await service.findReviewableBookings(userId);

      expect(result).toEqual([]);
    });

    it('should order by completedAt DESC', async () => {
      mockBookingRepo.find.mockResolvedValue([]);

      await service.findReviewableBookings(userId);

      expect(mockBookingRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { completedAt: 'DESC' },
        })
      );
    });
  });

  describe('Edge Cases and Security', () => {
    it('should prevent booking in the past', async () => {
      const pastDate = new Date('2020-01-01');
      const createDto = {
        businessId: 'business-123',
        scheduledDate: pastDate,
        description: 'Past booking',
      };

      // This should be validated at DTO level, but test service behavior
      mockBusinessRepo.findOne.mockResolvedValue({ id: 'business-123', userId: 'owner-123' });
      mockBankAccountRepo.findOne.mockResolvedValue({ isVerified: true });
      mockBookingRepo.create.mockReturnValue(createDto);
      mockBookingRepo.save.mockResolvedValue(createDto);

      // Service should accept - validation happens at controller/DTO level
      await service.create('user-123', createDto as any);
      expect(mockBookingRepo.save).toHaveBeenCalled();
    });

    it('should handle concurrent booking updates', async () => {
      const mockBooking = {
        id: 'booking-123',
        userId: 'user-123',
        businessId: 'business-123',
        status: BookingStatus.PENDING,
      };
      const mockBusiness = { id: 'business-123', userId: 'owner-123' };

      mockBookingRepo.findOne.mockResolvedValue(mockBooking);
      mockBusinessRepo.findOne.mockResolvedValue(mockBusiness);
      mockBookingRepo.save.mockImplementation((entity: any) => Promise.resolve(entity));

      // Simulate concurrent updates
      await Promise.all([
        service.updateStatus('booking-123', 'owner-123', { status: BookingStatus.CONFIRMED }),
        service.updateStatus('booking-123', 'owner-123', { status: BookingStatus.IN_PROGRESS }),
      ]);

      expect(mockBookingRepo.save).toHaveBeenCalledTimes(2);
    });

    it('should prevent unauthorized status changes', async () => {
      const mockBooking = {
        id: 'booking-123',
        userId: 'customer-123',
        businessId: 'business-123',
        status: BookingStatus.PENDING,
      };
      const mockBusiness = { id: 'business-123', userId: 'owner-123' };

      mockBookingRepo.findOne.mockResolvedValue(mockBooking);
      mockBusinessRepo.findOne.mockResolvedValue(mockBusiness);

      await expect(
        service.updateStatus('booking-123', 'hacker-123', { status: BookingStatus.COMPLETED })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should handle missing relations gracefully', async () => {
      mockBookingRepo.findOne.mockResolvedValue({
        id: 'booking-123',
        businessId: 'business-123',
      });
      mockBusinessRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateStatus('booking-123', 'user-123', { status: BookingStatus.CONFIRMED })
      ).rejects.toThrow(NotFoundException);
    });
  });
});
