import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  Matches,
  IsEnum,
  IsBoolean,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Basic Auth DTOs
export class RegisterDto {
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
    description: 'Gated estate ID (required)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'Estate selection is required' })
  @IsUUID('4', { message: 'Estate ID must be a valid UUID' })
  estateId: string;

  @ApiProperty({
    description: 'State of origin ID',
    example: 'lagos-state-id',
  })
  @IsNotEmpty({ message: 'State of origin is required' })
  @IsString()
  stateOfOriginId: string;

  @ApiProperty({
    description: 'Cultural background ID',
    example: 'yoruba-cultural-id',
  })
  @IsNotEmpty({ message: 'Cultural background is required' })
  @IsString()
  culturalBackgroundId: string;

  @ApiProperty({
    description: 'Professional category ID',
    example: 'tech-category-id',
  })
  @IsNotEmpty({ message: 'Professional category is required' })
  @IsString()
  professionalCategoryId: string;

  @ApiProperty({
    description: 'Professional title within the category',
    example: 'Senior Software Engineer',
    required: false,
  })
  @IsOptional()
  @IsString()
  professionalTitle?: string;

  @ApiProperty({
    description: 'Occupation or job title',
    example: 'Software Engineer',
    required: false,
  })
  @IsOptional()
  @IsString()
  occupation?: string;
}

export class LoginDto {
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

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Email address the OTP was sent to',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: '6-digit OTP code',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  otpCode: string;

  @ApiProperty({
    description: 'Purpose of the OTP verification',
    enum: ['registration', 'login', 'password_reset'],
    example: 'registration',
  })
  @IsEnum(['registration', 'login', 'password_reset'])
  purpose: 'registration' | 'login' | 'password_reset';
}

// Password Reset DTOs
export class ResetPasswordDto {
  @ApiProperty({
    description: 'Email address to send reset code to',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;
}

export class ConfirmPasswordResetDto {
  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'Reset code sent to email',
    example: '123456',
  })
  @IsString()
  resetCode: string;

  @ApiProperty({
    description: 'New password',
    example: 'NewSecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one lowercase letter, one uppercase letter, and one number',
  })
  newPassword: string;
}

// OTP Login DTOs
export class InitiateOtpLoginDto {
  @ApiProperty({
    description: 'Email address for OTP login',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;
}

export class VerifyOtpLoginDto {
  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'OTP code sent to email',
    example: '123456',
  })
  @IsString()
  otpCode: string;
}

// Phone Verification DTOs
export class InitiatePhoneVerificationDto {
  @ApiProperty({
    description: 'Nigerian phone number in international format',
    example: '+2348123456789',
  })
  @Matches(/^\+234[0-9]{10}$/, {
    message: 'Phone number must be in Nigerian format (+234XXXXXXXXXX)',
  })
  phoneNumber: string;
}

export class VerifyPhoneOtpDto {
  @ApiProperty({
    description: 'Nigerian phone number in international format',
    example: '+2348123456789',
  })
  @Matches(/^\+234[0-9]{10}$/, {
    message: 'Phone number must be in Nigerian format (+234XXXXXXXXXX)',
  })
  phoneNumber: string;

  @ApiProperty({
    description: '4-digit OTP code',
    example: '1234',
    minLength: 4,
    maxLength: 6,
  })
  @IsString()
  otpCode: string;
}

export class ResendPhoneOtpDto {
  @ApiProperty({
    description: 'Nigerian phone number in international format',
    example: '+2348123456789',
  })
  @Matches(/^\+234[0-9]{10}$/, {
    message: 'Phone number must be in Nigerian format (+234XXXXXXXXXX)',
  })
  phoneNumber: string;
}

export class AlternativeVerificationDto {
  @ApiProperty({
    description: 'Nigerian phone number in international format',
    example: '+2348123456789',
  })
  @Matches(/^\+234[0-9]{10}$/, {
    message: 'Phone number must be in Nigerian format (+234XXXXXXXXXX)',
  })
  phoneNumber: string;

  @ApiProperty({
    description: 'Alternative verification method',
    enum: ['call', 'ussd'],
    example: 'call',
  })
  @IsEnum(['call', 'ussd'])
  method: 'call' | 'ussd';
}

// Social Auth DTOs
export class SocialAuthDto {
  @ApiProperty({
    description: 'Social provider',
    enum: ['google', 'facebook', 'apple'],
    example: 'google',
  })
  @IsEnum(['google', 'facebook', 'apple'])
  provider: 'google' | 'facebook' | 'apple';

  @ApiProperty({
    description: 'Social provider access token',
    example: 'ya29.a0AfH6SMC...',
  })
  @IsString()
  accessToken: string;
}

export class SocialAuthWithPhoneDto extends SocialAuthDto {
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
}

export class LinkSocialAccountDto {
  @ApiProperty({
    description: 'Social provider',
    enum: ['google', 'facebook', 'apple'],
    example: 'google',
  })
  @IsEnum(['google', 'facebook', 'apple'])
  provider: 'google' | 'facebook' | 'apple';

  @ApiProperty({
    description: 'Social provider access token',
    example: 'ya29.a0AfH6SMC...',
  })
  @IsString()
  accessToken: string;
}

export class UnlinkSocialAccountDto {
  @ApiProperty({
    description: 'Social provider to unlink',
    enum: ['google', 'facebook', 'apple'],
    example: 'google',
  })
  @IsEnum(['google', 'facebook', 'apple'])
  provider: 'google' | 'facebook' | 'apple';
}

// Enhanced Registration DTOs
export class EnhancedRegisterDto extends RegisterDto {
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

export class UpdateOnboardingStepDto {
  @ApiProperty({
    description: 'Current onboarding step',
    example: 'location_setup',
  })
  @IsString()
  step: string;

  @ApiProperty({
    description: 'Step completion status',
    example: true,
  })
  @IsBoolean()
  completed: boolean;

  @ApiProperty({
    description: 'Additional step data',
    example: { location: 'Lagos, Nigeria' },
    required: false,
  })
  @IsOptional()
  data?: any;
}

// Location DTOs
export class LocationSetupDto {
  @ApiProperty({
    description: 'Nigerian state',
    example: 'Lagos',
  })
  @IsString()
  state: string;

  @ApiProperty({
    description: 'City within state',
    example: 'Ikeja',
  })
  @IsString()
  city: string;

  @ApiProperty({
    description: 'Estate or compound name',
    example: 'Victoria Island Estate',
    required: false,
  })
  @IsOptional()
  @IsString()
  estate?: string;

  @ApiProperty({
    description: 'Landmark or street address',
    example: 'Near Ikeja City Mall',
    required: false,
  })
  @IsOptional()
  @IsString()
  landmark?: string;
}

export class LandmarkSearchDto {
  @ApiProperty({
    description: 'Nigerian state',
    example: 'Lagos',
  })
  @IsString()
  state: string;

  @ApiProperty({
    description: 'City within state',
    example: 'Ikeja',
  })
  @IsString()
  city: string;

  @ApiProperty({
    description: 'Search query for landmarks',
    example: 'mall',
    required: false,
  })
  @IsOptional()
  @IsString()
  query?: string;
}

export class EstateSearchDto {
  @ApiProperty({
    description: 'Nigerian state',
    example: 'Lagos',
  })
  @IsString()
  state: string;

  @ApiProperty({
    description: 'City within state',
    example: 'Ikeja',
  })
  @IsString()
  city: string;

  @ApiProperty({
    description: 'Search query for estates',
    example: 'gated',
    required: false,
  })
  @IsOptional()
  @IsString()
  query?: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token to exchange for new access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
}
