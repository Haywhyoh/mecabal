# Business Account System - Implementation Guide
**MeCabal Backend Development**
*Date: 2025-10-09*
*Gap 5: Business Account System - Actionable Implementation Steps*

---

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Database Schema Setup](#phase-1-database-schema-setup)
4. [Phase 2: Create Business Service Microservice](#phase-2-create-business-service-microservice)
5. [Phase 3: Business Registration Flow](#phase-3-business-registration-flow)
6. [Phase 4: Business Profile Management](#phase-4-business-profile-management)
7. [Phase 5: Business Search & Discovery](#phase-5-business-search--discovery)
8. [Phase 6: Reviews & Ratings System](#phase-6-reviews--ratings-system)
9. [Phase 7: Business Verification](#phase-7-business-verification)
10. [Phase 8: Business Analytics & Activity](#phase-8-business-analytics--activity)
11. [Phase 9: API Gateway Integration](#phase-9-api-gateway-integration)
12. [Phase 10: Testing & Deployment](#phase-10-testing--deployment)
13. [Appendix](#appendix)

---

## Overview

### Current State
**Frontend:** Fully implemented business profile and registration screens with comprehensive features
**Backend:** ❌ Completely missing - no tables, entities, controllers, or services

### Goal
Build a complete business account system that enables:
- Business registration and profile management
- Service area-based discovery
- Reviews and ratings
- Business verification workflow
- Inquiry and booking system
- Business analytics

### Estimated Effort
**35 developer days** (7 weeks for 1 developer, 3.5 weeks for 2 developers)

---

## Prerequisites

### Required Knowledge
- NestJS framework and microservices architecture
- TypeORM entity relationships
- PostgreSQL with PostGIS extension
- RESTful API design
- File upload handling (MinIO/S3)
- JWT authentication

### Required Services Running
```bash
# Start development infrastructure
cd backend
docker-compose up -d

# Verify services are running:
# - PostgreSQL (port 5432)
# - Redis (port 6379)
# - MinIO (port 9000)
# - RabbitMQ (port 5672)
```

### Dependencies to Install
```bash
cd backend
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/passport passport passport-jwt
npm install class-validator class-transformer
npm install @nestjs/swagger swagger-ui-express
```

---

## Phase 1: Database Schema Setup

### Step 1.1: Create Database Entities

**Location:** `backend/libs/database/src/entities/`

#### Create `business-profile.entity.ts`
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { BusinessLicense } from './business-license.entity';
import { BusinessService } from './business-service.entity';
import { BusinessReview } from './business-review.entity';
import { BusinessInquiry } from './business-inquiry.entity';

@Entity('business_profiles')
@Index(['category', 'serviceArea', 'isActive'])
export class BusinessProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 255 })
  businessName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 100 })
  category: string;

  @Column({ length: 100, nullable: true })
  subcategory: string;

  @Column({ length: 50 })
  serviceArea: string; // 'neighborhood', '2km', '5km', '10km', 'city-wide', 'state-wide', 'nationwide'

  @Column({ length: 50 })
  pricingModel: string; // 'fixed-rate', 'hourly', 'per-item', 'project-based', 'custom-quote'

  @Column({ length: 50 })
  availability: string; // 'business-hours', 'weekdays', '24/7', 'weekends', 'custom'

  @Column({ length: 20, nullable: true })
  phoneNumber: string;

  @Column({ length: 20, nullable: true })
  whatsappNumber: string;

  @Column({ type: 'text', nullable: true })
  businessAddress: string;

  @Column({ type: 'int', default: 0 })
  yearsOfExperience: number;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ length: 20, default: 'basic' })
  verificationLevel: string; // 'basic', 'enhanced', 'premium'

  @Column({ length: 500, nullable: true })
  profileImageUrl: string;

  @Column({ length: 500, nullable: true })
  coverImageUrl: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @Column({ type: 'int', default: 0 })
  completedJobs: number;

  @Column({ length: 50, nullable: true })
  responseTime: string; // 'within-1-hour', 'within-24-hours', 'within-3-days'

  @Column({ type: 'boolean', default: false })
  hasInsurance: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  paymentMethods: string[]; // ['cash', 'bank-transfer', 'card', 'mobile-money', 'opay', 'crypto']

  @Column({ type: 'jsonb', nullable: true })
  businessHours: Record<string, { open: string; close: string }>;

  @CreateDateColumn()
  joinedDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => BusinessLicense, (license) => license.business)
  licenses: BusinessLicense[];

  @OneToMany(() => BusinessService, (service) => service.business)
  services: BusinessService[];

  @OneToMany(() => BusinessReview, (review) => review.business)
  reviews: BusinessReview[];

  @OneToMany(() => BusinessInquiry, (inquiry) => inquiry.business)
  inquiries: BusinessInquiry[];
}
```

#### Create `business-category.entity.ts`
```typescript
import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('business_categories')
export class BusinessCategory {
  @PrimaryColumn({ length: 100 })
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 100, nullable: true })
  icon: string;

  @Column({ length: 50, nullable: true })
  color: string;

  @Column({ type: 'jsonb' })
  subcategories: string[];

  @CreateDateColumn()
  createdAt: Date;
}
```

#### Create `business-license.entity.ts`
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { BusinessProfile } from './business-profile.entity';

@Entity('business_licenses')
export class BusinessLicense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  businessId: string;

  @ManyToOne(() => BusinessProfile, (business) => business.licenses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'businessId' })
  business: BusinessProfile;

  @Column({ length: 100 })
  licenseType: string; // 'CAC', 'TIN', 'NAFDAC', 'FIRS', 'SCUML', etc.

  @Column({ length: 100 })
  licenseNumber: string;

  @Column({ length: 255 })
  issuingAuthority: string;

  @Column({ type: 'date', nullable: true })
  issueDate: Date;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ length: 500, nullable: true })
  documentUrl: string;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
```

#### Create `business-service.entity.ts`
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { BusinessProfile } from './business-profile.entity';

@Entity('business_services')
export class BusinessService {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  businessId: string;

  @ManyToOne(() => BusinessProfile, (business) => business.services, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'businessId' })
  business: BusinessProfile;

  @Column({ length: 255 })
  serviceName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceMin: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceMax: number;

  @Column({ length: 50, nullable: true })
  duration: string; // '30-mins', '1-hour', '2-hours', 'half-day', 'full-day'

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
```

#### Create `business-review.entity.ts`
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { BusinessProfile } from './business-profile.entity';
import { User } from './user.entity';

@Entity('business_reviews')
@Index(['businessId', 'createdAt'])
export class BusinessReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  businessId: string;

  @ManyToOne(() => BusinessProfile, (business) => business.reviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'businessId' })
  business: BusinessProfile;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'int' })
  rating: number; // 1-5

  @Column({ type: 'text', nullable: true })
  reviewText: string;

  @Column({ type: 'int', nullable: true })
  serviceQuality: number; // 1-5

  @Column({ type: 'int', nullable: true })
  professionalism: number; // 1-5

  @Column({ type: 'int', nullable: true })
  valueForMoney: number; // 1-5

  @Column({ type: 'text', nullable: true })
  response: string;

  @Column({ type: 'timestamp', nullable: true })
  respondedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
```

#### Create `business-inquiry.entity.ts`
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { BusinessProfile } from './business-profile.entity';
import { User } from './user.entity';

@Entity('business_inquiries')
@Index(['businessId', 'status'])
export class BusinessInquiry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  businessId: string;

  @ManyToOne(() => BusinessProfile, (business) => business.inquiries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'businessId' })
  business: BusinessProfile;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 50 })
  inquiryType: string; // 'booking', 'question', 'quote'

  @Column({ type: 'text' })
  message: string;

  @Column({ length: 20, nullable: true })
  phoneNumber: string;

  @Column({ length: 20, nullable: true })
  preferredContact: string; // 'phone', 'whatsapp', 'in-app'

  @Column({ type: 'timestamp', nullable: true })
  preferredDate: Date;

  @Column({ length: 20, default: 'pending' })
  status: string; // 'pending', 'responded', 'closed'

  @Column({ type: 'text', nullable: true })
  response: string;

  @Column({ type: 'timestamp', nullable: true })
  respondedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
