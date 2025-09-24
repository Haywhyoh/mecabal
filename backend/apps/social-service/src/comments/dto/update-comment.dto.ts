import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({
    description: 'Updated comment content',
    example: 'Updated comment content here.',
    maxLength: 2000,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000, { message: 'Comment content cannot exceed 2000 characters' })
  content?: string;
}
