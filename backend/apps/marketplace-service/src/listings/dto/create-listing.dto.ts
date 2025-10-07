import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  MaxLength,
  MinLength,
  Min,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

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

export enum PropertyType {
  APARTMENT = 'apartment',
  HOUSE = 'house',
  LAND = 'land',
  OFFICE = 'office',
}

export enum ItemCondition {
  NEW = 'new',
  LIKE_NEW = 'like_new',
  GOOD = 'good',
  FAIR = 'fair',
}

export enum RentalPeriod {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export class LocationDto {
  @ApiProperty({
    description: 'Latitude coordinate',
    example: 6.5244,
  })
  @IsNumber()
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: 3.3792,
  })
  @IsNumber()
  longitude: number;

  @ApiProperty({
    description: 'Full address',
    example: 'Plot 12, Lekki Phase 1, Lagos',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  address: string;
}

export class ListingMediaDto {
  @ApiProperty({
    description: 'Media file URL',
    example: 'https://storage.mecabal.com/listings/image1.jpg',
  })
  @IsString()
  url: string;

  @ApiProperty({
    description: 'Media type',
    enum: ['image', 'video'],
    example: 'image',
  })
  @IsEnum(['image', 'video'])
  type: 'image' | 'video';

  @ApiPropertyOptional({
    description: 'Media caption',
    example: 'Living room view',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  caption?: string;

  @ApiPropertyOptional({
    description: 'Display order',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  displayOrder?: number;
}

export class CreateListingDto {
  @ApiProperty({
    description: 'Listing type',
    enum: ListingType,
    example: ListingType.PROPERTY,
  })
  @IsEnum(ListingType)
  listingType: ListingType;

  @ApiProperty({
    description: 'Category ID',
    example: 1,
  })
  @IsNumber()
  categoryId: number;

  @ApiProperty({
    description: 'Listing title',
    example: '3 Bedroom Flat in Lekki Phase 1',
    minLength: 10,
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  @MinLength(10)
  title: string;

  @ApiProperty({
    description: 'Listing description',
    example:
      'Spacious 3 bedroom flat with modern amenities, 24-hour power supply, and secure estate.',
    minLength: 20,
    maxLength: 5000,
  })
  @IsString()
  @MaxLength(5000)
  @MinLength(20)
  description: string;

  @ApiProperty({
    description: 'Price in Naira',
    example: 4500000,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Price type',
    enum: PriceType,
    example: PriceType.NEGOTIABLE,
  })
  @IsEnum(PriceType)
  priceType: PriceType;

  // Property-specific fields
  @ApiPropertyOptional({
    description: 'Property type (required for property listings)',
    enum: PropertyType,
    example: PropertyType.APARTMENT,
  })
  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;

  @ApiPropertyOptional({
    description: 'Number of bedrooms',
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @ApiPropertyOptional({
    description: 'Number of bathrooms',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @ApiPropertyOptional({
    description: 'Rental period',
    enum: RentalPeriod,
    example: RentalPeriod.YEARLY,
  })
  @IsOptional()
  @IsEnum(RentalPeriod)
  rentalPeriod?: RentalPeriod;

  // Item-specific fields
  @ApiPropertyOptional({
    description: 'Item condition (required for item listings)',
    enum: ItemCondition,
    example: ItemCondition.GOOD,
  })
  @IsOptional()
  @IsEnum(ItemCondition)
  condition?: ItemCondition;

  @ApiPropertyOptional({
    description: 'Brand name',
    example: 'Samsung',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  // Location
  @ApiProperty({
    description: 'Location information',
    type: LocationDto,
  })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  // Media
  @ApiPropertyOptional({
    description: 'Media attachments',
    type: [ListingMediaDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ListingMediaDto)
  media?: ListingMediaDto[];

  @ApiPropertyOptional({
    description: 'Expiration date',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
