import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsNumber,
  IsDateString,
  MaxLength,
  MinLength,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PostType {
  GENERAL = 'general',
  EVENT = 'event',
  ALERT = 'alert',
  MARKETPLACE = 'marketplace',
  LOST_FOUND = 'lost_found',
}

export enum PrivacyLevel {
  NEIGHBORHOOD = 'neighborhood',
  GROUP = 'group',
  PUBLIC = 'public',
}

export class PostMediaDto {
  @ApiProperty({ description: 'Media file URL' })
  @IsString()
  url: string;

  @ApiProperty({ description: 'Media type', enum: ['image', 'video'] })
  @IsEnum(['image', 'video'])
  type: 'image' | 'video';

  @ApiPropertyOptional({ description: 'Media caption' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  caption?: string;
}

export class CreatePostDto {
  @ApiPropertyOptional({
    description: 'Post title',
    example: 'Community BBQ This Weekend',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @MinLength(3)
  title?: string;

  @ApiProperty({
    description: 'Post content',
    example: 'Join us for a community BBQ this Saturday at 4 PM in the estate park.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content: string;

  @ApiProperty({
    description: 'Type of post',
    enum: PostType,
    example: PostType.GENERAL,
  })
  @IsEnum(PostType)
  postType: PostType;

  @ApiProperty({
    description: 'Privacy level of the post',
    enum: PrivacyLevel,
    example: PrivacyLevel.NEIGHBORHOOD,
  })
  @IsEnum(PrivacyLevel)
  privacyLevel: PrivacyLevel;

  @ApiPropertyOptional({
    description: 'Post category ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @ApiPropertyOptional({
    description: 'Post expiration time',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: 'Media attachments',
    type: [PostMediaDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostMediaDto)
  media?: PostMediaDto[];

  @ApiPropertyOptional({
    description: 'Whether to pin this post',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}
