import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  Matches,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class MobileRegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'Nigerian phone number in international format',
    example: '+2348123456789',
    required: false,
  })
  @IsOptional()
  @Matches(/^\+234[0-9]{10}$/, {
    message: 'Phone number must be in Nigerian format (+234XXXXXXXXXX)',
  })
  phone_number?: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  first_name: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  last_name: string;

  @ApiProperty({
    description: 'Nigerian state',
    example: 'Lagos',
    required: false,
  })
  @IsOptional()
  @IsString()
  state_of_origin?: string;

  @ApiProperty({
    description: 'Gated estate ID (required)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'Estate selection is required' })
  @IsUUID('4', { message: 'Estate ID must be a valid UUID' })
  estate_id: string;

  @ApiProperty({
    description: 'State of origin ID',
    example: 'lagos-state-id',
  })
  @IsNotEmpty({ message: 'State of origin is required' })
  @IsString()
  state_of_origin_id: string;

  @ApiProperty({
    description: 'Cultural background ID',
    example: 'yoruba-cultural-id',
  })
  @IsNotEmpty({ message: 'Cultural background is required' })
  @IsString()
  cultural_background_id: string;

  @ApiProperty({
    description: 'Professional category ID',
    example: 'tech-category-id',
  })
  @IsNotEmpty({ message: 'Professional category is required' })
  @IsString()
  professional_category_id: string;

  @ApiProperty({
    description: 'Professional title within the category',
    example: 'Senior Software Engineer',
    required: false,
  })
  @IsOptional()
  @IsString()
  professional_title?: string;

  @ApiProperty({
    description: 'Occupation or job title',
    example: 'Software Engineer',
    required: false,
  })
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiProperty({
    description: 'Preferred language',
    example: 'en',
    default: 'en',
    required: false,
  })
  @IsOptional()
  @IsString()
  preferred_language?: string = 'en';

  @ApiProperty({
    description: 'Carrier information',
    required: false,
  })
  @IsOptional()
  carrier_info?: any;
}
