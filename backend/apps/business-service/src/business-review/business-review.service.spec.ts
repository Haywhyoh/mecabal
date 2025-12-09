import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessReviewService } from './business-review.service';
import { BusinessReview } from '@app/database/entities/business-review.entity';
import { BusinessProfile } from '@app/database/entities/business-profile.entity';
import { Booking } from '@app/database/entities/booking.entity';
import { CreateBusinessReviewDto } from '../dto/create-review.dto';

describe('BusinessReviewService', () => {
  let service: BusinessReviewService;
  let reviewRepository: Repository<BusinessReview>;
  let businessRepository: Repository<BusinessProfile>;
  let bookingRepository: Repository<Booking>;

  const mockReviewRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockBusinessRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockBookingRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
  };

  const mockBusiness = {
    id: 'business-123',
    userId: 'business-owner-123',
    businessName: 'Test Business',
    rating: 4.5,
    reviewCount: 10,
  };

  const mockReview = {
    id: 'review-123',
    businessId: 'business-123',
    userId: 'user-123',
    rating: 5,
    reviewText: 'Great service!',
    serviceQuality: 5,
    professionalism: 4,
    valueForMoney: 5,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessReviewService,
        {
          provide: getRepositoryToken(BusinessReview),
          useValue: mockReviewRepository,
        },
        {
          provide: getRepositoryToken(BusinessProfile),
          useValue: mockBusinessRepository,
        },
        {
          provide: getRepositoryToken(Booking),
          useValue: mockBookingRepository,
        },
      ],
    }).compile();

    service = module.get<BusinessReviewService>(BusinessReviewService);
    reviewRepository = module.get<Repository<BusinessReview>>(
      getRepositoryToken(BusinessReview),
    );
    businessRepository = module.get<Repository<BusinessProfile>>(
      getRepositoryToken(BusinessProfile),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new review', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const createDto: CreateBusinessReviewDto = {
        rating: 5,
        reviewText: 'Excellent service!',
        serviceQuality: 5,
        professionalism: 4,
        valueForMoney: 5,
      };

      mockBusinessRepository.findOne.mockResolvedValue(mockBusiness);
      mockReviewRepository.findOne.mockResolvedValue(null);
      mockReviewRepository.create.mockReturnValue({
        businessId,
        userId,
        ...createDto,
      });
      mockReviewRepository.save.mockResolvedValue({
        id: 'review-123',
        businessId,
        userId,
        ...createDto,
      });

      const result = await service.create(businessId, userId, createDto);

      expect(result).toHaveProperty('id');
      expect(result.rating).toBe(createDto.rating);
      expect(mockReviewRepository.create).toHaveBeenCalledWith({
        businessId,
        userId,
        ...createDto,
      });
      expect(mockReviewRepository.save).toHaveBeenCalled();
    });

    it('should throw error if business not found', async () => {
      const businessId = 'non-existent';
      const userId = 'user-123';
      const createDto = { rating: 5 } as CreateBusinessReviewDto;

      mockBusinessRepository.findOne.mockResolvedValue(null);

      await expect(service.create(businessId, userId, createDto)).rejects.toThrow(
        'Business not found',
      );
    });

    it('should throw error if user already reviewed', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const createDto = { rating: 5 } as CreateBusinessReviewDto;

      mockBusinessRepository.findOne.mockResolvedValue(mockBusiness);
      mockReviewRepository.findOne.mockResolvedValue(mockReview);

      await expect(service.create(businessId, userId, createDto)).rejects.toThrow(
        'You have already reviewed this business',
      );
    });

    it('should throw error if business owner tries to review own business', async () => {
      const businessId = 'business-123';
      const userId = 'business-owner-123';
      const createDto = { rating: 5 } as CreateBusinessReviewDto;

      mockBusinessRepository.findOne.mockResolvedValue(mockBusiness);

      await expect(service.create(businessId, userId, createDto)).rejects.toThrow(
        'You cannot review your own business',
      );
    });
  });

  describe('findByBusiness', () => {
    it('should return reviews for a business with pagination', async () => {
      const businessId = 'business-123';
      const queryDto = { page: 1, limit: 10 };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockReview], 1]),
      };

      mockReviewRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findByBusiness(businessId, queryDto);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.data).toContain(mockReview);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'review.businessId = :businessId',
        { businessId },
      );
    });
  });

  describe('findById', () => {
    it('should return review by id', async () => {
      const reviewId = 'review-123';
      mockReviewRepository.findOne.mockResolvedValue(mockReview);

      const result = await service.findById(reviewId);

      expect(result).toEqual(mockReview);
      expect(mockReviewRepository.findOne).toHaveBeenCalledWith({
        where: { id: reviewId },
        relations: ['user', 'business'],
      });
    });

    it('should throw NotFoundException if review not found', async () => {
      const reviewId = 'non-existent';
      mockReviewRepository.findOne.mockResolvedValue(null);

      await expect(service.findById(reviewId)).rejects.toThrow(
        'Review not found',
      );
    });
  });

  describe('respondToReview', () => {
    it('should allow business owner to respond to review', async () => {
      const reviewId = 'review-123';
      const businessOwnerId = 'business-owner-123';
      const respondDto = { response: 'Thank you for your feedback!' };

      const reviewWithBusiness = {
        ...mockReview,
        business: mockBusiness,
      };

      mockReviewRepository.findOne.mockResolvedValue(reviewWithBusiness);
      mockReviewRepository.save.mockResolvedValue({
        ...reviewWithBusiness,
        response: respondDto.response,
        respondedAt: new Date(),
      });

      const result = await service.respondToReview(
        reviewId,
        businessOwnerId,
        respondDto,
      );

      expect(result.response).toBe(respondDto.response);
      expect(result.respondedAt).toBeDefined();
      expect(mockReviewRepository.save).toHaveBeenCalled();
    });

    it('should throw error if user is not business owner', async () => {
      const reviewId = 'review-123';
      const businessOwnerId = 'different-user';
      const respondDto = { response: 'Thank you!' };

      const reviewWithBusiness = {
        ...mockReview,
        business: mockBusiness,
      };

      mockReviewRepository.findOne.mockResolvedValue(reviewWithBusiness);

      await expect(
        service.respondToReview(reviewId, businessOwnerId, respondDto),
      ).rejects.toThrow('Only the business owner can respond to reviews');
    });
  });

  describe('update', () => {
    it('should update review by owner', async () => {
      const reviewId = 'review-123';
      const userId = 'user-123';
      const updateDto: CreateBusinessReviewDto = {
        rating: 4,
        reviewText: 'Updated review',
      };

      mockReviewRepository.findOne.mockResolvedValue(mockReview);
      mockReviewRepository.save.mockResolvedValue({
        ...mockReview,
        ...updateDto,
      });

      const result = await service.update(reviewId, userId, updateDto);

      expect(result.rating).toBe(updateDto.rating);
      expect(result.reviewText).toBe(updateDto.reviewText);
      expect(mockReviewRepository.save).toHaveBeenCalled();
    });

    it('should throw error if user is not review owner', async () => {
      const reviewId = 'review-123';
      const userId = 'different-user';
      const updateDto = { rating: 4 } as CreateBusinessReviewDto;

      mockReviewRepository.findOne.mockResolvedValue(mockReview);

      await expect(service.update(reviewId, userId, updateDto)).rejects.toThrow(
        'You can only update your own reviews',
      );
    });
  });

  describe('delete', () => {
    it('should delete review by owner', async () => {
      const reviewId = 'review-123';
      const userId = 'user-123';

      mockReviewRepository.findOne.mockResolvedValue(mockReview);
      mockReviewRepository.remove.mockResolvedValue(mockReview);

      await service.delete(reviewId, userId);

      expect(mockReviewRepository.remove).toHaveBeenCalledWith(mockReview);
    });
  });

  describe('getReviewStats', () => {
    it('should calculate review statistics', async () => {
      const businessId = 'business-123';
      const reviews = [
        { rating: 5, serviceQuality: 5, professionalism: 4, valueForMoney: 5 },
        { rating: 4, serviceQuality: 4, professionalism: 5, valueForMoney: 4 },
        { rating: 5, serviceQuality: 5, professionalism: 5, valueForMoney: 5 },
      ];

      mockReviewRepository.find.mockResolvedValue(reviews);

      const result = await service.getReviewStats(businessId);

      expect(result.averageRating).toBe(4.67);
      expect(result.totalReviews).toBe(3);
      expect(result.ratingDistribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 1, 5: 2 });
      expect(result.averageServiceQuality).toBe(4.67);
      expect(result.averageProfessionalism).toBe(4.67);
      expect(result.averageValueForMoney).toBe(4.67);
    });

    it('should return zero stats for no reviews', async () => {
      const businessId = 'business-123';
      mockReviewRepository.find.mockResolvedValue([]);

      const result = await service.getReviewStats(businessId);

      expect(result.averageRating).toBe(0);
      expect(result.totalReviews).toBe(0);
      expect(result.ratingDistribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    });
  });
});
