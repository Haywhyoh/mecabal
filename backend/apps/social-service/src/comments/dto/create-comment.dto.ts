import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsArray,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CommentMediaDto {
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

export class CreateCommentDto {
  @ApiProperty({
    description: 'Comment content',
    example: 'Great post! This is very helpful.',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000, { message: 'Comment content cannot exceed 2000 characters' })
  content: string;

  @ApiPropertyOptional({
    description: 'Parent comment ID for replies',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  parentCommentId?: string;

  @ApiPropertyOptional({
    description: 'Media attachments',
    type: [CommentMediaDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommentMediaDto)
  media?: CommentMediaDto[];
}
