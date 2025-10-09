# User Profile & Verification System Implementation Guide
**MeCabal - Gaps 1 & 2 Implementation**
*Detailed Developer Tasks & Instructions*

---

## Table of Contents
1. [Overview](#overview)
2. [Gap 1: User Profile Management](#gap-1-user-profile-management)
3. [Gap 2: Verification System](#gap-2-verification-system)
4. [Database Migrations](#database-migrations)
5. [Testing Requirements](#testing-requirements)
6. [Deployment Checklist](#deployment-checklist)

---

## Overview

### Goals
- Build fully functional User Service with profile management
- Implement comprehensive verification system with trust scoring
- Enable all user profile features shown in mobile app
- Create foundation for gamification and business features

### Tech Stack
- NestJS framework
- TypeORM for database operations
- PostgreSQL database
- JWT authentication (already implemented in Auth Service)
- AWS S3 or DigitalOcean Spaces for file uploads
- Redis for caching (optional but recommended)

### Development Timeline
- **Sprint 1 (10 days):** User Profile Management
- **Sprint 2 (10 days):** Dashboard & Statistics
- **Sprint 3 (10 days):** Verification System Foundation

---

## GAP 1: USER PROFILE MANAGEMENT

### Sprint 1: Core User Service (10 days)

---

## TASK 1.1: Project Setup & Service Structure (Day 1)

### Objective
Set up the User Service module structure with proper dependency injection and configuration.

### Prerequisites
- User Service skeleton already exists at `backend/apps/user-service/`
- Auth Service is functional for authentication

### Step-by-Step Instructions

#### 1.1.1: Update User Service Module
**File:** `backend/apps/user-service/src/user-service.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, UserSession, UserNeighborhood } from '@app/database';
import { AuthModule } from '@app/auth';
import { UserServiceController } from './user-service.controller';
import { UserProfileService } from './services/user-profile.service';
import { UserStatisticsService } from './services/user-statistics.service';
import { UserSearchService } from './services/user-search.service';
import { FileUploadService } from './services/file-upload.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forFeature([
      User,
      UserSession,
      UserNeighborhood,
    ]),
    AuthModule, // For JWT guards
  ],
  controllers: [UserServiceController],
  providers: [
    UserProfileService,
    UserStatisticsService,
    UserSearchService,
    FileUploadService,
  ],
  exports: [
    UserProfileService,
    UserStatisticsService,
  ],
})
export class UserServiceModule {}
```

**Verification:**
- [ ] Module imports compile without errors
- [ ] All services are properly injected
- [ ] TypeORM entities are registered

---

#### 1.1.2: Create Service Files Structure

Create the following directory structure:

```
backend/apps/user-service/src/
├── controllers/
│   └── user-profile.controller.ts
├── services/
│   ├── user-profile.service.ts
│   ├── user-statistics.service.ts
│   ├── user-search.service.ts
│   └── file-upload.service.ts
├── dto/
│   ├── update-profile.dto.ts
│   ├── user-response.dto.ts
│   ├── user-search.dto.ts
│   └── upload-avatar.dto.ts
├── interfaces/
│   └── user-statistics.interface.ts
└── user-service.module.ts
```

**Create each file with basic structure:**

**File:** `backend/apps/user-service/src/services/user-profile.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@app/database';

@Injectable()
export class UserProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Methods will be implemented in subsequent tasks
}
```

**Verification:**
- [ ] All service files created
- [ ] Basic dependency injection works
- [ ] No compilation errors

---

## TASK 1.2: User Profile CRUD Endpoints (Days 2-3)

### Objective
Implement core user profile retrieval and update functionality.

---

#### 1.2.1: Create DTOs

**File:** `backend/apps/user-service/src/dto/update-profile.dto.ts`

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsDateString,
  IsEnum,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'User first name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ description: 'User last name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ description: 'User email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number (Nigerian format)' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Date of birth (ISO format)' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: 'Gender',
    enum: ['male', 'female', 'other'],
  })
  @IsOptional()
  @IsEnum(['male', 'female', 'other'])
  gender?: string;

  @ApiPropertyOptional({ description: 'User bio/description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ description: 'Occupation/job title' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  occupation?: string;

  @ApiPropertyOptional({ description: 'Professional skills (comma-separated)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  professionalSkills?: string;

  @ApiPropertyOptional({ description: 'Cultural background' })
  @IsOptional()
  @IsString()
  culturalBackground?: string;

  @ApiPropertyOptional({ description: 'Native languages (comma-separated)' })
  @IsOptional()
  @IsString()
  nativeLanguages?: string;

  @ApiPropertyOptional({ description: 'Preferred language code' })
  @IsOptional()
  @IsString()
  preferredLanguage?: string;

  // Location fields
  @ApiPropertyOptional({ description: 'Nigerian state' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'City within state' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Estate or compound name' })
  @IsOptional()
  @IsString()
  estate?: string;

  @ApiPropertyOptional({ description: 'Landmark for location reference' })
  @IsOptional()
  @IsString()
  landmark?: string;

  @ApiPropertyOptional({ description: 'Full address text' })
  @IsOptional()
  @IsString()
  address?: string;
}
```

**File:** `backend/apps/user-service/src/dto/user-response.dto.ts`

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class UserResponseDto {
  @Expose()
  @ApiProperty({ description: 'User ID' })
  id: string;

  @Expose()
  @ApiProperty({ description: 'First name' })
  firstName: string;

  @Expose()
  @ApiProperty({ description: 'Last name' })
  lastName: string;

  @Expose()
  @ApiProperty({ description: 'Full name' })
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  @Expose()
  @ApiProperty({ description: 'Email address' })
  email: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Phone number' })
  phoneNumber?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Profile picture URL' })
  profilePictureUrl?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Date of birth' })
  dateOfBirth?: Date;

  @Expose()
  @ApiPropertyOptional({ description: 'Gender' })
  gender?: string;

  @Expose()
  @ApiProperty({ description: 'Verification status' })
  isVerified: boolean;

  @Expose()
  @ApiProperty({ description: 'Phone verification status' })
  phoneVerified: boolean;

  @Expose()
  @ApiProperty({ description: 'Identity verification status' })
  identityVerified: boolean;

  @Expose()
  @ApiProperty({ description: 'Address verification status' })
  addressVerified: boolean;

  @Expose()
  @ApiProperty({ description: 'Trust score (0-100)' })
  trustScore: number;

  @Expose()
  @ApiPropertyOptional({ description: 'Verification level' })
  verificationLevel?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Verification badge type' })
  verificationBadge?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Bio/description' })
  bio?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Occupation' })
  occupation?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Professional skills' })
  professionalSkills?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Cultural background' })
  culturalBackground?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Native languages' })
  nativeLanguages?: string;

  @Expose()
  @ApiProperty({ description: 'Preferred language' })
  preferredLanguage: string;

  // Location fields
  @Expose()
  @ApiPropertyOptional({ description: 'State' })
  state?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'City' })
  city?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Estate' })
  estate?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Location string' })
  get locationString(): string {
    const parts = [this.estate, this.city, this.state].filter(Boolean);
    return parts.join(', ') || 'Location not set';
  }

  @Expose()
  @ApiPropertyOptional({ description: 'Landmark' })
  landmark?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Address' })
  address?: string;

  @Expose()
  @ApiProperty({ description: 'Account active status' })
  isActive: boolean;

  @Expose()
  @ApiProperty({ description: 'Member since date' })
  memberSince?: Date;

  @Expose()
  @ApiProperty({ description: 'Last login timestamp' })
  lastLoginAt?: Date;

  @Expose()
  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @Expose()
  @ApiPropertyOptional({ description: 'Join date formatted' })
  get joinDate(): string {
    const date = this.memberSince || this.createdAt;
    return date?.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
    }) || 'Recently joined';
  }

  @Expose()
  @ApiProperty({ description: 'Profile completion percentage' })
  get profileCompleteness(): number {
    let score = 0;
    const fields = [
      this.firstName,
      this.lastName,
      this.email,
      this.phoneNumber,
      this.phoneVerified,
      this.bio,
      this.occupation,
      this.state,
      this.city,
      this.profilePictureUrl,
    ];

    fields.forEach(field => {
      if (field) score += 10;
    });

    return Math.min(score, 100);
  }
}
```

**Verification:**
- [ ] DTOs validate correctly
- [ ] Swagger annotations are present
- [ ] Response DTO excludes sensitive fields (password)

---

#### 1.2.2: Implement User Profile Service Methods

**File:** `backend/apps/user-service/src/services/user-profile.service.ts`

```typescript
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { User } from '@app/database';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class UserProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Get user profile by ID
   */
  async getUserById(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['userNeighborhoods', 'userNeighborhoods.neighborhood'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.transformUserToResponse(user);
  }

  /**
   * Get user profile by email
   */
  async getUserByEmail(email: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['userNeighborhoods', 'userNeighborhoods.neighborhood'],
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return this.transformUserToResponse(user);
  }

  /**
   * Get user profile by phone number
   */
  async getUserByPhone(phoneNumber: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { phoneNumber },
      relations: ['userNeighborhoods', 'userNeighborhoods.neighborhood'],
    });

    if (!user) {
      throw new NotFoundException(`User with phone ${phoneNumber} not found`);
    }

    return this.transformUserToResponse(user);
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updateData: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check for email uniqueness if email is being updated
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateData.email, id: Not(userId) },
      });

      if (existingUser) {
        throw new ConflictException('Email already in use by another user');
      }
    }

    // Check for phone uniqueness if phone is being updated
    if (updateData.phoneNumber && updateData.phoneNumber !== user.phoneNumber) {
      const existingUser = await this.userRepository.findOne({
        where: { phoneNumber: updateData.phoneNumber, id: Not(userId) },
      });

      if (existingUser) {
        throw new ConflictException('Phone number already in use by another user');
      }
    }

    // Update user fields
    Object.assign(user, updateData);

    // Save updated user
    const updatedUser = await this.userRepository.save(user);

    // Return response
    return this.transformUserToResponse(updatedUser);
  }

  /**
   * Update user avatar/profile picture
   */
  async updateAvatar(
    userId: string,
    avatarUrl: string,
  ): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    user.profilePictureUrl = avatarUrl;
    const updatedUser = await this.userRepository.save(user);

    return this.transformUserToResponse(updatedUser);
  }

  /**
   * Delete/deactivate user account
   */
  async deactivateAccount(userId: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Soft delete - set isActive to false
    user.isActive = false;
    await this.userRepository.save(user);

    return {
      message: 'Account deactivated successfully',
    };
  }

  /**
   * Reactivate user account
   */
  async reactivateAccount(userId: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    user.isActive = true;
    await this.userRepository.save(user);

    return {
      message: 'Account reactivated successfully',
    };
  }

  /**
   * Get user profile completion percentage
   */
  async getProfileCompletion(userId: string): Promise<{
    percentage: number;
    missingFields: string[];
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const requiredFields = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      phoneVerified: user.phoneVerified,
      bio: user.bio,
      occupation: user.occupation,
      state: user.state,
      city: user.city,
      profilePictureUrl: user.profilePictureUrl,
    };

    const missingFields: string[] = [];
    let completedFields = 0;
    const totalFields = Object.keys(requiredFields).length;

    Object.entries(requiredFields).forEach(([key, value]) => {
      if (value) {
        completedFields++;
      } else {
        missingFields.push(key);
      }
    });

    const percentage = Math.round((completedFields / totalFields) * 100);

    return {
      percentage,
      missingFields,
    };
  }

  /**
   * Transform User entity to UserResponseDto
   */
  private transformUserToResponse(user: User): UserResponseDto {
    const response = plainToClass(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });

    // Add verification level
    response.verificationLevel = user.getVerificationLevel();

    return response;
  }
}
```

**Verification:**
- [ ] All methods compile without errors
- [ ] Proper error handling is in place
- [ ] User entity relations are loaded correctly
- [ ] DTOs are properly transformed

---

#### 1.2.3: Create User Profile Controller

**File:** `backend/apps/user-service/src/controllers/user-profile.controller.ts`

```typescript
import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '@app/auth';
import { User } from '@app/database';
import { UserProfileService } from '../services/user-profile.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UserResponseDto } from '../dto/user-response.dto';

@ApiTags('User Profile')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserProfileController {
  constructor(
    private readonly userProfileService: UserProfileService,
  ) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  async getCurrentUserProfile(
    @CurrentUser() user: User,
  ): Promise<UserResponseDto> {
    return this.userProfileService.getUserById(user.id);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user profile by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserProfile(
    @Param('id') userId: string,
  ): Promise<UserResponseDto> {
    return this.userProfileService.getUserById(userId);
  }

  @Get('by-email/:email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user profile by email' })
  @ApiParam({ name: 'email', description: 'User email address' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserByEmail(
    @Param('email') email: string,
  ): Promise<UserResponseDto> {
    return this.userProfileService.getUserByEmail(email);
  }

  @Get('by-phone/:phone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user profile by phone number' })
  @ApiParam({ name: 'phone', description: 'Phone number' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserByPhone(
    @Param('phone') phone: string,
  ): Promise<UserResponseDto> {
    return this.userProfileService.getUserByPhone(phone);
  }

  @Put('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 409,
    description: 'Email or phone number already in use',
  })
  async updateCurrentUserProfile(
    @CurrentUser() user: User,
    @Body() updateData: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.userProfileService.updateProfile(user.id, updateData);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user profile by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async updateUserProfile(
    @Param('id') userId: string,
    @Body() updateData: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.userProfileService.updateProfile(userId, updateData);
  }

  @Get('me/completion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get profile completion status' })
  @ApiResponse({
    status: 200,
    description: 'Profile completion percentage retrieved',
    schema: {
      type: 'object',
      properties: {
        percentage: { type: 'number' },
        missingFields: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async getProfileCompletion(
    @CurrentUser() user: User,
  ): Promise<{ percentage: number; missingFields: string[] }> {
    return this.userProfileService.getProfileCompletion(user.id);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate current user account' })
  @ApiResponse({
    status: 200,
    description: 'Account deactivated successfully',
  })
  async deactivateAccount(
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    return this.userProfileService.deactivateAccount(user.id);
  }
}
```

**Verification:**
- [ ] All endpoints are properly documented with Swagger
- [ ] JWT authentication guard is applied
- [ ] Proper HTTP status codes are used
- [ ] Current user decorator works correctly

---

#### 1.2.4: Update Main User Service Controller

**File:** `backend/apps/user-service/src/user-service.controller.ts`

Replace the existing "Hello World" controller:

```typescript
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('User Service')
@Controller()
export class UserServiceController {
  @Get('health')
  @ApiOperation({ summary: 'Health check for user service' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
  })
  getHealth() {
    return {
      status: 'healthy',
      service: 'user-service',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}
```

**Verification:**
- [ ] Health endpoint is accessible
- [ ] Service returns proper health status

---

## TASK 1.3: Avatar Upload Service (Day 4)

### Objective
Implement file upload functionality for user profile pictures with S3/Spaces integration.

---

#### 1.3.1: Install Required Dependencies

```bash
cd backend
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer @types/multer sharp @types/sharp
```

**Verification:**
- [ ] Dependencies installed successfully
- [ ] No version conflicts

---

#### 1.3.2: Configure Environment Variables

**File:** `backend/.env`

Add the following variables:

```env
# File Upload Configuration
UPLOAD_PROVIDER=s3  # or 'spaces' for DigitalOcean Spaces
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=mecabal-user-uploads

# DigitalOcean Spaces (if using Spaces)
SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
SPACES_BUCKET=mecabal-uploads
SPACES_REGION=nyc3

# Upload Limits
MAX_FILE_SIZE=5242880  # 5MB in bytes
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp
```

**Verification:**
- [ ] Environment variables are set
- [ ] Credentials are valid

---

#### 1.3.3: Create File Upload Service

**File:** `backend/apps/user-service/src/services/file-upload.service.ts`

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import * as sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileUploadService {
  private s3Client: S3Client;
  private bucket: string;
  private cdnUrl: string;

  constructor(private configService: ConfigService) {
    const provider = this.configService.get<string>('UPLOAD_PROVIDER', 's3');

    if (provider === 'spaces') {
      // DigitalOcean Spaces configuration
      this.s3Client = new S3Client({
        endpoint: this.configService.get<string>('SPACES_ENDPOINT'),
        region: this.configService.get<string>('SPACES_REGION', 'nyc3'),
        credentials: {
          accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
          secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
        },
      });
      this.bucket = this.configService.get<string>('SPACES_BUCKET');
      this.cdnUrl = `https://${this.bucket}.${this.configService.get<string>('SPACES_REGION')}.cdn.digitaloceanspaces.com`;
    } else {
      // AWS S3 configuration
      this.s3Client = new S3Client({
        region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
        credentials: {
          accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
          secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
        },
      });
      this.bucket = this.configService.get<string>('AWS_S3_BUCKET');
      this.cdnUrl = `https://${this.bucket}.s3.${this.configService.get<string>('AWS_REGION')}.amazonaws.com`;
    }
  }

  /**
   * Upload user avatar/profile picture
   */
  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    // Validate file
    this.validateImageFile(file);

    // Process image (resize, optimize)
    const processedImage = await this.processImage(file.buffer);

    // Generate unique filename
    const fileExtension = file.mimetype.split('/')[1];
    const fileName = `avatars/${userId}/${uuidv4()}.${fileExtension}`;

    // Upload to S3/Spaces
    const uploadCommand = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileName,
      Body: processedImage,
      ContentType: file.mimetype,
      ACL: 'public-read',
      CacheControl: 'max-age=31536000', // 1 year cache
    });

    await this.s3Client.send(uploadCommand);

    // Return CDN URL
    return `${this.cdnUrl}/${fileName}`;
  }

  /**
   * Delete user avatar
   */
  async deleteAvatar(avatarUrl: string): Promise<void> {
    // Extract file key from URL
    const fileKey = avatarUrl.replace(`${this.cdnUrl}/`, '');

    const deleteCommand = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
    });

    await this.s3Client.send(deleteCommand);
  }

  /**
   * Validate image file
   */
  private validateImageFile(file: Express.Multer.File): void {
    // Check file size
    const maxSize = this.configService.get<number>('MAX_FILE_SIZE', 5242880); // 5MB default
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
      );
    }

    // Check file type
    const allowedTypes = this.configService
      .get<string>('ALLOWED_IMAGE_TYPES', 'image/jpeg,image/png,image/webp')
      .split(',');

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }
  }

  /**
   * Process image (resize and optimize)
   */
  private async processImage(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .resize(400, 400, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 85 })
      .toBuffer();
  }
}
```

**Verification:**
- [ ] S3/Spaces client initializes correctly
- [ ] Image validation works
- [ ] Image processing works

---

#### 1.3.4: Add Upload Endpoint to Controller

**File:** `backend/apps/user-service/src/controllers/user-profile.controller.ts`

Add these imports and endpoint:

```typescript
import {
  // ... existing imports
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileUploadService } from '../services/file-upload.service';

