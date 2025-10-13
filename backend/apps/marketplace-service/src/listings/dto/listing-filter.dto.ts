import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsString,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { 
  ListingType, 
  PriceType, 
  PropertyType, 
  ItemCondition, 
  ServiceType, 
  PricingModel, 
  EmploymentType, 
  WorkLocation, 
  PetPolicy 
} from './create-listing.dto';
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

  // Service-specific filters
  @ApiPropertyOptional({
    description: 'Filter by service type',
    enum: ServiceType,
  })
  @IsOptional()
  @IsEnum(ServiceType)
  serviceType?: ServiceType;

  @ApiPropertyOptional({
    description: 'Filter by pricing model',
    enum: PricingModel,
  })
  @IsOptional()
  @IsEnum(PricingModel)
  pricingModel?: PricingModel;

  @ApiPropertyOptional({
    description: 'Filter by service radius (minimum)',
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minServiceRadius?: number;

  @ApiPropertyOptional({
    description: 'Filter by response time (maximum hours)',
    example: 24,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxResponseTime?: number;

  // Job-specific filters
  @ApiPropertyOptional({
    description: 'Filter by employment type',
    enum: EmploymentType,
  })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiPropertyOptional({
    description: 'Filter by work location',
    enum: WorkLocation,
  })
  @IsOptional()
  @IsEnum(WorkLocation)
  workLocation?: WorkLocation;

  @ApiPropertyOptional({
    description: 'Filter by minimum salary',
    example: 500000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minSalary?: number;

  @ApiPropertyOptional({
    description: 'Filter by maximum salary',
    example: 2000000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxSalary?: number;

  @ApiPropertyOptional({
    description: 'Filter by required skills',
    example: ['JavaScript', 'React'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredSkills?: string[];

  @ApiPropertyOptional({
    description: 'Filter by application deadline (before this date)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsString()
  applicationDeadlineBefore?: string;

  // Enhanced property filters
  @ApiPropertyOptional({
    description: 'Filter by property amenities',
    example: ['Swimming Pool', 'Gym'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  propertyAmenities?: string[];

  @ApiPropertyOptional({
    description: 'Filter by utilities included',
    example: ['Electricity', 'Water'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  utilitiesIncluded?: string[];

  @ApiPropertyOptional({
    description: 'Filter by pet policy',
    enum: PetPolicy,
  })
  @IsOptional()
  @IsEnum(PetPolicy)
  petPolicy?: PetPolicy;

  @ApiPropertyOptional({
    description: 'Filter by minimum parking spaces',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minParkingSpaces?: number;

  @ApiPropertyOptional({
    description: 'Filter by security features',
    example: ['CCTV', 'Security Guard'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  securityFeatures?: string[];

  @ApiPropertyOptional({
    description: 'Filter by minimum property size (square meters)',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPropertySize?: number;

  @ApiPropertyOptional({
    description: 'Filter by maximum property size (square meters)',
    example: 500,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPropertySize?: number;

  @ApiPropertyOptional({
    description: 'Filter by minimum land size (square meters)',
    example: 200,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minLandSize?: number;

  @ApiPropertyOptional({
    description: 'Filter by maximum land size (square meters)',
    example: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxLandSize?: number;

  // Enhanced location filters
  @ApiPropertyOptional({
    description: 'Filter by estate ID',
    example: 'estate-uuid-123',
  })
  @IsOptional()
  @IsString()
  estateId?: string;

  @ApiPropertyOptional({
    description: 'Filter by city',
    example: 'Lagos',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Filter by state',
    example: 'Lagos State',
  })
  @IsOptional()
  @IsString()
  state?: string;

  // Enhanced status filters
  @ApiPropertyOptional({
    description: 'Filter by featured status',
    example: true,
  })
  @IsOptional()
  featured?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by boosted status',
    example: true,
  })
  @IsOptional()
  boosted?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by verification status',
    enum: ['pending', 'verified', 'rejected'],
  })
  @IsOptional()
  @IsEnum(['pending', 'verified', 'rejected'])
  verificationStatus?: 'pending' | 'verified' | 'rejected';

  // Advanced search options
  @ApiPropertyOptional({
    description: 'Full-text search query',
    example: '3 bedroom apartment lekki',
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['createdAt', 'price', 'viewsCount', 'relevance', 'savesCount'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsEnum(['createdAt', 'price', 'viewsCount', 'relevance', 'savesCount'])
  sortBy?: 'createdAt' | 'price' | 'viewsCount' | 'relevance' | 'savesCount' = 'createdAt';
}
