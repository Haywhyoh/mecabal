import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  BusinessProfile,
  BusinessService,
  BusinessReview,
  BusinessInquiry,
  ServiceInquiry,
  User,
  ListingCategory,
} from '@app/database';

export interface BusinessSearchDto {
  query?: string;
  category?: string;
  subcategory?: string;
  serviceArea?: string;
  minRating?: number;
  hasInsurance?: boolean;
  isVerified?: boolean;
  latitude?: number;
  longitude?: number;
  radius?: number;
  page?: number;
  limit?: number;
  sortBy?: 'rating' | 'reviews' | 'distance' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
}

export interface ServiceInquiryDto {
  businessId: string;
  serviceType: string;
  description: string;
  urgency?: 'low' | 'normal' | 'high' | 'urgent';
  budgetMin?: number;
  budgetMax?: number;
  preferredContact: 'call' | 'message' | 'whatsapp';
}

export interface BusinessReviewDto {
  businessId: string;
  rating: number;
  reviewText?: string;
  serviceQuality?: number;
  professionalism?: number;
  valueForMoney?: number;
}

export interface PaginatedBusinessResponse {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

@Injectable()
export class BusinessApiService {
  constructor(
    @InjectRepository(BusinessProfile)
    private readonly businessRepository: Repository<BusinessProfile>,
    @InjectRepository(BusinessService)
    private readonly businessServiceRepository: Repository<BusinessService>,
    @InjectRepository(BusinessReview)
    private readonly businessReviewRepository: Repository<BusinessReview>,
    @InjectRepository(BusinessInquiry)
    private readonly businessInquiryRepository: Repository<BusinessInquiry>,
    @InjectRepository(ServiceInquiry)
    private readonly serviceInquiryRepository: Repository<ServiceInquiry>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ListingCategory)
    private readonly categoryRepository: Repository<ListingCategory>,
  ) {}

