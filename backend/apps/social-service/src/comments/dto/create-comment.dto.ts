import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, MaxLength } from 'class-validator';

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

  @ApiProperty({
    description: 'Parent comment ID for replies',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  parentCommentId?: string;
}
