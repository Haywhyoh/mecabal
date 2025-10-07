# Help & Listings Feature Implementation Plan

**Project**: MeCabal Community App
**Feature**: Help Requests & Property/Item Listings
**Date**: 2025-10-07
**Design Philosophy**: Apple Human Interface Guidelines

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Design Decisions](#design-decisions)
3. [Backend Implementation Tasks](#backend-implementation-tasks)
4. [Frontend Implementation Tasks](#frontend-implementation-tasks)
5. [Integration & Testing Tasks](#integration--testing-tasks)
6. [Timeline & Dependencies](#timeline--dependencies)

---

## Architecture Overview

### Current State
- **Feed System**: Posts with types (`general`, `event`, `alert`, `marketplace`, `lost_found`)
- **Marketplace Tab**: Separate navigator with dedicated screens
- **Post Filter**: Modal-based filter system

### Target State
- **Enhanced Feed**: Add `help` post type for jobs/errands/recommendations
- **Listings System**: New entity for apartments and items for sale (separate from posts)
- **iOS-Style Filtering**: Segmented control + filter button (Apple Mail/Photos pattern)
- **Hybrid Architecture**: Social in Feed, Commerce in Marketplace

### Why This Approach?

#### Following Apple's HIG Principles

**1. Clarity**
- Clear separation: Feed = Community interactions, Marketplace = Transactions
- Segmented control provides immediate visual feedback
- Reduces cognitive load with familiar iOS patterns

**2. Deference**
- Content-first design with non-intrusive filters
- Segmented control doesn't overwhelm the interface
- Quick access to common filters without modal overlays

**3. Depth**
- Hierarchical navigation: Tab → Filter → Detail
- Smooth transitions between content types
- Progressive disclosure of filter options

#### Nigerian Context Alignment
- Mirrors WhatsApp group usage patterns
- Help requests are social and time-sensitive (Feed)
- Property/item listings are transactional (Marketplace)
- Reduces feed clutter from commercial posts

---

## Design Decisions

### 1. Post Types vs. Listings

**Posts (Feed - Social)**
```typescript
type PostType =
  | 'general'     // Community updates, discussions
  | 'help'        // NEW - Jobs, errands, recommendations
  | 'event'       // Community gatherings
  | 'alert'       // Safety and urgent notices
  | 'lost_found'  // Missing items/pets
```

**Listings (Marketplace - Commercial)**
```typescript
type ListingType =
  | 'property'    // Apartments, houses for rent/sale
  | 'item'        // Electronics, furniture, vehicles
  | 'service'     // Plumbing, cleaning, repairs
```

**Why Separate?**
- Posts expire quickly, listings persist until sold
- Listings need pricing, availability, condition fields
- Different moderation workflows
- Analytics and metrics differ

### 2. Help Post Structure

```typescript
interface HelpPost extends Post {
  postType: 'help';
  helpCategory: 'job' | 'errand' | 'recommendation' | 'advice';
  urgency?: 'low' | 'medium' | 'high';
  budget?: string;
  deadline?: Date;
  skills?: string[];
}
```

**Help Categories:**
- **Job**: "Need a plumber for burst pipe" (paid work)
- **Errand**: "Can someone pick up my parcel from UPS?" (small tasks)
- **Recommendation**: "Best phone repair shop in Lekki?"
- **Advice**: "How do I register for NEPA prepaid?"

### 3. Listing Structure

```typescript
interface Listing {
  id: string;
  userId: string;
  listingType: 'property' | 'item' | 'service';
  category: string; // 'apartment', 'electronics', 'plumbing'
  title: string;
  description: string;
  price: number;
  currency: 'NGN';
  priceType: 'fixed' | 'negotiable' | 'per_hour' | 'per_day';

  // Property-specific
  propertyType?: 'apartment' | 'house' | 'land' | 'office';
  bedrooms?: number;
  bathrooms?: number;
  rentalPeriod?: 'monthly' | 'yearly';

  // Item-specific
  condition?: 'new' | 'like_new' | 'good' | 'fair';
  brand?: string;

  // Common
  location: Location;
  media: Media[];
  status: 'active' | 'sold' | 'expired' | 'draft';
  views: number;
  saves: number;
  createdAt: Date;
  expiresAt?: Date;
}
```

### 4. UI/UX Design Pattern

#### Feed Screen - iOS Segmented Control
```
┌─────────────────────────────────────────┐
│  MeCabal          🔍 🔔 💬             │
├─────────────────────────────────────────┤
│  ┌───────┬────────┬────────┬─────────┐ │
│  │  All  │  Help  │ Events │ Alerts  │ │ ← Segmented Control
│  └───────┴────────┴────────┴─────────┘ │
│                             [⚙️ Filters]│
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📍 John D.    🏠 Lekki Phase 1  │   │
│  │ Need a reliable electrician for │   │
│  │ wiring work. Budget: ₦50k       │   │
│  │ #help #job                       │   │
│  │ 👍 12  💬 5    ⏰ 2 hours ago    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📍 Sarah M.   🏠 Victoria Island│   │
│  │ Community cleanup this Saturday! │   │
│  │ #event                           │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
         [+]  ← Floating Action Button
```

#### Marketplace Screen - Grid/List View
```
┌─────────────────────────────────────────┐
│  ← Marketplace        🔍  [Grid/List]   │
├─────────────────────────────────────────┤
│  [All] [Property] [Items] [Services]    │ ← Category Pills
│                             [⚙️ Filters]│
│                                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │ 📷 Image     │  │ 📷 Image     │   │
│  │ ₦450,000     │  │ ₦4.8M        │   │
│  │ 3BR Flat     │  │ Toyota       │   │
│  │ Lekki        │  │ Corolla 2018 │   │
│  └──────────────┘  └──────────────┘   │
│                                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │ 📷 Image     │  │ 📷 Image     │   │
│  │ ₦180k        │  │ ₦12k/visit   │   │
│  │ 7-Seat Sofa  │  │ Plumbing     │   │
│  │ Phase 1      │  │ Service      │   │
│  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────┘
```

---

## Backend Implementation Tasks

### Phase 1: Database Schema Updates

#### Task 1.1: Add Help Post Type to Enum
**File**: `backend/libs/database/src/entities/post.entity.ts`
**Changes**:
- Update `postType` column comment to include `help`
- Ensure enum accepts `help` value

**Migration**:
```sql
-- Add help to post_type enum
ALTER TYPE post_type_enum ADD VALUE IF NOT EXISTS 'help';

-- Add help metadata columns
ALTER TABLE posts ADD COLUMN IF NOT EXISTS help_category VARCHAR(50);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS urgency VARCHAR(20);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS budget VARCHAR(100);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS deadline TIMESTAMP;
```

**Estimated Time**: 1 hour

---

#### Task 1.2: Create Listing Entity
**File**: `backend/libs/database/src/entities/listing.entity.ts`

**Entity Structure**:
```typescript
@Entity('listings')
export class Listing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'neighborhood_id' })
  neighborhoodId: string;

  @Column({ name: 'listing_type', length: 20 })
  listingType: 'property' | 'item' | 'service';

  @Column({ name: 'category_id' })
  categoryId: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ length: 3, default: 'NGN' })
  currency: string;

  @Column({ name: 'price_type', length: 20 })
  priceType: 'fixed' | 'negotiable' | 'per_hour' | 'per_day';

  // Property-specific
  @Column({ name: 'property_type', length: 20, nullable: true })
  propertyType?: string;

  @Column({ nullable: true })
  bedrooms?: number;

  @Column({ nullable: true })
  bathrooms?: number;

  @Column({ name: 'rental_period', length: 20, nullable: true })
  rentalPeriod?: string;

  // Item-specific
  @Column({ length: 20, nullable: true })
  condition?: string;

  @Column({ length: 100, nullable: true })
  brand?: string;

  // Location
  @Column({ type: 'point' })
  location: Point;

  @Column({ name: 'address', type: 'text' })
  address: string;

  // Status
  @Column({ length: 20, default: 'active' })
  status: 'active' | 'sold' | 'expired' | 'draft';

  // Metrics
  @Column({ name: 'views_count', default: 0 })
  viewsCount: number;

  @Column({ name: 'saves_count', default: 0 })
  savesCount: number;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Neighborhood)
  @JoinColumn({ name: 'neighborhood_id' })
  neighborhood: Neighborhood;

  @OneToMany(() => ListingMedia, media => media.listing)
  media: ListingMedia[];

  @OneToMany(() => ListingSave, save => save.listing)
  saves: ListingSave[];
}
```

**Estimated Time**: 2 hours

---

#### Task 1.3: Create Listing Media Entity
**File**: `backend/libs/database/src/entities/listing-media.entity.ts`

```typescript
@Entity('listing_media')
export class ListingMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'listing_id' })
  listingId: string;

  @Column({ type: 'text' })
  url: string;

  @Column({ length: 10 })
  type: 'image' | 'video';

  @Column({ type: 'text', nullable: true })
  caption?: string;

  @Column({ name: 'display_order', default: 0 })
  displayOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Listing, listing => listing.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_id' })
  listing: Listing;
}
```

**Estimated Time**: 1 hour

---

#### Task 1.4: Create Listing Categories Table
**File**: `backend/libs/database/src/entities/listing-category.entity.ts`

```typescript
@Entity('listing_categories')
export class ListingCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'listing_type', length: 20 })
  listingType: 'property' | 'item' | 'service';

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'icon_url', type: 'text', nullable: true })
  iconUrl?: string;

  @Column({ name: 'color_code', length: 7, nullable: true })
  colorCode?: string;

  @Column({ name: 'display_order', default: 0 })
  displayOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

**Seed Data**:
```sql
INSERT INTO listing_categories (listing_type, name, icon_url, color_code, display_order) VALUES
-- Property
('property', 'Apartment', 'apartment', '#FF6B35', 1),
('property', 'House', 'home', '#FF6B35', 2),
('property', 'Land', 'terrain', '#228B22', 3),
('property', 'Office Space', 'office-building', '#0066CC', 4),
-- Items
('item', 'Electronics', 'laptop', '#3498db', 10),
('item', 'Furniture', 'sofa', '#e74c3c', 11),
('item', 'Vehicles', 'car', '#f39c12', 12),
('item', 'Fashion', 'tshirt-crew', '#9b59b6', 13),
('item', 'Home & Garden', 'home-variant', '#16a085', 14),
-- Services
('service', 'Plumbing', 'pipe-wrench', '#2ecc71', 20),
('service', 'Electrical', 'lightning-bolt', '#f1c40f', 21),
('service', 'Cleaning', 'spray-bottle', '#3498db', 22),
('service', 'Security', 'shield-account', '#e74c3c', 23),
('service', 'Repairs', 'tools', '#95a5a6', 24);
```

**Estimated Time**: 1 hour

---

#### Task 1.5: Create Migration Script
**File**: `backend/libs/database/src/migrations/[timestamp]-add-help-and-listings.ts`

**Migration Content**:
```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHelpAndListings[TIMESTAMP] implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add help to post_type enum
    await queryRunner.query(`
      ALTER TYPE post_type_enum ADD VALUE IF NOT EXISTS 'help';
    `);

    // 2. Add help metadata columns to posts
    await queryRunner.query(`
      ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS help_category VARCHAR(50),
      ADD COLUMN IF NOT EXISTS urgency VARCHAR(20),
      ADD COLUMN IF NOT EXISTS budget VARCHAR(100),
      ADD COLUMN IF NOT EXISTS deadline TIMESTAMP;
    `);

    // 3. Create listing_categories table
    await queryRunner.query(`
      CREATE TABLE listing_categories (
        id SERIAL PRIMARY KEY,
        listing_type VARCHAR(20) NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon_url TEXT,
        color_code VARCHAR(7),
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Create listings table
    await queryRunner.query(`
      CREATE TABLE listings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id),
        listing_type VARCHAR(20) NOT NULL,
        category_id INT NOT NULL REFERENCES listing_categories(id),
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(12, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'NGN',
        price_type VARCHAR(20) NOT NULL,
        property_type VARCHAR(20),
        bedrooms INT,
        bathrooms INT,
        rental_period VARCHAR(20),
        condition VARCHAR(20),
        brand VARCHAR(100),
        location GEOGRAPHY(POINT, 4326) NOT NULL,
        address TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        views_count INT DEFAULT 0,
        saves_count INT DEFAULT 0,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Create listing_media table
    await queryRunner.query(`
      CREATE TABLE listing_media (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        type VARCHAR(10) NOT NULL,
        caption TEXT,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Create listing_saves table
    await queryRunner.query(`
      CREATE TABLE listing_saves (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(listing_id, user_id)
      );
    `);

    // 7. Create indexes
    await queryRunner.query(`
      CREATE INDEX idx_listings_neighborhood ON listings(neighborhood_id);
      CREATE INDEX idx_listings_user ON listings(user_id);
      CREATE INDEX idx_listings_type ON listings(listing_type);
      CREATE INDEX idx_listings_category ON listings(category_id);
      CREATE INDEX idx_listings_status ON listings(status);
      CREATE INDEX idx_listings_location ON listings USING GIST(location);
      CREATE INDEX idx_listing_media_listing ON listing_media(listing_id);
      CREATE INDEX idx_posts_type ON posts(post_type);
    `);

    // 8. Seed listing categories
    await queryRunner.query(`
      INSERT INTO listing_categories (listing_type, name, icon_url, color_code, display_order) VALUES
      ('property', 'Apartment', 'apartment', '#FF6B35', 1),
      ('property', 'House', 'home', '#FF6B35', 2),
      ('property', 'Land', 'terrain', '#228B22', 3),
      ('property', 'Office Space', 'office-building', '#0066CC', 4),
      ('item', 'Electronics', 'laptop', '#3498db', 10),
      ('item', 'Furniture', 'sofa', '#e74c3c', 11),
      ('item', 'Vehicles', 'car', '#f39c12', 12),
      ('item', 'Fashion', 'tshirt-crew', '#9b59b6', 13),
      ('item', 'Home & Garden', 'home-variant', '#16a085', 14),
      ('service', 'Plumbing', 'pipe-wrench', '#2ecc71', 20),
      ('service', 'Electrical', 'lightning-bolt', '#f1c40f', 21),
      ('service', 'Cleaning', 'spray-bottle', '#3498db', 22),
      ('service', 'Security', 'shield-account', '#e74c3c', 23),
      ('service', 'Repairs', 'tools', '#95a5a6', 24);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS listing_saves CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS listing_media CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS listings CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS listing_categories CASCADE;`);

    await queryRunner.query(`
      ALTER TABLE posts
      DROP COLUMN IF EXISTS help_category,
      DROP COLUMN IF EXISTS urgency,
      DROP COLUMN IF EXISTS budget,
      DROP COLUMN IF EXISTS deadline;
    `);
  }
}
```

**Estimated Time**: 2 hours

---

### Phase 2: Backend DTOs & Validation

#### Task 2.1: Update Post DTOs
**File**: `backend/apps/social-service/src/posts/dto/create-post.dto.ts`

**Changes**:
```typescript
export enum PostType {
  GENERAL = 'general',
  EVENT = 'event',
  ALERT = 'alert',
  MARKETPLACE = 'marketplace',
  LOST_FOUND = 'lost_found',
  HELP = 'help', // NEW
}

export class CreatePostDto {
  // ... existing fields ...

  // Add help-specific fields
  @ApiPropertyOptional({
    description: 'Help category (required if postType is help)',
    enum: ['job', 'errand', 'recommendation', 'advice'],
  })
  @IsOptional()
  @IsEnum(['job', 'errand', 'recommendation', 'advice'])
  @ValidateIf(o => o.postType === PostType.HELP)
  @IsNotEmpty()
  helpCategory?: string;

  @ApiPropertyOptional({
    description: 'Urgency level for help requests',
    enum: ['low', 'medium', 'high'],
  })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  urgency?: string;

  @ApiPropertyOptional({
    description: 'Budget for help request',
    example: '₦50,000',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  budget?: string;

  @ApiPropertyOptional({
    description: 'Deadline for help request',
  })
  @IsOptional()
  @IsDateString()
  deadline?: string;
}
```

**Estimated Time**: 1 hour

---

#### Task 2.2: Create Listing DTOs
**Files**:
- `backend/apps/marketplace-service/src/listings/dto/create-listing.dto.ts`
- `backend/apps/marketplace-service/src/listings/dto/update-listing.dto.ts`
- `backend/apps/marketplace-service/src/listings/dto/listing-response.dto.ts`
- `backend/apps/marketplace-service/src/listings/dto/listing-filter.dto.ts`

**create-listing.dto.ts**:
```typescript
export enum ListingType {
  PROPERTY = 'property',
  ITEM = 'item',
  SERVICE = 'service',
}

export enum PriceType {
  FIXED = 'fixed',
  NEGOTIABLE = 'negotiable',
  PER_HOUR = 'per_hour',
  PER_DAY = 'per_day',
}

export class LocationDto {
  @ApiProperty({ description: 'Latitude' })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: 'Longitude' })
  @IsNumber()
  longitude: number;

  @ApiProperty({ description: 'Full address' })
  @IsString()
  address: string;
}

export class CreateListingDto {
  @ApiProperty({ enum: ListingType })
  @IsEnum(ListingType)
  listingType: ListingType;

  @ApiProperty({ description: 'Category ID' })
  @IsNumber()
  categoryId: number;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  @MinLength(10)
  title: string;

  @ApiProperty()
  @IsString()
  @MaxLength(5000)
  @MinLength(20)
  description: string;

  @ApiProperty({ description: 'Price in Naira' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ enum: PriceType })
  @IsEnum(PriceType)
  priceType: PriceType;

  // Property-specific
  @ApiPropertyOptional({ enum: ['apartment', 'house', 'land', 'office'] })
  @IsOptional()
  @IsEnum(['apartment', 'house', 'land', 'office'])
  propertyType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @ApiPropertyOptional({ enum: ['monthly', 'yearly'] })
  @IsOptional()
  @IsEnum(['monthly', 'yearly'])
  rentalPeriod?: string;

  // Item-specific
  @ApiPropertyOptional({ enum: ['new', 'like_new', 'good', 'fair'] })
  @IsOptional()
  @IsEnum(['new', 'like_new', 'good', 'fair'])
  condition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  // Location
  @ApiProperty({ type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  // Media
  @ApiPropertyOptional({ type: [PostMediaDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostMediaDto)
  media?: PostMediaDto[];

  @ApiPropertyOptional({ description: 'Expiration date' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
```

**listing-filter.dto.ts**:
```typescript
export class ListingFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: ListingType })
  @IsOptional()
  @IsEnum(ListingType)
  listingType?: ListingType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  categoryId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Radius in kilometers' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  radius?: number = 5;

  @ApiPropertyOptional({ enum: ['createdAt', 'price', 'viewsCount'] })
  @IsOptional()
  @IsEnum(['createdAt', 'price', 'viewsCount'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({ enum: ['active', 'sold', 'expired'] })
  @IsOptional()
  @IsEnum(['active', 'sold', 'expired'])
  status?: string = 'active';
}
```

**Estimated Time**: 3 hours

---

### Phase 3: Backend Services & Controllers

#### Task 3.1: Update Posts Service
**File**: `backend/apps/social-service/src/posts/posts.service.ts`

**Changes**:
- Add handling for `help` post type
- Validate help-specific fields
- Add help category filtering

**Estimated Time**: 1 hour

---

#### Task 3.2: Create Listings Service
**File**: `backend/apps/marketplace-service/src/listings/listings.service.ts`

**Methods**:
```typescript
@Injectable()
export class ListingsService {
  async create(userId: string, createListingDto: CreateListingDto): Promise<Listing>;

  async findAll(filter: ListingFilterDto): Promise<PaginatedListings>;

  async findOne(id: string, userId?: string): Promise<Listing>;

  async update(id: string, userId: string, updateDto: UpdateListingDto): Promise<Listing>;

  async remove(id: string, userId: string): Promise<void>;

  async incrementViews(id: string): Promise<void>;

  async saveListing(listingId: string, userId: string): Promise<void>;

  async unsaveListing(listingId: string, userId: string): Promise<void>;

  async getSavedListings(userId: string, filter: ListingFilterDto): Promise<PaginatedListings>;

  async getUserListings(userId: string, filter: ListingFilterDto): Promise<PaginatedListings>;

  async searchNearby(lat: number, lon: number, radius: number, filter: ListingFilterDto): Promise<Listing[]>;

  async markAsSold(id: string, userId: string): Promise<Listing>;

  async expireOldListings(): Promise<void>; // Cron job
}
```

**Key Implementation Details**:
- Use PostGIS for location-based queries
- Implement full-text search on title and description
- Auto-expire listings after 90 days
- Track views and saves for analytics

**Estimated Time**: 4 hours

---

#### Task 3.3: Create Listings Controller
**File**: `backend/apps/marketplace-service/src/listings/listings.controller.ts`

**Endpoints**:
```typescript
@Controller('listings')
@UseGuards(JwtAuthGuard)
export class ListingsController {
  @Post()
  @ApiOperation({ summary: 'Create a new listing' })
  create(@CurrentUser() user, @Body() createDto: CreateListingDto) {}

  @Get()
  @ApiOperation({ summary: 'Get all listings with filters' })
  findAll(@Query() filter: ListingFilterDto) {}

  @Get('nearby')
  @ApiOperation({ summary: 'Find listings nearby' })
  findNearby(@Query() params: NearbySearchDto) {}

  @Get('saved')
  @ApiOperation({ summary: 'Get user saved listings' })
  getSaved(@CurrentUser() user, @Query() filter: ListingFilterDto) {}

  @Get('my-listings')
  @ApiOperation({ summary: 'Get user own listings' })
  getMyListings(@CurrentUser() user, @Query() filter: ListingFilterDto) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get listing by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user) {}

  @Patch(':id')
  @ApiOperation({ summary: 'Update a listing' })
  update(@Param('id') id: string, @CurrentUser() user, @Body() updateDto: UpdateListingDto) {}

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a listing' })
  remove(@Param('id') id: string, @CurrentUser() user) {}

  @Post(':id/view')
  @ApiOperation({ summary: 'Increment view count' })
  incrementView(@Param('id') id: string) {}

  @Post(':id/save')
  @ApiOperation({ summary: 'Save a listing' })
  save(@Param('id') id: string, @CurrentUser() user) {}

  @Delete(':id/save')
  @ApiOperation({ summary: 'Unsave a listing' })
  unsave(@Param('id') id: string, @CurrentUser() user) {}

  @Patch(':id/mark-sold')
  @ApiOperation({ summary: 'Mark listing as sold' })
  markSold(@Param('id') id: string, @CurrentUser() user) {}
}
```

**Estimated Time**: 2 hours

---

#### Task 3.4: Create Listing Categories Controller
**File**: `backend/apps/marketplace-service/src/listing-categories/listing-categories.controller.ts`

**Endpoints**:
```typescript
@Controller('listing-categories')
export class ListingCategoriesController {
  @Get()
  @ApiOperation({ summary: 'Get all listing categories' })
  findAll(@Query('listingType') listingType?: ListingType) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  findOne(@Param('id') id: number) {}
}
```

**Estimated Time**: 1 hour

---

#### Task 3.5: Update API Gateway
**File**: `backend/apps/api-gateway/src/api-gateway.controller.ts`

**Add Routes**:
```typescript
// Listings
@All('listings*')
async listings(@Req() req, @Res() res) {
  return this.proxyRequest(req, res, 'marketplace-service', 3005);
}

@All('listing-categories*')
async listingCategories(@Req() req, @Res() res) {
  return this.proxyRequest(req, res, 'marketplace-service', 3005);
}
```

**Estimated Time**: 30 minutes

---

## Frontend Implementation Tasks

### Phase 4: Mobile App - Type Definitions & Services

#### Task 4.1: Update Post Types
**File**: `Hommie_Mobile/src/services/postsService.ts`

**Changes**:
```typescript
export interface Post {
  // ... existing fields ...
  postType: 'general' | 'event' | 'alert' | 'marketplace' | 'lost_found' | 'help';

  // Help-specific fields
  helpCategory?: 'job' | 'errand' | 'recommendation' | 'advice';
  urgency?: 'low' | 'medium' | 'high';
  budget?: string;
  deadline?: string;
}

export interface CreatePostRequest {
  // ... existing fields ...
  postType: 'general' | 'event' | 'alert' | 'marketplace' | 'lost_found' | 'help';
  helpCategory?: string;
  urgency?: string;
  budget?: string;
  deadline?: string;
}

export interface PostFilter {
  // ... existing fields ...
  postType?: 'general' | 'event' | 'alert' | 'marketplace' | 'lost_found' | 'help';
}
```

**Estimated Time**: 30 minutes

---

#### Task 4.2: Create Listing Service
**File**: `Hommie_Mobile/src/services/listingsService.ts`

**Service Structure**:
```typescript
export interface Listing {
  id: string;
  userId: string;
  listingType: 'property' | 'item' | 'service';
  category: {
    id: number;
    name: string;
    iconUrl?: string;
    colorCode?: string;
  };
  title: string;
  description: string;
  price: number;
  currency: string;
  priceType: 'fixed' | 'negotiable' | 'per_hour' | 'per_day';
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  rentalPeriod?: string;
  condition?: string;
  brand?: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  media: Media[];
  status: 'active' | 'sold' | 'expired' | 'draft';
  viewsCount: number;
  savesCount: number;
  isSaved: boolean;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    isVerified: boolean;
  };
  createdAt: string;
  expiresAt?: string;
}

export interface CreateListingRequest {
  listingType: 'property' | 'item' | 'service';
  categoryId: number;
  title: string;
  description: string;
  price: number;
  priceType: 'fixed' | 'negotiable' | 'per_hour' | 'per_day';
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  rentalPeriod?: string;
  condition?: string;
  brand?: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  media?: Media[];
  expiresAt?: string;
}

export interface ListingFilter {
  page?: number;
  limit?: number;
  listingType?: 'property' | 'item' | 'service';
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  sortBy?: 'createdAt' | 'price' | 'viewsCount';
  sortOrder?: 'ASC' | 'DESC';
  status?: 'active' | 'sold' | 'expired';
}

class ListingsService {
  async createListing(data: CreateListingRequest): Promise<Listing>;
  async getListings(filter: ListingFilter): Promise<PaginatedListings>;
  async getListing(id: string): Promise<Listing>;
  async updateListing(id: string, data: Partial<CreateListingRequest>): Promise<Listing>;
  async deleteListing(id: string): Promise<void>;
  async saveListing(id: string): Promise<void>;
  async unsaveListing(id: string): Promise<void>;
  async getSavedListings(filter: ListingFilter): Promise<PaginatedListings>;
  async getMyListings(filter: ListingFilter): Promise<PaginatedListings>;
  async markAsSold(id: string): Promise<Listing>;
  async incrementView(id: string): Promise<void>;
  async searchNearby(lat: number, lon: number, radius: number, filter: ListingFilter): Promise<Listing[]>;
}
```

**Estimated Time**: 2 hours

---

#### Task 4.3: Create Listing Categories Service
**File**: `Hommie_Mobile/src/services/listingCategoriesService.ts`

```typescript
export interface ListingCategory {
  id: number;
  listingType: 'property' | 'item' | 'service';
  name: string;
  description?: string;
  iconUrl?: string;
  colorCode?: string;
  displayOrder: number;
  isActive: boolean;
}

class ListingCategoriesService {
  async getCategories(listingType?: 'property' | 'item' | 'service'): Promise<ListingCategory[]>;
  async getCategory(id: number): Promise<ListingCategory>;
}
```

**Estimated Time**: 30 minutes

---

### Phase 5: Mobile App - UI Components

#### Task 5.1: Create Segmented Control Component
**File**: `Hommie_Mobile/src/components/SegmentedControl.tsx`

**iOS-Style Segmented Control**:
```typescript
interface Segment {
  id: string;
  label: string;
  icon?: string;
  count?: number;
}

interface SegmentedControlProps {
  segments: Segment[];
  selectedSegment: string;
  onSegmentChange: (segmentId: string) => void;
  style?: ViewStyle;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  segments,
  selectedSegment,
  onSegmentChange,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {segments.map((segment) => (
          <TouchableOpacity
            key={segment.id}
            style={[
              styles.segment,
              selectedSegment === segment.id && styles.selectedSegment,
            ]}
            onPress={() => onSegmentChange(segment.id)}
            activeOpacity={0.7}
          >
            {segment.icon && (
              <Ionicons
                name={segment.icon}
                size={16}
                color={selectedSegment === segment.id ? '#FFFFFF' : '#2C2C2C'}
                style={styles.icon}
              />
            )}
            <Text
              style={[
                styles.label,
                selectedSegment === segment.id && styles.selectedLabel,
              ]}
            >
              {segment.label}
            </Text>
            {segment.count !== undefined && segment.count > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{segment.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 2,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 4,
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  selectedSegment: {
    backgroundColor: '#00A651',
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C2C2C',
  },
  selectedLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
```

**Estimated Time**: 2 hours

---

#### Task 5.2: Create Help Post Card Component
**File**: `Hommie_Mobile/src/components/HelpPostCard.tsx`

**Component for displaying help requests in feed**:
```typescript
interface HelpPostCardProps {
  post: Post;
  onPress: () => void;
  onReact: (reactionType: string) => void;
  onComment: () => void;
  onShare: () => void;
}

export const HelpPostCard: React.FC<HelpPostCardProps> = ({
  post,
  onPress,
  onReact,
  onComment,
  onShare,
}) => {
  const getHelpIcon = () => {
    switch (post.helpCategory) {
      case 'job': return 'briefcase';
      case 'errand': return 'bicycle';
      case 'recommendation': return 'star';
      case 'advice': return 'help-circle';
      default: return 'help-circle';
    }
  };

  const getUrgencyColor = () => {
    switch (post.urgency) {
      case 'high': return '#E74C3C';
      case 'medium': return '#FFC107';
      case 'low': return '#00A651';
      default: return '#8E8E8E';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {/* Author Info */}
      <View style={styles.header}>
        <UserAvatar user={post.author} size="medium" />
        <View style={styles.authorInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.authorName}>
              {post.author.firstName} {post.author.lastName}
            </Text>
            {post.author.isVerified && (
              <Ionicons name="checkmark-circle" size={16} color="#3498db" />
            )}
          </View>
          <Text style={styles.timestamp}>
            {formatTimeAgo(post.createdAt)}
          </Text>
        </View>

        {/* Help Type Badge */}
        <View style={[styles.helpBadge, { backgroundColor: getUrgencyColor() + '20' }]}>
          <Ionicons
            name={getHelpIcon()}
            size={14}
            color={getUrgencyColor()}
          />
          <Text style={[styles.helpType, { color: getUrgencyColor() }]}>
            {post.helpCategory?.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Content */}
      <Text style={styles.content}>{post.content}</Text>

      {/* Help Details */}
      <View style={styles.detailsRow}>
        {post.budget && (
          <View style={styles.detail}>
            <Ionicons name="cash-outline" size={16} color="#00A651" />
            <Text style={styles.detailText}>{post.budget}</Text>
          </View>
        )}
        {post.deadline && (
          <View style={styles.detail}>
            <Ionicons name="time-outline" size={16} color="#FF6B35" />
            <Text style={styles.detailText}>
              {formatDeadline(post.deadline)}
            </Text>
          </View>
        )}
        {post.urgency && (
          <View style={styles.detail}>
            <Ionicons name="alert-circle-outline" size={16} color={getUrgencyColor()} />
            <Text style={[styles.detailText, { color: getUrgencyColor() }]}>
              {post.urgency.toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Engagement Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => onReact('like')}>
          <Ionicons
            name={post.engagement.userReaction ? "heart" : "heart-outline"}
            size={20}
            color={post.engagement.userReaction ? "#E74C3C" : "#8E8E8E"}
          />
          <Text style={styles.actionCount}>{post.engagement.reactionsCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onComment}>
          <Ionicons name="chatbubble-outline" size={20} color="#8E8E8E" />
          <Text style={styles.actionCount}>{post.engagement.commentsCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onShare}>
          <Ionicons name="share-outline" size={20} color="#8E8E8E" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.respondButton}>
          <Ionicons name="hand-right-outline" size={16} color="#FFFFFF" />
          <Text style={styles.respondText}>I Can Help</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};
```

**Estimated Time**: 3 hours

---

#### Task 5.3: Create Listing Card Component
**File**: `Hommie_Mobile/src/components/ListingCard.tsx`

**Component for marketplace listings**:
```typescript
interface ListingCardProps {
  listing: Listing;
  onPress: () => void;
  onSave?: () => void;
  viewMode?: 'grid' | 'list';
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onPress,
  onSave,
  viewMode = 'grid',
}) => {
  if (viewMode === 'list') {
    return <ListingCardList {...{ listing, onPress, onSave }} />;
  }

  return (
    <TouchableOpacity style={styles.gridCard} onPress={onPress}>
      {/* Image */}
      <View style={styles.imageContainer}>
        {listing.media.length > 0 ? (
          <Image source={{ uri: listing.media[0].url }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={40} color="#8E8E8E" />
          </View>
        )}

        {/* Save Button */}
        {onSave && (
          <TouchableOpacity style={styles.saveButton} onPress={onSave}>
            <Ionicons
              name={listing.isSaved ? "bookmark" : "bookmark-outline"}
              size={20}
              color={listing.isSaved ? "#00A651" : "#FFFFFF"}
            />
          </TouchableOpacity>
        )}

        {/* Status Badge */}
        {listing.status === 'sold' && (
          <View style={styles.soldBadge}>
            <Text style={styles.soldText}>SOLD</Text>
          </View>
        )}
      </View>

      {/* Details */}
      <View style={styles.details}>
        <Text style={styles.price}>
          ₦{formatPrice(listing.price)}
          {listing.priceType !== 'fixed' && (
            <Text style={styles.priceType}> ({listing.priceType})</Text>
          )}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {listing.title}
        </Text>
        <View style={styles.meta}>
          <Ionicons name="location-outline" size={12} color="#8E8E8E" />
          <Text style={styles.location} numberOfLines={1}>
            {listing.location.address}
          </Text>
        </View>

        {/* Property Details */}
        {listing.listingType === 'property' && (
          <View style={styles.propertyDetails}>
            {listing.bedrooms && (
              <View style={styles.propertyDetail}>
                <Ionicons name="bed-outline" size={14} color="#8E8E8E" />
                <Text style={styles.propertyDetailText}>{listing.bedrooms}</Text>
              </View>
            )}
            {listing.bathrooms && (
              <View style={styles.propertyDetail}>
                <Ionicons name="water-outline" size={14} color="#8E8E8E" />
                <Text style={styles.propertyDetailText}>{listing.bathrooms}</Text>
              </View>
            )}
          </View>
        )}

        {/* Verification Badge */}
        {listing.author.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#00A651" />
            <Text style={styles.verifiedText}>Verified Seller</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
```

**Estimated Time**: 3 hours

---

#### Task 5.4: Update Post Filter Component
**File**: `Hommie_Mobile/src/components/PostFilter.tsx`

**Add help post type to filter**:
```typescript
const postTypes = [
  { id: 'general', label: 'General', icon: 'chatbubble-outline', color: '#3498db' },
  { id: 'help', label: 'Help', icon: 'hand-right-outline', color: '#FF6B35' }, // NEW
  { id: 'event', label: 'Event', icon: 'calendar-outline', color: '#e74c3c' },
  { id: 'alert', label: 'Alert', icon: 'warning-outline', color: '#f39c12' },
  { id: 'marketplace', label: 'Marketplace', icon: 'storefront-outline', color: '#2ecc71' },
  { id: 'lost_found', label: 'Lost & Found', icon: 'search-outline', color: '#9b59b6' },
];

// Add help category filter
const helpCategories = [
  { id: 'job', label: 'Jobs', icon: 'briefcase' },
  { id: 'errand', label: 'Errands', icon: 'bicycle' },
  { id: 'recommendation', label: 'Recommendations', icon: 'star' },
  { id: 'advice', label: 'Advice', icon: 'help-circle' },
];
```

**Estimated Time**: 1 hour

---

#### Task 5.5: Create Listing Filter Component
**File**: `Hommie_Mobile/src/components/ListingFilter.tsx`

**iOS-style filter modal for listings**:
```typescript
interface ListingFilterProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filter: ListingFilter) => void;
  currentFilter: ListingFilter;
}

export const ListingFilter: React.FC<ListingFilterProps> = ({
  visible,
  onClose,
  onApply,
  currentFilter,
}) => {
  const [filter, setFilter] = useState<ListingFilter>(currentFilter);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Filters</Text>
          <TouchableOpacity onPress={() => handleApply()}>
            <Text style={styles.applyButton}>Apply</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Listing Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Listing Type</Text>
            {listingTypes.map(type => (
              <TouchableOpacity
                key={type.id}
                style={styles.option}
                onPress={() => updateFilter('listingType', type.id)}
              >
                <Text style={styles.optionLabel}>{type.label}</Text>
                {filter.listingType === type.id && (
                  <Ionicons name="checkmark" size={20} color="#00A651" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Price Range */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Range</Text>
            <View style={styles.priceRange}>
              <TextInput
                style={styles.priceInput}
                placeholder="Min"
                keyboardType="numeric"
                value={filter.minPrice?.toString()}
                onChangeText={(text) => updateFilter('minPrice', parseInt(text))}
              />
              <Text style={styles.priceSeparator}>-</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Max"
                keyboardType="numeric"
                value={filter.maxPrice?.toString()}
                onChangeText={(text) => updateFilter('maxPrice', parseInt(text))}
              />
            </View>
          </View>

          {/* Location Radius */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Distance: {filter.radius} km</Text>
            <Slider
              minimumValue={1}
              maximumValue={50}
              step={1}
              value={filter.radius}
              onValueChange={(value) => updateFilter('radius', value)}
              minimumTrackTintColor="#00A651"
              maximumTrackTintColor="#E0E0E0"
            />
          </View>

          {/* Property-specific filters */}
          {filter.listingType === 'property' && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Bedrooms</Text>
                <View style={styles.pills}>
                  {[1, 2, 3, 4, 5].map(num => (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.pill,
                        filter.bedrooms === num && styles.activePill
                      ]}
                      onPress={() => updateFilter('bedrooms', num)}
                    >
                      <Text style={styles.pillText}>{num}+</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* Item-specific filters */}
          {filter.listingType === 'item' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Condition</Text>
              {conditions.map(condition => (
                <TouchableOpacity
                  key={condition.id}
                  style={styles.option}
                  onPress={() => updateFilter('condition', condition.id)}
                >
                  <Text style={styles.optionLabel}>{condition.label}</Text>
                  {filter.condition === condition.id && (
                    <Ionicons name="checkmark" size={20} color="#00A651" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Reset Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Reset All Filters</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};
```

**Estimated Time**: 3 hours

---

### Phase 6: Mobile App - Screens

#### Task 6.1: Update Feed Screen with Segmented Control
**File**: `Hommie_Mobile/src/screens/FeedScreen.tsx`

**Add segmented control for quick filtering**:
```typescript
export const FeedScreen: React.FC<FeedScreenProps> = ({ navigation }) => {
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [showFilter, setShowFilter] = useState(false);

  const segments = [
    { id: 'all', label: 'All', icon: 'apps-outline' },
    { id: 'help', label: 'Help', icon: 'hand-right-outline' },
    { id: 'event', label: 'Events', icon: 'calendar-outline' },
    { id: 'alert', label: 'Alerts', icon: 'warning-outline' },
  ];

  const handleSegmentChange = useCallback((segmentId: string) => {
    setSelectedSegment(segmentId);

    if (segmentId === 'all') {
      clearFilter();
    } else {
      updateFilter({ postType: segmentId as any });
    }

    refreshFeed();
  }, [clearFilter, updateFilter, refreshFeed]);

  return (
    <View style={styles.container}>
      {/* Segmented Control */}
      <View style={styles.filterBar}>
        <SegmentedControl
          segments={segments}
          selectedSegment={selectedSegment}
          onSegmentChange={handleSegmentChange}
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilter(true)}
        >
          <Ionicons name="options-outline" size={20} color="#2C2C2C" />
        </TouchableOpacity>
      </View>

      {/* Feed List */}
      <FeedList
        posts={posts}
        loading={loading}
        refreshing={refreshing}
        hasMore={hasMore}
        onRefresh={refreshFeed}
        onLoadMore={loadMore}
        onPostPress={handlePostPress}
        onReaction={handleReaction}
        onComment={handleComment}
        onShare={handleShare}
        renderPostCard={(post) => {
          if (post.postType === 'help') {
            return (
              <HelpPostCard
                post={post}
                onPress={() => handlePostPress(post)}
                onReact={handleReaction}
                onComment={() => handleComment(post.id)}
                onShare={() => handleShare(post)}
              />
            );
          }
          return (
            <PostCard
              post={post}
              onPress={() => handlePostPress(post)}
              onReact={handleReaction}
              onComment={() => handleComment(post.id)}
              onShare={() => handleShare(post)}
            />
          );
        }}
      />

      {/* Filter Modal */}
      <PostFilter
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={(filter) => {
          updateFilter(filter);
          setShowFilter(false);
          refreshFeed();
        }}
        currentFilter={filter}
      />
    </View>
  );
};
```

**Estimated Time**: 2 hours

---

#### Task 6.2: Update Marketplace Screen
**File**: `Hommie_Mobile/src/screens/MarketplaceScreen.tsx`

**Update to use new Listings API**:
```typescript
export default function MarketplaceScreen({ navigation }: MarketplaceScreenProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState<ListingFilter>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });

  const categories = [
    { id: null, label: 'All', icon: 'apps' },
    { id: 1, label: 'Property', icon: 'home' },
    { id: 10, label: 'Electronics', icon: 'laptop' },
    { id: 11, label: 'Furniture', icon: 'bed' },
    { id: 20, label: 'Services', icon: 'construct' },
  ];

  useEffect(() => {
    fetchListings();
  }, [filter, selectedCategory]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const listingsService = ListingsService.getInstance();
      const result = await listingsService.getListings({
        ...filter,
        categoryId: selectedCategory || undefined,
      });
      setListings(result.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Marketplace</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            <Ionicons
              name={viewMode === 'grid' ? 'list' : 'grid'}
              size={24}
              color="#2C2C2C"
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowFilter(true)}>
            <Ionicons name="options-outline" size={24} color="#2C2C2C" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryPill,
              selectedCategory === cat.id && styles.activeCategoryPill
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Ionicons
              name={cat.icon}
              size={16}
              color={selectedCategory === cat.id ? '#FFFFFF' : '#2C2C2C'}
            />
            <Text style={[
              styles.categoryLabel,
              selectedCategory === cat.id && styles.activeCategoryLabel
            ]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Listings Grid/List */}
      {viewMode === 'grid' ? (
        <FlatList
          data={listings}
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
              onSave={() => handleSaveListing(item.id)}
              viewMode="grid"
            />
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          refreshing={loading}
          onRefresh={fetchListings}
        />
      ) : (
        <FlatList
          data={listings}
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
              onSave={() => handleSaveListing(item.id)}
              viewMode="list"
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={fetchListings}
        />
      )}

      {/* Filter Modal */}
      <ListingFilter
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={(newFilter) => {
          setFilter(newFilter);
          setShowFilter(false);
        }}
        currentFilter={filter}
      />
    </SafeAreaView>
  );
}
```

**Estimated Time**: 2 hours

---

#### Task 6.3: Create Help Post Creation Screen
**File**: `Hommie_Mobile/src/screens/CreateHelpPostScreen.tsx`

**Dedicated screen for creating help requests**:
```typescript
export const CreateHelpPostScreen: React.FC = () => {
  const navigation = useNavigation();
  const [content, setContent] = useState('');
  const [helpCategory, setHelpCategory] = useState<'job' | 'errand' | 'recommendation' | 'advice'>('job');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const helpCategories = [
    { id: 'job', label: 'Job', description: 'Paid work needed', icon: 'briefcase' },
    { id: 'errand', label: 'Errand', description: 'Small task or favor', icon: 'bicycle' },
    { id: 'recommendation', label: 'Recommendation', description: 'Ask for suggestions', icon: 'star' },
    { id: 'advice', label: 'Advice', description: 'Need guidance', icon: 'help-circle' },
  ];

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please describe what help you need');
      return;
    }

    try {
      const postsService = PostsService.getInstance();
      await postsService.createPost({
        content,
        postType: 'help',
        privacyLevel: 'neighborhood',
        helpCategory,
        urgency,
        budget: budget || undefined,
        deadline: deadline?.toISOString(),
      });

      Alert.alert('Success', 'Help request posted!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to post help request');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ask for Help</Text>
        <TouchableOpacity onPress={handleSubmit}>
          <Text style={styles.postButton}>Post</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Help Category Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What kind of help do you need?</Text>
          <View style={styles.categoryGrid}>
            {helpCategories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryCard,
                  helpCategory === cat.id && styles.selectedCategoryCard
                ]}
                onPress={() => setHelpCategory(cat.id as any)}
              >
                <Ionicons
                  name={cat.icon}
                  size={32}
                  color={helpCategory === cat.id ? '#00A651' : '#8E8E8E'}
                />
                <Text style={styles.categoryCardLabel}>{cat.label}</Text>
                <Text style={styles.categoryCardDescription}>{cat.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe what help you need..."
            multiline
            numberOfLines={6}
            value={content}
            onChangeText={setContent}
            textAlignVertical="top"
          />
        </View>

        {/* Budget (for jobs) */}
        {helpCategory === 'job' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Budget (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., ₦50,000"
              value={budget}
              onChangeText={setBudget}
              keyboardType="default"
            />
          </View>
        )}

        {/* Deadline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deadline (Optional)</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#8E8E8E" />
            <Text style={styles.dateButtonText}>
              {deadline ? format(deadline, 'PPP') : 'Select deadline'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Urgency */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Urgency</Text>
          <View style={styles.urgencyButtons}>
            {['low', 'medium', 'high'].map(level => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.urgencyButton,
                  urgency === level && styles.selectedUrgencyButton,
                  urgency === level && level === 'high' && { backgroundColor: '#E74C3C' },
                  urgency === level && level === 'medium' && { backgroundColor: '#FFC107' },
                  urgency === level && level === 'low' && { backgroundColor: '#00A651' },
                ]}
                onPress={() => setUrgency(level as any)}
              >
                <Text style={[
                  styles.urgencyButtonText,
                  urgency === level && styles.selectedUrgencyButtonText
                ]}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={deadline || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDeadline(selectedDate);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
};
```

**Estimated Time**: 3 hours

---

#### Task 6.4: Create Listing Creation Screen
**File**: `Hommie_Mobile/src/screens/CreateListingScreen.tsx`

**Multi-step form for creating listings**:
```typescript
export const CreateListingScreen: React.FC = () => {
  const navigation = useNavigation();
  const [step, setStep] = useState(1);
  const [listingType, setListingType] = useState<'property' | 'item' | 'service'>('item');
  const [formData, setFormData] = useState<Partial<CreateListingRequest>>({});

  const totalSteps = listingType === 'property' ? 5 : 4;

  const renderStep = () => {
    switch (step) {
      case 1:
        return <ListingTypeStep onSelect={(type) => {
          setListingType(type);
          setStep(2);
        }} />;

      case 2:
        return <BasicInfoStep
          listingType={listingType}
          data={formData}
          onNext={(data) => {
            setFormData({ ...formData, ...data });
            setStep(3);
          }}
        />;

      case 3:
        if (listingType === 'property') {
          return <PropertyDetailsStep
            data={formData}
            onNext={(data) => {
              setFormData({ ...formData, ...data });
              setStep(4);
            }}
          />;
        } else {
          return <MediaStep
            data={formData}
            onNext={(data) => {
              setFormData({ ...formData, ...data });
              setStep(4);
            }}
          />;
        }

      case 4:
        if (listingType === 'property') {
          return <MediaStep
            data={formData}
            onNext={(data) => {
              setFormData({ ...formData, ...data });
              setStep(5);
            }}
          />;
        } else {
          return <ReviewStep
            listingType={listingType}
            data={formData}
            onSubmit={handleSubmit}
          />;
        }

      case 5:
        return <ReviewStep
          listingType={listingType}
          data={formData}
          onSubmit={handleSubmit}
        />;

      default:
        return null;
    }
  };

  const handleSubmit = async (finalData: CreateListingRequest) => {
    try {
      const listingsService = ListingsService.getInstance();
      await listingsService.createListing(finalData);

      Alert.alert('Success', 'Listing created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create listing');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Progress */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#2C2C2C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Listing</Text>
        <Text style={styles.stepIndicator}>{step}/{totalSteps}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progress, { width: `${(step / totalSteps) * 100}%` }]} />
      </View>

      {/* Step Content */}
      {renderStep()}
    </SafeAreaView>
  );
};
```

**Estimated Time**: 4 hours

---

#### Task 6.5: Create Listing Detail Screen
**File**: `Hommie_Mobile/src/screens/ListingDetailScreen.tsx`

**Detailed view of a single listing**:
```typescript
export const ListingDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { listingId } = route.params as { listingId: string };
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchListing();
  }, [listingId]);

  const fetchListing = async () => {
    try {
      const listingsService = ListingsService.getInstance();
      const data = await listingsService.getListing(listingId);
      setListing(data);

      // Increment view count
      await listingsService.incrementView(listingId);
    } catch (error) {
      Alert.alert('Error', 'Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const handleContact = () => {
    // Navigate to chat or show contact options
    navigation.navigate('Chat', { userId: listing.author.id });
  };

  const handleSave = async () => {
    try {
      const listingsService = ListingsService.getInstance();
      if (listing.isSaved) {
        await listingsService.unsaveListing(listingId);
      } else {
        await listingsService.saveListing(listingId);
      }
      setListing({ ...listing, isSaved: !listing.isSaved });
    } catch (error) {
      Alert.alert('Error', 'Failed to save listing');
    }
  };

  if (loading || !listing) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      {/* Image Carousel */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.imageCarousel}
      >
        {listing.media.map((media, index) => (
          <Image
            key={media.id}
            source={{ uri: media.url }}
            style={styles.image}
            resizeMode="cover"
          />
        ))}
      </ScrollView>

      {/* Header Actions */}
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Ionicons
            name={listing.isSaved ? "bookmark" : "bookmark-outline"}
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Price */}
        <View style={styles.priceSection}>
          <Text style={styles.price}>
            ₦{formatPrice(listing.price)}
          </Text>
          {listing.priceType !== 'fixed' && (
            <Text style={styles.priceType}>
              {listing.priceType.replace('_', ' ')}
            </Text>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>{listing.title}</Text>

        {/* Property Details */}
        {listing.listingType === 'property' && (
          <View style={styles.propertyDetails}>
            {listing.bedrooms && (
              <View style={styles.propertyDetail}>
                <Ionicons name="bed-outline" size={20} color="#8E8E8E" />
                <Text style={styles.propertyDetailText}>
                  {listing.bedrooms} Bedroom{listing.bedrooms > 1 ? 's' : ''}
                </Text>
              </View>
            )}
            {listing.bathrooms && (
              <View style={styles.propertyDetail}>
                <Ionicons name="water-outline" size={20} color="#8E8E8E" />
                <Text style={styles.propertyDetailText}>
                  {listing.bathrooms} Bathroom{listing.bathrooms > 1 ? 's' : ''}
                </Text>
              </View>
            )}
            {listing.propertyType && (
              <View style={styles.propertyDetail}>
                <Ionicons name="home-outline" size={20} color="#8E8E8E" />
                <Text style={styles.propertyDetailText}>
                  {listing.propertyType}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Item Details */}
        {listing.listingType === 'item' && (
          <View style={styles.itemDetails}>
            {listing.condition && (
              <View style={styles.detailBadge}>
                <Text style={styles.detailBadgeLabel}>Condition</Text>
                <Text style={styles.detailBadgeValue}>{listing.condition}</Text>
              </View>
            )}
            {listing.brand && (
              <View style={styles.detailBadge}>
                <Text style={styles.detailBadgeLabel}>Brand</Text>
                <Text style={styles.detailBadgeValue}>{listing.brand}</Text>
              </View>
            )}
          </View>
        )}

        {/* Location */}
        <View style={styles.locationSection}>
          <Ionicons name="location" size={20} color="#00A651" />
          <Text style={styles.locationText}>{listing.location.address}</Text>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{listing.description}</Text>
        </View>

        {/* Seller Info */}
        <View style={styles.sellerSection}>
          <Text style={styles.sectionTitle}>Seller</Text>
          <View style={styles.sellerInfo}>
            <UserAvatar user={listing.author} size="large" />
            <View style={styles.sellerDetails}>
              <View style={styles.sellerNameRow}>
                <Text style={styles.sellerName}>
                  {listing.author.firstName} {listing.author.lastName}
                </Text>
                {listing.author.isVerified && (
                  <Ionicons name="checkmark-circle" size={16} color="#3498db" />
                )}
              </View>
              <Text style={styles.sellerMeta}>
                Member since {format(new Date(listing.author.createdAt), 'MMM yyyy')}
              </Text>
            </View>
          </View>
        </View>

        {/* Map */}
        <View style={styles.mapSection}>
          <Text style={styles.sectionTitle}>Location</Text>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: listing.location.latitude,
              longitude: listing.location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={{
                latitude: listing.location.latitude,
                longitude: listing.location.longitude,
              }}
            />
          </MapView>
        </View>

        {/* Metadata */}
        <View style={styles.metaSection}>
          <Text style={styles.metaText}>
            Posted {formatTimeAgo(listing.createdAt)}
          </Text>
          <Text style={styles.metaText}>
            {listing.viewsCount} views
          </Text>
        </View>
      </ScrollView>

      {/* Contact Button (Fixed) */}
      {currentUser?.id !== listing.author.id && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
            <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
            <Text style={styles.contactButtonText}>Contact Seller</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
```

**Estimated Time**: 4 hours

---

#### Task 6.6: Update Floating Action Button
**File**: `Hommie_Mobile/src/components/FloatingActionButton.tsx`

**Add help and listing creation options**:
```typescript
const postTypes: PostType[] = [
  {
    id: 'general',
    title: 'General Post',
    description: 'Share news, updates, or start a conversation',
    icon: 'text',
    color: colors.primary,
    onPress: () => handlePostType('general'),
  },
  {
    id: 'help',
    title: 'Ask for Help',
    description: 'Get help with jobs, errands, or recommendations',
    icon: 'hand-right',
    color: colors.accent.lagosOrange,
    onPress: () => handlePostType('help'),
  },
  {
    id: 'listing',
    title: 'Create Listing',
    description: 'Sell property, items, or offer services',
    icon: 'pricetag',
    color: colors.accent.marketGreen,
    onPress: () => handlePostType('listing'),
  },
  {
    id: 'event',
    title: 'Create Event',
    description: 'Organize a community gathering',
    icon: 'calendar-plus',
    color: colors.accent.trustBlue,
    onPress: () => handlePostType('event'),
  },
  {
    id: 'safety',
    title: 'Safety Alert',
    description: 'Report security or emergency situations',
    icon: 'shield-alert',
    color: colors.accent.safetyRed,
    onPress: () => handlePostType('safety'),
  },
];

const handlePostType = (type: string) => {
  closeModal();

  switch (type) {
    case 'general':
      navigation?.navigate('CreatePost', { type: 'general' });
      break;
    case 'help':
      navigation?.navigate('CreatePost', { type: 'help' }); // Or CreateHelpPost if separate
      break;
    case 'listing':
      navigation?.navigate('Market', {
        screen: 'CreateListing'
      });
      break;
    case 'event':
      navigation?.navigate('CreateEvent');
      break;
    case 'safety':
      navigation?.navigate('CreatePost', { type: 'alert' });
      break;
  }
};
```

**Estimated Time**: 1 hour

---

## Integration & Testing Tasks

### Phase 7: Integration & Quality Assurance

#### Task 7.1: Backend Testing
**Tests to write**:
- Unit tests for ListingsService
- Integration tests for Listings API endpoints
- E2E tests for listing creation flow
- Tests for location-based queries
- Tests for help post filtering

**Estimated Time**: 4 hours

---

#### Task 7.2: Frontend Testing
**Tests to write**:
- Component tests for SegmentedControl
- Component tests for HelpPostCard
- Component tests for ListingCard
- Integration tests for CreateListingScreen flow
- Snapshot tests for all new components

**Estimated Time**: 3 hours

---

#### Task 7.3: Documentation
**Documents to update**:
- API documentation with new endpoints
- Mobile app CLAUDE.md with new screens
- User guide for help requests
- User guide for creating listings
- Admin documentation for moderation

**Estimated Time**: 2 hours

---

## Timeline & Dependencies

### Week 1: Backend Foundation
- **Days 1-2**: Database schema & migrations (Tasks 1.1-1.5)
- **Days 3-4**: DTOs & validation (Tasks 2.1-2.2)
- **Day 5**: Services & controllers (Tasks 3.1-3.3)

### Week 2: Backend Completion & Frontend Start
- **Day 1**: Complete backend services (Tasks 3.4-3.5)
- **Days 2-3**: Frontend services & types (Tasks 4.1-4.3)
- **Days 4-5**: Core UI components (Tasks 5.1-5.3)

### Week 3: Frontend Screens
- **Days 1-2**: Feed & filter updates (Tasks 5.4-5.5, 6.1)
- **Days 3-4**: Marketplace screens (Tasks 6.2, 6.5)
- **Day 5**: Creation screens (Tasks 6.3-6.4)

### Week 4: Integration & Testing
- **Days 1-2**: Complete frontend (Task 6.6)
- **Days 3-4**: Testing & bug fixes (Tasks 7.1-7.2)
- **Day 5**: Documentation & deployment (Task 7.3)

---

## Success Criteria

### Backend
- [ ] All migrations run successfully
- [ ] API endpoints return correct data
- [ ] Location-based queries perform well (<200ms)
- [ ] All tests pass with >80% coverage

### Frontend
- [ ] Segmented control works smoothly
- [ ] Help posts display correctly in feed
- [ ] Listings display in marketplace
- [ ] Filters work for both posts and listings
- [ ] Creation flows are intuitive
- [ ] No TypeScript errors

### User Experience
- [ ] Feed loads in <2 seconds
- [ ] Filters apply instantly
- [ ] Images load progressively
- [ ] Offline support for viewing cached data
- [ ] Smooth 60fps animations

---

## Risk Mitigation

### Technical Risks
1. **PostGIS performance**: Index optimization, query caching
2. **Image upload size**: Compression, progressive loading
3. **Migration complexity**: Test on staging first, rollback plan

### UX Risks
1. **Filter complexity**: User testing, progressive disclosure
2. **Content overload**: Pagination, infinite scroll
3. **Navigation confusion**: Clear breadcrumbs, back button

### Business Risks
1. **Spam listings**: Moderation workflow, user reports
2. **Fraud**: Verification badges, trust scores
3. **Low adoption**: Onboarding tutorial, incentives

---

## Post-Launch Improvements

### Phase 2 Features (Future)
- [ ] Advanced search with AI-powered recommendations
- [ ] In-app messaging for listings
- [ ] Payment integration for transactions
- [ ] Rating & review system for sellers
- [ ] Analytics dashboard for listing performance
- [ ] Push notifications for matching help requests
- [ ] Saved searches with alerts
- [ ] Property tour scheduling
- [ ] Lease/sale document management

---

## Appendix

### API Endpoints Summary

**Posts**
- `GET /posts?postType=help` - Get help posts
- `POST /posts` - Create post (including help type)

**Listings**
- `GET /listings` - Get all listings with filters
- `GET /listings/nearby` - Location-based search
- `GET /listings/saved` - User's saved listings
- `GET /listings/my-listings` - User's own listings
- `GET /listings/:id` - Get single listing
- `POST /listings` - Create listing
- `PATCH /listings/:id` - Update listing
- `DELETE /listings/:id` - Delete listing
- `POST /listings/:id/save` - Save listing
- `DELETE /listings/:id/save` - Unsave listing
- `POST /listings/:id/view` - Increment views
- `PATCH /listings/:id/mark-sold` - Mark as sold

**Listing Categories**
- `GET /listing-categories` - Get all categories
- `GET /listing-categories/:id` - Get single category

### Database Schema Summary

**Tables Created**:
- `listing_categories` - Categories for listings
- `listings` - Main listings table
- `listing_media` - Media attachments for listings
- `listing_saves` - User saved listings

**Tables Modified**:
- `posts` - Added help-specific columns

### Color Palette

**Help Post Colors**:
- Job: `#FF6B35` (Lagos Orange)
- Errand: `#0066CC` (Trust Blue)
- Recommendation: `#FFC107` (Warm Gold)
- Advice: `#7B68EE` (Neighbor Purple)

**Urgency Colors**:
- High: `#E74C3C` (Safety Red)
- Medium: `#FFC107` (Warm Gold)
- Low: `#00A651` (MeCabal Green)

---

**End of Implementation Plan**
