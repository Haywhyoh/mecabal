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
  IsBoolean,
  IsObject,
  IsInt,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  IsPositivePrice,
  IsFutureDate,
  IsValidCoordinates,
  IsValidSalaryRange,
  IsValidSkillsArray,
  IsValidPropertySize,
  IsValidServiceRadius,
  IsValidResponseTime,
  IsNigerianPhoneNumber,
  IsValidUrl,
} from '../../validators/custom-validators';

export enum ListingType {
  PROPERTY = 'property',
  ITEM = 'item',
  SERVICE = 'service',
  // @deprecated Use Community Help 'task' category for job postings
  // JOB = 'job',
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

export enum TransactionType {
  SALE = 'sale',
  RENT = 'rent',
  LEASE = 'lease',
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

export enum ServiceType {
  OFFERING = 'offering',
  REQUEST = 'request',
}

export enum PricingModel {
  HOURLY = 'hourly',
  PROJECT = 'project',
  FIXED = 'fixed',
  NEGOTIABLE = 'negotiable',
}

export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  FREELANCE = 'freelance',
}

export enum WorkLocation {
  REMOTE = 'remote',
  ON_SITE = 'on_site',
  HYBRID = 'hybrid',
}

export enum PetPolicy {
  ALLOWED = 'allowed',
  NOT_ALLOWED = 'not_allowed',
  CASE_BY_CASE = 'case_by_case',
}

export class LocationDto {
  @ApiProperty({
    description: 'Latitude coordinate',
    example: 6.5244,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: 3.3792,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
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
  @ApiPropertyOptional({
    description: 'Temporary ID from client (ignored by server)',
    example: '0',
  })
  @IsOptional()
  @IsString()
  id?: string;

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

export class AvailabilityScheduleDto {
  @ApiProperty({
    description: 'Available days of the week',
    example: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  })
  @IsArray()
  @IsString({ each: true })
  days: string[];

  @ApiProperty({
    description: 'Start time',
    example: '09:00',
  })
  @IsString()
  startTime: string;

  @ApiProperty({
    description: 'End time',
    example: '17:00',
  })
  @IsString()
  endTime: string;

  @ApiProperty({
    description: 'Timezone',
    example: 'Africa/Lagos',
  })
  @IsString()
  timezone: string;
}

export class ProfessionalCredentialsDto {
  @ApiProperty({
    description: 'Professional licenses',
    example: ['CAC Registration', 'Tax Clearance'],
  })
  @IsArray()
  @IsString({ each: true })
  licenses: string[];

  @ApiProperty({
    description: 'Professional certifications',
    example: ['PMP', 'AWS Certified'],
  })
  @IsArray()
  @IsString({ each: true })
  certifications: string[];

  @ApiProperty({
    description: 'Years of experience',
    example: 5,
  })
  @IsNumber()
  @Min(0)
  experience: number;

  @ApiProperty({
    description: 'Has professional insurance',
    example: true,
  })
  @IsOptional()
  insurance?: boolean;
}

export class CompanyInfoDto {
  @ApiProperty({
    description: 'Company name',
    example: 'Tech Solutions Ltd',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Company size',
    example: '10-50 employees',
  })
  @IsString()
  size: string;

  @ApiProperty({
    description: 'Industry',
    example: 'Technology',
  })
  @IsString()
  industry: string;

  @ApiPropertyOptional({
    description: 'Company website',
    example: 'https://techsolutions.com',
  })
  @IsOptional()
  @IsString()
  website?: string;
}

export class ContactPreferencesDto {
  @ApiProperty({
    description: 'Allow phone calls',
    example: true,
  })
  @IsOptional()
  allowCalls?: boolean;

  @ApiProperty({
    description: 'Allow messages',
    example: true,
  })
  @IsOptional()
  allowMessages?: boolean;

  @ApiProperty({
    description: 'Allow WhatsApp',
    example: true,
  })
  @IsOptional()
  allowWhatsApp?: boolean;

  @ApiProperty({
    description: 'Preferred contact time',
    example: '9 AM - 5 PM',
  })
  @IsOptional()
  @IsString()
  preferredTime?: string;
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
  @IsInt()
  @Min(1)
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
  @IsPositivePrice()
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
    description: 'Transaction type for properties',
    enum: TransactionType,
    example: TransactionType.RENT,
  })
  @IsOptional()
  @IsEnum(TransactionType)
  transactionType?: TransactionType;

  @ApiPropertyOptional({
    description: 'Number of bedrooms (required for apartments and houses)',
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @ApiPropertyOptional({
    description: 'Number of bathrooms (required for apartments and houses)',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @ApiPropertyOptional({
    description: 'Rental period (required only when transactionType is "rent")',
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

  @ApiPropertyOptional({
    description: 'Model name',
    example: 'J5',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @ApiPropertyOptional({
    description: 'Year of manufacture',
    example: 2020,
  })
  @IsOptional()
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year?: number;

  @ApiPropertyOptional({
    description: 'Warranty period',
    example: '2 months',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  warranty?: string;

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

  // Service-specific fields
  @ApiPropertyOptional({
    description: 'Service type (required for service listings)',
    enum: ServiceType,
    example: ServiceType.OFFERING,
  })
  @IsOptional()
  @IsEnum(ServiceType)
  serviceType?: ServiceType;

  @ApiPropertyOptional({
    description: 'Service availability schedule',
    type: AvailabilityScheduleDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AvailabilityScheduleDto)
  availabilitySchedule?: AvailabilityScheduleDto;

  @ApiPropertyOptional({
    description: 'Service radius in kilometers',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @IsValidServiceRadius()
  serviceRadius?: number;

  @ApiPropertyOptional({
    description: 'Professional credentials',
    type: ProfessionalCredentialsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProfessionalCredentialsDto)
  professionalCredentials?: ProfessionalCredentialsDto;

  @ApiPropertyOptional({
    description: 'Pricing model for services',
    enum: PricingModel,
    example: PricingModel.HOURLY,
  })
  @IsOptional()
  @IsEnum(PricingModel)
  pricingModel?: PricingModel;

  @ApiPropertyOptional({
    description: 'Response time in hours',
    example: 24,
  })
  @IsOptional()
  @IsNumber()
  @IsValidResponseTime()
  responseTime?: number;

  // Job-specific fields (DEPRECATED - use Community Help for job postings)
  /**
   * @deprecated Job listings no longer supported. Use Community Help instead.
   */
  @ApiPropertyOptional({
    description: 'Employment type (DEPRECATED)',
    enum: EmploymentType,
    example: EmploymentType.FULL_TIME,
    deprecated: true,
  })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  /**
   * @deprecated Job listings no longer supported. Use Community Help instead.
   */
  @ApiPropertyOptional({
    description: 'Minimum salary (DEPRECATED)',
    example: 500000,
    deprecated: true,
  })
  @IsOptional()
  @IsNumber()
  @IsPositivePrice()
  salaryMin?: number;

  /**
   * @deprecated Job listings no longer supported. Use Community Help instead.
   */
  @ApiPropertyOptional({
    description: 'Maximum salary (DEPRECATED)',
    example: 1000000,
    deprecated: true,
  })
  @IsOptional()
  @IsNumber()
  @IsPositivePrice()
  salaryMax?: number;

  /**
   * @deprecated Job listings no longer supported. Use Community Help instead.
   */
  @ApiPropertyOptional({
    description: 'Application deadline (DEPRECATED)',
    example: '2024-12-31T23:59:59Z',
    deprecated: true,
  })
  @IsOptional()
  @IsDateString()
  @IsFutureDate()
  applicationDeadline?: string;

  /**
   * @deprecated Job listings no longer supported. Use Community Help instead.
   */
  @ApiPropertyOptional({
    description: 'Required skills (DEPRECATED)',
    example: ['JavaScript', 'React', 'Node.js'],
    deprecated: true,
  })
  @IsOptional()
  @IsArray()
  @IsValidSkillsArray()
  requiredSkills?: string[];

  /**
   * @deprecated Job listings no longer supported. Use Community Help instead.
   */
  @ApiPropertyOptional({
    description: 'Work location type (DEPRECATED)',
    enum: WorkLocation,
    example: WorkLocation.REMOTE,
    deprecated: true,
  })
  @IsOptional()
  @IsEnum(WorkLocation)
  workLocation?: WorkLocation;

  /**
   * @deprecated Job listings no longer supported. Use Community Help instead.
   */
  @ApiPropertyOptional({
    description: 'Company information (DEPRECATED)',
    type: CompanyInfoDto,
    deprecated: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CompanyInfoDto)
  companyInfo?: CompanyInfoDto;

  // Enhanced property fields
  @ApiPropertyOptional({
    description: 'Property amenities',
    example: ['Swimming Pool', 'Gym', 'Parking'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  propertyAmenities?: string[];

  @ApiPropertyOptional({
    description: 'Utilities included',
    example: ['Electricity', 'Water', 'Internet'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  utilitiesIncluded?: string[];

  @ApiPropertyOptional({
    description: 'Pet policy',
    enum: PetPolicy,
    example: PetPolicy.ALLOWED,
  })
  @IsOptional()
  @IsEnum(PetPolicy)
  petPolicy?: PetPolicy;

  @ApiPropertyOptional({
    description: 'Number of parking spaces',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  parkingSpaces?: number;

  @ApiPropertyOptional({
    description: 'Security features',
    example: ['CCTV', 'Security Guard', 'Gated Community'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  securityFeatures?: string[];

  @ApiPropertyOptional({
    description: 'Property size in square meters',
    example: 120.5,
  })
  @IsOptional()
  @IsNumber()
  @IsValidPropertySize()
  propertySize?: number;

  @ApiPropertyOptional({
    description: 'Land size in square meters',
    example: 500.0,
  })
  @IsOptional()
  @IsNumber()
  @IsValidPropertySize()
  landSize?: number;

  // Enhanced location fields
  @ApiPropertyOptional({
    description: 'Estate ID',
    example: 'estate-uuid-123',
  })
  @IsOptional()
  @IsString()
  estateId?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Lagos',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'State',
    example: 'Lagos State',
  })
  @IsOptional()
  @IsString()
  state?: string;

  // Enhanced status and metadata
  @ApiPropertyOptional({
    description: 'Whether listing is featured',
    example: false,
  })
  @IsOptional()
  featured?: boolean;

  @ApiPropertyOptional({
    description: 'Whether listing is boosted',
    example: false,
  })
  @IsOptional()
  boosted?: boolean;

  @ApiPropertyOptional({
    description: 'Contact preferences',
    type: ContactPreferencesDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContactPreferencesDto)
  contactPreferences?: ContactPreferencesDto;
}