```

#### Create `business-activity-log.entity.ts`
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { BusinessProfile } from './business-profile.entity';

@Entity('business_activity_log')
@Index(['businessId', 'createdAt'])
export class BusinessActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  businessId: string;

  @ManyToOne(() => BusinessProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: BusinessProfile;

  @Column({ length: 50 })
  activityType: string; // 'job_completed', 'review_received', 'inquiry_received', 'profile_updated'

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
```

### Step 1.2: Export Entities

**Location:** `backend/libs/database/src/entities/index.ts`

```typescript
// Add these exports
export * from './business-profile.entity';
export * from './business-category.entity';
export * from './business-license.entity';
export * from './business-service.entity';
export * from './business-review.entity';
export * from './business-inquiry.entity';
export * from './business-activity-log.entity';
```

### Step 1.3: Generate and Run Migration

```bash
cd backend

# Generate migration based on new entities
npm run migration:generate -- -n CreateBusinessTables

# Review the generated migration file in:
# backend/libs/database/src/migrations/

# Run the migration
npm run migration:run
```

### Step 1.4: Seed Business Categories

Create a seeder for business categories:

**Location:** `backend/libs/database/src/seeds/business-categories.seed.ts`

```typescript
import { BusinessCategory } from '../entities/business-category.entity';

export const businessCategoriesData: Partial<BusinessCategory>[] = [
  {
    id: 'household-services',
    name: 'Household Services',
    description: 'Home maintenance and household help',
    icon: 'home-repair',
    color: '#4CAF50',
    subcategories: [
      'Cleaning',
      'Plumbing',
      'Electrical',
      'Carpentry',
      'Painting',
      'Gardening',
      'Pest Control',
      'Air Conditioning',
      'Generator Repair',
      'Security Installation',
      'Laundry Services',
      'Home Appliance Repair',
      'Roofing',
      'Tiling',
      'Fumigation',
    ],
  },
  {
    id: 'professional-services',
    name: 'Professional Services',
    description: 'Professional and business services',
    icon: 'briefcase',
    color: '#2196F3',
    subcategories: [
      'Legal Services',
      'Accounting',
      'Tax Consulting',
      'Real Estate',
      'Insurance',
      'Business Consulting',
      'IT Services',
      'Web Development',
      'Graphic Design',
      'Photography',
      'Videography',
      'Event Planning',
      'Marketing',
      'Translation',
      'Writing Services',
    ],
  },
  {
    id: 'health-wellness',
    name: 'Health & Wellness',
    description: 'Healthcare and wellness services',
    icon: 'medical-services',
    color: '#E91E63',
    subcategories: [
      'Home Nursing',
      'Physiotherapy',
      'Massage Therapy',
      'Personal Training',
      'Nutrition Consulting',
      'Mental Health',
      'Dental Services',
      'Optometry',
      'Pharmacy',
      'Medical Labs',
      'Fitness Training',
      'Yoga Instruction',
    ],
  },
  {
    id: 'education-tutoring',
    name: 'Education & Tutoring',
    description: 'Educational and training services',
    icon: 'school',
    color: '#FF9800',
    subcategories: [
      'Home Tutoring',
      'Language Classes',
      'Music Lessons',
      'Art Classes',
      'Coding Classes',
      'Exam Preparation',
      'Vocational Training',
      'Special Needs Education',
      'Early Childhood Education',
      'Adult Education',
    ],
  },
  {
    id: 'food-catering',
    name: 'Food & Catering',
    description: 'Food services and catering',
    icon: 'restaurant',
    color: '#F44336',
    subcategories: [
      'Home Catering',
      'Small Chops',
      'Baked Goods',
      'Meal Prep',
      'Food Delivery',
      'Event Catering',
      'Restaurant',
      'Food Truck',
    ],
  },
  {
    id: 'beauty-personal-care',
    name: 'Beauty & Personal Care',
    description: 'Beauty and grooming services',
    icon: 'face',
    color: '#9C27B0',
    subcategories: [
      'Hair Styling',
      'Barbing',
      'Makeup Artistry',
      'Nail Services',
      'Spa Services',
      'Beauty Therapy',
      'Skincare',
      'Lash Extensions',
    ],
  },
  {
    id: 'automotive',
    name: 'Automotive',
    description: 'Car services and repairs',
    icon: 'directions-car',
    color: '#607D8B',
    subcategories: [
      'Auto Mechanic',
      'Car Wash',
      'Auto Electrical',
      'Tire Services',
      'Car AC Repair',
      'Panel Beating',
      'Car Detailing',
      'Towing Services',
    ],
  },
  {
    id: 'transportation',
    name: 'Transportation',
    description: 'Transport and logistics',
    icon: 'local-shipping',
    color: '#795548',
    subcategories: [
      'Courier Services',
      'Moving Services',
      'Taxi/Ride Services',
      'Logistics',
      'Delivery Services',
    ],
  },
  {
    id: 'childcare',
    name: 'Childcare',
    description: 'Children and family services',
    icon: 'child-care',
    color: '#FFEB3B',
    subcategories: [
      'Babysitting',
      'Daycare',
      'Nanny Services',
      'After School Care',
      'Child Tutoring',
    ],
  },
  {
    id: 'pet-care',
    name: 'Pet Care',
    description: 'Pet services and care',
    icon: 'pets',
    color: '#8BC34A',
    subcategories: [
      'Pet Grooming',
      'Veterinary',
      'Dog Walking',
      'Pet Sitting',
      'Pet Training',
    ],
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    description: 'Entertainment and recreation',
    icon: 'music-note',
    color: '#00BCD4',
    subcategories: [
      'DJ Services',
      'MC Services',
      'Live Band',
      'Comedy',
      'Magic Shows',
      'Equipment Rental',
    ],
  },
  {
    id: 'fashion-tailoring',
    name: 'Fashion & Tailoring',
    description: 'Fashion and clothing services',
    icon: 'checkroom',
    color: '#E91E63',
    subcategories: [
      'Tailoring',
      'Fashion Design',
      'Alterations',
      'Dry Cleaning',
      'Shoe Repair',
    ],
  },
  {
    id: 'technology',
    name: 'Technology',
    description: 'Tech services and repairs',
    icon: 'computer',
    color: '#3F51B5',
    subcategories: [
      'Phone Repair',
      'Computer Repair',
      'Software Installation',
      'Data Recovery',
      'CCTV Installation',
      'Smart Home Setup',
    ],
  },
  {
    id: 'agriculture',
    name: 'Agriculture',
    description: 'Agricultural services',
    icon: 'agriculture',
    color: '#4CAF50',
    subcategories: [
      'Farming Services',
      'Poultry',
      'Fishery',
      'Livestock',
      'Agro-Processing',
    ],
  },
  {
    id: 'construction',
    name: 'Construction',
    description: 'Construction and building',
    icon: 'construction',
    color: '#FF5722',
    subcategories: [
      'Building Construction',
      'Renovation',
      'Architectural Design',
      'Surveying',
      'Civil Engineering',
      'Interior Design',
    ],
  },
];

export async function seedBusinessCategories(dataSource: any) {
  const categoryRepo = dataSource.getRepository(BusinessCategory);

  for (const categoryData of businessCategoriesData) {
    const existing = await categoryRepo.findOne({
      where: { id: categoryData.id },
    });

    if (!existing) {
      const category = categoryRepo.create(categoryData);
      await categoryRepo.save(category);
      console.log(`✅ Created business category: ${categoryData.name}`);
    }
  }
}
```