  async searchBusinesses(
    searchDto: BusinessSearchDto,
    userId?: string,
  ): Promise<PaginatedBusinessResponse> {
    const queryBuilder = this.createBusinessQueryBuilder();

    // Apply search filters
    this.applyBusinessFilters(queryBuilder, searchDto);

    // Apply pagination
    const page = searchDto.page || 1;
    const limit = searchDto.limit || 20;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    // Apply sorting
    this.applyBusinessSorting(queryBuilder, searchDto);

    // Execute query
    const [businesses, total] = await queryBuilder.getManyAndCount();

    // Format response
    const formattedBusinesses = await Promise.all(
      businesses.map((business) => this.formatBusinessResponse(business, userId)),
    );

    return {
      data: formattedBusinesses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit),
    };
  }

  async getBusinessById(id: string, userId?: string): Promise<any> {
    const business = await this.businessRepository.findOne({
      where: { id },
      relations: ['services', 'reviews', 'user'],
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return this.formatBusinessResponse(business, userId);
  }

  async createServiceInquiry(
    userId: string,
    inquiryDto: ServiceInquiryDto,
  ): Promise<any> {
    // Verify business exists
    const business = await this.businessRepository.findOne({
      where: { id: inquiryDto.businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Create service inquiry
    const inquiry = this.serviceInquiryRepository.create({
      businessId: inquiryDto.businessId,
      customerId: userId,
      serviceType: inquiryDto.serviceType,
      description: inquiryDto.description,
      urgency: inquiryDto.urgency || 'normal',
      budgetMin: inquiryDto.budgetMin,
      budgetMax: inquiryDto.budgetMax,
      preferredContact: inquiryDto.preferredContact,
      status: 'pending',
    });

    const savedInquiry = await this.serviceInquiryRepository.save(inquiry);

    return this.formatServiceInquiryResponse(savedInquiry);
  }

  async getBusinessInquiries(
    businessId: string,
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedBusinessResponse> {
    // Verify business ownership
    const business = await this.businessRepository.findOne({
      where: { id: businessId, userId },
    });

    if (!business) {
      throw new ForbiddenException('You can only view inquiries for your own business');
    }

    const skip = (page - 1) * limit;

    const [inquiries, total] = await this.serviceInquiryRepository.findAndCount({
      where: { businessId },
      relations: ['customer'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const formattedInquiries = inquiries.map((inquiry) =>
      this.formatServiceInquiryResponse(inquiry),
    );

    return {
      data: formattedInquiries,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit),
    };
  }

  async respondToInquiry(
    inquiryId: string,
    businessId: string,
    userId: string,
    response: string,
  ): Promise<any> {
    // Verify business ownership
    const business = await this.businessRepository.findOne({
      where: { id: businessId, userId },
    });

    if (!business) {
      throw new ForbiddenException('You can only respond to inquiries for your own business');
    }

    // Find inquiry
    const inquiry = await this.serviceInquiryRepository.findOne({
      where: { id: inquiryId, businessId },
    });

    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    // Update inquiry
    inquiry.businessResponse = response;
    inquiry.status = 'responded';
    inquiry.respondedAt = new Date();

    const updatedInquiry = await this.serviceInquiryRepository.save(inquiry);

    return this.formatServiceInquiryResponse(updatedInquiry);
  }

  async createBusinessReview(
    userId: string,
    reviewDto: BusinessReviewDto,
  ): Promise<any> {
    // Verify business exists
    const business = await this.businessRepository.findOne({
      where: { id: reviewDto.businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Check if user already reviewed this business
    const existingReview = await this.businessReviewRepository.findOne({
      where: { businessId: reviewDto.businessId, userId },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this business');
    }

    // Create review
    const review = this.businessReviewRepository.create({
      businessId: reviewDto.businessId,
      userId,
      rating: reviewDto.rating,
      reviewText: reviewDto.reviewText,
      serviceQuality: reviewDto.serviceQuality,
      professionalism: reviewDto.professionalism,
      valueForMoney: reviewDto.valueForMoney,
    });

    const savedReview = await this.businessReviewRepository.save(review);

    // Update business rating
    await this.updateBusinessRating(reviewDto.businessId);

    return this.formatBusinessReviewResponse(savedReview);
  }

  async getBusinessReviews(
    businessId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedBusinessResponse> {
    const skip = (page - 1) * limit;

    const [reviews, total] = await this.businessReviewRepository.findAndCount({
      where: { businessId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const formattedReviews = reviews.map((review) =>
      this.formatBusinessReviewResponse(review),
    );

    return {
      data: formattedReviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit),
    };
  }

  async updateBusinessServices(
    businessId: string,
    userId: string,
    services: any[],
  ): Promise<any> {
    // Verify business ownership
    const business = await this.businessRepository.findOne({
      where: { id: businessId, userId },
    });

    if (!business) {
      throw new ForbiddenException('You can only update your own business services');
    }

    // Delete existing services
    await this.businessServiceRepository.delete({ businessId });

    // Create new services
    const serviceEntities = services.map((service) =>
      this.businessServiceRepository.create({
        businessId,
        serviceName: service.serviceName,
        description: service.description,
        priceMin: service.priceMin,
        priceMax: service.priceMax,
        duration: service.duration,
      }),
    );

    const savedServices = await this.businessServiceRepository.save(serviceEntities);

    return savedServices.map((service) => this.formatBusinessServiceResponse(service));
  }

  async getNearbyBusinesses(
    latitude: number,
    longitude: number,
    radius: number,
    searchDto: BusinessSearchDto,
    userId?: string,
  ): Promise<any[]> {
    // Convert radius from km to meters for PostGIS
    const radiusMeters = radius * 1000;

    const query = this.businessRepository
      .createQueryBuilder('business')
      .leftJoinAndSelect('business.user', 'user')
      .leftJoinAndSelect('business.services', 'services')
      .where(
        `ST_DWithin(
          ST_SetSRID(ST_MakePoint(business.longitude, business.latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
          :radius
        )`,
        {
          latitude,
          longitude,
          radius: radiusMeters,
        },
      )
      .andWhere('business.isActive = :active', { active: true });

    // Apply search filters
    this.applyBusinessFilters(query, searchDto);

    // Apply sorting
    this.applyBusinessSorting(query, searchDto);

    const businesses = await query
      .orderBy(
        `ST_Distance(
          ST_SetSRID(ST_MakePoint(business.longitude, business.latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
        )`,
      )
      .setParameters({ latitude, longitude })
      .limit(searchDto.limit || 50)
      .getMany();

    return Promise.all(
      businesses.map((business) => this.formatBusinessResponse(business, userId)),
    );
  }

  private createBusinessQueryBuilder(): SelectQueryBuilder<BusinessProfile> {
    return this.businessRepository
      .createQueryBuilder('business')
      .leftJoinAndSelect('business.user', 'user')
      .leftJoinAndSelect('business.services', 'services')
      .leftJoinAndSelect('business.reviews', 'reviews');
  }

  private applyBusinessFilters(
    queryBuilder: SelectQueryBuilder<BusinessProfile>,
    searchDto: BusinessSearchDto,
  ): void {
    // Text search
    if (searchDto.query) {
      queryBuilder.andWhere(
        `(
          business.businessName ILIKE :query OR 
          business.description ILIKE :query OR
          business.category ILIKE :query OR
          business.subcategory ILIKE :query
        )`,
        { query: `%${searchDto.query}%` },
      );
    }

    // Category filters
    if (searchDto.category) {
      queryBuilder.andWhere('business.category = :category', {
        category: searchDto.category,
      });
    }

    if (searchDto.subcategory) {
      queryBuilder.andWhere('business.subcategory = :subcategory', {
        subcategory: searchDto.subcategory,
      });
    }

    // Service area filter
    if (searchDto.serviceArea) {
      queryBuilder.andWhere('business.serviceArea = :serviceArea', {
        serviceArea: searchDto.serviceArea,
      });
    }

    // Rating filter
    if (searchDto.minRating !== undefined) {
      queryBuilder.andWhere('business.rating >= :minRating', {
        minRating: searchDto.minRating,
      });
    }

    // Insurance filter
    if (searchDto.hasInsurance !== undefined) {
      queryBuilder.andWhere('business.hasInsurance = :hasInsurance', {
        hasInsurance: searchDto.hasInsurance,
      });
    }

    // Verification filter
    if (searchDto.isVerified !== undefined) {
      queryBuilder.andWhere('business.isVerified = :isVerified', {
        isVerified: searchDto.isVerified,
      });
    }

    // Location-based search
    if (searchDto.latitude && searchDto.longitude && searchDto.radius) {
      const radiusMeters = searchDto.radius * 1000;
      queryBuilder.andWhere(
        `ST_DWithin(
          ST_SetSRID(ST_MakePoint(business.longitude, business.latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
          :radius
        )`,
        {
          latitude: searchDto.latitude,
          longitude: searchDto.longitude,
          radius: radiusMeters,
        },
      );
    }

    // Only show active businesses
    queryBuilder.andWhere('business.isActive = :active', { active: true });
  }

  private applyBusinessSorting(
    queryBuilder: SelectQueryBuilder<BusinessProfile>,
    searchDto: BusinessSearchDto,
  ): void {
    const sortBy = searchDto.sortBy || 'rating';
    const sortOrder = searchDto.sortOrder || 'DESC';

    switch (sortBy) {
      case 'rating':
        queryBuilder.orderBy('business.rating', sortOrder);
        break;
      case 'reviews':
        queryBuilder.orderBy('business.reviewCount', sortOrder);
        break;
      case 'distance':
        // Distance sorting is handled in the query itself
        break;
      case 'createdAt':
        queryBuilder.orderBy('business.createdAt', sortOrder);
        break;
      default:
        queryBuilder.orderBy('business.rating', 'DESC');
        break;
    }
  }

  private async updateBusinessRating(businessId: string): Promise<void> {
    const reviews = await this.businessReviewRepository.find({
      where: { businessId },
    });

    if (reviews.length === 0) return;

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await this.businessRepository.update(businessId, {
      rating: Math.round(averageRating * 100) / 100,
      reviewCount: reviews.length,
    });
  }

  private async formatBusinessResponse(business: BusinessProfile, userId?: string): Promise<any> {
    return {
      id: business.id,
      businessName: business.businessName,
      description: business.description,
      category: business.category,
      subcategory: business.subcategory,
      serviceArea: business.serviceArea,
      pricingModel: business.pricingModel,
      availability: business.availability,
      phoneNumber: business.phoneNumber,
      whatsappNumber: business.whatsappNumber,
      businessAddress: business.businessAddress,
      location: {
        latitude: business.latitude,
        longitude: business.longitude,
      },
      state: business.state,
      city: business.city,
      yearsOfExperience: business.yearsOfExperience,
      isVerified: business.isVerified,
      verificationLevel: business.verificationLevel,
      profileImageUrl: business.profileImageUrl,
      coverImageUrl: business.coverImageUrl,
      rating: business.rating,
      reviewCount: business.reviewCount,
      completedJobs: business.completedJobs,
      responseTime: business.responseTime,
      hasInsurance: business.hasInsurance,
      paymentMethods: business.paymentMethods,
      businessHours: business.businessHours,
      servicesOffered: business.servicesOffered,
      serviceAreas: business.serviceAreas,
      contactPreferences: business.contactPreferences,
      services: business.services?.map((service) => this.formatBusinessServiceResponse(service)),
      author: {
        id: business.user.id,
        firstName: business.user.firstName,
        lastName: business.user.lastName,
        profilePicture: business.user.profilePictureUrl,
        isVerified: business.user.isVerified,
      },
      createdAt: business.createdAt,
      updatedAt: business.updatedAt,
    };
  }

  private formatServiceInquiryResponse(inquiry: ServiceInquiry): any {
    return {
      id: inquiry.id,
      businessId: inquiry.businessId,
      customerId: inquiry.customerId,
      serviceType: inquiry.serviceType,
      description: inquiry.description,
      urgency: inquiry.urgency,
      budgetMin: inquiry.budgetMin,
      budgetMax: inquiry.budgetMax,
      preferredContact: inquiry.preferredContact,
      status: inquiry.status,
      businessResponse: inquiry.businessResponse,
      respondedAt: inquiry.respondedAt,
      customer: inquiry.customer ? {
        id: inquiry.customer.id,
        firstName: inquiry.customer.firstName,
        lastName: inquiry.customer.lastName,
        profilePicture: inquiry.customer.profilePictureUrl,
      } : null,
      createdAt: inquiry.createdAt,
    };
  }

  private formatBusinessReviewResponse(review: BusinessReview): any {
    return {
      id: review.id,
      businessId: review.businessId,
      userId: review.userId,
      rating: review.rating,
      reviewText: review.reviewText,
      serviceQuality: review.serviceQuality,
      professionalism: review.professionalism,
      valueForMoney: review.valueForMoney,
      response: review.response,
      respondedAt: review.respondedAt,
      user: review.user ? {
        id: review.user.id,
        firstName: review.user.firstName,
        lastName: review.user.lastName,
        profilePicture: review.user.profilePictureUrl,
      } : null,
      createdAt: review.createdAt,
    };
  }

  private formatBusinessServiceResponse(service: BusinessService): any {
    return {
      id: service.id,
      businessId: service.businessId,
      serviceName: service.serviceName,
      description: service.description,
      priceMin: service.priceMin,
      priceMax: service.priceMax,
      duration: service.duration,
      isActive: service.isActive,
      createdAt: service.createdAt,
    };
  }
}
