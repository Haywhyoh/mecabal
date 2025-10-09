# User Dashboard & Statistics System - Implementation Guide
**MeCabal Backend Development**
*Date: 2025-10-09*
*Gap 6: User Dashboard & Statistics - Actionable Implementation Steps*

---

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Database Schema Setup](#phase-1-database-schema-setup)
4. [Phase 2: Bookmarks System](#phase-2-bookmarks-system)
5. [Phase 3: Saved Deals System](#phase-3-saved-deals-system)
6. [Phase 4: Activity Tracking System](#phase-4-activity-tracking-system)
7. [Phase 5: Dashboard Statistics Engine](#phase-5-dashboard-statistics-engine)
8. [Phase 6: Neighbors Helped Tracking](#phase-6-neighbors-helped-tracking)
9. [Phase 7: Community Impact Calculation](#phase-7-community-impact-calculation)
10. [Phase 8: Statistics Caching & Optimization](#phase-8-statistics-caching--optimization)
11. [Phase 9: User Service Integration](#phase-9-user-service-integration)
12. [Phase 10: Testing & Performance](#phase-10-testing--performance)
13. [Appendix](#appendix)

---

## Overview

### Current State
**Frontend:** ProfileScreen displays dashboard with bookmarks, saved deals, events, and community impact statistics
**Backend:** ❌ Completely missing - no bookmarks, saved deals, activity tracking, or statistics endpoints

### Goal
Build a complete user dashboard and statistics system that provides:
- Bookmarking for posts, listings, and events
- Saved deals/offers tracking
- User activity aggregation (posts shared, events joined)
- "Neighbors helped" tracking mechanism
- Community impact calculation
- Real-time dashboard statistics

### Estimated Effort
**10 developer days** (2 weeks for 1 developer, 1 week for 2 developers)

---

## Prerequisites

### Required Knowledge
- NestJS services and controllers
- TypeORM entities and relations
- Redis for caching
- Event-driven architecture
- Aggregation queries

### Required Services Running
```bash
# Start development infrastructure
cd backend
docker-compose up -d

# Verify services:
# - PostgreSQL (port 5432)
# - Redis (port 6379)
```

### Dependencies
```bash
cd backend
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/cache-manager cache-manager
npm install @nestjs/event-emitter
```

---

## Phase 1: Database Schema Setup

### Step 1.1: Create Database Entities

**Location:** `backend/libs/database/src/entities/`

#### Create `user-bookmark.entity.ts`
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

export enum BookmarkType {
  POST = 'post',
  LISTING = 'listing',
  EVENT = 'event',
  BUSINESS = 'business',
}

@Entity('user_bookmarks')
@Unique(['userId', 'itemType', 'itemId'])
@Index(['userId', 'itemType'])
@Index(['itemType', 'itemId'])
export class UserBookmark {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: BookmarkType,
  })
  itemType: BookmarkType;

  @Column({ type: 'uuid' })
  itemId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    title?: string;
    preview?: string;
    imageUrl?: string;
  };

  @CreateDateColumn()
  createdAt: Date;
}
```

#### Create `user-saved-deal.entity.ts`
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_saved_deals')
@Unique(['userId', 'dealId'])
@Index(['userId', 'createdAt'])
export class UserSavedDeal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  dealId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  dealType: string; // 'marketplace', 'service', 'event', 'bundle'

  @Column({ type: 'jsonb', nullable: true })
  dealSnapshot: {
    title: string;
    description?: string;
    price?: number;
    discount?: number;
    imageUrl?: string;
    expiryDate?: Date;
  };

  @Column({ type: 'boolean', default: true })
  isActive: boolean; // false if deal expired or removed

  @CreateDateColumn()
  createdAt: Date;
}
```

#### Create `user-activity-log.entity.ts`
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
import { User } from './user.entity';

export enum ActivityType {
  POST_CREATED = 'post_created',
  POST_SHARED = 'post_shared',
  COMMENT_CREATED = 'comment_created',
  HELPFUL_COMMENT = 'helpful_comment',
  EVENT_CREATED = 'event_created',
  EVENT_JOINED = 'event_joined',
  EVENT_ATTENDED = 'event_attended',
  HELP_REQUEST_CREATED = 'help_request_created',
  HELP_REQUEST_FULFILLED = 'help_request_fulfilled',
  NEIGHBOR_HELPED = 'neighbor_helped',
  REVIEW_WRITTEN = 'review_written',
  BUSINESS_INQUIRY = 'business_inquiry',
  RECOMMENDATION_GIVEN = 'recommendation_given',
  SAFETY_REPORT = 'safety_report',
  VERIFICATION_COMPLETED = 'verification_completed',
}

@Entity('user_activity_log')
@Index(['userId', 'activityType', 'createdAt'])
@Index(['activityType', 'createdAt'])
export class UserActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: ActivityType,
  })
  activityType: ActivityType;

  @Column({ type: 'uuid', nullable: true })
  relatedUserId: string; // User who was helped/interacted with

  @Column({ type: 'uuid', nullable: true })
  relatedItemId: string; // ID of post, event, etc.

  @Column({ type: 'varchar', length: 50, nullable: true })
  relatedItemType: string; // 'post', 'event', 'comment', etc.

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    description?: string;
    points?: number;
    category?: string;
    [key: string]: any;
  };

  @Column({ type: 'boolean', default: true })
  countsTowardStats: boolean; // Some activities might not count

  @CreateDateColumn()
  createdAt: Date;
}
```

#### Create `user-dashboard-stats.entity.ts`
```typescript
import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_dashboard_stats')
export class UserDashboardStats {
  @PrimaryColumn({ type: 'uuid' })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Bookmarks & Saved Items
  @Column({ type: 'int', default: 0 })
  bookmarksCount: number;

  @Column({ type: 'int', default: 0 })
  savedDealsCount: number;

  @Column({ type: 'int', default: 0 })
  savedPostsCount: number;

  @Column({ type: 'int', default: 0 })
  savedEventsCount: number;

  @Column({ type: 'int', default: 0 })
  savedListingsCount: number;

  // Events
  @Column({ type: 'int', default: 0 })
  attendingEventsCount: number;

  @Column({ type: 'int', default: 0 })
  eventsJoinedCount: number;

  @Column({ type: 'int', default: 0 })
  eventsCreatedCount: number;

  @Column({ type: 'int', default: 0 })
  eventsAttendedCount: number;

  // Posts & Comments
  @Column({ type: 'int', default: 0 })
  postsSharedCount: number;

  @Column({ type: 'int', default: 0 })
  commentsCount: number;

  @Column({ type: 'int', default: 0 })
  helpfulCommentsCount: number;

  // Community Impact
  @Column({ type: 'int', default: 0 })
  neighborsHelpedCount: number;

  @Column({ type: 'int', default: 0 })
  helpRequestsFulfilledCount: number;

  @Column({ type: 'int', default: 0 })
  recommendationsGivenCount: number;

  @Column({ type: 'int', default: 0 })
  safetyReportsCount: number;

  // Business Activities
  @Column({ type: 'int', default: 0 })
  reviewsWrittenCount: number;

  @Column({ type: 'int', default: 0 })
  businessInquiriesCount: number;

  // Engagement Score (calculated)
  @Column({ type: 'int', default: 0 })
  totalEngagementScore: number;

  // Timestamps
  @Column({ type: 'timestamp', nullable: true })
  lastActivityAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastCalculatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### Create `neighbor-help-interaction.entity.ts`
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
import { User } from './user.entity';

export enum HelpType {
  HELP_REQUEST = 'help_request',
  HELPFUL_COMMENT = 'helpful_comment',
  DIRECT_ASSISTANCE = 'direct_assistance',
  RECOMMENDATION = 'recommendation',
  REFERRAL = 'referral',
  INFORMATION_SHARED = 'information_shared',
}

@Entity('neighbor_help_interactions')
@Index(['helperId', 'createdAt'])
@Index(['helpedUserId', 'createdAt'])
export class NeighborHelpInteraction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  helperId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'helperId' })
  helper: User;

  @Column({ type: 'uuid' })
  helpedUserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'helpedUserId' })
  helpedUser: User;

  @Column({
    type: 'enum',
    enum: HelpType,
  })
  helpType: HelpType;

  @Column({ type: 'uuid', nullable: true })
  relatedItemId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  relatedItemType: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  wasAcknowledged: boolean; // Did helped user acknowledge/thank?

  @Column({ type: 'boolean', default: true })
  countsTowardStats: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
```

### Step 1.2: Export New Entities

**Location:** `backend/libs/database/src/entities/index.ts`

```typescript
// Add these exports
export * from './user-bookmark.entity';
export * from './user-saved-deal.entity';
export * from './user-activity-log.entity';
export * from './user-dashboard-stats.entity';
export * from './neighbor-help-interaction.entity';
```

### Step 1.3: Generate and Run Migration

```bash
cd backend

# Generate migration
npm run migration:generate -- -n CreateDashboardAndStatsTables

# Review generated migration in:
# backend/libs/database/src/migrations/

# Run migration
npm run migration:run
```

### Step 1.4: Initialize Dashboard Stats for Existing Users

Create a migration script:

**Location:** `backend/libs/database/src/scripts/initialize-dashboard-stats.ts`

```typescript
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserDashboardStats } from '../entities/user-dashboard-stats.entity';

