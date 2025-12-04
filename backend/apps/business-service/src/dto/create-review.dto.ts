import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBusinessReviewDto {
  @ApiProperty({ example: 5, description: 'Overall rating (1-5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({
    example: 'Excellent service! Very professional and timely.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  reviewText?: string;

  @ApiPropertyOptional({ example: 'uuid-of-booking' })
  @IsString()
  @IsOptional()
  bookingId?: string;

  @ApiPropertyOptional({ example: 'Plumbing Repair' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  serviceType?: string;

  @ApiPropertyOptional({ example: 5, description: 'Service quality rating (1-5)' })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(5)
  serviceQuality?: number;

  @ApiPropertyOptional({ example: 5, description: 'Professionalism rating (1-5)' })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(5)
  professionalism?: number;

  @ApiPropertyOptional({ example: 4, description: 'Value for money rating (1-5)' })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(5)
  valueForMoney?: number;
}

export class RespondToReviewDto {
  @ApiProperty({ example: 'Thank you for your feedback!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  response: string;
}

export class ReviewQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 5, description: 'Filter by rating' })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(5)
  rating?: number;
}
