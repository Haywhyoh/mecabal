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
