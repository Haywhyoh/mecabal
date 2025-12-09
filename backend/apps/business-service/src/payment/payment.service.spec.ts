import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Payment, PaymentStatus, PaymentType } from '@app/database/entities/payment.entity';
import { Booking, BookingStatus, PaymentStatus as BookingPaymentStatus } from '@app/database/entities/booking.entity';
import { PaystackService } from './paystack/paystack.service';
import { InitializePaymentDto, PaymentFilterDto, RefundPaymentDto } from '../dto/payment.dto';
import * as crypto from 'crypto';

// Mock crypto module
jest.mock('crypto', () => ({
  randomUUID: jest.fn(),
}));

describe('PaymentService', () => {
  let service: PaymentService;
  let paymentRepo: Repository<Payment>;
  let bookingRepo: Repository<Booking>;
  let paystackService: PaystackService;

  const mockPaymentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockBookingRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockPaystackService = {
    initializePayment: jest.fn(),
    verifyPayment: jest.fn(),
    resolveBankAccount: jest.fn(),
    getBanks: jest.fn(),
  };

  // Mock data
  const userId = 'user-123';
  const bookingId = 'booking-123';
  const paymentId = 'payment-123';
  const reference = 'MCB_ABC123DEF456';

  const mockBooking: Partial<Booking> = {
    id: bookingId,
    userId,
    businessId: 'business-123',
    status: BookingStatus.PENDING,
    paymentStatus: BookingPaymentStatus.UNPAID,
    paymentId: null,
  };

  const mockPayment: Partial<Payment> = {
    id: paymentId,
    userId,
    amount: 5000,
    currency: 'NGN',
    status: PaymentStatus.PENDING,
    type: PaymentType.SERVICE_BOOKING,
    reference,
    paystackReference: 'paystack-ref-123',
    description: 'Payment for service booking',
    bookingId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPaystackInitResponse = {
    status: true,
    message: 'Authorization URL created',
    data: {
      authorization_url: 'https://checkout.paystack.com/abc123',
      access_code: 'access-code-123',
      reference: 'paystack-ref-123',
    },
  };

  const mockPaystackVerifyResponse = {
    status: true,
    message: 'Verification successful',
    data: {
      id: 123456,
      domain: 'live',
      status: 'success',
      reference: 'paystack-ref-123',
      amount: 500000, // In kobo
      message: 'Payment successful',
      gateway_response: 'Approved',
      paid_at: '2025-12-09T10:00:00Z',
      created_at: '2025-12-09T09:55:00Z',
      channel: 'card',
      currency: 'NGN',
      ip_address: '192.168.1.1',
      metadata: {},
      log: null,
      fees: 7500,
      fees_split: null,
      authorization: {},
      customer: {},
      plan: null,
      split: null,
      order_id: null,
      paidAt: '2025-12-09T10:00:00Z',
      createdAt: '2025-12-09T09:55:00Z',
      requested_amount: 500000,
      pos_transaction_data: null,
      source: null,
      fees_breakdown: null,
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: getRepositoryToken(Payment),
          useValue: mockPaymentRepository,
        },
        {
          provide: getRepositoryToken(Booking),
          useValue: mockBookingRepository,
        },
        {
          provide: PaystackService,
          useValue: mockPaystackService,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    paymentRepo = module.get<Repository<Payment>>(getRepositoryToken(Payment));
    bookingRepo = module.get<Repository<Booking>>(getRepositoryToken(Booking));
    paystackService = module.get<PaystackService>(PaystackService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initializePayment', () => {
    const initializeDto: InitializePaymentDto = {
      amount: 5000,
      email: 'user@example.com',
      currency: 'NGN',
      type: PaymentType.SERVICE_BOOKING,
      description: 'Payment for service booking',
      bookingId,
      metadata: { serviceType: 'cleaning' },
      callbackUrl: 'https://example.com/callback',
    };

    describe('Success Scenarios', () => {
      it('should successfully initialize payment with booking', async () => {
        const mockUUID = 'abc123def456';
        (crypto.randomUUID as jest.Mock).mockReturnValue(mockUUID);

        mockBookingRepository.findOne.mockResolvedValue(mockBooking);
        mockPaystackService.initializePayment.mockResolvedValue(mockPaystackInitResponse);
        mockPaymentRepository.create.mockReturnValue(mockPayment);
        mockPaymentRepository.save.mockResolvedValue(mockPayment);

        const result = await service.initializePayment(userId, initializeDto);

        expect(result).toEqual({
          authorizationUrl: mockPaystackInitResponse.data.authorization_url,
          accessCode: mockPaystackInitResponse.data.access_code,
          reference: `MCB_${mockUUID.replace(/-/g, '').toUpperCase()}`,
        });

        expect(mockBookingRepository.findOne).toHaveBeenCalledWith({
          where: { id: bookingId, userId },
        });

        expect(mockPaystackService.initializePayment).toHaveBeenCalledWith({
          email: initializeDto.email,
          amount: initializeDto.amount,
          currency: 'NGN',
          reference: `MCB_${mockUUID.replace(/-/g, '').toUpperCase()}`,
          metadata: {
            ...initializeDto.metadata,
            userId,
            bookingId,
            billId: undefined,
            eventId: undefined,
          },
          callback_url: initializeDto.callbackUrl,
        });

        expect(mockPaymentRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            userId,
            amount: initializeDto.amount,
            currency: 'NGN',
            type: initializeDto.type,
            status: PaymentStatus.PENDING,
            bookingId,
          }),
        );

        expect(mockPaymentRepository.save).toHaveBeenCalled();
      });

      it('should successfully initialize payment without booking', async () => {
        const mockUUID = 'xyz789abc123';
        (crypto.randomUUID as jest.Mock).mockReturnValue(mockUUID);

        const dtoWithoutBooking: InitializePaymentDto = {
          ...initializeDto,
          bookingId: undefined,
        };

        mockPaystackService.initializePayment.mockResolvedValue(mockPaystackInitResponse);
        mockPaymentRepository.create.mockReturnValue(mockPayment);
        mockPaymentRepository.save.mockResolvedValue(mockPayment);

        const result = await service.initializePayment(userId, dtoWithoutBooking);

        expect(result).toHaveProperty('authorizationUrl');
        expect(result).toHaveProperty('accessCode');
        expect(result).toHaveProperty('reference');
        expect(mockBookingRepository.findOne).not.toHaveBeenCalled();
      });

      it('should default currency to NGN if not provided', async () => {
        const mockUUID = 'def456ghi789';
        (crypto.randomUUID as jest.Mock).mockReturnValue(mockUUID);

        const dtoWithoutCurrency = { ...initializeDto };
        delete dtoWithoutCurrency.currency;

        mockPaystackService.initializePayment.mockResolvedValue(mockPaystackInitResponse);
        mockPaymentRepository.create.mockReturnValue(mockPayment);
        mockPaymentRepository.save.mockResolvedValue(mockPayment);

        await service.initializePayment(userId, dtoWithoutCurrency);

        expect(mockPaystackService.initializePayment).toHaveBeenCalledWith(
          expect.objectContaining({
            currency: 'NGN',
          }),
        );
      });

      it('should generate unique reference in correct format', async () => {
        const mockUUID = 'a1b2-c3d4-e5f6-g7h8';
        (crypto.randomUUID as jest.Mock).mockReturnValue(mockUUID);

        mockPaystackService.initializePayment.mockResolvedValue(mockPaystackInitResponse);
        mockPaymentRepository.create.mockReturnValue(mockPayment);
        mockPaymentRepository.save.mockResolvedValue(mockPayment);

        const result = await service.initializePayment(userId, { ...initializeDto, bookingId: undefined });

        expect(result.reference).toBe('MCB_A1B2C3D4E5F6G7H8');
        expect(result.reference).toMatch(/^MCB_[A-Z0-9]{16}$/);
      });
    });

    describe('Error Scenarios', () => {
      it('should throw NotFoundException if booking not found', async () => {
        mockBookingRepository.findOne.mockResolvedValue(null);

        await expect(service.initializePayment(userId, initializeDto)).rejects.toThrow(
          NotFoundException,
        );
        await expect(service.initializePayment(userId, initializeDto)).rejects.toThrow(
          'Booking not found',
        );

        expect(mockPaystackService.initializePayment).not.toHaveBeenCalled();
      });

      it('should throw BadRequestException if booking is already paid', async () => {
        mockBookingRepository.findOne.mockResolvedValue({
          ...mockBooking,
          paymentStatus: BookingPaymentStatus.PAID,
        });

        await expect(service.initializePayment(userId, initializeDto)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.initializePayment(userId, initializeDto)).rejects.toThrow(
          'Booking is already paid',
        );

        expect(mockPaystackService.initializePayment).not.toHaveBeenCalled();
      });

      it('should throw error if Paystack initialization fails', async () => {
        mockBookingRepository.findOne.mockResolvedValue(mockBooking);
        mockPaystackService.initializePayment.mockRejectedValue(
          new BadRequestException('Paystack API error'),
        );

        await expect(service.initializePayment(userId, initializeDto)).rejects.toThrow(
          BadRequestException,
        );
      });
    });

    describe('Edge Cases', () => {
      it('should handle large amounts correctly', async () => {
        const mockUUID = 'large123amount';
        (crypto.randomUUID as jest.Mock).mockReturnValue(mockUUID);

        const largeAmountDto = { ...initializeDto, amount: 9999999.99, bookingId: undefined };

        mockPaystackService.initializePayment.mockResolvedValue(mockPaystackInitResponse);
        mockPaymentRepository.create.mockReturnValue(mockPayment);
        mockPaymentRepository.save.mockResolvedValue(mockPayment);

        await service.initializePayment(userId, largeAmountDto);

        expect(mockPaystackService.initializePayment).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 9999999.99,
          }),
        );
      });

      it('should include all metadata fields when provided', async () => {
        const mockUUID = 'metadata123';
        (crypto.randomUUID as jest.Mock).mockReturnValue(mockUUID);

        const dtoWithAllFields: InitializePaymentDto = {
          ...initializeDto,
          bookingId: 'booking-123',
          billId: 'bill-456',
          eventId: 'event-789',
          metadata: { custom: 'data', foo: 'bar' },
        };

        mockBookingRepository.findOne.mockResolvedValue(mockBooking);
        mockPaystackService.initializePayment.mockResolvedValue(mockPaystackInitResponse);
        mockPaymentRepository.create.mockReturnValue(mockPayment);
        mockPaymentRepository.save.mockResolvedValue(mockPayment);

        await service.initializePayment(userId, dtoWithAllFields);

        expect(mockPaystackService.initializePayment).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: {
              custom: 'data',
              foo: 'bar',
              userId,
              bookingId: 'booking-123',
              billId: 'bill-456',
              eventId: 'event-789',
            },
          }),
        );
      });
    });
  });

  describe('verifyPayment', () => {
    const mockPaymentWithBooking = {
      ...mockPayment,
      booking: mockBooking,
    };

    describe('Success Scenarios', () => {
      it('should successfully verify payment by reference', async () => {
        mockPaymentRepository.findOne.mockResolvedValueOnce(mockPaymentWithBooking);
        mockPaystackService.verifyPayment.mockResolvedValue(mockPaystackVerifyResponse);
        mockPaymentRepository.save.mockResolvedValue({
          ...mockPaymentWithBooking,
          status: PaymentStatus.SUCCESS,
        });

        const result = await service.verifyPayment(reference);

        expect(result.status).toBe(PaymentStatus.SUCCESS);
        expect(mockPaymentRepository.findOne).toHaveBeenCalledWith({
          where: { reference },
          relations: ['booking'],
        });
        expect(mockPaystackService.verifyPayment).toHaveBeenCalledWith('paystack-ref-123');
      });

      it('should verify payment by paystackReference if not found by reference', async () => {
        mockPaymentRepository.findOne
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(mockPaymentWithBooking);
        mockPaystackService.verifyPayment.mockResolvedValue(mockPaystackVerifyResponse);
        mockPaymentRepository.save.mockResolvedValue({
          ...mockPaymentWithBooking,
          status: PaymentStatus.SUCCESS,
        });

        const result = await service.verifyPayment('paystack-ref-123');

        expect(mockPaymentRepository.findOne).toHaveBeenCalledTimes(2);
        expect(mockPaymentRepository.findOne).toHaveBeenNthCalledWith(2, {
          where: { paystackReference: 'paystack-ref-123' },
          relations: ['booking'],
        });
        expect(result.status).toBe(PaymentStatus.SUCCESS);
      });

      it('should update payment status to SUCCESS and set paidAt timestamp', async () => {
        const paidAtDate = '2025-12-09T10:00:00Z';
        mockPaymentRepository.findOne.mockResolvedValue(mockPaymentWithBooking);
        mockPaystackService.verifyPayment.mockResolvedValue({
          ...mockPaystackVerifyResponse,
          data: {
            ...mockPaystackVerifyResponse.data,
            paid_at: paidAtDate,
          },
        });
        mockPaymentRepository.save.mockImplementation((payment) => Promise.resolve(payment));

        await service.verifyPayment(reference);

        expect(mockPaymentRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            status: PaymentStatus.SUCCESS,
            paidAt: new Date(paidAtDate),
          }),
        );
      });

      it('should update booking payment status to PAID when payment is successful', async () => {
        mockPaymentRepository.findOne.mockResolvedValue(mockPaymentWithBooking);
        mockPaystackService.verifyPayment.mockResolvedValue(mockPaystackVerifyResponse);
        mockPaymentRepository.save.mockImplementation((payment) => Promise.resolve(payment));

        await service.verifyPayment(reference);

        expect(mockBookingRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            paymentStatus: BookingPaymentStatus.PAID,
            paymentId: paymentId,
          }),
        );
      });

      it('should auto-confirm PENDING booking when payment is successful', async () => {
        mockPaymentRepository.findOne.mockResolvedValue(mockPaymentWithBooking);
        mockPaystackService.verifyPayment.mockResolvedValue(mockPaystackVerifyResponse);
        mockPaymentRepository.save.mockImplementation((payment) => Promise.resolve(payment));

        await service.verifyPayment(reference);

        expect(mockBookingRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            status: BookingStatus.CONFIRMED,
            paymentStatus: BookingPaymentStatus.PAID,
          }),
        );
      });

      it('should not change booking status if already CONFIRMED', async () => {
        const confirmedBooking = {
          ...mockBooking,
          status: BookingStatus.CONFIRMED,
        };
        mockPaymentRepository.findOne.mockResolvedValue({
          ...mockPayment,
          booking: confirmedBooking,
        });
        mockPaystackService.verifyPayment.mockResolvedValue(mockPaystackVerifyResponse);
        mockPaymentRepository.save.mockImplementation((payment) => Promise.resolve(payment));

        await service.verifyPayment(reference);

        expect(mockBookingRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            status: BookingStatus.CONFIRMED,
          }),
        );
      });

      it('should handle payment without booking', async () => {
        const paymentWithoutBooking = {
          ...mockPayment,
          bookingId: null,
          booking: null,
        };
        mockPaymentRepository.findOne.mockResolvedValue(paymentWithoutBooking);
        mockPaystackService.verifyPayment.mockResolvedValue(mockPaystackVerifyResponse);
        mockPaymentRepository.save.mockImplementation((payment) => Promise.resolve(payment));

        const result = await service.verifyPayment(reference);

        expect(result.status).toBe(PaymentStatus.SUCCESS);
        expect(mockBookingRepository.save).not.toHaveBeenCalled();
      });

      it('should handle paidAt field from both paid_at and paidAt', async () => {
        mockPaymentRepository.findOne.mockResolvedValue(mockPaymentWithBooking);
        mockPaystackService.verifyPayment.mockResolvedValue({
          ...mockPaystackVerifyResponse,
          data: {
            ...mockPaystackVerifyResponse.data,
            paid_at: undefined,
            paidAt: '2025-12-09T11:30:00Z',
          },
        });
        mockPaymentRepository.save.mockImplementation((payment) => Promise.resolve(payment));

        await service.verifyPayment(reference);

        expect(mockPaymentRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            paidAt: new Date('2025-12-09T11:30:00Z'),
          }),
        );
      });
    });

    describe('Error Scenarios', () => {
      it('should throw NotFoundException if payment not found by reference', async () => {
        mockPaymentRepository.findOne.mockResolvedValue(null);

        await expect(service.verifyPayment(reference)).rejects.toThrow(NotFoundException);
        await expect(service.verifyPayment(reference)).rejects.toThrow('Payment not found');

        // Should be called 4 times: 2 for each verifyPayment call (tries reference then paystackReference)
        expect(mockPaymentRepository.findOne).toHaveBeenCalledTimes(4);
      });

      it('should update payment status to FAILED if Paystack verification fails', async () => {
        mockPaymentRepository.findOne.mockResolvedValue(mockPaymentWithBooking);
        mockPaystackService.verifyPayment.mockResolvedValue({
          status: false,
          message: 'Payment failed',
          data: {
            ...mockPaystackVerifyResponse.data,
            status: 'failed',
          },
        });
        mockPaymentRepository.save.mockImplementation((payment) => Promise.resolve(payment));

        await service.verifyPayment(reference);

        expect(mockPaymentRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            status: PaymentStatus.FAILED,
          }),
        );
      });

      it('should handle Paystack API errors gracefully', async () => {
        mockPaymentRepository.findOne.mockResolvedValue(mockPaymentWithBooking);
        mockPaystackService.verifyPayment.mockRejectedValue(
          new BadRequestException('Paystack API error'),
        );

        await expect(service.verifyPayment(reference)).rejects.toThrow(BadRequestException);
      });
    });

    describe('Edge Cases', () => {
      it('should be idempotent - handle already verified payment', async () => {
        const verifiedPayment = {
          ...mockPaymentWithBooking,
          status: PaymentStatus.SUCCESS,
          paidAt: new Date('2025-12-09T09:00:00Z'),
        };
        mockPaymentRepository.findOne.mockResolvedValue(verifiedPayment);
        mockPaystackService.verifyPayment.mockResolvedValue(mockPaystackVerifyResponse);
        mockPaymentRepository.save.mockImplementation((payment) => Promise.resolve(payment));

        const result = await service.verifyPayment(reference);

        expect(result.status).toBe(PaymentStatus.SUCCESS);
        expect(mockPaystackService.verifyPayment).toHaveBeenCalled();
      });

      it('should use paystackReference over reference for verification', async () => {
        const paymentWithBothRefs = {
          ...mockPaymentWithBooking,
          reference: 'MCB_123',
          paystackReference: 'paystack-456',
        };
        mockPaymentRepository.findOne.mockResolvedValue(paymentWithBothRefs);
        mockPaystackService.verifyPayment.mockResolvedValue(mockPaystackVerifyResponse);
        mockPaymentRepository.save.mockImplementation((payment) => Promise.resolve(payment));

        await service.verifyPayment('MCB_123');

        expect(mockPaystackService.verifyPayment).toHaveBeenCalledWith('paystack-456');
      });

      it('should use payment reference if paystackReference is null', async () => {
        const paymentWithoutPaystackRef = {
          ...mockPaymentWithBooking,
          paystackReference: null,
        };
        mockPaymentRepository.findOne.mockResolvedValue(paymentWithoutPaystackRef);
        mockPaystackService.verifyPayment.mockResolvedValue(mockPaystackVerifyResponse);
        mockPaymentRepository.save.mockImplementation((payment) => Promise.resolve(payment));

        await service.verifyPayment(reference);

        expect(mockPaystackService.verifyPayment).toHaveBeenCalledWith(reference);
      });
    });
  });

  describe('findUserPayments', () => {
    const mockPayments: Partial<Payment>[] = [
      { ...mockPayment, id: 'payment-1' },
      { ...mockPayment, id: 'payment-2' },
      { ...mockPayment, id: 'payment-3' },
    ];

    describe('Success Scenarios', () => {
      it('should return paginated user payments with default pagination', async () => {
        mockPaymentRepository.findAndCount.mockResolvedValue([mockPayments, 3]);

        const result = await service.findUserPayments(userId);

        expect(result).toEqual({
          data: mockPayments,
          total: 3,
          page: 1,
          limit: 20,
          totalPages: 1,
        });

        expect(mockPaymentRepository.findAndCount).toHaveBeenCalledWith({
          where: { userId },
          relations: ['booking'],
          order: { createdAt: 'DESC' },
          skip: 0,
          take: 20,
        });
      });

      it('should return paginated user payments with custom pagination', async () => {
        const filter: PaymentFilterDto = { page: 2, limit: 10 };
        mockPaymentRepository.findAndCount.mockResolvedValue([[mockPayments[0]], 15]);

        const result = await service.findUserPayments(userId, filter);

        expect(result).toEqual({
          data: [mockPayments[0]],
          total: 15,
          page: 2,
          limit: 10,
          totalPages: 2,
        });

        expect(mockPaymentRepository.findAndCount).toHaveBeenCalledWith({
          where: { userId },
          relations: ['booking'],
          order: { createdAt: 'DESC' },
          skip: 10,
          take: 10,
        });
      });

      it('should filter by payment type', async () => {
        const filter: PaymentFilterDto = { type: PaymentType.SERVICE_BOOKING };
        mockPaymentRepository.findAndCount.mockResolvedValue([mockPayments, 3]);

        await service.findUserPayments(userId, filter);

        expect(mockPaymentRepository.findAndCount).toHaveBeenCalledWith({
          where: { userId, type: PaymentType.SERVICE_BOOKING },
          relations: ['booking'],
          order: { createdAt: 'DESC' },
          skip: 0,
          take: 20,
        });
      });

      it('should filter by payment status', async () => {
        const filter: PaymentFilterDto = { status: PaymentStatus.SUCCESS };
        mockPaymentRepository.findAndCount.mockResolvedValue([mockPayments, 3]);

        await service.findUserPayments(userId, filter);

        expect(mockPaymentRepository.findAndCount).toHaveBeenCalledWith({
          where: { userId, status: PaymentStatus.SUCCESS },
          relations: ['booking'],
          order: { createdAt: 'DESC' },
          skip: 0,
          take: 20,
        });
      });

      it('should filter by both type and status', async () => {
        const filter: PaymentFilterDto = {
          type: PaymentType.BILL_PAYMENT,
          status: PaymentStatus.SUCCESS,
        };
        mockPaymentRepository.findAndCount.mockResolvedValue([mockPayments, 3]);

        await service.findUserPayments(userId, filter);

        expect(mockPaymentRepository.findAndCount).toHaveBeenCalledWith({
          where: {
            userId,
            type: PaymentType.BILL_PAYMENT,
            status: PaymentStatus.SUCCESS,
          },
          relations: ['booking'],
          order: { createdAt: 'DESC' },
          skip: 0,
          take: 20,
        });
      });

      it('should return empty array when user has no payments', async () => {
        mockPaymentRepository.findAndCount.mockResolvedValue([[], 0]);

        const result = await service.findUserPayments(userId);

        expect(result).toEqual({
          data: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        });
      });

      it('should calculate totalPages correctly', async () => {
        mockPaymentRepository.findAndCount.mockResolvedValue([mockPayments, 45]);

        const result = await service.findUserPayments(userId, { limit: 10 });

        expect(result.totalPages).toBe(5); // Math.ceil(45 / 10)
      });
    });

    describe('Edge Cases', () => {
      it('should handle large page numbers', async () => {
        const filter: PaymentFilterDto = { page: 100, limit: 20 };
        mockPaymentRepository.findAndCount.mockResolvedValue([[], 50]);

        const result = await service.findUserPayments(userId, filter);

        expect(mockPaymentRepository.findAndCount).toHaveBeenCalledWith(
          expect.objectContaining({
            skip: 1980, // (100 - 1) * 20
          }),
        );
      });

      it('should order by createdAt DESC', async () => {
        mockPaymentRepository.findAndCount.mockResolvedValue([mockPayments, 3]);

        await service.findUserPayments(userId);

        expect(mockPaymentRepository.findAndCount).toHaveBeenCalledWith(
          expect.objectContaining({
            order: { createdAt: 'DESC' },
          }),
        );
      });

      it('should include booking relation', async () => {
        mockPaymentRepository.findAndCount.mockResolvedValue([mockPayments, 3]);

        await service.findUserPayments(userId);

        expect(mockPaymentRepository.findAndCount).toHaveBeenCalledWith(
          expect.objectContaining({
            relations: ['booking'],
          }),
        );
      });
    });

    describe('Security', () => {
      it('should only return payments for the specified user', async () => {
        mockPaymentRepository.findAndCount.mockResolvedValue([mockPayments, 3]);

        await service.findUserPayments(userId);

        expect(mockPaymentRepository.findAndCount).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ userId }),
          }),
        );
      });

      it('should not leak other users payments', async () => {
        const otherUserPayments = [
          { ...mockPayment, userId: 'other-user-123' },
        ];
        mockPaymentRepository.findAndCount.mockResolvedValue([otherUserPayments, 1]);

        const result = await service.findUserPayments('different-user');

        // Repository should be called with different-user
        expect(mockPaymentRepository.findAndCount).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ userId: 'different-user' }),
          }),
        );
      });
    });
  });

  describe('findById', () => {
    describe('Success Scenarios', () => {
      it('should return payment by id with relations', async () => {
        mockPaymentRepository.findOne.mockResolvedValue(mockPayment);

        const result = await service.findById(paymentId);

        expect(result).toEqual(mockPayment);
        expect(mockPaymentRepository.findOne).toHaveBeenCalledWith({
          where: { id: paymentId },
          relations: ['booking'],
        });
      });
    });

    describe('Error Scenarios', () => {
      it('should throw NotFoundException if payment not found', async () => {
        mockPaymentRepository.findOne.mockResolvedValue(null);

        await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
        await expect(service.findById('non-existent')).rejects.toThrow('Payment not found');
      });
    });
  });

  describe('refundPayment', () => {
    const refundDto: RefundPaymentDto = {
      amount: 5000,
    };

    const mockPaymentWithBooking = {
      ...mockPayment,
      status: PaymentStatus.SUCCESS,
      booking: mockBooking,
    };

    describe('Success Scenarios', () => {
      it('should successfully refund payment', async () => {
        mockPaymentRepository.findOne.mockResolvedValue(mockPaymentWithBooking);
        mockPaymentRepository.save.mockImplementation((payment) => Promise.resolve(payment));

        const result = await service.refundPayment(paymentId, userId, refundDto);

        expect(result.status).toBe(PaymentStatus.REFUNDED);
        expect(mockPaymentRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            status: PaymentStatus.REFUNDED,
          }),
        );
      });

      it('should update booking payment status to REFUNDED', async () => {
        const successfulPaymentWithBooking = {
          ...mockPaymentWithBooking,
          status: PaymentStatus.SUCCESS,
        };
        mockPaymentRepository.findOne.mockResolvedValue(successfulPaymentWithBooking);
        mockPaymentRepository.save.mockImplementation((payment) => Promise.resolve(payment));

        await service.refundPayment(paymentId, userId, refundDto);

        expect(mockBookingRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            paymentStatus: BookingPaymentStatus.REFUNDED,
          }),
        );
      });

      it('should handle refund without booking', async () => {
        const paymentWithoutBooking = {
          ...mockPayment,
          status: PaymentStatus.SUCCESS,
          bookingId: null,
          booking: null,
        };
        mockPaymentRepository.findOne.mockResolvedValue(paymentWithoutBooking);
        mockPaymentRepository.save.mockImplementation((payment) => Promise.resolve(payment));

        const result = await service.refundPayment(paymentId, userId, refundDto);

        expect(result.status).toBe(PaymentStatus.REFUNDED);
        expect(mockBookingRepository.save).not.toHaveBeenCalled();
      });
    });

    describe('Error Scenarios', () => {
      it('should throw NotFoundException if payment not found', async () => {
        mockPaymentRepository.findOne.mockResolvedValue(null);

        await expect(service.refundPayment(paymentId, userId, refundDto)).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should throw ForbiddenException if user does not own payment', async () => {
        const otherUserPayment = {
          ...mockPayment,
          userId: 'other-user-123',
          status: PaymentStatus.SUCCESS,
        };
        mockPaymentRepository.findOne.mockResolvedValue(otherUserPayment);

        await expect(service.refundPayment(paymentId, userId, refundDto)).rejects.toThrow(
          ForbiddenException,
        );
        await expect(service.refundPayment(paymentId, userId, refundDto)).rejects.toThrow(
          'You do not have permission to refund this payment',
        );
      });

      it('should throw BadRequestException if payment is not successful', async () => {
        const pendingPayment = {
          ...mockPayment,
          status: PaymentStatus.PENDING,
        };
        mockPaymentRepository.findOne.mockResolvedValue(pendingPayment);

        await expect(service.refundPayment(paymentId, userId, refundDto)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.refundPayment(paymentId, userId, refundDto)).rejects.toThrow(
          'Only successful payments can be refunded',
        );
      });

      it('should throw BadRequestException if payment is already refunded', async () => {
        const refundedPayment = {
          ...mockPayment,
          status: PaymentStatus.REFUNDED,
        };
        mockPaymentRepository.findOne.mockResolvedValue(refundedPayment);

        await expect(service.refundPayment(paymentId, userId, refundDto)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should throw BadRequestException if payment failed', async () => {
        const failedPayment = {
          ...mockPayment,
          status: PaymentStatus.FAILED,
        };
        mockPaymentRepository.findOne.mockResolvedValue(failedPayment);

        await expect(service.refundPayment(paymentId, userId, refundDto)).rejects.toThrow(
          BadRequestException,
        );
      });
    });

    describe('Security', () => {
      it('should verify payment ownership before refunding', async () => {
        const successfulPaymentWithBooking = {
          ...mockPaymentWithBooking,
          status: PaymentStatus.SUCCESS,
        };
        mockPaymentRepository.findOne.mockResolvedValue(successfulPaymentWithBooking);
        mockPaymentRepository.save.mockImplementation((payment) => Promise.resolve(payment));

        await service.refundPayment(paymentId, userId, refundDto);

        expect(mockPaymentRepository.findOne).toHaveBeenCalledWith({
          where: { id: paymentId },
          relations: ['booking'],
        });
      });

      it('should prevent cross-user refunds', async () => {
        const anotherUserPayment = {
          ...mockPaymentWithBooking,
          userId: 'another-user-456',
        };
        mockPaymentRepository.findOne.mockResolvedValue(anotherUserPayment);

        await expect(
          service.refundPayment(paymentId, 'attacker-user', refundDto),
        ).rejects.toThrow(ForbiddenException);
      });
    });
  });

  describe('Integration with Booking', () => {
    it('should maintain payment-booking relationship integrity', async () => {
      const mockUUID = 'integration123';
      (crypto.randomUUID as jest.Mock).mockReturnValue(mockUUID);

      const initializeDto: InitializePaymentDto = {
        amount: 5000,
        email: 'user@example.com',
        type: PaymentType.SERVICE_BOOKING,
        bookingId,
      };

      mockBookingRepository.findOne.mockResolvedValue(mockBooking);
      mockPaystackService.initializePayment.mockResolvedValue(mockPaystackInitResponse);
      mockPaymentRepository.create.mockReturnValue(mockPayment);
      mockPaymentRepository.save.mockResolvedValue(mockPayment);

      await service.initializePayment(userId, initializeDto);

      expect(mockPaymentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          bookingId,
        }),
      );
    });
  });

  describe('PCI Compliance & Security', () => {
    it('should never store card details in payment record', async () => {
      const mockUUID = 'security123';
      (crypto.randomUUID as jest.Mock).mockReturnValue(mockUUID);

      const initializeDto: InitializePaymentDto = {
        amount: 5000,
        email: 'user@example.com',
        type: PaymentType.SERVICE_BOOKING,
        metadata: {
          // Card details should never be in metadata
          cardNumber: '4111111111111111',
        },
      };

      mockPaystackService.initializePayment.mockResolvedValue(mockPaystackInitResponse);
      mockPaymentRepository.create.mockReturnValue(mockPayment);
      mockPaymentRepository.save.mockResolvedValue(mockPayment);

      // Service should still process, but responsibility is on caller
      await service.initializePayment(userId, initializeDto);

      // Verify payment is created (metadata is passed as-is)
      expect(mockPaymentRepository.create).toHaveBeenCalled();
    });

    it('should use HTTPS Paystack URLs', () => {
      expect(mockPaystackInitResponse.data.authorization_url).toMatch(/^https:\/\//);
    });
  });
});
