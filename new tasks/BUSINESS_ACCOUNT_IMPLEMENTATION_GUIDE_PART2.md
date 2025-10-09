# Business Account System - Implementation Guide (Part 2)
**MeCabal Backend Development**
*Date: 2025-10-09*
*Gap 5: Business Account System - Phases 5-10 Detailed Implementation*

---

## Table of Contents
1. [Overview](#overview)
2. [Phase 5: Business Search & Discovery](#phase-5-business-search--discovery)
3. [Phase 6: Reviews & Ratings System](#phase-6-reviews--ratings-system)
4. [Phase 7: Business Verification](#phase-7-business-verification)
5. [Phase 8: Business Analytics & Activity](#phase-8-business-analytics--activity)
6. [Phase 9: Business Inquiry System](#phase-9-business-inquiry-system)
7. [Phase 10: API Gateway Integration](#phase-10-api-gateway-integration)
8. [Phase 11: Testing & Quality Assurance](#phase-11-testing--quality-assurance)
9. [Phase 12: Deployment & Monitoring](#phase-12-deployment--monitoring)
10. [Integration Checklist](#integration-checklist)

---

## Overview

This document continues from Part 1 and provides detailed implementation steps for **Phases 5-12** of the Business Account System. Part 1 covered:
- ✅ Phase 1: Database Schema Setup
- ✅ Phase 2: Create Business Service Microservice
- ✅ Phase 3: Business Registration Flow
- ✅ Phase 4: Business Profile Management (Categories & Services)

**Prerequisites:** Complete Phases 1-4 from Part 1 before proceeding.

---

## Phase 5: Business Search & Discovery

### Objective
Implement comprehensive business search with geographic filtering, category filtering, and advanced search capabilities.

### Step 5.1: Install PostGIS Dependencies

PostGIS is already configured in the Docker setup, but ensure TypeORM is configured for spatial queries.

**Location:** `backend/libs/database/src/database.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [__dirname + '/entities/*.entity{.ts,.js}'],
        synchronize: false,
        logging: configService.get('NODE_ENV') === 'development',
        // Enable PostGIS support
        extra: {
          application_name: 'mecabal-backend',
        },
      }),
    }),
  ],
})
export class DatabaseModule {}
```

### Step 5.2: Add Geographic Fields to Business Entity

**Location:** `backend/libs/database/src/entities/business-profile.entity.ts`

Add the following fields:

```typescript
import { Point } from 'geojson';

// Inside BusinessProfile entity class:

@Column({
  type: 'geography',
  spatialFeatureType: 'Point',
  srid: 4326,
  nullable: true,
})
location: Point; // Geographic coordinates

@Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
latitude: number;

@Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
longitude: number;

@Column({ length: 100, nullable: true })
state: string; // Nigerian state

@Column({ length: 100, nullable: true })
city: string; // City or LGA
```

Generate and run migration:

```bash
cd backend
npm run migration:generate -- -n AddBusinessGeography
npm run migration:run
```

### Step 5.3: Create Search DTOs

**Location:** `backend/libs/validation/src/dtos/business/search-business.dto.ts`

```typescript
import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum SortBy {
  RATING = 'rating',
  REVIEWS = 'reviewCount',
  JOINED_DATE = 'joinedDate',
  DISTANCE = 'distance',
  COMPLETED_JOBS = 'completedJobs',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class SearchBusinessDto {
  @ApiPropertyOptional({ example: 'plumbing services' })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiPropertyOptional({ example: 'household-services' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: 'Plumbing' })
  @IsString()
  @IsOptional()
  subcategory?: string;

  @ApiPropertyOptional({ example: 6.5244, description: 'User latitude' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({ example: 3.3792, description: 'User longitude' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional({ example: 5, description: 'Search radius in kilometers' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(200)
  radius?: number;

  @ApiPropertyOptional({ example: 'Lagos' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: 'Lekki' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 4.0, description: 'Minimum rating' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  verifiedOnly?: boolean;

  @ApiPropertyOptional({ example: ['cash', 'bank-transfer'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  paymentMethods?: string[];

  @ApiPropertyOptional({ example: SortBy.RATING, enum: SortBy })
  @IsEnum(SortBy)
  @IsOptional()
  sortBy?: SortBy = SortBy.RATING;

  @ApiPropertyOptional({ example: SortOrder.DESC, enum: SortOrder })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
```

### Step 5.4: Create Business Search Service

**Location:** `backend/apps/business-service/src/business-search/business-search.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BusinessProfile } from '@app/database/entities/business-profile.entity';
import { SearchBusinessDto, SortBy } from '@app/validation/dtos/business/search-business.dto';

@Injectable()
export class BusinessSearchService {
  constructor(
    @InjectRepository(BusinessProfile)
    private businessRepo: Repository<BusinessProfile>,
  ) {}

  async search(searchDto: SearchBusinessDto) {
    const {
      query,
      category,
      subcategory,
      latitude,
      longitude,
      radius,
      state,
      city,
      minRating,
      verifiedOnly,
      paymentMethods,
      sortBy,
      sortOrder,
      page,
      limit,
    } = searchDto;

    let queryBuilder = this.businessRepo
      .createQueryBuilder('business')
      .leftJoinAndSelect('business.user', 'user')
      .where('business.isActive = :isActive', { isActive: true });

    // Full-text search on business name and description
    if (query) {
      queryBuilder = queryBuilder.andWhere(
        '(business.businessName ILIKE :query OR business.description ILIKE :query)',
        { query: `%${query}%` },
      );
    }

    // Category filtering
    if (category) {
      queryBuilder = queryBuilder.andWhere('business.category = :category', {
        category,
      });
    }

    if (subcategory) {
      queryBuilder = queryBuilder.andWhere(
        'business.subcategory = :subcategory',
        { subcategory },
      );
    }

    // Geographic filtering with PostGIS
    if (latitude && longitude && radius) {
      queryBuilder = queryBuilder.andWhere(
        `ST_DWithin(
          business.location::geography,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
          :radiusMeters
        )`,
        {
          latitude,
          longitude,
          radiusMeters: radius * 1000, // Convert km to meters
        },
      );

      // Add distance calculation for sorting
      queryBuilder = queryBuilder.addSelect(
        `ST_Distance(
          business.location::geography,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
        ) / 1000`,
        'distance',
      );
    }

    // State and city filtering
    if (state) {
      queryBuilder = queryBuilder.andWhere('business.state = :state', {
        state,
      });
    }

    if (city) {
      queryBuilder = queryBuilder.andWhere('business.city = :city', { city });
    }

    // Minimum rating filter
    if (minRating) {
      queryBuilder = queryBuilder.andWhere('business.rating >= :minRating', {
        minRating,
      });
    }

    // Verified only filter
    if (verifiedOnly) {
      queryBuilder = queryBuilder.andWhere('business.isVerified = :verified', {
        verified: true,
      });
    }

    // Payment methods filter
    if (paymentMethods && paymentMethods.length > 0) {
      queryBuilder = queryBuilder.andWhere(
        'business.paymentMethods ?| array[:...methods]',
        { methods: paymentMethods },
      );
    }

    // Sorting
    if (sortBy === SortBy.DISTANCE && latitude && longitude) {
      queryBuilder = queryBuilder.orderBy('distance', sortOrder);
    } else {
      queryBuilder = queryBuilder.orderBy(
        `business.${sortBy}`,
        sortOrder,
      );
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder = queryBuilder.skip(skip).take(limit);

    // Execute query
    const [businesses, total] = await queryBuilder.getManyAndCount();

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data: businesses,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  async searchByServiceArea(
    latitude: number,
    longitude: number,
    category?: string,
  ) {
    const serviceAreas = [
      { name: 'neighborhood', radius: 1 },
      { name: '2km', radius: 2 },
      { name: '5km', radius: 5 },
      { name: '10km', radius: 10 },
      { name: 'city-wide', radius: 50 },
      { name: 'state-wide', radius: 200 },
    ];

    const results = {};

    for (const area of serviceAreas) {
      const searchDto: SearchBusinessDto = {
        latitude,
        longitude,
        radius: area.radius,
        category,
        sortBy: SortBy.DISTANCE,
        page: 1,
        limit: 10,
      };

      const areaResults = await this.search(searchDto);
      results[area.name] = areaResults.data;
    }

    // Add nationwide businesses
    const nationwideQuery = this.businessRepo
      .createQueryBuilder('business')
      .where('business.serviceArea = :serviceArea', {
        serviceArea: 'nationwide',
      })
      .andWhere('business.isActive = :isActive', { isActive: true });

    if (category) {
      nationwideQuery.andWhere('business.category = :category', { category });
    }

    results['nationwide'] = await nationwideQuery.take(10).getMany();

    return results;
  }

  async getFeaturedBusinesses(limit: number = 10): Promise<BusinessProfile[]> {
    return await this.businessRepo.find({
      where: {
        isActive: true,
        isVerified: true,
      },
      order: {
        rating: 'DESC',
        reviewCount: 'DESC',
      },
      take: limit,
      relations: ['user'],
    });
  }

  async getTrendingBusinesses(limit: number = 10): Promise<BusinessProfile[]> {
    // Businesses with recent activity and high engagement
    return await this.businessRepo
      .createQueryBuilder('business')
      .where('business.isActive = :isActive', { isActive: true })
      .andWhere('business.updatedAt >= NOW() - INTERVAL \'30 days\'')
      .orderBy('business.reviewCount', 'DESC')
      .addOrderBy('business.completedJobs', 'DESC')
      .take(limit)
      .leftJoinAndSelect('business.user', 'user')
      .getMany();
  }
}
```

### Step 5.5: Create Business Search Controller

**Location:** `backend/apps/business-service/src/business-search/business-search.controller.ts`

```typescript
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BusinessSearchService } from './business-search.service';
import { SearchBusinessDto } from '@app/validation/dtos/business/search-business.dto';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';

@ApiTags('Business Search')
@Controller('business/search')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BusinessSearchController {
  constructor(private readonly searchService: BusinessSearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search businesses with filters' })
  @ApiResponse({ status: 200, description: 'Search results retrieved' })
  async search(@Query() searchDto: SearchBusinessDto) {
    const results = await this.searchService.search(searchDto);
    return {
      success: true,
      ...results,
    };
  }

  @Get('by-service-area')
  @ApiOperation({
    summary: 'Get businesses grouped by service area from user location',
  })
  @ApiResponse({ status: 200, description: 'Businesses grouped by service area' })
  async searchByServiceArea(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('category') category?: string,
  ) {
    const results = await this.searchService.searchByServiceArea(
      latitude,
      longitude,
      category,
    );
    return {
      success: true,
      data: results,
    };
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured businesses' })
  @ApiResponse({ status: 200, description: 'Featured businesses retrieved' })
  async getFeatured(@Query('limit') limit: number = 10) {
    const businesses = await this.searchService.getFeaturedBusinesses(limit);
    return {
      success: true,
      data: businesses,
    };
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending businesses' })
  @ApiResponse({ status: 200, description: 'Trending businesses retrieved' })
  async getTrending(@Query('limit') limit: number = 10) {
    const businesses = await this.searchService.getTrendingBusinesses(limit);
    return {
      success: true,
      data: businesses,
    };
  }
}
```

### Step 5.6: Update Business Service Module

**Location:** `backend/apps/business-service/src/business-service.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
import {
  BusinessProfile,
  BusinessCategory,
  BusinessLicense,
  BusinessService,
  BusinessReview,
  BusinessInquiry,
  BusinessActivityLog,
} from '@app/database/entities';
import { BusinessProfileController } from './business-profile/business-profile.controller';
import { BusinessProfileService } from './business-profile/business-profile.service';
import { BusinessCategoryService } from './business-category/business-category.service';
import { BusinessSearchController } from './business-search/business-search.controller';
import { BusinessSearchService } from './business-search/business-search.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    DatabaseModule,
    TypeOrmModule.forFeature([
      BusinessProfile,
      BusinessCategory,
      BusinessLicense,
      BusinessService,
      BusinessReview,
      BusinessInquiry,
      BusinessActivityLog,
    ]),
  ],
  controllers: [BusinessProfileController, BusinessSearchController],
  providers: [
    BusinessProfileService,
    BusinessCategoryService,
    BusinessSearchService,
  ],
})
export class BusinessServiceModule {}
```

---

## Phase 6: Reviews & Ratings System

### Objective
Implement comprehensive review and rating system with business owner responses, rating aggregation, and moderation capabilities.

### Step 6.1: Create Review DTOs

**Location:** `backend/libs/validation/src/dtos/business/create-review.dto.ts`

```typescript
import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBusinessReviewDto {
  @ApiProperty({ example: 5, description: 'Overall rating (1-5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({
    example: 'Excellent service! Very professional and timely.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  reviewText?: string;

  @ApiPropertyOptional({ example: 5, description: 'Service quality rating (1-5)' })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(5)
  serviceQuality?: number;

  @ApiPropertyOptional({ example: 5, description: 'Professionalism rating (1-5)' })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(5)
  professionalism?: number;

  @ApiPropertyOptional({ example: 4, description: 'Value for money rating (1-5)' })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(5)
  valueForMoney?: number;
}

export class RespondToReviewDto {
  @ApiProperty({ example: 'Thank you for your feedback!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  response: string;
}

export class ReviewQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 5, description: 'Filter by rating' })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(5)
  rating?: number;
}
```

### Step 6.2: Create Business Review Service

**Location:** `backend/apps/business-service/src/business-review/business-review.service.ts`

```typescript
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
import {
  CreateBusinessReviewDto,
  RespondToReviewDto,
  ReviewQueryDto,
} from '@app/validation/dtos/business/create-review.dto';

@Injectable()
export class BusinessReviewService {
  constructor(
    @InjectRepository(BusinessReview)
    private reviewRepo: Repository<BusinessReview>,
    @InjectRepository(BusinessProfile)
    private businessRepo: Repository<BusinessProfile>,
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

    // Create review
    const review = this.reviewRepo.create({
      businessId,
      userId,
      ...createDto,
    });

    const savedReview = await this.reviewRepo.save(review);

    // Update business rating and review count
    await this.updateBusinessRating(businessId);

    return savedReview;
  }

  async findByBusiness(
    businessId: string,
    queryDto: ReviewQueryDto,
  ): Promise<{ data: BusinessReview[]; meta: any }> {
    const { page, limit, rating } = queryDto;
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

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
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
```

### Step 6.3: Create Business Review Controller

**Location:** `backend/apps/business-service/src/business-review/business-review.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BusinessReviewService } from './business-review.service';
import {
  CreateBusinessReviewDto,
  RespondToReviewDto,
  ReviewQueryDto,
} from '@app/validation/dtos/business/create-review.dto';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';

@ApiTags('Business Reviews')
@Controller('business/:businessId/reviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BusinessReviewController {
  constructor(private readonly reviewService: BusinessReviewService) {}

  @Post()
  @ApiOperation({ summary: 'Create a review for a business' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({ status: 400, description: 'Already reviewed or bad request' })
  async create(
    @Param('businessId') businessId: string,
    @Request() req,
    @Body() createDto: CreateBusinessReviewDto,
  ) {
    const review = await this.reviewService.create(
      businessId,
      req.user.userId,
      createDto,
    );
    return {
      success: true,
      message: 'Review created successfully',
      data: review,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all reviews for a business' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved' })
  async findAll(
    @Param('businessId') businessId: string,
    @Query() queryDto: ReviewQueryDto,
  ) {
    const result = await this.reviewService.findByBusiness(
      businessId,
      queryDto,
    );
    return {
      success: true,
      ...result,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get review statistics for a business' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getStats(@Param('businessId') businessId: string) {
    const stats = await this.reviewService.getReviewStats(businessId);
    return {
      success: true,
      data: stats,
    };
  }

  @Put(':reviewId')
  @ApiOperation({ summary: 'Update your review' })
  @ApiResponse({ status: 200, description: 'Review updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @Param('reviewId') reviewId: string,
    @Request() req,
    @Body() updateDto: CreateBusinessReviewDto,
  ) {
    const review = await this.reviewService.update(
      reviewId,
      req.user.userId,
      updateDto,
    );
    return {
      success: true,
      message: 'Review updated successfully',
      data: review,
    };
  }

  @Post(':reviewId/respond')
  @ApiOperation({ summary: 'Business owner responds to a review' })
  @ApiResponse({ status: 200, description: 'Response added successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async respond(
    @Param('reviewId') reviewId: string,
    @Request() req,
    @Body() respondDto: RespondToReviewDto,
  ) {
    const review = await this.reviewService.respondToReview(
      reviewId,
      req.user.userId,
      respondDto,
    );
    return {
      success: true,
      message: 'Response added successfully',
      data: review,
    };
  }

  @Delete(':reviewId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete your review' })
  @ApiResponse({ status: 204, description: 'Review deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async delete(@Param('reviewId') reviewId: string, @Request() req) {
    await this.reviewService.delete(reviewId, req.user.userId);
  }
}
```

---

## Phase 7: Business Verification

### Objective
Implement multi-level business verification with license uploads, document verification, and badge system.

### Step 7.1: Create License DTOs

**Location:** `backend/libs/validation/src/dtos/business/license.dto.ts`

```typescript
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum LicenseType {
  CAC = 'CAC',
  TIN = 'TIN',
  NAFDAC = 'NAFDAC',
  SON = 'SON',
  SCUML = 'SCUML',
  NBA = 'NBA',
  NMA = 'NMA',
  ICAN = 'ICAN',
  NSE = 'NSE',
  APCON = 'APCON',
  BUSINESS_PREMISES = 'BUSINESS_PREMISES',
  HEALTH_CERT = 'HEALTH_CERT',
  FIRE_CERT = 'FIRE_CERT',
  SIGNAGE = 'SIGNAGE',
  OTHER = 'OTHER',
}

export class CreateBusinessLicenseDto {
  @ApiProperty({ enum: LicenseType, example: LicenseType.CAC })
  @IsEnum(LicenseType)
  licenseType: LicenseType;

  @ApiProperty({ example: 'RC1234567' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  licenseNumber: string;

  @ApiProperty({ example: 'Corporate Affairs Commission' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  issuingAuthority: string;

  @ApiPropertyOptional({ example: '2023-01-15' })
  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @ApiPropertyOptional({ example: '2028-01-15' })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional({ example: 'https://storage.mecabal.com/licenses/document.pdf' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  documentUrl?: string;
}

export class UpdateBusinessLicenseDto {
  @ApiPropertyOptional({ enum: LicenseType })
  @IsEnum(LicenseType)
  @IsOptional()
  licenseType?: LicenseType;

  @ApiPropertyOptional({ example: 'RC1234567' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  licenseNumber?: string;

  @ApiPropertyOptional({ example: 'Corporate Affairs Commission' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  issuingAuthority?: string;

  @ApiPropertyOptional({ example: '2023-01-15' })
  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @ApiPropertyOptional({ example: '2028-01-15' })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional({ example: 'https://storage.mecabal.com/licenses/document.pdf' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  documentUrl?: string;
}

export class VerifyLicenseDto {
  @ApiProperty({ example: true })
  @IsNotEmpty()
  isVerified: boolean;
}
```

### Step 7.2: Create Business License Service

**Location:** `backend/apps/business-service/src/business-license/business-license.service.ts`

```typescript
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessLicense } from '@app/database/entities/business-license.entity';
import { BusinessProfile } from '@app/database/entities/business-profile.entity';
import {
  CreateBusinessLicenseDto,
  UpdateBusinessLicenseDto,
  VerifyLicenseDto,
} from '@app/validation/dtos/business/license.dto';

@Injectable()
export class BusinessLicenseService {
  constructor(
    @InjectRepository(BusinessLicense)
    private licenseRepo: Repository<BusinessLicense>,
    @InjectRepository(BusinessProfile)
    private businessRepo: Repository<BusinessProfile>,
  ) {}

  async create(
    businessId: string,
    userId: string,
    createDto: CreateBusinessLicenseDto,
  ): Promise<BusinessLicense> {
    // Verify business exists and user owns it
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (business.userId !== userId) {
      throw new ForbiddenException('You do not own this business');
    }

    const license = this.licenseRepo.create({
      businessId,
      ...createDto,
    });

    const savedLicense = await this.licenseRepo.save(license);

    // Update verification level based on licenses
    await this.updateVerificationLevel(businessId);

    return savedLicense;
  }

  async findByBusiness(businessId: string): Promise<BusinessLicense[]> {
    return await this.licenseRepo.find({
      where: { businessId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<BusinessLicense> {
    const license = await this.licenseRepo.findOne({
      where: { id },
      relations: ['business'],
    });

    if (!license) {
      throw new NotFoundException('License not found');
    }

    return license;
  }

  async update(
    id: string,
    userId: string,
    updateDto: UpdateBusinessLicenseDto,
  ): Promise<BusinessLicense> {
    const license = await this.findById(id);

    if (license.business.userId !== userId) {
      throw new ForbiddenException('You do not own this business');
    }

    Object.assign(license, updateDto);
    return await this.licenseRepo.save(license);
  }

  async delete(id: string, userId: string): Promise<void> {
    const license = await this.findById(id);

    if (license.business.userId !== userId) {
      throw new ForbiddenException('You do not own this business');
    }

    const businessId = license.businessId;
    await this.licenseRepo.remove(license);

    // Update verification level after removing license
    await this.updateVerificationLevel(businessId);
  }

  async verifyLicense(
    id: string,
    verifyDto: VerifyLicenseDto,
  ): Promise<BusinessLicense> {
    // This endpoint should be protected and only accessible by admins
    const license = await this.findById(id);

    license.isVerified = verifyDto.isVerified;
    const updatedLicense = await this.licenseRepo.save(license);

    // Update business verification level
    await this.updateVerificationLevel(license.businessId);

    return updatedLicense;
  }

  private async updateVerificationLevel(businessId: string): Promise<void> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
      relations: ['licenses'],
    });

    if (!business) return;

    const verifiedLicenses = business.licenses.filter((l) => l.isVerified);
    const licenseCount = verifiedLicenses.length;

    let verificationLevel = 'basic';
    let isVerified = false;

    if (licenseCount === 0) {
      verificationLevel = 'basic';
      isVerified = false;
    } else if (licenseCount >= 1 && licenseCount < 3) {
      verificationLevel = 'enhanced';
      isVerified = true;
    } else if (licenseCount >= 3) {
      verificationLevel = 'premium';
      isVerified = true;
    }

    await this.businessRepo.update(businessId, {
      verificationLevel,
      isVerified,
    });
  }
}
```

### Step 7.3: Create Business License Controller

**Location:** `backend/apps/business-service/src/business-license/business-license.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BusinessLicenseService } from './business-license.service';
import {
  CreateBusinessLicenseDto,
  UpdateBusinessLicenseDto,
  VerifyLicenseDto,
} from '@app/validation/dtos/business/license.dto';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@app/auth/guards/roles.guard';
import { Roles } from '@app/auth/decorators/roles.decorator';

@ApiTags('Business Licenses')
@Controller('business/:businessId/licenses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BusinessLicenseController {
  constructor(private readonly licenseService: BusinessLicenseService) {}

  @Post()
  @ApiOperation({ summary: 'Add a license to business profile' })
  @ApiResponse({ status: 201, description: 'License added successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @Param('businessId') businessId: string,
    @Request() req,
    @Body() createDto: CreateBusinessLicenseDto,
  ) {
    const license = await this.licenseService.create(
      businessId,
      req.user.userId,
      createDto,
    );
    return {
      success: true,
      message: 'License added successfully',
      data: license,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all licenses for a business' })
  @ApiResponse({ status: 200, description: 'Licenses retrieved' })
  async findAll(@Param('businessId') businessId: string) {
    const licenses = await this.licenseService.findByBusiness(businessId);
    return {
      success: true,
      data: licenses,
    };
  }

  @Put(':licenseId')
  @ApiOperation({ summary: 'Update a license' })
  @ApiResponse({ status: 200, description: 'License updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @Param('licenseId') licenseId: string,
    @Request() req,
    @Body() updateDto: UpdateBusinessLicenseDto,
  ) {
    const license = await this.licenseService.update(
      licenseId,
      req.user.userId,
      updateDto,
    );
    return {
      success: true,
      message: 'License updated successfully',
      data: license,
    };
  }

  @Delete(':licenseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a license' })
  @ApiResponse({ status: 204, description: 'License deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async delete(@Param('licenseId') licenseId: string, @Request() req) {
    await this.licenseService.delete(licenseId, req.user.userId);
  }

  @Post(':licenseId/verify')
  @UseGuards(RolesGuard)
  @Roles('admin', 'moderator')
  @ApiOperation({ summary: 'Verify a license (Admin only)' })
  @ApiResponse({ status: 200, description: 'License verification status updated' })
  async verify(
    @Param('licenseId') licenseId: string,
    @Body() verifyDto: VerifyLicenseDto,
  ) {
    const license = await this.licenseService.verifyLicense(
      licenseId,
      verifyDto,
    );
    return {
      success: true,
      message: `License ${verifyDto.isVerified ? 'verified' : 'unverified'} successfully`,
      data: license,
    };
  }
}
```

---

## Phase 8: Business Analytics & Activity

### Objective
Implement activity logging and analytics dashboard for business owners to track performance metrics.

### Step 8.1: Create Activity Service

**Location:** `backend/apps/business-service/src/business-activity/business-activity.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { BusinessActivityLog } from '@app/database/entities/business-activity-log.entity';
import { BusinessProfile } from '@app/database/entities/business-profile.entity';

export enum ActivityType {
  JOB_COMPLETED = 'job_completed',
  REVIEW_RECEIVED = 'review_received',
  INQUIRY_RECEIVED = 'inquiry_received',
  PROFILE_UPDATED = 'profile_updated',
  PROFILE_VIEWED = 'profile_viewed',
  CONTACT_CLICKED = 'contact_clicked',
}

@Injectable()
export class BusinessActivityService {
  constructor(
    @InjectRepository(BusinessActivityLog)
    private activityRepo: Repository<BusinessActivityLog>,
    @InjectRepository(BusinessProfile)
    private businessRepo: Repository<BusinessProfile>,
  ) {}

  async logActivity(
    businessId: string,
    activityType: ActivityType,
    metadata?: Record<string, any>,
  ): Promise<BusinessActivityLog> {
    const activity = this.activityRepo.create({
      businessId,
      activityType,
      metadata,
    });

    return await this.activityRepo.save(activity);
  }

  async getRecentActivity(
    businessId: string,
    limit: number = 50,
  ): Promise<BusinessActivityLog[]> {
    return await this.activityRepo.find({
      where: { businessId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getAnalytics(businessId: string, period: '7d' | '30d' | '90d' | 'all') {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    let startDate: Date;
    const endDate = new Date();

    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        startDate = business.createdAt;
        break;
    }

    const activities = await this.activityRepo.find({
      where: {
        businessId,
        createdAt: Between(startDate, endDate),
      },
    });

    // Calculate metrics
    const profileViews = activities.filter(
      (a) => a.activityType === ActivityType.PROFILE_VIEWED,
    ).length;

    const inquiriesReceived = activities.filter(
      (a) => a.activityType === ActivityType.INQUIRY_RECEIVED,
    ).length;

    const reviewsReceived = activities.filter(
      (a) => a.activityType === ActivityType.REVIEW_RECEIVED,
    ).length;

    const jobsCompleted = activities.filter(
      (a) => a.activityType === ActivityType.JOB_COMPLETED,
    ).length;

    const contactClicks = activities.filter(
      (a) => a.activityType === ActivityType.CONTACT_CLICKED,
    ).length;

    // Calculate conversion rate (inquiries to jobs)
    const conversionRate =
      inquiriesReceived > 0
        ? Number(((jobsCompleted / inquiriesReceived) * 100).toFixed(2))
        : 0;

    // Calculate engagement rate (contacts/views)
    const engagementRate =
      profileViews > 0
        ? Number(((contactClicks / profileViews) * 100).toFixed(2))
        : 0;

    return {
      period,
      startDate,
      endDate,
      metrics: {
        profileViews,
        inquiriesReceived,
        reviewsReceived,
        jobsCompleted,
        contactClicks,
        conversionRate,
        engagementRate,
      },
      business: {
        rating: business.rating,
        reviewCount: business.reviewCount,
        completedJobs: business.completedJobs,
        verificationLevel: business.verificationLevel,
        isVerified: business.isVerified,
      },
    };
  }

  async getDailyStats(businessId: string, days: number = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const activities = await this.activityRepo.find({
      where: {
        businessId,
        createdAt: Between(startDate, new Date()),
      },
      order: { createdAt: 'ASC' },
    });

    // Group by date
    const dailyStats = {};

    activities.forEach((activity) => {
      const date = activity.createdAt.toISOString().split('T')[0];

      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          views: 0,
          inquiries: 0,
          reviews: 0,
          jobs: 0,
          contacts: 0,
        };
      }

      switch (activity.activityType) {
        case ActivityType.PROFILE_VIEWED:
          dailyStats[date].views++;
          break;
        case ActivityType.INQUIRY_RECEIVED:
          dailyStats[date].inquiries++;
          break;
        case ActivityType.REVIEW_RECEIVED:
          dailyStats[date].reviews++;
          break;
        case ActivityType.JOB_COMPLETED:
          dailyStats[date].jobs++;
          break;
        case ActivityType.CONTACT_CLICKED:
          dailyStats[date].contacts++;
          break;
      }
    });

    return Object.values(dailyStats);
  }
}
```

### Step 8.2: Create Activity Controller

**Location:** `backend/apps/business-service/src/business-activity/business-activity.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BusinessActivityService, ActivityType } from './business-activity.service';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessProfile } from '@app/database/entities/business-profile.entity';

@ApiTags('Business Analytics')
@Controller('business/:businessId')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BusinessActivityController {
  constructor(
    private readonly activityService: BusinessActivityService,
    @InjectRepository(BusinessProfile)
    private businessRepo: Repository<BusinessProfile>,
  ) {}

  private async verifyBusinessOwnership(
    businessId: string,
    userId: string,
  ): Promise<void> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });

    if (!business || business.userId !== userId) {
      throw new ForbiddenException('You do not own this business');
    }
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get business analytics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved' })
  async getAnalytics(
    @Param('businessId') businessId: string,
    @Query('period') period: '7d' | '30d' | '90d' | 'all' = '30d',
    @Request() req,
  ) {
    await this.verifyBusinessOwnership(businessId, req.user.userId);

    const analytics = await this.activityService.getAnalytics(
      businessId,
      period,
    );
    return {
      success: true,
      data: analytics,
    };
  }

  @Get('analytics/daily')
  @ApiOperation({ summary: 'Get daily statistics' })
  @ApiResponse({ status: 200, description: 'Daily stats retrieved' })
  async getDailyStats(
    @Param('businessId') businessId: string,
    @Query('days') days: number = 30,
    @Request() req,
  ) {
    await this.verifyBusinessOwnership(businessId, req.user.userId);

    const stats = await this.activityService.getDailyStats(businessId, days);
    return {
      success: true,
      data: stats,
    };
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get recent activity log' })
  @ApiResponse({ status: 200, description: 'Activity log retrieved' })
  async getActivity(
    @Param('businessId') businessId: string,
    @Query('limit') limit: number = 50,
    @Request() req,
  ) {
    await this.verifyBusinessOwnership(businessId, req.user.userId);

    const activities = await this.activityService.getRecentActivity(
      businessId,
      limit,
    );
    return {
      success: true,
      data: activities,
    };
  }

  @Post('activity/view')
  @ApiOperation({ summary: 'Log a profile view (public endpoint)' })
  @ApiResponse({ status: 201, description: 'View logged' })
  async logView(@Param('businessId') businessId: string) {
    await this.activityService.logActivity(
      businessId,
      ActivityType.PROFILE_VIEWED,
    );
    return {
      success: true,
      message: 'View logged',
    };
  }

  @Post('activity/contact-click')
  @ApiOperation({ summary: 'Log a contact button click' })
  @ApiResponse({ status: 201, description: 'Contact click logged' })
  async logContactClick(@Param('businessId') businessId: string) {
    await this.activityService.logActivity(
      businessId,
      ActivityType.CONTACT_CLICKED,
    );
    return {
      success: true,
      message: 'Contact click logged',
    };
  }
}
```

---

## Phase 9: Business Inquiry System

### Objective
Implement customer inquiry and booking system for businesses.

### Step 9.1: Create Inquiry DTOs

**Location:** `backend/libs/validation/src/dtos/business/inquiry.dto.ts`

```typescript
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum InquiryType {
  BOOKING = 'booking',
  QUESTION = 'question',
  QUOTE = 'quote',
}

export enum InquiryStatus {
  PENDING = 'pending',
  RESPONDED = 'responded',
  CLOSED = 'closed',
}

export enum PreferredContact {
  PHONE = 'phone',
  WHATSAPP = 'whatsapp',
  IN_APP = 'in-app',
}

export class CreateBusinessInquiryDto {
  @ApiProperty({ enum: InquiryType, example: InquiryType.BOOKING })
  @IsEnum(InquiryType)
  inquiryType: InquiryType;

  @ApiProperty({
    example: 'I need plumbing services for a burst pipe. Available tomorrow?',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({ enum: PreferredContact, example: PreferredContact.WHATSAPP })
  @IsEnum(PreferredContact)
  @IsOptional()
  preferredContact?: PreferredContact;

  @ApiPropertyOptional({ example: '2025-10-15T09:00:00Z' })
  @IsDateString()
  @IsOptional()
  preferredDate?: string;
}

export class RespondToInquiryDto {
  @ApiProperty({ example: 'Yes, I can help you tomorrow at 10am.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  response: string;
}

export class UpdateInquiryStatusDto {
  @ApiProperty({ enum: InquiryStatus, example: InquiryStatus.CLOSED })
  @IsEnum(InquiryStatus)
  status: InquiryStatus;
}
```

### Step 9.2: Create Inquiry Service

**Location:** `backend/apps/business-service/src/business-inquiry/business-inquiry.service.ts`

```typescript
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessInquiry } from '@app/database/entities/business-inquiry.entity';
import { BusinessProfile } from '@app/database/entities/business-profile.entity';
import {
  CreateBusinessInquiryDto,
  RespondToInquiryDto,
  UpdateInquiryStatusDto,
  InquiryStatus,
} from '@app/validation/dtos/business/inquiry.dto';
import { BusinessActivityService, ActivityType } from '../business-activity/business-activity.service';

@Injectable()
export class BusinessInquiryService {
  constructor(
    @InjectRepository(BusinessInquiry)
    private inquiryRepo: Repository<BusinessInquiry>,
    @InjectRepository(BusinessProfile)
    private businessRepo: Repository<BusinessProfile>,
    private activityService: BusinessActivityService,
  ) {}

  async create(
    businessId: string,
    userId: string,
    createDto: CreateBusinessInquiryDto,
  ): Promise<BusinessInquiry> {
    // Verify business exists
    const business = await this.businessRepo.findOne({
      where: { id: businessId, isActive: true },
    });

    if (!business) {
      throw new NotFoundException('Business not found or inactive');
    }

    const inquiry = this.inquiryRepo.create({
      businessId,
      userId,
      ...createDto,
      status: InquiryStatus.PENDING,
    });

    const savedInquiry = await this.inquiryRepo.save(inquiry);

    // Log activity
    await this.activityService.logActivity(
      businessId,
      ActivityType.INQUIRY_RECEIVED,
      {
        inquiryId: savedInquiry.id,
        inquiryType: createDto.inquiryType,
      },
    );

    return savedInquiry;
  }

  async findByBusiness(
    businessId: string,
    status?: InquiryStatus,
  ): Promise<BusinessInquiry[]> {
    const query: any = { businessId };
    if (status) {
      query.status = status;
    }

    return await this.inquiryRepo.find({
      where: query,
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }

  async findByUser(userId: string): Promise<BusinessInquiry[]> {
    return await this.inquiryRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['business'],
    });
  }

  async findById(id: string): Promise<BusinessInquiry> {
    const inquiry = await this.inquiryRepo.findOne({
      where: { id },
      relations: ['business', 'user'],
    });

    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    return inquiry;
  }

  async respond(
    id: string,
    businessOwnerId: string,
    respondDto: RespondToInquiryDto,
  ): Promise<BusinessInquiry> {
    const inquiry = await this.findById(id);

    // Verify business ownership
    if (inquiry.business.userId !== businessOwnerId) {
      throw new ForbiddenException('You do not own this business');
    }

    inquiry.response = respondDto.response;
    inquiry.respondedAt = new Date();
    inquiry.status = InquiryStatus.RESPONDED;

    return await this.inquiryRepo.save(inquiry);
  }

  async updateStatus(
    id: string,
    businessOwnerId: string,
    updateDto: UpdateInquiryStatusDto,
  ): Promise<BusinessInquiry> {
    const inquiry = await this.findById(id);

    if (inquiry.business.userId !== businessOwnerId) {
      throw new ForbiddenException('You do not own this business');
    }

    inquiry.status = updateDto.status;
    return await this.inquiryRepo.save(inquiry);
  }

  async getInquiryStats(businessId: string) {
    const inquiries = await this.inquiryRepo.find({
      where: { businessId },
    });

    const total = inquiries.length;
    const pending = inquiries.filter(
      (i) => i.status === InquiryStatus.PENDING,
    ).length;
    const responded = inquiries.filter(
      (i) => i.status === InquiryStatus.RESPONDED,
    ).length;
    const closed = inquiries.filter(
      (i) => i.status === InquiryStatus.CLOSED,
    ).length;

    const responseRate =
      total > 0 ? Number((((responded + closed) / total) * 100).toFixed(2)) : 0;

    return {
      total,
      pending,
      responded,
      closed,
      responseRate,
    };
  }
}
```

### Step 9.3: Create Inquiry Controller

**Location:** `backend/apps/business-service/src/business-inquiry/business-inquiry.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BusinessInquiryService } from './business-inquiry.service';
import {
  CreateBusinessInquiryDto,
  RespondToInquiryDto,
  UpdateInquiryStatusDto,
  InquiryStatus,
} from '@app/validation/dtos/business/inquiry.dto';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';

@ApiTags('Business Inquiries')
@Controller('business/:businessId/inquiries')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BusinessInquiryController {
  constructor(private readonly inquiryService: BusinessInquiryService) {}

  @Post()
  @ApiOperation({ summary: 'Send an inquiry to a business' })
  @ApiResponse({ status: 201, description: 'Inquiry sent successfully' })
  async create(
    @Param('businessId') businessId: string,
    @Request() req,
    @Body() createDto: CreateBusinessInquiryDto,
  ) {
    const inquiry = await this.inquiryService.create(
      businessId,
      req.user.userId,
      createDto,
    );
    return {
      success: true,
      message: 'Inquiry sent successfully',
      data: inquiry,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all inquiries for a business (business owner)' })
  @ApiResponse({ status: 200, description: 'Inquiries retrieved' })
  async findAll(
    @Param('businessId') businessId: string,
    @Query('status') status?: InquiryStatus,
  ) {
    const inquiries = await this.inquiryService.findByBusiness(
      businessId,
      status,
    );
    return {
      success: true,
      data: inquiries,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get inquiry statistics for a business' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getStats(@Param('businessId') businessId: string) {
    const stats = await this.inquiryService.getInquiryStats(businessId);
    return {
      success: true,
      data: stats,
    };
  }

  @Post(':inquiryId/respond')
  @ApiOperation({ summary: 'Business owner responds to inquiry' })
  @ApiResponse({ status: 200, description: 'Response sent successfully' })
  async respond(
    @Param('inquiryId') inquiryId: string,
    @Request() req,
    @Body() respondDto: RespondToInquiryDto,
  ) {
    const inquiry = await this.inquiryService.respond(
      inquiryId,
      req.user.userId,
      respondDto,
    );
    return {
      success: true,
      message: 'Response sent successfully',
      data: inquiry,
    };
  }

  @Put(':inquiryId/status')
  @ApiOperation({ summary: 'Update inquiry status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  async updateStatus(
    @Param('inquiryId') inquiryId: string,
    @Request() req,
    @Body() updateDto: UpdateInquiryStatusDto,
  ) {
    const inquiry = await this.inquiryService.updateStatus(
      inquiryId,
      req.user.userId,
      updateDto,
    );
    return {
      success: true,
      message: 'Status updated successfully',
      data: inquiry,
    };
  }
}

@Controller('user/inquiries')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('User Inquiries')
export class UserInquiryController {
  constructor(private readonly inquiryService: BusinessInquiryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all inquiries sent by current user' })
  @ApiResponse({ status: 200, description: 'User inquiries retrieved' })
  async getMyInquiries(@Request() req) {
    const inquiries = await this.inquiryService.findByUser(req.user.userId);
    return {
      success: true,
      data: inquiries,
    };
  }
}
```

---

## Phase 10: API Gateway Integration

### Objective
Register the business service with the API Gateway and configure routing.

### Step 10.1: Update API Gateway Configuration

**Location:** `backend/apps/api-gateway/src/api-gateway.module.ts`

```typescript
// Add BusinessService proxy configuration
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    ConfigModule.forRoot(),
    HttpModule,
    // ... other imports
  ],
  controllers: [
    // ... existing controllers
  ],
  providers: [
    {
      provide: 'BUSINESS_SERVICE_URL',
      useValue: process.env.BUSINESS_SERVICE_URL || 'http://localhost:3008',
    },
    // ... other providers
  ],
})
export class ApiGatewayModule {}
```

### Step 10.2: Create Business Gateway Controller

**Location:** `backend/apps/api-gateway/src/controllers/business-gateway.controller.ts`

```typescript
import {
  Controller,
  All,
  Req,
  Res,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { HttpService } from '@nestjs/axios';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';
import { firstValueFrom } from 'rxjs';

@Controller('business')
@UseGuards(JwtAuthGuard)
export class BusinessGatewayController {
  constructor(
    private readonly httpService: HttpService,
    @Inject('BUSINESS_SERVICE_URL')
    private readonly businessServiceUrl: string,
  ) {}

  @All('*')
  async proxyRequest(@Req() req: Request, @Res() res: Response) {
    const path = req.url;
    const method = req.method;
    const headers = {
      ...req.headers,
      'x-user-id': req['user']?.userId,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url: `${this.businessServiceUrl}${path}`,
          data: req.body,
          headers,
          params: req.query,
        }),
      );

      res.status(response.status).json(response.data);
    } catch (error) {
      const status = error.response?.status || 500;
      const message = error.response?.data || 'Internal server error';
      res.status(status).json(message);
    }
  }
}
```

### Step 10.3: Update Gateway Environment Variables

**Location:** `backend/.env`

Add:
```
BUSINESS_SERVICE_URL=http://localhost:3008
```

### Step 10.4: Update docker-compose for Production

**Location:** `backend/docker-compose.yml`

```yaml
services:
  # ... existing services

  business-service:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        APP_NAME: business-service
    ports:
      - "3008:3008"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USERNAME=${DB_USERNAME}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=${DB_NAME}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - postgres
      - redis
    networks:
      - mecabal-network
```

---

## Phase 11: Testing & Quality Assurance

### Step 11.1: Create Unit Tests

**Location:** `backend/apps/business-service/src/business-profile/business-profile.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BusinessProfileService } from './business-profile.service';
import { BusinessProfile } from '@app/database/entities/business-profile.entity';
import { Repository } from 'typeorm';

describe('BusinessProfileService', () => {
  let service: BusinessProfileService;
  let repository: Repository<BusinessProfile>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessProfileService,
        {
          provide: getRepositoryToken(BusinessProfile),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<BusinessProfileService>(BusinessProfileService);
    repository = module.get<Repository<BusinessProfile>>(
      getRepositoryToken(BusinessProfile),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new business profile', async () => {
      const userId = 'user-123';
      const createDto = {
        businessName: 'Test Business',
        category: 'household-services',
        serviceArea: 'neighborhood',
        pricingModel: 'hourly',
        availability: 'business-hours',
        yearsOfExperience: 5,
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({ ...createDto, userId });
      mockRepository.save.mockResolvedValue({
        id: 'business-123',
        ...createDto,
        userId,
      });

      const result = await service.create(userId, createDto as any);

      expect(result).toHaveProperty('id');
      expect(result.businessName).toBe(createDto.businessName);
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw error if user already has a business', async () => {
      const userId = 'user-123';
      const createDto = { businessName: 'Test' } as any;

      mockRepository.findOne.mockResolvedValue({ id: 'existing' });

      await expect(service.create(userId, createDto)).rejects.toThrow();
    });
  });
});
```

### Step 11.2: Create E2E Tests

**Location:** `backend/apps/business-service/test/business-profile.e2e-spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { BusinessServiceModule } from '../src/business-service.module';

describe('Business Profile (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let businessId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [BusinessServiceModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Get auth token (mock or actual)
    authToken = 'Bearer test-token';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/business/register (POST)', () => {
    it('should create a new business profile', () => {
      return request(app.getHttpServer())
        .post('/business/register')
        .set('Authorization', authToken)
        .send({
          businessName: 'E2E Test Business',
          category: 'household-services',
          subcategory: 'Plumbing',
          serviceArea: '5km',
          pricingModel: 'hourly',
          availability: 'business-hours',
          yearsOfExperience: 3,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('id');
          businessId = res.body.data.id;
        });
    });

    it('should fail with invalid data', () => {
      return request(app.getHttpServer())
        .post('/business/register')
        .set('Authorization', authToken)
        .send({
          businessName: '', // Invalid empty name
        })
        .expect(400);
    });
  });

  describe('/business/:id (GET)', () => {
    it('should retrieve business profile', () => {
      return request(app.getHttpServer())
        .get(`/business/${businessId}`)
        .set('Authorization', authToken)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.businessName).toBe('E2E Test Business');
        });
    });
  });
});
```

### Step 11.3: Run Tests

```bash
cd backend

# Run unit tests
npm run test

# Run tests with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e

# Run specific test file
npm run test -- business-profile.service.spec.ts
```

---

## Phase 12: Deployment & Monitoring

### Step 12.1: Build for Production

```bash
cd backend

# Build business service
npm run build:business

# Build all services
npm run build
```

### Step 12.2: Environment Configuration

Create production environment file:

**Location:** `backend/.env.production`

```bash
NODE_ENV=production

# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_USERNAME=mecabal_prod
DB_PASSWORD=strong-password
DB_NAME=mecabal_production

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379

# Business Service
BUSINESS_SERVICE_PORT=3008
BUSINESS_SERVICE_URL=https://api.mecabal.com/business

# File Storage (MinIO/S3)
STORAGE_ENDPOINT=your-storage-endpoint
STORAGE_ACCESS_KEY=your-access-key
STORAGE_SECRET_KEY=your-secret-key
STORAGE_BUCKET=mecabal-business-files

# JWT
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

### Step 12.3: Start Production Services

```bash
# Start business service in production
npm run start:prod business-service

# Or using PM2
pm2 start dist/apps/business-service/main.js --name business-service
```

### Step 12.4: Health Check Endpoint

**Location:** `backend/apps/business-service/src/health/health.controller.ts`

```typescript
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check endpoint' })
  check() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }
}
```

---

## Integration Checklist

### ✅ Backend Completion Checklist

**Database Layer:**
- [ ] All entities created and exported
- [ ] Migrations generated and run successfully
- [ ] Business categories seeded
- [ ] Indexes added for performance
- [ ] Geographic fields configured

**Business Service:**
- [ ] Microservice running on port 3008
- [ ] Swagger documentation accessible at `/api/docs`
- [ ] All CRUD endpoints functional
- [ ] Authentication guards in place
- [ ] Error handling implemented

**Search & Discovery:**
- [ ] Full-text search working
- [ ] Geographic filtering functional
- [ ] Category filtering working
- [ ] Pagination implemented
- [ ] Featured/trending endpoints working

**Reviews & Ratings:**
- [ ] Create review endpoint working
- [ ] Rating aggregation accurate
- [ ] Business owner responses functional
- [ ] Review stats calculation correct

**Verification:**
- [ ] License upload working
- [ ] Verification level calculation correct
- [ ] Admin verification endpoints secured
- [ ] Verification badges displayed

**Analytics:**
- [ ] Activity logging functional
- [ ] Analytics dashboard working
- [ ] Daily stats calculation accurate
- [ ] Conversion tracking implemented

**Inquiries:**
- [ ] Send inquiry working
- [ ] Business owner response functional
- [ ] Status updates working
- [ ] Inquiry stats accurate

**API Gateway:**
- [ ] Business routes registered
- [ ] Proxy requests working
- [ ] Authentication passing through
- [ ] Error handling functional

**Testing:**
- [ ] Unit tests passing (>80% coverage)
- [ ] E2E tests passing
- [ ] Integration tests complete
- [ ] Load testing complete

**Deployment:**
- [ ] Production build successful
- [ ] Environment variables configured
- [ ] Health checks functional
- [ ] Monitoring set up
- [ ] Logging configured

---

## Mobile App Integration

### API Endpoints to Integrate

**Business Registration:**
```typescript
POST /api/business/register
```

**Business Profile:**
```typescript
GET /api/business/my-business
GET /api/business/:id
PUT /api/business/:id
PUT /api/business/:id/status
```

**Search:**
```typescript
GET /api/business/search?query=plumber&latitude=6.5244&longitude=3.3792&radius=5
GET /api/business/search/by-service-area?latitude=6.5244&longitude=3.3792
GET /api/business/search/featured
GET /api/business/search/trending
```

**Reviews:**
```typescript
POST /api/business/:businessId/reviews
GET /api/business/:businessId/reviews
GET /api/business/:businessId/reviews/stats
PUT /api/business/:businessId/reviews/:reviewId
POST /api/business/:businessId/reviews/:reviewId/respond
```

**Licenses:**
```typescript
POST /api/business/:businessId/licenses
GET /api/business/:businessId/licenses
PUT /api/business/:businessId/licenses/:licenseId
```

**Analytics:**
```typescript
GET /api/business/:businessId/analytics?period=30d
GET /api/business/:businessId/analytics/daily?days=30
GET /api/business/:businessId/activity
```

**Inquiries:**
```typescript
POST /api/business/:businessId/inquiries
GET /api/business/:businessId/inquiries
GET /api/user/inquiries
POST /api/business/:businessId/inquiries/:inquiryId/respond
```

---

## Success Metrics

**Performance Targets:**
- API response time: <500ms (p95)
- Search query time: <1s
- Database query optimization with indexes
- Geographic queries: <2s
- Concurrent users: 1000+

**Quality Targets:**
- Test coverage: >80%
- Zero critical bugs
- API uptime: 99.9%
- Error rate: <0.1%

---

## Next Steps After Implementation

1. **Mobile Integration:** Update mobile app to consume real APIs
2. **File Upload:** Implement actual file upload for images/documents
3. **Notifications:** Add push notifications for inquiries/reviews
4. **Payment Integration:** Add payment processing for premium features
5. **Advanced Search:** Implement Elasticsearch for better search
6. **Recommendation Engine:** Build ML-based business recommendations
7. **Admin Dashboard:** Create admin panel for verification
8. **Analytics Dashboard:** Build visual analytics for business owners

---

**Document Version:** 2.0
**Last Updated:** 2025-10-09
**Status:** Ready for Implementation
**Estimated Completion Time:** 35 developer days
