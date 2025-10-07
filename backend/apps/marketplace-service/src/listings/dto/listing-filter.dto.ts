import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ListingType, PriceType, PropertyType, ItemCondition } from './create-listing.dto';
import { ListingStatus } from './update-listing.dto';

export class ListingFilterDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of listings per page',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by listing type',
    enum: ListingType,
  })
  @IsOptional()
  @IsEnum(ListingType)
  listingType?: ListingType;

  @ApiPropertyOptional({
    description: 'Filter by category ID',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  @ApiPropertyOptional({
    description: 'Minimum price',
    example: 1000000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum price',
    example: 10000000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Search term for title and description',
    example: 'apartment lekki',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Latitude for location-based search',
    example: 6.5244,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude for location-based search',
    example: 3.3792,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Search radius in kilometers',
    minimum: 1,
    maximum: 100,
    default: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  radius?: number = 5;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['createdAt', 'price', 'viewsCount'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsEnum(['createdAt', 'price', 'viewsCount'])
  sortBy?: 'createdAt' | 'price' | 'viewsCount' = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ListingStatus,
    default: ListingStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus = ListingStatus.ACTIVE;

  // Property-specific filters
  @ApiPropertyOptional({
    description: 'Filter by property type',
    enum: PropertyType,
  })
  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;

  @ApiPropertyOptional({
    description: 'Minimum number of bedrooms',
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minBedrooms?: number;

  @ApiPropertyOptional({
    description: 'Minimum number of bathrooms',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minBathrooms?: number;

  // Item-specific filters
  @ApiPropertyOptional({
    description: 'Filter by item condition',
    enum: ItemCondition,
  })
  @IsOptional()
  @IsEnum(ItemCondition)
  condition?: ItemCondition;

  @ApiPropertyOptional({
    description: 'Filter by brand',
    example: 'Samsung',
  })
  @IsOptional()
  @IsString()
  brand?: string;
}
