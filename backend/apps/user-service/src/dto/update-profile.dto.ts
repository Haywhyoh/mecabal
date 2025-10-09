import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsDateString,
  IsEnum,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'User first name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ description: 'User last name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ description: 'User email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number (Nigerian format)' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Date of birth (ISO format)' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: 'Gender',
    enum: ['male', 'female', 'other'],
  })
  @IsOptional()
  @IsEnum(['male', 'female', 'other'])
  gender?: string;

  @ApiPropertyOptional({ description: 'User bio/description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ description: 'Occupation/job title' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  occupation?: string;

  @ApiPropertyOptional({ description: 'Professional skills (comma-separated)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  professionalSkills?: string;

  @ApiPropertyOptional({ description: 'Cultural background' })
  @IsOptional()
  @IsString()
  culturalBackground?: string;

  @ApiPropertyOptional({ description: 'Native languages (comma-separated)' })
  @IsOptional()
  @IsString()
  nativeLanguages?: string;

  @ApiPropertyOptional({ description: 'Preferred language code' })
  @IsOptional()
  @IsString()
  preferredLanguage?: string;

  // Location fields
  @ApiPropertyOptional({ description: 'Nigerian state' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'City within state' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Estate or compound name' })
  @IsOptional()
  @IsString()
  estate?: string;

  @ApiPropertyOptional({ description: 'Landmark for location reference' })
  @IsOptional()
  @IsString()
  landmark?: string;

  @ApiPropertyOptional({ description: 'Full address text' })
  @IsOptional()
  @IsString()
  address?: string;
}