// Add to controller class:
constructor(
  private readonly userProfileService: UserProfileService,
  private readonly fileUploadService: FileUploadService, // Add this
) {}

@Post('me/avatar')
@HttpCode(HttpStatus.OK)
@UseInterceptors(FileInterceptor('avatar'))
@ApiConsumes('multipart/form-data')
@ApiOperation({ summary: 'Upload user avatar' })
@ApiBody({
  description: 'Avatar image file',
  schema: {
    type: 'object',
    properties: {
      avatar: {
        type: 'string',
        format: 'binary',
      },
    },
  },
})
@ApiResponse({
  status: 200,
  description: 'Avatar uploaded successfully',
  schema: {
    type: 'object',
    properties: {
      avatarUrl: { type: 'string' },
    },
  },
})
@ApiResponse({
  status: 400,
  description: 'Invalid file or file too large',
})
async uploadAvatar(
  @CurrentUser() user: User,
  @UploadedFile() file: Express.Multer.File,
): Promise<{ avatarUrl: string }> {
  // Delete old avatar if exists
  if (user.profilePictureUrl) {
    try {
      await this.fileUploadService.deleteAvatar(user.profilePictureUrl);
    } catch (error) {
      // Log but don't fail if old avatar deletion fails
      console.error('Failed to delete old avatar:', error);
    }
  }

  // Upload new avatar
  const avatarUrl = await this.fileUploadService.uploadAvatar(user.id, file);

  // Update user profile
  await this.userProfileService.updateAvatar(user.id, avatarUrl);

  return { avatarUrl };
}

