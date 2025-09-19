import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserDto {
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
  phoneNumber?: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  lastName: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one lowercase letter, one uppercase letter, and one number',
  })
  password: string;

  @ApiProperty({
    description: 'Nigerian state',
    example: 'Lagos',
    required: false,
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({
    description: 'City within state',
    example: 'Ikeja',
    required: false,
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    description: 'Estate or compound name',
    example: 'Victoria Island Estate',
    required: false,
  })
  @IsOptional()
  @IsString()
  estate?: string;

  @ApiProperty({
    description: 'Preferred language',
    example: 'en',
    default: 'en',
    required: false,
  })
  @IsOptional()
  @IsString()
  preferredLanguage?: string = 'en';
}

export class LoginUserDto {
  @ApiProperty({
    description: 'Email or phone number for login',
    example: 'user@example.com or +2348123456789',
  })
  @IsString()
  identifier: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePassword123!',
  })
  @IsString()
  password: string;
}
