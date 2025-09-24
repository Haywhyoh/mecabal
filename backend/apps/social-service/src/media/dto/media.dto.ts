import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

export class UploadMediaDto {
  @ApiProperty({
    description: 'Media type',
    enum: MediaType,
    example: MediaType.IMAGE,
  })
  @IsEnum(MediaType)
  type: MediaType;

  @ApiPropertyOptional({
    description: 'Media caption',
    example: 'Beautiful sunset in Lagos',
  })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({
    description: 'Image quality (0.1 to 1.0)',
    minimum: 0.1,
    maximum: 1.0,
    default: 0.8,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(1.0)
  quality?: number = 0.8;

  @ApiPropertyOptional({
    description: 'Maximum width for image resizing',
    minimum: 100,
    maximum: 2000,
    default: 1200,
  })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(2000)
  maxWidth?: number = 1200;

  @ApiPropertyOptional({
    description: 'Maximum height for image resizing',
    minimum: 100,
    maximum: 2000,
    default: 1200,
  })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(2000)
  maxHeight?: number = 1200;
}

export class MediaResponseDto {
  @ApiProperty({ description: 'Media ID' })
  id: string;

  @ApiProperty({ description: 'Media URL' })
  url: string;

  @ApiProperty({ description: 'Media type', enum: MediaType })
  type: MediaType;

  @ApiPropertyOptional({ description: 'Media caption' })
  caption?: string;

  @ApiProperty({ description: 'File size in bytes' })
  size: number;

  @ApiPropertyOptional({ description: 'Image width' })
  width?: number;

  @ApiPropertyOptional({ description: 'Image height' })
  height?: number;

  @ApiProperty({ description: 'Upload timestamp' })
  uploadedAt: Date;

  @ApiProperty({ description: 'Uploader user ID' })
  uploadedBy: string;
}

export class MediaUploadResponseDto {
  @ApiProperty({ description: 'Uploaded media', type: [MediaResponseDto] })
  media: MediaResponseDto[];

  @ApiProperty({ description: 'Total upload time in milliseconds' })
  uploadTime: number;

  @ApiProperty({ description: 'Total file size in bytes' })
  totalSize: number;
}

export class MediaFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by media type',
    enum: MediaType,
  })
  @IsOptional()
  @IsEnum(MediaType)
  type?: MediaType;

  @ApiPropertyOptional({
    description: 'Filter by uploader user ID',
  })
  @IsOptional()
  @IsString()
  uploadedBy?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class PaginatedMediaDto {
  @ApiProperty({ description: 'Array of media', type: [MediaResponseDto] })
  data: MediaResponseDto[];

  @ApiProperty({ description: 'Total number of media' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPrev: boolean;
}
