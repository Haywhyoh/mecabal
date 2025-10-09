import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { UserResponseDto } from './user-response.dto';

export class UserSearchDto {
  @ApiPropertyOptional({ description: 'Search query (name, email, occupation)' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ description: 'Filter by state' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Filter by city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Filter by estate' })
  @IsOptional()
  @IsString()
  estate?: string;

  @ApiPropertyOptional({ description: 'Filter by cultural background' })
  @IsOptional()
  @IsString()
  culturalBackground?: string;

  @ApiPropertyOptional({ description: 'Filter by occupation' })
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional({
    description: 'Filter by verification level',
    enum: ['unverified', 'phone', 'identity', 'full'],
  })
  @IsOptional()
  @IsEnum(['unverified', 'phone', 'identity', 'full'])
  verificationLevel?: string;

  @ApiPropertyOptional({ description: 'Only verified users', default: false })
  @IsOptional()
  @Type(() => Boolean)
  verifiedOnly?: boolean;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['createdAt', 'trustScore', 'lastName'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsEnum(['createdAt', 'trustScore', 'lastName'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class UserSearchResponseDto {
  @ApiPropertyOptional({ description: 'List of users' })
  users: UserResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of matching users' })
  total: number;

  @ApiPropertyOptional({ description: 'Current page' })
  page: number;

  @ApiPropertyOptional({ description: 'Items per page' })
  limit: number;

  @ApiPropertyOptional({ description: 'Total pages' })
  totalPages: number;

  @ApiPropertyOptional({ description: 'Has next page' })
  hasNextPage: boolean;

  @ApiPropertyOptional({ description: 'Has previous page' })
  hasPreviousPage: boolean;
}