@Delete('me/avatar')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Delete user avatar' })
@ApiResponse({
  status: 200,
  description: 'Avatar deleted successfully',
})
async deleteAvatar(
  @CurrentUser() user: User,
): Promise<{ message: string }> {
  if (!user.profilePictureUrl) {
    throw new BadRequestException('No avatar to delete');
  }

  // Delete from storage
  await this.fileUploadService.deleteAvatar(user.profilePictureUrl);

  // Update user profile
  await this.userProfileService.updateAvatar(user.id, null);

  return { message: 'Avatar deleted successfully' };
}
```

**Verification:**
- [ ] File upload interceptor works
- [ ] Avatar uploads to S3/Spaces
- [ ] Old avatar is deleted when uploading new one
- [ ] User profile is updated with new avatar URL

---

## TASK 1.4: User Search & Discovery (Day 5)

### Objective
Implement user search functionality with filtering options.

---

#### 1.4.1: Create Search DTOs

**File:** `backend/apps/user-service/src/dto/user-search.dto.ts`

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class UserSearchDto {
  @ApiPropertyOptional({ description: 'Search query (name, email, occupation)' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ description: 'Filter by state' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Filter by city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Filter by estate' })
  @IsOptional()
  @IsString()
  estate?: string;

  @ApiPropertyOptional({ description: 'Filter by cultural background' })
  @IsOptional()
  @IsString()
  culturalBackground?: string;

  @ApiPropertyOptional({ description: 'Filter by occupation' })
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional({
    description: 'Filter by verification level',
    enum: ['unverified', 'phone', 'identity', 'full'],
  })
  @IsOptional()
  @IsEnum(['unverified', 'phone', 'identity', 'full'])
  verificationLevel?: string;

  @ApiPropertyOptional({ description: 'Only verified users', default: false })
  @IsOptional()
  @Type(() => Boolean)
  verifiedOnly?: boolean;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['createdAt', 'trustScore', 'lastName'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsEnum(['createdAt', 'trustScore', 'lastName'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class UserSearchResponseDto {
  @ApiPropertyOptional({ description: 'List of users' })
  users: UserResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of matching users' })
  total: number;

  @ApiPropertyOptional({ description: 'Current page' })
  page: number;

  @ApiPropertyOptional({ description: 'Items per page' })
  limit: number;

  @ApiPropertyOptional({ description: 'Total pages' })
  totalPages: number;

  @ApiPropertyOptional({ description: 'Has next page' })
  hasNextPage: boolean;

  @ApiPropertyOptional({ description: 'Has previous page' })
  hasPreviousPage: boolean;
}
```