---

## Phase 2: Create Business Service Microservice

### Step 2.1: Generate Business Service

```bash
cd backend

# Generate new NestJS application for business service
nest generate app business-service
```

### Step 2.2: Configure Business Service

**Location:** `backend/apps/business-service/src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { BusinessServiceModule } from './business-service.module';

async function bootstrap() {
  const app = await NestFactory.create(BusinessServiceModule);

  // Enable CORS
  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('MeCabal Business Service')
    .setDescription('Business profiles, services, reviews, and inquiries')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3008);
  console.log('🚀 Business Service running on http://localhost:3008');
}
bootstrap();
```

### Step 2.3: Update package.json Scripts

**Location:** `backend/package.json`

Add the following scripts:
```json
{
  "scripts": {
    "start:business": "nest start business-service --watch",
    "build:business": "nest build business-service"
  }
}
```

---

## Phase 3: Business Registration Flow

### Step 3.1: Create DTOs for Business Registration

**Location:** `backend/libs/validation/src/dtos/business/`

#### `create-business-profile.dto.ts`
```typescript
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsBoolean,
  IsArray,
  IsEnum,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ServiceArea {
  NEIGHBORHOOD = 'neighborhood',
  TWO_KM = '2km',
  FIVE_KM = '5km',
  TEN_KM = '10km',
  CITY_WIDE = 'city-wide',
  STATE_WIDE = 'state-wide',
  NATIONWIDE = 'nationwide',
}

export enum PricingModel {
  FIXED_RATE = 'fixed-rate',
  HOURLY = 'hourly',
  PER_ITEM = 'per-item',
  PROJECT_BASED = 'project-based',
  CUSTOM_QUOTE = 'custom-quote',
}

export enum Availability {
  BUSINESS_HOURS = 'business-hours',
  WEEKDAYS = 'weekdays',
  TWENTY_FOUR_SEVEN = '24/7',
  WEEKENDS = 'weekends',
  CUSTOM = 'custom',
}

export class CreateBusinessProfileDto {
  @ApiProperty({ example: 'Top Notch Plumbing Services' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  businessName: string;

  @ApiPropertyOptional({
    example: 'Professional plumbing services for residential and commercial properties',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'household-services' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({ example: 'Plumbing' })
  @IsString()
  @IsOptional()
  subcategory?: string;

  @ApiProperty({ enum: ServiceArea, example: ServiceArea.FIVE_KM })
  @IsEnum(ServiceArea)
  serviceArea: ServiceArea;

  @ApiProperty({ enum: PricingModel, example: PricingModel.HOURLY })
  @IsEnum(PricingModel)
  pricingModel: PricingModel;

  @ApiProperty({ enum: Availability, example: Availability.BUSINESS_HOURS })
  @IsEnum(Availability)
  availability: Availability;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsString()
  @IsOptional()
  whatsappNumber?: string;

  @ApiPropertyOptional({ example: '123 Main Street, Lekki, Lagos' })
  @IsString()
  @IsOptional()
  businessAddress?: string;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(0)
  @Max(50)
  yearsOfExperience: number;

  @ApiPropertyOptional({ example: ['cash', 'bank-transfer', 'mobile-money'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  paymentMethods?: string[];

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  hasInsurance?: boolean;
}
```

