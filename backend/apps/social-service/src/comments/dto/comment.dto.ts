import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Comment content',
    example: 'Great idea! I would love to join.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;

  @ApiPropertyOptional({
    description: 'Parent comment ID for replies',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  parentCommentId?: string;
}

export class UpdateCommentDto {
  @ApiProperty({
    description: 'Updated comment content',
    example: 'Updated comment content',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;
}

export class CommentResponseDto {
  @ApiProperty({ description: 'Comment ID' })
  id: string;

  @ApiProperty({ description: 'Post ID' })
  postId: string;

  @ApiProperty({ description: 'User ID who made the comment' })
  userId: string;

  @ApiPropertyOptional({ description: 'Parent comment ID for replies' })
  parentCommentId?: string;

  @ApiProperty({ description: 'Comment content' })
  content: string;

  @ApiProperty({ description: 'Whether comment is approved' })
  isApproved: boolean;

  @ApiProperty({ description: 'Comment creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Comment last update timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'User information' })
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    isVerified: boolean;
    trustScore: number;
  };

  @ApiProperty({
    description: 'Replies to this comment',
    type: [CommentResponseDto],
  })
  replies: CommentResponseDto[];

  @ApiProperty({ description: 'Whether this is a reply' })
  isReply: boolean;
}

export class CommentFilterDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of comments per page',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Show only top-level comments (no replies)',
    default: false,
  })
  @IsOptional()
  topLevelOnly?: boolean = false;
}

export class PaginatedCommentsDto {
  @ApiProperty({ description: 'Array of comments', type: [CommentResponseDto] })
  data: CommentResponseDto[];

  @ApiProperty({ description: 'Total number of comments' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of comments per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPrev: boolean;
}
