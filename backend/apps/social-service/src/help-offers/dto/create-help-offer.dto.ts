import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ContactMethod } from '@app/database';

export class CreateHelpOfferDto {
  @ApiProperty({
    description: 'Post ID to offer help for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  postId: string;

  @ApiProperty({
    description: 'Message explaining how you can help',
    example: 'I can help you with this task. I have experience in this area and can complete it within 2 hours.',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Message must be at least 10 characters long' })
  @MaxLength(2000, { message: 'Message cannot exceed 2000 characters' })
  message: string;

  @ApiProperty({
    description: 'Preferred contact method',
    enum: ContactMethod,
    example: ContactMethod.MESSAGE,
  })
  @IsEnum(ContactMethod)
  contactMethod: ContactMethod;

  @ApiPropertyOptional({
    description: 'Availability information',
    example: 'Available today and tomorrow',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Availability cannot exceed 500 characters' })
  availability?: string;

  @ApiPropertyOptional({
    description: 'Estimated time to complete',
    example: '2 hours',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Estimated time cannot exceed 100 characters' })
  estimatedTime?: string;
}

