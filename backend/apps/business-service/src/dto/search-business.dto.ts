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