**Verification:**
- [ ] DTO validation works correctly
- [ ] Default values are applied
- [ ] Enum validations work

---

#### 1.4.2: Implement User Search Service

**File:** `backend/apps/user-service/src/services/user-search.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { User } from '@app/database';
import { UserSearchDto, UserSearchResponseDto } from '../dto/user-search.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class UserSearchService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Search users with filters and pagination
   */
  async searchUsers(
    searchDto: UserSearchDto,
  ): Promise<UserSearchResponseDto> {
    const {
      query,
      state,
      city,
      estate,
      culturalBackground,
      occupation,
      verificationLevel,
      verifiedOnly,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = searchDto;

    // Build query
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.isActive = :isActive', { isActive: true });

    // Text search (name, email, occupation)
    if (query) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :query OR user.lastName ILIKE :query OR user.email ILIKE :query OR user.occupation ILIKE :query)',
        { query: `%${query}%` },
      );
    }

    // Location filters
    if (state) {
      queryBuilder.andWhere('user.state = :state', { state });
    }

    if (city) {
      queryBuilder.andWhere('user.city = :city', { city });
    }

    if (estate) {
      queryBuilder.andWhere('user.estate ILIKE :estate', {
        estate: `%${estate}%`,
      });
    }

    // Cultural filter
    if (culturalBackground) {
      queryBuilder.andWhere(
        'user.culturalBackground = :culturalBackground',
        { culturalBackground },
      );
    }

    // Occupation filter
    if (occupation) {
      queryBuilder.andWhere('user.occupation ILIKE :occupation', {
        occupation: `%${occupation}%`,
      });
    }

    // Verification filters
    if (verifiedOnly) {
      queryBuilder.andWhere('user.isVerified = :verified', {
        verified: true,
      });
    }

    if (verificationLevel) {
      switch (verificationLevel) {
        case 'phone':
          queryBuilder.andWhere('user.phoneVerified = :phoneVerified', {
            phoneVerified: true,
          });
          break;
        case 'identity':
          queryBuilder.andWhere(
            'user.phoneVerified = :phoneVerified AND user.identityVerified = :identityVerified',
            { phoneVerified: true, identityVerified: true },
          );
          break;
        case 'full':
          queryBuilder.andWhere(
            'user.phoneVerified = :phoneVerified AND user.identityVerified = :identityVerified AND user.addressVerified = :addressVerified',
            {
              phoneVerified: true,
              identityVerified: true,
              addressVerified: true,
            },
          );
          break;
        case 'unverified':
          queryBuilder.andWhere('user.isVerified = :verified', {
            verified: false,
          });
          break;
      }
    }

    // Sorting
    const sortField = `user.${sortBy}`;
    queryBuilder.orderBy(sortField, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const [users, total] = await queryBuilder.getManyAndCount();

    // Transform to response DTOs
    const userDtos = users.map(user =>
      plainToClass(UserResponseDto, user, {
        excludeExtraneousValues: true,
      }),
    );

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      users: userDtos,
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    };
  }

  /**
   * Get users by location (nearby neighbors)
   */
  async getUsersByLocation(
    state: string,
    city?: string,
    estate?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<UserSearchResponseDto> {
    return this.searchUsers({
      state,
      city,
      estate,
      page,
      limit,
      verifiedOnly: true,
    });
  }

  /**
   * Get users by cultural background
   */
  async getUsersByCulture(
    culturalBackground: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<UserSearchResponseDto> {
    return this.searchUsers({
      culturalBackground,
      page,
      limit,
    });
  }

  /**
   * Get verified users
   */
  async getVerifiedUsers(
    page: number = 1,
    limit: number = 20,
  ): Promise<UserSearchResponseDto> {
    return this.searchUsers({
      verifiedOnly: true,
      page,
      limit,
      sortBy: 'trustScore',
      sortOrder: 'DESC',
    });
  }
}
```