#### `update-business-profile.dto.ts`
```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateBusinessProfileDto } from './create-business-profile.dto';

export class UpdateBusinessProfileDto extends PartialType(
  CreateBusinessProfileDto,
) {}
```

### Step 3.2: Create Business Profile Service

**Location:** `backend/apps/business-service/src/business-profile/business-profile.service.ts`

```typescript
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessProfile } from '@app/database/entities/business-profile.entity';
import { CreateBusinessProfileDto } from '@app/validation/dtos/business/create-business-profile.dto';
import { UpdateBusinessProfileDto } from '@app/validation/dtos/business/update-business-profile.dto';

@Injectable()
export class BusinessProfileService {
  constructor(
    @InjectRepository(BusinessProfile)
    private businessProfileRepo: Repository<BusinessProfile>,
  ) {}

  async create(
    userId: string,
    createDto: CreateBusinessProfileDto,
  ): Promise<BusinessProfile> {
    // Check if user already has a business profile
    const existingBusiness = await this.businessProfileRepo.findOne({
      where: { userId },
    });

    if (existingBusiness) {
      throw new BadRequestException(
        'User already has a business profile. Use update endpoint instead.',
      );
    }

    const business = this.businessProfileRepo.create({
      userId,
      ...createDto,
      isActive: true,
      isVerified: false,
      verificationLevel: 'basic',
      rating: 0,
      reviewCount: 0,
      completedJobs: 0,
    });

    return await this.businessProfileRepo.save(business);
  }

  async findById(id: string): Promise<BusinessProfile> {
    const business = await this.businessProfileRepo.findOne({
      where: { id },
      relations: ['user', 'licenses', 'services', 'reviews'],
    });

    if (!business) {
      throw new NotFoundException('Business profile not found');
    }

    return business;
  }

  async findByUserId(userId: string): Promise<BusinessProfile | null> {
    return await this.businessProfileRepo.findOne({
      where: { userId },
      relations: ['licenses', 'services'],
    });
  }

  async update(
    id: string,
    userId: string,
    updateDto: UpdateBusinessProfileDto,
  ): Promise<BusinessProfile> {
    const business = await this.findById(id);

    // Ensure user owns this business
    if (business.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this business',
      );
    }

    Object.assign(business, updateDto);
    return await this.businessProfileRepo.save(business);
  }

  async updateStatus(
    id: string,
    userId: string,
    isActive: boolean,
  ): Promise<BusinessProfile> {
    const business = await this.findById(id);

    if (business.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this business',
      );
    }

    business.isActive = isActive;
    return await this.businessProfileRepo.save(business);
  }

  async delete(id: string, userId: string): Promise<void> {
    const business = await this.findById(id);

    if (business.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this business',
      );
    }

    await this.businessProfileRepo.remove(business);
  }

  async incrementCompletedJobs(id: string): Promise<void> {
    await this.businessProfileRepo.increment({ id }, 'completedJobs', 1);
  }
}
```

