import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsString,
  IsDateString,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class EventFilterDto {
  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiProperty({
    description: 'Filter by event category ID',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  categoryId?: number;

  @ApiProperty({
    description: 'Filter by event status',
    enum: ['draft', 'published', 'cancelled', 'completed'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['draft', 'published', 'cancelled', 'completed'])
  status?: string;

  @ApiProperty({
    description: 'Search term for event title and description',
    example: 'community cleanup',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filter events from this date (YYYY-MM-DD)',
    example: '2025-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiProperty({
    description: 'Filter events until this date (YYYY-MM-DD)',
    example: '2025-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiProperty({
    description: 'Filter by neighborhood ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  neighborhoodId?: string;

  @ApiProperty({
    description: 'Filter by free events only',
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isFree?: boolean;

  @ApiProperty({
    description: 'Sort by field',
    enum: ['createdAt', 'eventDate', 'attendeesCount'],
    example: 'eventDate',
    required: false,
  })
  @IsOptional()
  @IsEnum(['createdAt', 'eventDate', 'attendeesCount'])
  sortBy?: string;

  @ApiProperty({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    example: 'ASC',
    required: false,
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}