**Verification:**
- [ ] Search query builder works correctly
- [ ] All filters apply properly
- [ ] Pagination works
- [ ] Sorting works

---

#### 1.4.3: Add Search Endpoints to Controller

**File:** `backend/apps/user-service/src/controllers/user-profile.controller.ts`

Add to controller:

```typescript
import { UserSearchService } from '../services/user-search.service';
import { UserSearchDto, UserSearchResponseDto } from '../dto/user-search.dto';

// Update constructor:
constructor(
  private readonly userProfileService: UserProfileService,
  private readonly fileUploadService: FileUploadService,
  private readonly userSearchService: UserSearchService, // Add this
) {}

// Add endpoints:
@Get('search')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Search users with filters' })
@ApiResponse({
  status: 200,
  description: 'Users retrieved successfully',
  type: UserSearchResponseDto,
})
async searchUsers(
  @Query() searchDto: UserSearchDto,
): Promise<UserSearchResponseDto> {
  return this.userSearchService.searchUsers(searchDto);
}

@Get('nearby')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Get nearby users (same location)' })
@ApiQuery({ name: 'state', required: true })
@ApiQuery({ name: 'city', required: false })
@ApiQuery({ name: 'estate', required: false })
@ApiQuery({ name: 'page', required: false })
@ApiQuery({ name: 'limit', required: false })
@ApiResponse({
  status: 200,
  description: 'Nearby users retrieved successfully',
  type: UserSearchResponseDto,
})
async getNearbyUsers(
  @Query('state') state: string,
  @Query('city') city?: string,
  @Query('estate') estate?: string,
  @Query('page') page?: number,
  @Query('limit') limit?: number,
): Promise<UserSearchResponseDto> {
  return this.userSearchService.getUsersByLocation(
    state,
    city,
    estate,
    page,
    limit,
  );
}

@Get('verified')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Get verified users' })
@ApiQuery({ name: 'page', required: false })
@ApiQuery({ name: 'limit', required: false })
@ApiResponse({
  status: 200,
  description: 'Verified users retrieved successfully',
  type: UserSearchResponseDto,
})
async getVerifiedUsers(
  @Query('page') page?: number,
  @Query('limit') limit?: number,
): Promise<UserSearchResponseDto> {
  return this.userSearchService.getVerifiedUsers(page, limit);
}
```

**Verification:**
- [ ] Search endpoint returns results
- [ ] Pagination works correctly
- [ ] Filters apply as expected
- [ ] Swagger documentation is correct

---

## TASK 1.5: Dashboard Statistics (Days 6-7)

### Objective
Implement dashboard statistics showing user activity, bookmarks, and saved items.

---

#### 1.5.1: Create Database Tables for Bookmarks

**File:** `backend/libs/database/src/migrations/[timestamp]-AddUserDashboardTables.ts`

Create a new migration file:

```bash
cd backend
npm run migration:create -- AddUserDashboardTables
```

Then edit the migration file:

```typescript
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddUserDashboardTables1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user_bookmarks table
    await queryRunner.createTable(
      new Table({
        name: 'user_bookmarks',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'item_type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'item_id',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create unique index on user_id, item_type, item_id
    await queryRunner.createIndex(
      'user_bookmarks',
      new TableIndex({
        name: 'IDX_USER_BOOKMARKS_UNIQUE',
        columnNames: ['user_id', 'item_type', 'item_id'],
        isUnique: true,
      }),
    );

    // Create index for faster lookups
    await queryRunner.createIndex(
      'user_bookmarks',
      new TableIndex({
        name: 'IDX_USER_BOOKMARKS_USER_TYPE',
        columnNames: ['user_id', 'item_type'],
      }),
    );

    // Create user_dashboard_stats table (cached statistics)
    await queryRunner.createTable(
      new Table({
        name: 'user_dashboard_stats',
        columns: [
          {
            name: 'user_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'bookmarks_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'saved_deals_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'attending_events_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'posts_shared_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'neighbors_helped_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'events_joined_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'last_calculated_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_dashboard_stats');
    await queryRunner.dropTable('user_bookmarks');
  }
}
```

**Run migration:**
```bash
npm run migration:run
```

**Verification:**
- [ ] Migration runs successfully
- [ ] Tables are created in database
- [ ] Foreign keys are working
- [ ] Indexes are created

---

#### 1.5.2: Create Entity Classes