### Step 3.3: Create Business Profile Controller

**Location:** `backend/apps/business-service/src/business-profile/business-profile.controller.ts`

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
import { BusinessProfileService } from './business-profile.service';
import { CreateBusinessProfileDto } from '@app/validation/dtos/business/create-business-profile.dto';
import { UpdateBusinessProfileDto } from '@app/validation/dtos/business/update-business-profile.dto';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';

@ApiTags('Business Profile')
@Controller('business')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BusinessProfileController {
  constructor(private readonly businessProfileService: BusinessProfileService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new business profile' })
  @ApiResponse({ status: 201, description: 'Business profile created successfully' })
  @ApiResponse({ status: 400, description: 'User already has a business profile' })
  async register(
    @Request() req,
    @Body() createDto: CreateBusinessProfileDto,
  ) {
    const business = await this.businessProfileService.create(
      req.user.userId,
      createDto,
    );
    return {
      success: true,
      message: 'Business profile created successfully',
      data: business,
    };
  }

  @Get('my-business')
  @ApiOperation({ summary: 'Get current user\'s business profile' })
  @ApiResponse({ status: 200, description: 'Business profile retrieved' })
  @ApiResponse({ status: 404, description: 'No business profile found' })
  async getMyBusiness(@Request() req) {
    const business = await this.businessProfileService.findByUserId(
      req.user.userId,
    );
    return {
      success: true,
      data: business,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get business profile by ID' })
  @ApiResponse({ status: 200, description: 'Business profile retrieved' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  async getById(@Param('id') id: string) {
    const business = await this.businessProfileService.findById(id);
    return {
      success: true,
      data: business,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update business profile' })
  @ApiResponse({ status: 200, description: 'Business profile updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateDto: UpdateBusinessProfileDto,
  ) {
    const business = await this.businessProfileService.update(
      id,
      req.user.userId,
      updateDto,
    );
    return {
      success: true,
      message: 'Business profile updated successfully',
      data: business,
    };
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update business online/offline status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  async updateStatus(
    @Param('id') id: string,
    @Request() req,
    @Body('isActive') isActive: boolean,
  ) {
    const business = await this.businessProfileService.updateStatus(
      id,
      req.user.userId,
      isActive,
    );
    return {
      success: true,
      message: `Business is now ${isActive ? 'online' : 'offline'}`,
      data: business,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete business profile' })
  @ApiResponse({ status: 204, description: 'Business profile deleted' })
  async delete(@Param('id') id: string, @Request() req) {
    await this.businessProfileService.delete(id, req.user.userId);
  }
}
```

---

## Phase 4: Business Profile Management

*(Continue with Step 4.1: Business Categories Service, Step 4.2: Business Services Management, etc.)*

### Step 4.1: Create Business Categories Service

**Location:** `backend/apps/business-service/src/business-category/business-category.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessCategory } from '@app/database/entities/business-category.entity';

@Injectable()
export class BusinessCategoryService {
  constructor(
    @InjectRepository(BusinessCategory)
    private categoryRepo: Repository<BusinessCategory>,
  ) {}

  async findAll(): Promise<BusinessCategory[]> {
    return await this.categoryRepo.find({
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<BusinessCategory | null> {
    return await this.categoryRepo.findOne({ where: { id } });
  }

  async getSubcategories(categoryId: string): Promise<string[]> {
    const category = await this.findById(categoryId);
    return category?.subcategories || [];
  }
}
```

*(Due to length constraints, I'll summarize the remaining phases. The complete implementation would follow the same detailed pattern)*

---

## Phase 5: Business Search & Discovery

**Key Components:**
- Search service with filters (category, service area, rating, pricing)
- PostGIS integration for geographic filtering
- Pagination and sorting
- Advanced search with full-text search

---

## Phase 6: Reviews & Ratings System

**Key Components:**
- Create review endpoints
- Rating aggregation logic
- Business owner responses
- Review moderation
- Update business rating on new review

---

## Phase 7: Business Verification

**Key Components:**
- License upload and verification
- Verification level progression (basic → enhanced → premium)
- Admin verification endpoints
- Document storage with MinIO
- Verification badges

---

## Phase 8: Business Analytics & Activity

**Key Components:**
- Activity logging
- Analytics dashboard (views, inquiries, conversions)
- Performance metrics
- Response time tracking

---

## Phase 9: API Gateway Integration

**Key Components:**
- Register business service with API gateway
- Add routes to gateway
- Configure load balancing
- Add rate limiting

---

## Phase 10: Testing & Deployment

**Key Components:**
- Unit tests for services
- Integration tests for endpoints
- E2E tests for registration flow
- Load testing
- Deployment to production

---

## Appendix

### A. Nigerian Business Licenses Reference

```typescript
export const nigerianBusinessLicenses = {
  federal: [
    { code: 'CAC', name: 'Corporate Affairs Commission Registration' },
    { code: 'TIN', name: 'Tax Identification Number (FIRS)' },
    { code: 'NAFDAC', name: 'NAFDAC Registration (Food/Drugs)' },
    { code: 'SON', name: 'Standards Organisation of Nigeria' },
    { code: 'SCUML', name: 'Special Control Unit Against Money Laundering' },
  ],
  professional: [
    { code: 'NBA', name: 'Nigerian Bar Association (Lawyers)' },
    { code: 'NMA', name: 'Nigerian Medical Association' },
    { code: 'ICAN', name: 'Institute of Chartered Accountants' },
    { code: 'NSE', name: 'Nigerian Society of Engineers' },
    { code: 'APCON', name: 'Advertising Practitioners Council' },
  ],
  stateLocal: [
    { code: 'BUSINESS_PREMISES', name: 'Business Premises Permit' },
    { code: 'HEALTH_CERT', name: 'Health Certificate' },
    { code: 'FIRE_CERT', name: 'Fire Safety Certificate' },
    { code: 'SIGNAGE', name: 'Signage Permit' },
  ],
};
```

### B. Service Area Distance Mapping

```typescript
export const serviceAreaDistances = {
  'neighborhood': { radius: 1, unit: 'km' },
  '2km': { radius: 2, unit: 'km' },
  '5km': { radius: 5, unit: 'km' },
  '10km': { radius: 10, unit: 'km' },
  'city-wide': { radius: 50, unit: 'km' },
  'state-wide': { radius: 200, unit: 'km' },
  'nationwide': { radius: null, unit: null },
};
```

### C. Payment Methods Enum

```typescript
export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank-transfer',
  CARD = 'card',
  MOBILE_MONEY = 'mobile-money',
  OPAY = 'opay',
  KUDA = 'kuda',
  PALMPAY = 'palmpay',
  CRYPTO = 'crypto',
}
```

### D. Response Time Categories

```typescript
export enum ResponseTime {
  WITHIN_1_HOUR = 'within-1-hour',
  WITHIN_24_HOURS = 'within-24-hours',
  WITHIN_3_DAYS = 'within-3-days',
  CUSTOM = 'custom',
}
```

---

## Success Criteria

✅ **Phase 1 Complete:**
- All database entities created
- Migrations run successfully
- Business categories seeded

✅ **Phase 2 Complete:**
- Business service microservice running on port 3008
- Swagger documentation accessible
- Service registered in package.json

✅ **Phase 3 Complete:**
- Business registration endpoint working
- DTOs validated correctly
- Business profiles created in database

✅ **Phases 4-8 Complete:**
- All CRUD operations working
- Search and filtering functional
- Reviews and ratings operational
- Verification workflow complete
- Analytics tracking active

✅ **Phase 9 Complete:**
- API Gateway routing to business service
- All endpoints accessible via gateway

✅ **Phase 10 Complete:**
- Test coverage > 80%
- Load testing passed
- Deployed to production
- Mobile app successfully integrated

---

**Document Version:** 1.0
**Last Updated:** 2025-10-09
**Status:** Ready for Implementation
