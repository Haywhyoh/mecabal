import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  IsDateString,
  Matches,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  ValidateNested,
  IsArray,
  IsUrl,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LocationDto {
  @ApiProperty({
    description: 'Location name',
    example: 'Victoria Island Community Center',
    maxLength: 200,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({
    description: 'Full location address',
    example: '123 Ahmadu Bello Way, Victoria Island, Lagos',
  })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: 6.4281,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: 3.4219,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({
    description: 'Landmark for location reference',
    example: 'Near Eko Hotel',
    required: false,
  })
  @IsOptional()
  @IsString()
  landmark?: string;
}

export class MediaDto {
  @ApiProperty({
    description: 'Media URL',
    example: 'https://example.com/images/event-cover.jpg',
  })
  @IsUrl()
  url: string;

  @ApiProperty({
    description: 'Media type',
    enum: ['image', 'video'],
    example: 'image',
  })
  @IsEnum(['image', 'video'])
  type: 'image' | 'video';

  @ApiProperty({
    description: 'Media caption',
    example: 'Event venue entrance',
    required: false,
  })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiProperty({
    description: 'Display order for sorting media',
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  displayOrder?: number;
}

export class CreateEventDto {
  @ApiProperty({
    description: 'Event category ID',
    example: 1,
  })
  @IsInt()
  @Min(1)
  categoryId: number;

  @ApiProperty({
    description: 'Event title',
    example: 'Community Cleanup Drive',
    maxLength: 200,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Event description',
    example: 'Join us for a community cleanup drive to keep our neighborhood clean and beautiful.',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Event date in YYYY-MM-DD format',
    example: '2025-01-15',
  })
  @IsDateString()
  eventDate: string;

  @ApiProperty({
    description: 'Event start time in HH:mm format',
    example: '09:00',
  })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Start time must be in HH:mm format',
  })
  startTime: string;

  @ApiProperty({
    description: 'Event end time in HH:mm format',
    example: '17:00',
    required: false,
  })
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'End time must be in HH:mm format',
  })
  endTime?: string;

  @ApiProperty({
    description: 'Event location details',
    type: LocationDto,
  })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiProperty({
    description: 'Whether event is free',
    default: true,
  })
  @IsBoolean()
  isFree: boolean;

  @ApiProperty({
    description: 'Event price in Naira (required if not free)',
    example: 5000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({
    description: 'Maximum number of attendees',
    example: 100,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxAttendees?: number;

  @ApiProperty({
    description: 'Whether guests are allowed',
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  allowGuests?: boolean;

  @ApiProperty({
    description: 'Whether verification is required',
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  requireVerification?: boolean;

  @ApiProperty({
    description: 'Age restriction',
    example: '18+',
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  ageRestriction?: string;

  @ApiProperty({
    description: 'Languages spoken at event',
    example: ['English', 'Yoruba'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiProperty({
    description: 'Whether event is private',
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiProperty({
    description: 'Cover image URL',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  coverImageUrl?: string;

  @ApiProperty({
    description: 'Event media attachments',
    type: [MediaDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaDto)
  media?: MediaDto[];

  @ApiProperty({
    description: 'Special requirements or notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  specialRequirements?: string;
}