**File:** `backend/libs/database/src/entities/user-bookmark.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

@Entity('user_bookmarks')
@Index(['userId', 'itemType', 'itemId'], { unique: true })
export class UserBookmark {
  @ApiProperty({ description: 'Bookmark ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID' })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({
    description: 'Item type',
    enum: ['post', 'listing', 'event'],
  })
  @Column({ name: 'item_type', length: 50 })
  itemType: 'post' | 'listing' | 'event';

  @ApiProperty({ description: 'Item ID' })
  @Column({ name: 'item_id', type: 'uuid' })
  itemId: string;

  @ApiProperty({ description: 'Bookmark creation date' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.bookmarks)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
```

**File:** `backend/libs/database/src/entities/user-dashboard-stats.entity.ts`

```typescript
import {
  Entity,
  Column,
  PrimaryColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

@Entity('user_dashboard_stats')
export class UserDashboardStats {
  @ApiProperty({ description: 'User ID' })
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Number of bookmarks' })
  @Column({ name: 'bookmarks_count', type: 'int', default: 0 })
  bookmarksCount: number;

  @ApiProperty({ description: 'Number of saved deals' })
  @Column({ name: 'saved_deals_count', type: 'int', default: 0 })
  savedDealsCount: number;

  @ApiProperty({ description: 'Number of events attending' })
  @Column({ name: 'attending_events_count', type: 'int', default: 0 })
  attendingEventsCount: number;

  @ApiProperty({ description: 'Number of posts shared' })
  @Column({ name: 'posts_shared_count', type: 'int', default: 0 })
  postsSharedCount: number;

  @ApiProperty({ description: 'Number of neighbors helped' })
  @Column({ name: 'neighbors_helped_count', type: 'int', default: 0 })
  neighborsHelpedCount: number;

  @ApiProperty({ description: 'Number of events joined' })
  @Column({ name: 'events_joined_count', type: 'int', default: 0 })
  eventsJoinedCount: number;

  @ApiProperty({ description: 'Last calculation timestamp' })
  @Column({ name: 'last_calculated_at', type: 'timestamp', nullable: true })
  lastCalculatedAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
```

**Update User Entity:**

**File:** `backend/libs/database/src/entities/user.entity.ts`

Add to User entity:

```typescript
import { UserBookmark } from './user-bookmark.entity';
import { UserDashboardStats } from './user-dashboard-stats.entity';

// Add to User class:
@OneToMany(() => UserBookmark, (bookmark) => bookmark.user)
bookmarks: UserBookmark[];

@OneToOne(() => UserDashboardStats, (stats) => stats.user)
dashboardStats: UserDashboardStats;
```

**Export entities:**

**File:** `backend/libs/database/src/entities/index.ts`

```typescript
export * from './user-bookmark.entity';
export * from './user-dashboard-stats.entity';
// ... other exports
```

**Verification:**
- [ ] Entities compile without errors
- [ ] Relations are properly defined
- [ ] Entities are exported

---

#### 1.5.3: Create Dashboard Statistics Service

