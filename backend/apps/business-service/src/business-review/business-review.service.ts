import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessReview } from '@app/database/entities/business-review.entity';
import { BusinessProfile } from '@app/database/entities/business-profile.entity';
import { Booking } from '@app/database/entities/booking.entity';
import {
  CreateBusinessReviewDto,
  RespondToReviewDto,
  ReviewQueryDto,
} from '../dto/create-review.dto';

@Injectable()
export class BusinessReviewService {
  constructor(
    @InjectRepository(BusinessReview)
    private reviewRepo: Repository<BusinessReview>,
    @InjectRepository(BusinessProfile)
    private businessRepo: Repository<BusinessProfile>,
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
  ) {}

  async create(
    businessId: string,
    userId: string,
    createDto: CreateBusinessReviewDto,
  ): Promise<BusinessReview> {
    // Verify business exists
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Check if user has already reviewed this business
    const existingReview = await this.reviewRepo.findOne({
      where: { businessId, userId },
    });

    if (existingReview) {
      throw new BadRequestException(
        'You have already reviewed this business. Use update endpoint instead.',
      );
    }

    // Prevent business owner from reviewing their own business
    if (business.userId === userId) {
      throw new ForbiddenException('You cannot review your own business');
    }

    // If bookingId is provided, verify booking exists and belongs to user
    if (createDto.bookingId) {
      const booking = await this.bookingRepo.findOne({
        where: { id: createDto.bookingId, userId, businessId },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found or does not belong to you');
      }

      if (booking.hasReviewed) {
        throw new BadRequestException('This booking has already been reviewed');
      }
    }

    // Create review
    const review = this.reviewRepo.create({
      businessId,
      userId,
      ...createDto,
    });

    const savedReview = await this.reviewRepo.save(review);

    // If bookingId is provided, mark booking as reviewed
    if (createDto.bookingId) {
      await this.bookingRepo.update(createDto.bookingId, {
        hasReviewed: true,
        reviewId: savedReview.id,
      });
    }

    // Update business rating and review count
    await this.updateBusinessRating(businessId);

    return savedReview;
  }

  async findByBusiness(
    businessId: string,
    queryDto: ReviewQueryDto,
  ): Promise<{ data: BusinessReview[]; meta: any }> {
    const { page = 1, limit = 20, rating } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.reviewRepo
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .where('review.businessId = :businessId', { businessId })
      .orderBy('review.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (rating) {
      queryBuilder.andWhere('review.rating = :rating', { rating });
    }

    const [reviews, total] = await queryBuilder.getManyAndCount();

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<BusinessReview> {
    const review = await this.reviewRepo.findOne({
      where: { id },
      relations: ['user', 'business'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async respondToReview(
    reviewId: string,
    businessOwnerId: string,
    respondDto: RespondToReviewDto,
  ): Promise<BusinessReview> {
    const review = await this.findById(reviewId);

    // Verify the user is the business owner
    if (review.business.userId !== businessOwnerId) {
      throw new ForbiddenException(
        'Only the business owner can respond to reviews',
      );
    }

    review.response = respondDto.response;
    review.respondedAt = new Date();

    return await this.reviewRepo.save(review);
  }

  async update(
    id: string,
    userId: string,
    updateDto: CreateBusinessReviewDto,
  ): Promise<BusinessReview> {
    const review = await this.findById(id);

    // Verify user owns this review
    if (review.userId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    Object.assign(review, updateDto);
    const updatedReview = await this.reviewRepo.save(review);

    // Recalculate business rating
    await this.updateBusinessRating(review.businessId);

    return updatedReview;
  }

  async delete(id: string, userId: string): Promise<void> {
    const review = await this.findById(id);

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    const businessId = review.businessId;
    await this.reviewRepo.remove(review);

    // Recalculate business rating
    await this.updateBusinessRating(businessId);
  }

  async getReviewStats(businessId: string) {
    const reviews = await this.reviewRepo.find({
      where: { businessId },
    });

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        averageServiceQuality: 0,
        averageProfessionalism: 0,
        averageValueForMoney: 0,
      };
    }

      const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalServiceQuality = 0;
    let totalProfessionalism = 0;
    let totalValueForMoney = 0;
    let serviceQualityCount = 0;
    let professionalismCount = 0;
    let valueForMoneyCount = 0;

    reviews.forEach((review) => {
      ratingDistribution[review.rating]++;

      if (review.serviceQuality) {
        totalServiceQuality += review.serviceQuality;
        serviceQualityCount++;
      }

      if (review.professionalism) {
        totalProfessionalism += review.professionalism;
        professionalismCount++;
      }

      if (review.valueForMoney) {
        totalValueForMoney += review.valueForMoney;
        valueForMoneyCount++;
      }
    });

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = Number((totalRating / reviews.length).toFixed(2));

    return {
      averageRating,
      totalReviews: reviews.length,
      ratingDistribution,
      averageServiceQuality: serviceQualityCount
        ? Number((totalServiceQuality / serviceQualityCount).toFixed(2))
        : 0,
      averageProfessionalism: professionalismCount
        ? Number((totalProfessionalism / professionalismCount).toFixed(2))
        : 0,
      averageValueForMoney: valueForMoneyCount
        ? Number((totalValueForMoney / valueForMoneyCount).toFixed(2))
        : 0,
    };
  }

  private async updateBusinessRating(businessId: string): Promise<void> {
    const stats = await this.getReviewStats(businessId);

    await this.businessRepo.update(businessId, {
      rating: stats.averageRating,
      reviewCount: stats.totalReviews,
    });
  }
}
