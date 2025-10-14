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
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PostType {
  GENERAL = 'general',
  EVENT = 'event',
  ALERT = 'alert',
  MARKETPLACE = 'marketplace',
  LOST_FOUND = 'lost_found',
  HELP = 'help',
}

export enum HelpCategory {
  ERRAND = 'errand',
  TASK = 'task',
  RECOMMENDATION = 'recommendation',
  ADVICE = 'advice',
  BORROW = 'borrow',
}

export enum Urgency {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
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
    example:
      'Join us for a community BBQ this Saturday at 4 PM in the estate park.',
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

  // Help-specific fields
  @ApiPropertyOptional({
    description: 'Help category (required if postType is help)',
    enum: HelpCategory,
    example: HelpCategory.JOB,
  })
  @IsOptional()
  @IsEnum(HelpCategory)
  @ValidateIf((o) => o.postType === PostType.HELP)
  @IsNotEmpty()
  helpCategory?: HelpCategory;

  @ApiPropertyOptional({
    description: 'Urgency level for help requests',
    enum: Urgency,
    example: Urgency.MEDIUM,
  })
  @IsOptional()
  @IsEnum(Urgency)
  urgency?: Urgency;

  @ApiPropertyOptional({
    description: 'Budget for help request',
    example: '₦50,000',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  budget?: string;

  @ApiPropertyOptional({
    description: 'Deadline for help request',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  // Borrow-specific fields
  @ApiPropertyOptional({
    description: 'Borrow duration (required if helpCategory is borrow)',
    enum: ['few_hours', 'day', 'few_days', 'week'],
    example: 'day',
  })
  @IsOptional()
  @IsEnum(['few_hours', 'day', 'few_days', 'week'])
  @ValidateIf((o) => o.helpCategory === HelpCategory.BORROW)
  @IsNotEmpty({ message: 'Borrow duration is required for borrow requests' })
  borrowDuration?: string;

  @ApiPropertyOptional({
    description: 'Item to borrow (required if helpCategory is borrow)',
    example: 'Ladder',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @ValidateIf((o) => o.helpCategory === HelpCategory.BORROW)
  @IsNotEmpty({ message: 'Borrow item is required for borrow requests' })
  borrowItem?: string;

  @ApiPropertyOptional({
    description: 'Item condition notes (for borrow requests)',
    example: 'Prefer one in good working condition',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  itemCondition?: string;

  // Task-specific fields
  @ApiPropertyOptional({
    description: 'Task type (for task requests)',
    example: 'moving',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taskType?: string;

  @ApiPropertyOptional({
    description: 'Estimated duration (for task requests)',
    example: '2 hours',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  estimatedDuration?: string;
}
