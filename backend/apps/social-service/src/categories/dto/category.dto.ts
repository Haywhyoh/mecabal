import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsUrl, Length, Matches } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Category name',
    example: 'Community News',
    maxLength: 50,
  })
  @IsString()
  @Length(1, 50)
  name: string;

  @ApiPropertyOptional({
    description: 'Category description',
    example: 'News and updates about the community',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Icon URL for the category',
    example: 'https://example.com/icons/news.png',
  })
  @IsOptional()
  @IsUrl()
  iconUrl?: string;

  @ApiPropertyOptional({
    description: 'Color code for the category',
    example: '#FF5733',
    pattern: '^#[0-9A-Fa-f]{6}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Color code must be a valid hex color (e.g., #FF5733)',
  })
  colorCode?: string;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({
    description: 'Category name',
    example: 'Community News',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  name?: string;

  @ApiPropertyOptional({
    description: 'Category description',
    example: 'News and updates about the community',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Icon URL for the category',
    example: 'https://example.com/icons/news.png',
  })
  @IsOptional()
  @IsUrl()
  iconUrl?: string;

  @ApiPropertyOptional({
    description: 'Color code for the category',
    example: '#FF5733',
    pattern: '^#[0-9A-Fa-f]{6}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Color code must be a valid hex color (e.g., #FF5733)',
  })
  colorCode?: string;

  @ApiPropertyOptional({
    description: 'Whether category is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CategoryResponseDto {
  @ApiProperty({ description: 'Category ID' })
  id: number;

  @ApiProperty({ description: 'Category name' })
  name: string;

  @ApiPropertyOptional({ description: 'Category description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Icon URL for the category' })
  iconUrl?: string;

  @ApiPropertyOptional({ description: 'Color code for the category' })
  colorCode?: string;

  @ApiProperty({ description: 'Whether category is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Number of posts in this category' })
  postCount: number;

  @ApiProperty({ description: 'Category creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Category last update timestamp' })
  updatedAt: Date;
}

export class CategoryFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by active status',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Search term for category name or description',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class CategoryStatsDto {
  @ApiProperty({ description: 'Total number of categories' })
  totalCategories: number;

  @ApiProperty({ description: 'Number of active categories' })
  activeCategories: number;

  @ApiProperty({ description: 'Number of inactive categories' })
  inactiveCategories: number;

  @ApiProperty({ description: 'Most used categories' })
  topCategories: Array<{
    id: number;
    name: string;
    postCount: number;
  }>;
}