**File:** `backend/apps/user-service/src/services/user-statistics.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  User,
  UserBookmark,
  UserDashboardStats,
  Post,
  Event,
} from '@app/database';

export interface DashboardStatsResponse {
  bookmarks: {
    count: number;
    items: Array<{
      id: string;
      type: 'post' | 'listing' | 'event';
      itemId: string;
      createdAt: Date;
    }>;
  };
  savedDeals: {
    count: number;
  };
  events: {
    attending: number;
    organized: number;
    joined: number;
  };
  posts: {
    shared: number;
  };
  community: {
    neighborsHelped: number;
    trustScore: number;
  };
  lastUpdated: Date;
}

@Injectable()
export class UserStatisticsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserBookmark)
    private readonly bookmarkRepository: Repository<UserBookmark>,
    @InjectRepository(UserDashboardStats)
    private readonly statsRepository: Repository<UserDashboardStats>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  /**
   * Get user dashboard statistics
   */
  async getDashboardStats(userId: string): Promise<DashboardStatsResponse> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Get cached stats or calculate
    let stats = await this.statsRepository.findOne({
      where: { userId },
    });

    // If stats don't exist or are stale (>1 hour), recalculate
    const isStale =
      !stats ||
      !stats.lastCalculatedAt ||
      Date.now() - stats.lastCalculatedAt.getTime() > 3600000; // 1 hour

    if (isStale) {
      stats = await this.calculateAndCacheStats(userId);
    }

    // Get recent bookmarks for preview
    const bookmarks = await this.bookmarkRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    // Get event counts
    const attendingEvents = await this.eventRepository.count({
      where: {
        attendees: { id: userId },
      },
    });

    const organizedEvents = await this.eventRepository.count({
      where: { organizerId: userId },
    });

    return {
      bookmarks: {
        count: stats.bookmarksCount,
        items: bookmarks.map(b => ({
          id: b.id,
          type: b.itemType,
          itemId: b.itemId,
          createdAt: b.createdAt,
        })),
      },
      savedDeals: {
        count: stats.savedDealsCount,
      },
      events: {
        attending: attendingEvents,
        organized: organizedEvents,
        joined: stats.eventsJoinedCount,
      },
      posts: {
        shared: stats.postsSharedCount,
      },
      community: {
        neighborsHelped: stats.neighborsHelpedCount,
        trustScore: user.trustScore,
      },
      lastUpdated: stats.updatedAt,
    };
  }

  /**
   * Calculate and cache dashboard statistics
   */
  async calculateAndCacheStats(
    userId: string,
  ): Promise<UserDashboardStats> {
    // Count bookmarks
    const bookmarksCount = await this.bookmarkRepository.count({
      where: { userId },
    });

    // Count bookmarks of type 'listing' (deals)
    const savedDealsCount = await this.bookmarkRepository.count({
      where: { userId, itemType: 'listing' },
    });

    // Count posts
    const postsSharedCount = await this.postRepository.count({
      where: { userId },
    });

    // Count events joined (from event attendees)
    const eventsJoinedCount = await this.eventRepository
      .createQueryBuilder('event')
      .innerJoin('event.attendees', 'attendee')
      .where('attendee.id = :userId', { userId })
      .getCount();

    // TODO: Calculate neighbors helped (requires activity tracking implementation)
    const neighborsHelpedCount = 0; // Placeholder

    // Upsert stats
    let stats = await this.statsRepository.findOne({
      where: { userId },
    });

    if (!stats) {
      stats = this.statsRepository.create({
        userId,
        bookmarksCount,
        savedDealsCount,
        postsSharedCount,
        eventsJoinedCount,
        neighborsHelpedCount,
        attendingEventsCount: 0, // Will be calculated in real-time
        lastCalculatedAt: new Date(),
      });
    } else {
      stats.bookmarksCount = bookmarksCount;
      stats.savedDealsCount = savedDealsCount;
      stats.postsSharedCount = postsSharedCount;
      stats.eventsJoinedCount = eventsJoinedCount;
      stats.neighborsHelpedCount = neighborsHelpedCount;
      stats.lastCalculatedAt = new Date();
    }

    return this.statsRepository.save(stats);
  }

  /**
   * Add bookmark
   */
  async addBookmark(
    userId: string,
    itemType: 'post' | 'listing' | 'event',
    itemId: string,
  ): Promise<UserBookmark> {
    // Check if bookmark already exists
    const existing = await this.bookmarkRepository.findOne({
      where: { userId, itemType, itemId },
    });

    if (existing) {
      return existing;
    }

    // Create new bookmark
    const bookmark = this.bookmarkRepository.create({
      userId,
      itemType,
      itemId,
    });

    const savedBookmark = await this.bookmarkRepository.save(bookmark);

    // Update cached stats
    await this.incrementBookmarkCount(userId, itemType);

    return savedBookmark;
  }

  /**
   * Remove bookmark
   */
  async removeBookmark(
    userId: string,
    itemType: 'post' | 'listing' | 'event',
    itemId: string,
  ): Promise<{ message: string }> {
    const bookmark = await this.bookmarkRepository.findOne({
      where: { userId, itemType, itemId },
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    await this.bookmarkRepository.remove(bookmark);

    // Update cached stats
    await this.decrementBookmarkCount(userId, itemType);

    return { message: 'Bookmark removed successfully' };
  }

  /**
   * Get user bookmarks by type
   */
  async getBookmarksByType(
    userId: string,
    itemType: 'post' | 'listing' | 'event',
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    bookmarks: UserBookmark[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await this.bookmarkRepository.findAndCount({
      where: { userId, itemType },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      bookmarks,
      total,
      page,
      totalPages,
    };
  }

  /**
   * Check if item is bookmarked
   */
  async isBookmarked(
    userId: string,
    itemType: 'post' | 'listing' | 'event',
    itemId: string,
  ): Promise<boolean> {
    const count = await this.bookmarkRepository.count({
      where: { userId, itemType, itemId },
    });

    return count > 0;
  }

  /**
   * Increment bookmark count in cache
   */
  private async incrementBookmarkCount(
    userId: string,
    itemType: 'post' | 'listing' | 'event',
  ): Promise<void> {
    let stats = await this.statsRepository.findOne({
      where: { userId },
    });

    if (!stats) {
      stats = this.statsRepository.create({
        userId,
        bookmarksCount: 1,
        savedDealsCount: itemType === 'listing' ? 1 : 0,
      });
    } else {
      stats.bookmarksCount++;
      if (itemType === 'listing') {
        stats.savedDealsCount++;
      }
    }

    await this.statsRepository.save(stats);
  }

  /**
   * Decrement bookmark count in cache
   */
  private async decrementBookmarkCount(
    userId: string,
    itemType: 'post' | 'listing' | 'event',
  ): Promise<void> {
    const stats = await this.statsRepository.findOne({
      where: { userId },
    });

    if (stats) {
      stats.bookmarksCount = Math.max(0, stats.bookmarksCount - 1);
      if (itemType === 'listing') {
        stats.savedDealsCount = Math.max(0, stats.savedDealsCount - 1);
      }
      await this.statsRepository.save(stats);
    }
  }

  /**
   * Refresh all user statistics (can be run as cron job)
   */
  async refreshAllUserStats(): Promise<{ updated: number }> {
    const users = await this.userRepository.find({
      where: { isActive: true },
      select: ['id'],
    });

    let updated = 0;
    for (const user of users) {
      try {
        await this.calculateAndCacheStats(user.id);
        updated++;
      } catch (error) {
        console.error(`Failed to update stats for user ${user.id}:`, error);
      }
    }

    return { updated };
  }
}
```

**Verification:**
- [ ] Service compiles without errors
- [ ] Dependencies are properly injected
- [ ] Methods work as expected

---

Continuing with the remaining implementation tasks...

## TASK 1.5.4: Add Dashboard Endpoints

**File:** Create new controller `backend/apps/user-service/src/controllers/user-dashboard.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '@app/auth';
import { User } from '@app/database';
import { UserStatisticsService, DashboardStatsResponse } from '../services/user-statistics.service';

@ApiTags('User Dashboard')
@Controller('users/dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserDashboardController {
  constructor(
    private readonly statisticsService: UserStatisticsService,
  ) {}

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
  })
  async getDashboardStats(
    @CurrentUser() user: User,
  ): Promise<DashboardStatsResponse> {
    return this.statisticsService.getDashboardStats(user.id);
  }

  @Post('bookmarks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add bookmark' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        itemType: {
          type: 'string',
          enum: ['post', 'listing', 'event'],
        },
        itemId: { type: 'string', format: 'uuid' },
      },
      required: ['itemType', 'itemId'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Bookmark added successfully',
  })
  async addBookmark(
    @CurrentUser() user: User,
    @Body() body: { itemType: 'post' | 'listing' | 'event'; itemId: string },
  ) {
    return this.statisticsService.addBookmark(
      user.id,
      body.itemType,
      body.itemId,
    );
  }

  @Delete('bookmarks/:itemType/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove bookmark' })
  @ApiParam({ name: 'itemType', enum: ['post', 'listing', 'event'] })
  @ApiParam({ name: 'itemId', description: 'Item ID' })
  @ApiResponse({
    status: 200,
    description: 'Bookmark removed successfully',
  })
  async removeBookmark(
    @CurrentUser() user: User,
    @Param('itemType') itemType: 'post' | 'listing' | 'event',
    @Param('itemId') itemId: string,
  ) {
    return this.statisticsService.removeBookmark(user.id, itemType, itemId);
  }

  @Get('bookmarks/:itemType')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get bookmarks by type' })
  @ApiParam({ name: 'itemType', enum: ['post', 'listing', 'event'] })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({
    status: 200,
    description: 'Bookmarks retrieved successfully',
  })
  async getBookmarks(
    @CurrentUser() user: User,
    @Param('itemType') itemType: 'post' | 'listing' | 'event',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.statisticsService.getBookmarksByType(
      user.id,
      itemType,
      page,
      limit,
    );
  }

  @Get('bookmarks/check/:itemType/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if item is bookmarked' })
  @ApiParam({ name: 'itemType', enum: ['post', 'listing', 'event'] })
  @ApiParam({ name: 'itemId', description: 'Item ID' })
  @ApiResponse({
    status: 200,
    description: 'Bookmark status retrieved',
    schema: {
      type: 'object',
      properties: {
        isBookmarked: { type: 'boolean' },
      },
    },
  })
  async checkBookmark(
    @CurrentUser() user: User,
    @Param('itemType') itemType: 'post' | 'listing' | 'event',
    @Param('itemId') itemId: string,
  ): Promise<{ isBookmarked: boolean }> {
    const isBookmarked = await this.statisticsService.isBookmarked(
      user.id,
      itemType,
      itemId,
    );
    return { isBookmarked };
  }
}
```