export async function initializeDashboardStats(dataSource: DataSource) {
  const userRepo = dataSource.getRepository(User);
  const statsRepo = dataSource.getRepository(UserDashboardStats);

  const users = await userRepo.find();

  for (const user of users) {
    const existingStats = await statsRepo.findOne({
      where: { userId: user.id },
    });

    if (!existingStats) {
      const stats = statsRepo.create({
        userId: user.id,
        lastCalculatedAt: new Date(),
      });
      await statsRepo.save(stats);
      console.log(`✅ Created dashboard stats for user ${user.id}`);
    }
  }

  console.log(`✅ Initialized dashboard stats for ${users.length} users`);
}
```

---

## Phase 2: Bookmarks System

### Step 2.1: Create Bookmark DTOs

**Location:** `backend/libs/validation/src/dtos/dashboard/`

#### `create-bookmark.dto.ts`
```typescript
import { IsEnum, IsUUID, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookmarkType } from '@app/database/entities/user-bookmark.entity';

export class CreateBookmarkDto {
  @ApiProperty({ enum: BookmarkType, example: BookmarkType.POST })
  @IsEnum(BookmarkType)
  itemType: BookmarkType;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  itemId: string;

  @ApiPropertyOptional({
    example: {
      title: 'Community Event Planning',
      preview: 'Join us for planning...',
      imageUrl: 'https://example.com/image.jpg',
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: {
    title?: string;
    preview?: string;
    imageUrl?: string;
  };
}
```

#### `bookmark-list-query.dto.ts`
```typescript
import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BookmarkType } from '@app/database/entities/user-bookmark.entity';

export class BookmarkListQueryDto {
  @ApiPropertyOptional({ enum: BookmarkType })
  @IsOptional()
  @IsEnum(BookmarkType)
  itemType?: BookmarkType;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
```

### Step 2.2: Create Bookmark Service

**Location:** `backend/apps/user-service/src/bookmarks/bookmarks.service.ts`

```typescript
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserBookmark, BookmarkType } from '@app/database/entities/user-bookmark.entity';
import { CreateBookmarkDto } from '@app/validation/dtos/dashboard/create-bookmark.dto';
import { BookmarkListQueryDto } from '@app/validation/dtos/dashboard/bookmark-list-query.dto';

@Injectable()
export class BookmarksService {
  constructor(
    @InjectRepository(UserBookmark)
    private bookmarkRepo: Repository<UserBookmark>,
  ) {}

  async create(userId: string, createDto: CreateBookmarkDto): Promise<UserBookmark> {
    // Check if bookmark already exists
    const existing = await this.bookmarkRepo.findOne({
      where: {
        userId,
        itemType: createDto.itemType,
        itemId: createDto.itemId,
      },
    });

    if (existing) {
      throw new ConflictException('Item is already bookmarked');
    }

    const bookmark = this.bookmarkRepo.create({
      userId,
      ...createDto,
    });

    return await this.bookmarkRepo.save(bookmark);
  }

  async findAll(
    userId: string,
    query: BookmarkListQueryDto,
  ): Promise<{ bookmarks: UserBookmark[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, itemType } = query;
    const skip = (page - 1) * limit;

    const whereCondition: any = { userId };
    if (itemType) {
      whereCondition.itemType = itemType;
    }

    const [bookmarks, total] = await this.bookmarkRepo.findAndCount({
      where: whereCondition,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      bookmarks,
      total,
      page,
      limit,
    };
  }

  async findByItemId(
    userId: string,
    itemType: BookmarkType,
    itemId: string,
  ): Promise<UserBookmark | null> {
    return await this.bookmarkRepo.findOne({
      where: { userId, itemType, itemId },
    });
  }

  async isBookmarked(
    userId: string,
    itemType: BookmarkType,
    itemId: string,
  ): Promise<boolean> {
    const bookmark = await this.findByItemId(userId, itemType, itemId);
    return !!bookmark;
  }

  async remove(
    userId: string,
    itemType: BookmarkType,
    itemId: string,
  ): Promise<void> {
    const bookmark = await this.bookmarkRepo.findOne({
      where: { userId, itemType, itemId },
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    await this.bookmarkRepo.remove(bookmark);
  }

  async countByUser(userId: string): Promise<number> {
    return await this.bookmarkRepo.count({ where: { userId } });
  }

  async countByUserAndType(userId: string, itemType: BookmarkType): Promise<number> {
    return await this.bookmarkRepo.count({ where: { userId, itemType } });
  }
}
```

### Step 2.3: Create Bookmark Controller

**Location:** `backend/apps/user-service/src/bookmarks/bookmarks.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
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
import { BookmarksService } from './bookmarks.service';
import { CreateBookmarkDto } from '@app/validation/dtos/dashboard/create-bookmark.dto';
import { BookmarkListQueryDto } from '@app/validation/dtos/dashboard/bookmark-list-query.dto';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';
import { BookmarkType } from '@app/database/entities/user-bookmark.entity';

@ApiTags('Bookmarks')
@Controller('users/me/bookmarks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post()
  @ApiOperation({ summary: 'Add a bookmark' })
  @ApiResponse({ status: 201, description: 'Bookmark created successfully' })
  @ApiResponse({ status: 409, description: 'Item already bookmarked' })
  async create(@Request() req, @Body() createDto: CreateBookmarkDto) {
    const bookmark = await this.bookmarksService.create(
      req.user.userId,
      createDto,
    );
    return {
      success: true,
      message: 'Bookmark added successfully',
      data: bookmark,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get user bookmarks' })
  @ApiResponse({ status: 200, description: 'Bookmarks retrieved successfully' })
  async findAll(@Request() req, @Query() query: BookmarkListQueryDto) {
    const result = await this.bookmarksService.findAll(req.user.userId, query);
    return {
      success: true,
      data: result.bookmarks,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  @Get('check/:itemType/:itemId')
  @ApiOperation({ summary: 'Check if item is bookmarked' })
  @ApiResponse({ status: 200, description: 'Bookmark status checked' })
  async checkBookmark(
    @Request() req,
    @Param('itemType') itemType: BookmarkType,
    @Param('itemId') itemId: string,
  ) {
    const isBookmarked = await this.bookmarksService.isBookmarked(
      req.user.userId,
      itemType,
      itemId,
    );
    return {
      success: true,
      data: { isBookmarked },
    };
  }

  @Delete(':itemType/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a bookmark' })
  @ApiResponse({ status: 204, description: 'Bookmark removed successfully' })
  @ApiResponse({ status: 404, description: 'Bookmark not found' })
  async remove(
    @Request() req,
    @Param('itemType') itemType: BookmarkType,
    @Param('itemId') itemId: string,
  ) {
    await this.bookmarksService.remove(req.user.userId, itemType, itemId);
  }
}
```

---

## Phase 3: Saved Deals System

### Step 3.1: Create Saved Deals DTOs

**Location:** `backend/libs/validation/src/dtos/dashboard/`

#### `create-saved-deal.dto.ts`
```typescript
import { IsUUID, IsOptional, IsString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSavedDealDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  dealId: string;

  @ApiPropertyOptional({ example: 'marketplace' })
  @IsOptional()
  @IsString()
  dealType?: string;

  @ApiPropertyOptional({
    example: {
      title: 'Flash Sale - Electronics',
      price: 50000,
      discount: 20,
      imageUrl: 'https://example.com/deal.jpg',
    },
  })
  @IsOptional()
  @IsObject()
  dealSnapshot?: {
    title: string;
    description?: string;
    price?: number;
    discount?: number;
    imageUrl?: string;
    expiryDate?: Date;
  };
}
```

### Step 3.2: Create Saved Deals Service

**Location:** `backend/apps/user-service/src/saved-deals/saved-deals.service.ts`

```typescript
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSavedDeal } from '@app/database/entities/user-saved-deal.entity';
import { CreateSavedDealDto } from '@app/validation/dtos/dashboard/create-saved-deal.dto';

@Injectable()
export class SavedDealsService {
  constructor(
    @InjectRepository(UserSavedDeal)
    private savedDealRepo: Repository<UserSavedDeal>,
  ) {}

  async create(userId: string, createDto: CreateSavedDealDto): Promise<UserSavedDeal> {
    const existing = await this.savedDealRepo.findOne({
      where: { userId, dealId: createDto.dealId },
    });

    if (existing) {
      throw new ConflictException('Deal is already saved');
    }

    const savedDeal = this.savedDealRepo.create({
      userId,
      ...createDto,
    });

    return await this.savedDealRepo.save(savedDeal);
  }

  async findAll(userId: string, activeOnly = true): Promise<UserSavedDeal[]> {
    const whereCondition: any = { userId };
    if (activeOnly) {
      whereCondition.isActive = true;
    }

    return await this.savedDealRepo.find({
      where: whereCondition,
      order: { createdAt: 'DESC' },
    });
  }

  async remove(userId: string, dealId: string): Promise<void> {
    const savedDeal = await this.savedDealRepo.findOne({
      where: { userId, dealId },
    });

    if (!savedDeal) {
      throw new NotFoundException('Saved deal not found');
    }

    await this.savedDealRepo.remove(savedDeal);
  }

  async markAsInactive(dealId: string): Promise<void> {
    await this.savedDealRepo.update({ dealId }, { isActive: false });
  }

  async countByUser(userId: string, activeOnly = true): Promise<number> {
    const whereCondition: any = { userId };
    if (activeOnly) {
      whereCondition.isActive = true;
    }
    return await this.savedDealRepo.count({ where: whereCondition });
  }
}
```

### Step 3.3: Create Saved Deals Controller

**Location:** `backend/apps/user-service/src/saved-deals/saved-deals.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SavedDealsService } from './saved-deals.service';
import { CreateSavedDealDto } from '@app/validation/dtos/dashboard/create-saved-deal.dto';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';

@ApiTags('Saved Deals')
@Controller('users/me/saved-deals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SavedDealsController {
  constructor(private readonly savedDealsService: SavedDealsService) {}

  @Post()
  @ApiOperation({ summary: 'Save a deal/offer' })
  @ApiResponse({ status: 201, description: 'Deal saved successfully' })
  @ApiResponse({ status: 409, description: 'Deal already saved' })
  async create(@Request() req, @Body() createDto: CreateSavedDealDto) {
    const savedDeal = await this.savedDealsService.create(
      req.user.userId,
      createDto,
    );
    return {
      success: true,
      message: 'Deal saved successfully',
      data: savedDeal,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get user saved deals' })
  @ApiResponse({ status: 200, description: 'Saved deals retrieved' })
  async findAll(
    @Request() req,
    @Query('activeOnly', new ParseBoolPipe({ optional: true }))
    activeOnly = true,
  ) {
    const deals = await this.savedDealsService.findAll(
      req.user.userId,
      activeOnly,
    );
    return {
      success: true,
      data: deals,
    };
  }

  @Delete(':dealId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a saved deal' })
  @ApiResponse({ status: 204, description: 'Deal removed successfully' })
  @ApiResponse({ status: 404, description: 'Saved deal not found' })
  async remove(@Request() req, @Param('dealId') dealId: string) {
    await this.savedDealsService.remove(req.user.userId, dealId);
  }
}
```

---

## Phase 4: Activity Tracking System

### Step 4.1: Create Activity Tracking Service

**Location:** `backend/apps/user-service/src/activity/activity-tracking.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  UserActivityLog,
  ActivityType,
} from '@app/database/entities/user-activity-log.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface LogActivityParams {
  userId: string;
  activityType: ActivityType;
  relatedUserId?: string;
  relatedItemId?: string;
  relatedItemType?: string;
  metadata?: Record<string, any>;
  countsTowardStats?: boolean;
}

@Injectable()
export class ActivityTrackingService {
  constructor(
    @InjectRepository(UserActivityLog)
    private activityRepo: Repository<UserActivityLog>,
    private eventEmitter: EventEmitter2,
  ) {}

  async logActivity(params: LogActivityParams): Promise<UserActivityLog> {
    const activity = this.activityRepo.create({
      ...params,
      countsTowardStats: params.countsTowardStats ?? true,
    });

    const saved = await this.activityRepo.save(activity);

    // Emit event for statistics update
    this.eventEmitter.emit('activity.logged', {
      userId: params.userId,
      activityType: params.activityType,
      activity: saved,
    });

    return saved;
  }

  async getUserActivities(
    userId: string,
    limit = 50,
  ): Promise<UserActivityLog[]> {
    return await this.activityRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async countActivitiesByType(
    userId: string,
    activityType: ActivityType,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const whereCondition: any = { userId, activityType, countsTowardStats: true };

    if (startDate && endDate) {
      whereCondition.createdAt = Between(startDate, endDate);
    }

    return await this.activityRepo.count({ where: whereCondition });
  }

  async getActivitiesByType(
    userId: string,
    activityType: ActivityType,
    limit = 100,
  ): Promise<UserActivityLog[]> {
    return await this.activityRepo.find({
      where: { userId, activityType },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getRecentActivities(
    userId: string,
    days = 30,
    limit = 100,
  ): Promise<UserActivityLog[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await this.activityRepo.find({
      where: {
        userId,
        createdAt: Between(startDate, new Date()),
      },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // Helper methods for specific activities
  async logPostCreated(userId: string, postId: string): Promise<void> {
    await this.logActivity({
      userId,
      activityType: ActivityType.POST_CREATED,
      relatedItemId: postId,
      relatedItemType: 'post',
    });
  }

  async logEventJoined(userId: string, eventId: string): Promise<void> {
    await this.logActivity({
      userId,
      activityType: ActivityType.EVENT_JOINED,
      relatedItemId: eventId,
      relatedItemType: 'event',
    });
  }

  async logNeighborHelped(
    helperId: string,
    helpedUserId: string,
    itemId?: string,
  ): Promise<void> {
    await this.logActivity({
      userId: helperId,
      activityType: ActivityType.NEIGHBOR_HELPED,
      relatedUserId: helpedUserId,
      relatedItemId: itemId,
    });
  }
}
```

### Step 4.2: Create Activity Event Listeners

**Location:** `backend/apps/user-service/src/activity/activity.listener.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ActivityTrackingService } from './activity-tracking.service';
import { ActivityType } from '@app/database/entities/user-activity-log.entity';

@Injectable()
export class ActivityListener {
  constructor(
    private readonly activityTrackingService: ActivityTrackingService,
  ) {}

  @OnEvent('post.created')
  async handlePostCreated(payload: { userId: string; postId: string }) {
    await this.activityTrackingService.logPostCreated(
      payload.userId,
      payload.postId,
    );
  }

  @OnEvent('event.joined')
  async handleEventJoined(payload: { userId: string; eventId: string }) {
    await this.activityTrackingService.logEventJoined(
      payload.userId,
      payload.eventId,
    );
  }

  @OnEvent('comment.marked-helpful')
  async handleHelpfulComment(payload: {
    userId: string;
    commentId: string;
    postId: string;
  }) {
    await this.activityTrackingService.logActivity({
      userId: payload.userId,
      activityType: ActivityType.HELPFUL_COMMENT,
      relatedItemId: payload.commentId,
      relatedItemType: 'comment',
      metadata: { postId: payload.postId },
    });
  }

  @OnEvent('help-request.fulfilled')
  async handleHelpRequestFulfilled(payload: {
    fulfillerId: string;
    requesterId: string;
    helpRequestId: string;
  }) {
    await this.activityTrackingService.logActivity({
      userId: payload.fulfillerId,
      activityType: ActivityType.HELP_REQUEST_FULFILLED,
      relatedUserId: payload.requesterId,
      relatedItemId: payload.helpRequestId,
      relatedItemType: 'help_request',
    });

    await this.activityTrackingService.logNeighborHelped(
      payload.fulfillerId,
      payload.requesterId,
      payload.helpRequestId,
    );
  }
}
```

---

## Phase 5: Dashboard Statistics Engine

### Step 5.1: Create Statistics Service

**Location:** `backend/apps/user-service/src/statistics/statistics.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserDashboardStats } from '@app/database/entities/user-dashboard-stats.entity';
import { BookmarksService } from '../bookmarks/bookmarks.service';
import { SavedDealsService } from '../saved-deals/saved-deals.service';
import { ActivityTrackingService } from '../activity/activity-tracking.service';
import { ActivityType } from '@app/database/entities/user-activity-log.entity';
import { BookmarkType } from '@app/database/entities/user-bookmark.entity';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(UserDashboardStats)
    private statsRepo: Repository<UserDashboardStats>,
    private bookmarksService: BookmarksService,
    private savedDealsService: SavedDealsService,
    private activityTrackingService: ActivityTrackingService,
  ) {}

  async getOrCreateStats(userId: string): Promise<UserDashboardStats> {
    let stats = await this.statsRepo.findOne({ where: { userId } });

    if (!stats) {
      stats = this.statsRepo.create({ userId });
      await this.statsRepo.save(stats);
    }

    return stats;
  }

  async calculateAndUpdateStats(userId: string): Promise<UserDashboardStats> {
    const stats = await this.getOrCreateStats(userId);

    // Bookmarks
    stats.bookmarksCount = await this.bookmarksService.countByUser(userId);
    stats.savedPostsCount = await this.bookmarksService.countByUserAndType(
      userId,
      BookmarkType.POST,
    );
    stats.savedEventsCount = await this.bookmarksService.countByUserAndType(
      userId,
      BookmarkType.EVENT,
    );
    stats.savedListingsCount = await this.bookmarksService.countByUserAndType(
      userId,
      BookmarkType.LISTING,
    );

    // Saved Deals
    stats.savedDealsCount = await this.savedDealsService.countByUser(userId);

    // Posts & Comments
    stats.postsSharedCount =
      await this.activityTrackingService.countActivitiesByType(
        userId,
        ActivityType.POST_CREATED,
      );
    stats.commentsCount =
      await this.activityTrackingService.countActivitiesByType(
        userId,
        ActivityType.COMMENT_CREATED,
      );
    stats.helpfulCommentsCount =
      await this.activityTrackingService.countActivitiesByType(
        userId,
        ActivityType.HELPFUL_COMMENT,
      );

    // Events
    stats.eventsJoinedCount =
      await this.activityTrackingService.countActivitiesByType(
        userId,
        ActivityType.EVENT_JOINED,
      );
    stats.eventsCreatedCount =
      await this.activityTrackingService.countActivitiesByType(
        userId,
        ActivityType.EVENT_CREATED,
      );
    stats.eventsAttendedCount =
      await this.activityTrackingService.countActivitiesByType(
        userId,
        ActivityType.EVENT_ATTENDED,
      );

    // Community Impact
    stats.neighborsHelpedCount =
      await this.activityTrackingService.countActivitiesByType(
        userId,
        ActivityType.NEIGHBOR_HELPED,
      );
    stats.helpRequestsFulfilledCount =
      await this.activityTrackingService.countActivitiesByType(
        userId,
        ActivityType.HELP_REQUEST_FULFILLED,
      );
    stats.recommendationsGivenCount =
      await this.activityTrackingService.countActivitiesByType(
        userId,
        ActivityType.RECOMMENDATION_GIVEN,
      );
    stats.safetyReportsCount =
      await this.activityTrackingService.countActivitiesByType(
        userId,
        ActivityType.SAFETY_REPORT,
      );

    // Business Activities
    stats.reviewsWrittenCount =
      await this.activityTrackingService.countActivitiesByType(
        userId,
        ActivityType.REVIEW_WRITTEN,
      );
    stats.businessInquiriesCount =
      await this.activityTrackingService.countActivitiesByType(
        userId,
        ActivityType.BUSINESS_INQUIRY,
      );

    // Calculate engagement score
    stats.totalEngagementScore = this.calculateEngagementScore(stats);

    stats.lastCalculatedAt = new Date();
    return await this.statsRepo.save(stats);
  }

  private calculateEngagementScore(stats: UserDashboardStats): number {
    // Weighted engagement scoring
    const weights = {
      postsShared: 5,
      eventsJoined: 3,
      neighborsHelped: 10,
      helpfulComments: 2,
      eventsCreated: 15,
      helpRequestsFulfilled: 12,
      safetyReports: 8,
      reviewsWritten: 3,
    };

    return (
      stats.postsSharedCount * weights.postsShared +
      stats.eventsJoinedCount * weights.eventsJoined +
      stats.neighborsHelpedCount * weights.neighborsHelped +
      stats.helpfulCommentsCount * weights.helpfulComments +
      stats.eventsCreatedCount * weights.eventsCreated +
      stats.helpRequestsFulfilledCount * weights.helpRequestsFulfilled +
      stats.safetyReportsCount * weights.safetyReports +
      stats.reviewsWrittenCount * weights.reviewsWritten
    );
  }

  async incrementStat(
    userId: string,
    field: keyof UserDashboardStats,
    amount = 1,
  ): Promise<void> {
    await this.statsRepo.increment({ userId }, field, amount);
    await this.statsRepo.update(
      { userId },
      { lastCalculatedAt: new Date() },
    );
  }

  async getDashboardStats(userId: string): Promise<UserDashboardStats> {
    const stats = await this.getOrCreateStats(userId);

    // Check if stats need refresh (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (!stats.lastCalculatedAt || stats.lastCalculatedAt < oneHourAgo) {
      return await this.calculateAndUpdateStats(userId);
    }

    return stats;
  }
}
```

### Step 5.2: Create Dashboard Controller

**Location:** `backend/apps/user-service/src/dashboard/dashboard.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StatisticsService } from '../statistics/statistics.service';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';

@ApiTags('Dashboard')
@Controller('users/me/dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved' })
  async getDashboard(@Request() req) {
    const stats = await this.statisticsService.getDashboardStats(
      req.user.userId,
    );
    return {
      success: true,
      data: stats,
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Force refresh dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats refreshed' })
  async refreshDashboard(@Request() req) {
    const stats = await this.statisticsService.calculateAndUpdateStats(
      req.user.userId,
    );
    return {
      success: true,
      message: 'Dashboard statistics refreshed',
      data: stats,
    };
  }
}
```

---

## Phase 6: Neighbors Helped Tracking

### Step 6.1: Create Neighbor Help Service

**Location:** `backend/apps/user-service/src/neighbor-help/neighbor-help.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NeighborHelpInteraction,
  HelpType,
} from '@app/database/entities/neighbor-help-interaction.entity';
import { ActivityTrackingService } from '../activity/activity-tracking.service';
import { ActivityType } from '@app/database/entities/user-activity-log.entity';

export interface RecordHelpParams {
  helperId: string;
  helpedUserId: string;
  helpType: HelpType;
  relatedItemId?: string;
  relatedItemType?: string;
  description?: string;
}

@Injectable()
export class NeighborHelpService {
  constructor(
    @InjectRepository(NeighborHelpInteraction)
    private helpRepo: Repository<NeighborHelpInteraction>,
    private activityTrackingService: ActivityTrackingService,
  ) {}

  async recordHelp(params: RecordHelpParams): Promise<NeighborHelpInteraction> {
    const help = this.helpRepo.create(params);
    const saved = await this.helpRepo.save(help);

    // Log as activity
    await this.activityTrackingService.logActivity({
      userId: params.helperId,
      activityType: ActivityType.NEIGHBOR_HELPED,
      relatedUserId: params.helpedUserId,
      relatedItemId: params.relatedItemId,
      relatedItemType: params.relatedItemType,
      metadata: {
        helpType: params.helpType,
        description: params.description,
      },
    });

    return saved;
  }

  async acknowledgeHelp(helpId: string): Promise<void> {
    await this.helpRepo.update({ id: helpId }, { wasAcknowledged: true });
  }

  async countHelpsByHelper(helperId: string): Promise<number> {
    return await this.helpRepo.count({
      where: { helperId, countsTowardStats: true },
    });
  }

  async getHelpsProvidedByUser(
    helperId: string,
    limit = 50,
  ): Promise<NeighborHelpInteraction[]> {
    return await this.helpRepo.find({
      where: { helperId },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['helpedUser'],
    });
  }

  async getHelpsReceivedByUser(
    helpedUserId: string,
    limit = 50,
  ): Promise<NeighborHelpInteraction[]> {
    return await this.helpRepo.find({
      where: { helpedUserId },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['helper'],
    });
  }
}
```

---

## Phase 7: Community Impact Calculation

### Step 7.1: Create Community Impact Service

**Location:** `backend/apps/user-service/src/community-impact/community-impact.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { StatisticsService } from '../statistics/statistics.service';
import { NeighborHelpService } from '../neighbor-help/neighbor-help.service';
import { ActivityTrackingService } from '../activity/activity-tracking.service';

export interface CommunityImpact {
  postsShared: number;
  neighborsHelped: number;
  eventsJoined: number;
  eventsCreated: number;
  helpRequestsFulfilled: number;
  safetyReports: number;
  totalEngagementScore: number;
  impactLevel: string;
  impactDescription: string;
}

@Injectable()
export class CommunityImpactService {
  constructor(
    private statisticsService: StatisticsService,
    private neighborHelpService: NeighborHelpService,
    private activityTrackingService: ActivityTrackingService,
  ) {}

  async calculateCommunityImpact(userId: string): Promise<CommunityImpact> {
    const stats = await this.statisticsService.getDashboardStats(userId);

    const impact: CommunityImpact = {
      postsShared: stats.postsSharedCount,
      neighborsHelped: stats.neighborsHelpedCount,
      eventsJoined: stats.eventsJoinedCount,
      eventsCreated: stats.eventsCreatedCount,
      helpRequestsFulfilled: stats.helpRequestsFulfilledCount,
      safetyReports: stats.safetyReportsCount,
      totalEngagementScore: stats.totalEngagementScore,
      impactLevel: this.calculateImpactLevel(stats.totalEngagementScore),
      impactDescription: this.getImpactDescription(stats.totalEngagementScore),
    };

    return impact;
  }

  private calculateImpactLevel(score: number): string {
    if (score >= 500) return 'Community Legend';
    if (score >= 300) return 'Active Contributor';
    if (score >= 150) return 'Helpful Neighbor';
    if (score >= 50) return 'Engaged Member';
    return 'New Member';
  }

  private getImpactDescription(score: number): string {
    if (score >= 500)
      return 'You are a pillar of the community with exceptional contributions';
    if (score >= 300)
      return 'You actively contribute and help make the community better';
    if (score >= 150)
      return 'You regularly help neighbors and participate in community activities';
    if (score >= 50)
      return 'You are building connections and contributing to the community';
    return 'Welcome! Start engaging to make an impact';
  }

  async getDetailedImpact(userId: string) {
    const impact = await this.calculateCommunityImpact(userId);
    const helpsProvided = await this.neighborHelpService.getHelpsProvidedByUser(
      userId,
      10,
    );
    const recentActivities =
      await this.activityTrackingService.getRecentActivities(userId, 30, 20);

    return {
      ...impact,
      recentHelps: helpsProvided,
      recentActivities,
    };
  }
}
```

### Step 7.2: Create Community Impact Controller

**Location:** `backend/apps/user-service/src/community-impact/community-impact.controller.ts`

```typescript
import {
  Controller,
  Get,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CommunityImpactService } from './community-impact.service';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';

@ApiTags('Community Impact')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommunityImpactController {
  constructor(
    private readonly communityImpactService: CommunityImpactService,
  ) {}

  @Get('me/community-impact')
  @ApiOperation({ summary: 'Get current user community impact' })
  @ApiResponse({ status: 200, description: 'Community impact retrieved' })
  async getMyImpact(@Request() req) {
    const impact = await this.communityImpactService.calculateCommunityImpact(
      req.user.userId,
    );
    return {
      success: true,
      data: impact,
    };
  }

  @Get('me/community-impact/detailed')
  @ApiOperation({ summary: 'Get detailed community impact with activity history' })
  @ApiResponse({ status: 200, description: 'Detailed impact retrieved' })
  async getDetailedImpact(@Request() req) {
    const impact = await this.communityImpactService.getDetailedImpact(
      req.user.userId,
    );
    return {
      success: true,
      data: impact,
    };
  }

  @Get(':userId/community-impact')
  @ApiOperation({ summary: 'Get another user\'s community impact' })
  @ApiResponse({ status: 200, description: 'Community impact retrieved' })
  async getUserImpact(@Param('userId') userId: string) {
    const impact = await this.communityImpactService.calculateCommunityImpact(
      userId,
    );
    return {
      success: true,
      data: impact,
    };
  }
}
```

---

## Phase 8: Statistics Caching & Optimization

### Step 8.1: Implement Redis Caching

**Location:** `backend/apps/user-service/src/statistics/statistics-cache.service.ts`

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { UserDashboardStats } from '@app/database/entities/user-dashboard-stats.entity';

@Injectable()
export class StatisticsCacheService {
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly CACHE_PREFIX = 'user:stats:';

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getCachedStats(userId: string): Promise<UserDashboardStats | null> {
    return await this.cacheManager.get<UserDashboardStats>(
      `${this.CACHE_PREFIX}${userId}`,
    );
  }

  async setCachedStats(
    userId: string,
    stats: UserDashboardStats,
  ): Promise<void> {
    await this.cacheManager.set(
      `${this.CACHE_PREFIX}${userId}`,
      stats,
      this.CACHE_TTL,
    );
  }

  async invalidateStatsCache(userId: string): Promise<void> {
    await this.cacheManager.del(`${this.CACHE_PREFIX}${userId}`);
  }

  async invalidateMultipleStatsCache(userIds: string[]): Promise<void> {
    const keys = userIds.map((id) => `${this.CACHE_PREFIX}${id}`);
    await Promise.all(keys.map((key) => this.cacheManager.del(key)));
  }
}
```

### Step 8.2: Update Statistics Service with Caching

**Location:** Update `backend/apps/user-service/src/statistics/statistics.service.ts`

```typescript
// Add to StatisticsService class

async getDashboardStats(userId: string): Promise<UserDashboardStats> {
  // Try cache first
  const cached = await this.statisticsCacheService.getCachedStats(userId);
  if (cached) {
    return cached;
  }

  // Get from database
  const stats = await this.getOrCreateStats(userId);

  // Check if stats need refresh (older than 1 hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  if (!stats.lastCalculatedAt || stats.lastCalculatedAt < oneHourAgo) {
    const refreshed = await this.calculateAndUpdateStats(userId);
    await this.statisticsCacheService.setCachedStats(userId, refreshed);
    return refreshed;
  }

  // Cache current stats
  await this.statisticsCacheService.setCachedStats(userId, stats);
  return stats;
}
```

### Step 8.3: Create Statistics Event Listener

**Location:** `backend/apps/user-service/src/statistics/statistics.listener.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { StatisticsService } from './statistics.service';
import { StatisticsCacheService } from './statistics-cache.service';

@Injectable()
export class StatisticsListener {
  constructor(
    private readonly statisticsService: StatisticsService,
    private readonly statisticsCacheService: StatisticsCacheService,
  ) {}

  @OnEvent('activity.logged')
  async handleActivityLogged(payload: { userId: string; activityType: string }) {
    // Invalidate cache when new activity is logged
    await this.statisticsCacheService.invalidateStatsCache(payload.userId);

    // Optionally: Increment specific stat field for performance
    // await this.statisticsService.incrementStat(payload.userId, 'postsSharedCount');
  }

  @OnEvent('bookmark.created')
  async handleBookmarkCreated(payload: { userId: string }) {
    await this.statisticsCacheService.invalidateStatsCache(payload.userId);
  }

  @OnEvent('bookmark.deleted')
  async handleBookmarkDeleted(payload: { userId: string }) {
    await this.statisticsCacheService.invalidateStatsCache(payload.userId);
  }

  @OnEvent('deal.saved')
  async handleDealSaved(payload: { userId: string }) {
    await this.statisticsCacheService.invalidateStatsCache(payload.userId);
  }

  @OnEvent('deal.unsaved')
  async handleDealUnsaved(payload: { userId: string }) {
    await this.statisticsCacheService.invalidateStatsCache(payload.userId);
  }
}
```

---

## Phase 9: User Service Integration

### Step 9.1: Create User Service Module

**Location:** `backend/apps/user-service/src/user-service.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

// Entities
import { User } from '@app/database/entities/user.entity';
import { UserBookmark } from '@app/database/entities/user-bookmark.entity';
import { UserSavedDeal } from '@app/database/entities/user-saved-deal.entity';
import { UserActivityLog } from '@app/database/entities/user-activity-log.entity';
import { UserDashboardStats } from '@app/database/entities/user-dashboard-stats.entity';
import { NeighborHelpInteraction } from '@app/database/entities/neighbor-help-interaction.entity';

// Services
import { BookmarksService } from './bookmarks/bookmarks.service';
import { SavedDealsService } from './saved-deals/saved-deals.service';
import { ActivityTrackingService } from './activity/activity-tracking.service';
import { StatisticsService } from './statistics/statistics.service';
import { StatisticsCacheService } from './statistics/statistics-cache.service';
import { NeighborHelpService } from './neighbor-help/neighbor-help.service';
import { CommunityImpactService } from './community-impact/community-impact.service';

// Controllers
import { BookmarksController } from './bookmarks/bookmarks.controller';
import { SavedDealsController } from './saved-deals/saved-deals.controller';
import { DashboardController } from './dashboard/dashboard.controller';
import { CommunityImpactController } from './community-impact/community-impact.controller';

// Listeners
import { ActivityListener } from './activity/activity.listener';
import { StatisticsListener } from './statistics/statistics.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserBookmark,
      UserSavedDeal,
      UserActivityLog,
      UserDashboardStats,
      NeighborHelpInteraction,
    ]),
    EventEmitterModule.forRoot(),
    CacheModule.register({
      store: redisStore as any,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      ttl: 3600,
    }),
  ],
  controllers: [
    BookmarksController,
    SavedDealsController,
    DashboardController,
    CommunityImpactController,
  ],
  providers: [
    BookmarksService,
    SavedDealsService,
    ActivityTrackingService,
    StatisticsService,
    StatisticsCacheService,
    NeighborHelpService,
    CommunityImpactService,
    ActivityListener,
    StatisticsListener,
  ],
  exports: [
    ActivityTrackingService,
    StatisticsService,
    NeighborHelpService,
  ],
})
export class UserServiceModule {}
```

### Step 9.2: Update Main Application File

**Location:** `backend/apps/user-service/src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { UserServiceModule } from './user-service.module';

async function bootstrap() {
  const app = await NestFactory.create(UserServiceModule);

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('MeCabal User Service')
    .setDescription('User profiles, dashboard, statistics, and activity tracking')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3002);
  console.log('🚀 User Service running on http://localhost:3002');
}
bootstrap();
```

---

## Phase 10: Testing & Performance

### Step 10.1: Unit Tests Example

**Location:** `backend/apps/user-service/src/statistics/statistics.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatisticsService } from './statistics.service';
import { UserDashboardStats } from '@app/database/entities/user-dashboard-stats.entity';

describe('StatisticsService', () => {
  let service: StatisticsService;
  let statsRepo: Repository<UserDashboardStats>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        {
          provide: getRepositoryToken(UserDashboardStats),
          useClass: Repository,
        },
        // Mock other dependencies
      ],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
    statsRepo = module.get<Repository<UserDashboardStats>>(
      getRepositoryToken(UserDashboardStats),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateEngagementScore', () => {
    it('should calculate correct engagement score', async () => {
      const mockStats = {
        postsSharedCount: 10,
        eventsJoinedCount: 5,
        neighborsHelpedCount: 3,
        // ... other fields
      } as UserDashboardStats;

      const score = service['calculateEngagementScore'](mockStats);
      expect(score).toBeGreaterThan(0);
    });
  });
});
```

### Step 10.2: Integration Test Example

**Location:** `backend/apps/user-service/test/bookmarks.e2e-spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { UserServiceModule } from './../src/user-service.module';

describe('Bookmarks (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UserServiceModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get auth token for testing
    // authToken = await getTestAuthToken();
  });

  it('/users/me/bookmarks (POST)', () => {
    return request(app.getHttpServer())
      .post('/users/me/bookmarks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        itemType: 'post',
        itemId: '123e4567-e89b-12d3-a456-426614174000',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('id');
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

### Step 10.3: Performance Testing Script

**Location:** `backend/apps/user-service/test/performance/dashboard-load-test.ts`

```typescript
import { performance } from 'perf_hooks';

async function testDashboardPerformance() {
  const iterations = 1000;
  const userId = 'test-user-id';

  console.log(`Testing dashboard statistics retrieval with ${iterations} requests...`);

  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    // Simulate dashboard request
    // await fetch(`http://localhost:3002/users/me/dashboard`);
  }

  const end = performance.now();
  const avgTime = (end - start) / iterations;

  console.log(`Average response time: ${avgTime.toFixed(2)}ms`);
  console.log(`Total time: ${(end - start).toFixed(2)}ms`);

  if (avgTime > 100) {
    console.warn('⚠️ Average response time exceeds 100ms threshold');
  } else {
    console.log('✅ Performance within acceptable range');
  }
}

testDashboardPerformance();
```

---

## Appendix

### A. Database Indexes for Performance

```sql
-- Additional indexes for performance optimization
CREATE INDEX idx_user_bookmarks_user_created ON user_bookmarks(user_id, created_at DESC);
CREATE INDEX idx_user_activity_log_composite ON user_activity_log(user_id, activity_type, counts_toward_stats, created_at DESC);
CREATE INDEX idx_neighbor_help_helper_stats ON neighbor_help_interactions(helper_id, counts_toward_stats, created_at DESC);
CREATE INDEX idx_user_saved_deals_active ON user_saved_deals(user_id, is_active, created_at DESC);
```

### B. Event Types Reference

```typescript
export const DashboardEvents = {
  ACTIVITY_LOGGED: 'activity.logged',
  BOOKMARK_CREATED: 'bookmark.created',
  BOOKMARK_DELETED: 'bookmark.deleted',
  DEAL_SAVED: 'deal.saved',
  DEAL_UNSAVED: 'deal.unsaved',
  STATS_UPDATED: 'stats.updated',
  POST_CREATED: 'post.created',
  EVENT_JOINED: 'event.joined',
  NEIGHBOR_HELPED: 'neighbor.helped',
  HELP_REQUEST_FULFILLED: 'help-request.fulfilled',
};
```

### C. API Endpoint Summary

```
Bookmarks:
- POST   /users/me/bookmarks              - Add bookmark
- GET    /users/me/bookmarks              - List bookmarks
- GET    /users/me/bookmarks/check/:type/:id - Check if bookmarked
- DELETE /users/me/bookmarks/:type/:id    - Remove bookmark

Saved Deals:
- POST   /users/me/saved-deals            - Save deal
- GET    /users/me/saved-deals            - List saved deals
- DELETE /users/me/saved-deals/:dealId   - Remove saved deal

Dashboard:
- GET    /users/me/dashboard              - Get dashboard stats
- POST   /users/me/dashboard/refresh      - Force refresh stats

Community Impact:
- GET    /users/me/community-impact       - Get impact summary
- GET    /users/me/community-impact/detailed - Get detailed impact
- GET    /users/:userId/community-impact  - Get another user's impact
```

### D. Statistics Calculation Weights

```typescript
export const EngagementWeights = {
  postsShared: 5,
  eventsJoined: 3,
  eventsCreated: 15,
  neighborsHelped: 10,
  helpfulComments: 2,
  helpRequestsFulfilled: 12,
  safetyReports: 8,
  reviewsWritten: 3,
  recommendationsGiven: 4,
};

export const ImpactLevels = [
  { threshold: 0, level: 'New Member' },
  { threshold: 50, level: 'Engaged Member' },
  { threshold: 150, level: 'Helpful Neighbor' },
  { threshold: 300, level: 'Active Contributor' },
  { threshold: 500, level: 'Community Legend' },
];
```

---

## Success Criteria

✅ **Phase 1 Complete:**
- All database entities created and migrated
- Dashboard stats initialized for existing users

✅ **Phase 2 Complete:**
- Bookmarks CRUD operations working
- Bookmark counts accurate

✅ **Phase 3 Complete:**
- Saved deals system operational
- Deal expiry tracking functional

✅ **Phase 4 Complete:**
- Activity logging working across all types
- Activity events emitting correctly

✅ **Phase 5 Complete:**
- Dashboard statistics calculating correctly
- Engagement scores accurate

✅ **Phase 6 Complete:**
- Neighbor help tracking operational
- Help acknowledgments working

✅ **Phase 7 Complete:**
- Community impact calculations correct
- Impact levels displaying properly

✅ **Phase 8 Complete:**
- Redis caching functional
- Cache invalidation working
- Response times < 100ms

✅ **Phase 9 Complete:**
- All services integrated into User Service
- API endpoints accessible
- Swagger documentation complete

✅ **Phase 10 Complete:**
- Test coverage > 80%
- Performance benchmarks met
- Mobile app successfully integrated

---

**Document Version:** 1.0
**Last Updated:** 2025-10-09
**Status:** Ready for Implementation