**Update Module:**

**File:** `backend/apps/user-service/src/user-service.module.ts`

```typescript
import { UserDashboardController } from './controllers/user-dashboard.controller';
import { UserBookmark, UserDashboardStats, Post, Event } from '@app/database';

// Add to imports array:
TypeOrmModule.forFeature([
  User,
  UserSession,
  UserNeighborhood,
  UserBookmark,           // Add
  UserDashboardStats,     // Add
  Post,                   // Add
  Event,                  // Add
]),

// Add to controllers array:
controllers: [
  UserServiceController,
  UserProfileController,
  UserDashboardController, // Add
],
```

**Verification:**
- [ ] Dashboard endpoints work
- [ ] Bookmarks can be added/removed
- [ ] Statistics are calculated correctly
- [ ] Swagger documentation is complete

---

*Due to length, I'll create a second document for Gap 2 (Verification System). Let me complete this document first...*

---

## Testing Requirements for Gap 1

### Unit Tests

Create test files:

**File:** `backend/apps/user-service/src/services/user-profile.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserProfileService } from './user-profile.service';
import { User } from '@app/database';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('UserProfileService', () => {
  let service: UserProfileService;
  let repository: Repository<User>;

  const mockRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserProfileService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserProfileService>(UserProfileService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should return user profile when user exists', async () => {
      const mockUser = {
        id: 'test-user-id',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getUserById('test-user-id');

      expect(result).toBeDefined();
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        relations: ['userNeighborhoods', 'userNeighborhoods.neighborhood'],
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getUserById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const mockUser = {
        id: 'test-user-id',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      const updateData = {
        firstName: 'Jane',
      };

      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue({ ...mockUser, ...updateData });

      const result = await service.updateProfile('test-user-id', updateData);

      expect(result).toBeDefined();
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });
});
```

**Run tests:**
```bash
npm run test user-profile.service
```

### Integration Tests

**File:** `backend/apps/user-service/test/user-profile.e2e-spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { UserServiceModule } from '../src/user-service.module';

describe('User Profile (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UserServiceModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // TODO: Get auth token from auth service
    // authToken = await getTestAuthToken();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users/me (GET)', () => {
    it('should return current user profile', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email');
          expect(res.body).toHaveProperty('firstName');
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .expect(401);
    });
  });

  describe('/users/me (PUT)', () => {
    it('should update user profile', () => {
      return request(app.getHttpServer())
        .put('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Updated',
          bio: 'Test bio',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.firstName).toBe('Updated');
          expect(res.body.bio).toBe('Test bio');
        });
    });
  });
});
```

**Verification Checklist:**
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Test coverage > 80%
- [ ] Edge cases are tested
- [ ] Error scenarios are tested

---

## Deployment Checklist for Gap 1

### Pre-Deployment

- [ ] All code changes are committed to Git
- [ ] All tests are passing
- [ ] Environment variables are configured
- [ ] Database migrations are ready
- [ ] S3/Spaces bucket is created and configured
- [ ] API documentation is updated (Swagger)

### Database Migration

```bash
# Run in production environment
cd backend
npm run migration:run

# Verify migration
npm run migration:show
```

### Service Deployment

```bash
# Build user service
cd backend
npm run build user-service

# Start service (production)
npm run start:prod
```

### Health Checks

- [ ] User Service health endpoint responds: `GET /health`
- [ ] Database connection is working
- [ ] S3/Spaces connection is working
- [ ] Auth guards are functioning

### API Testing

Test these endpoints after deployment:

```bash
# Health check
curl -X GET https://api.mecabal.com/user-service/health

# Get current user profile (requires auth token)
curl -X GET https://api.mecabal.com/user-service/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update profile
curl -X PUT https://api.mecabal.com/user-service/users/me \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bio": "Updated bio"}'

# Search users
curl -X GET "https://api.mecabal.com/user-service/users/search?query=john&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Monitoring

- [ ] Set up logging for user service
- [ ] Configure error tracking (Sentry/similar)
- [ ] Set up performance monitoring
- [ ] Configure alerts for API failures

---

## Summary of Gap 1 Implementation

### Completed Features

✅ User profile CRUD endpoints
✅ Profile update functionality
✅ Avatar upload with S3/Spaces integration
✅ User search with filters
✅ Dashboard statistics
✅ Bookmarks system
✅ Profile completion tracking

### API Endpoints Created

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me` | Get current user profile |
| GET | `/users/:id` | Get user by ID |
| PUT | `/users/me` | Update current user profile |
| POST | `/users/me/avatar` | Upload avatar |
| DELETE | `/users/me/avatar` | Delete avatar |
| GET | `/users/search` | Search users |
| GET | `/users/nearby` | Get nearby users |
| GET | `/users/me/completion` | Get profile completion |
| GET | `/users/dashboard/stats` | Get dashboard stats |
| POST | `/users/dashboard/bookmarks` | Add bookmark |
| DELETE | `/users/dashboard/bookmarks/:type/:id` | Remove bookmark |

### Database Tables Created

- `user_bookmarks`
- `user_dashboard_stats`

### Next Steps

After completing Gap 1, proceed to Gap 2: Verification System (see next document)

---

*END OF GAP 1 IMPLEMENTATION GUIDE*

