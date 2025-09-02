import { IsEmail, IsPhoneNumber, IsString, MinLength, Matches, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { SocialProvider } from './social-auth.dto';
import { NigerianState, LocationMethod } from './location-setup.dto';

export enum RegistrationMethod {
  EMAIL = 'email',
  PHONE = 'phone',
  SOCIAL = 'social'
}

export enum OnboardingStep {
  WELCOME = 'welcome',
  PHONE_VERIFICATION = 'phone_verification',
  EMAIL_VERIFICATION = 'email_verification',
  LOCATION_SETUP = 'location_setup',
  PROFILE_COMPLETION = 'profile_completion',
  COMPLETED = 'completed'
}

export class EnhancedRegisterDto {
  // Basic Information
  @ApiProperty({ 
    example: 'user@example.com',
    description: 'User email address' 
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({ 
    example: '+2348123456789',
    description: 'Nigerian phone number',
    required: false 
  })
  @IsOptional()
  @IsPhoneNumber('NG', { message: 'Please provide a valid Nigerian phone number' })
  phoneNumber?: string;

  @ApiProperty({ 
    example: 'John',
    description: 'User first name' 
  })
  @IsString({ message: 'First name must be a string' })
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @ApiProperty({ 
    example: 'Doe',
    description: 'User last name' 
  })
  @IsString({ message: 'Last name must be a string' })
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @Transform(({ value }) => value?.trim())
  lastName: string;

  // Registration Method
  @ApiProperty({ 
    example: 'email',
    description: 'Registration method used',
    enum: RegistrationMethod 
  })
  @IsEnum(RegistrationMethod, { 
    message: 'Registration method must be email, phone, or social' 
  })
  registrationMethod: RegistrationMethod;

  // Password (required for email/phone registration)
  @ApiProperty({ 
    example: 'SecurePass123!',
    description: 'User password (required for email/phone registration)',
    required: false 
  })
  @IsOptional()
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: 'Password must contain uppercase letter, lowercase letter, number and special character' }
  )
  password?: string;

  // Social Authentication (for social registration)
  @ApiProperty({ 
    example: 'google',
    description: 'Social provider used for registration',
    enum: SocialProvider,
    required: false 
  })
  @IsOptional()
  @IsEnum(SocialProvider)
  socialProvider?: SocialProvider;

  @ApiProperty({ 
    example: 'google_user_id_12345',
    description: 'Social account ID',
    required: false 
  })
  @IsOptional()
  @IsString()
  socialId?: string;

  @ApiProperty({ 
    example: 'ya29.A0ARrdaM...',
    description: 'Social access token for verification',
    required: false 
  })
  @IsOptional()
  @IsString()
  socialAccessToken?: string;

  // Location Information (optional during registration)
  @ApiProperty({ 
    example: 'Lagos',
    description: 'Nigerian state',
    enum: NigerianState,
    required: false 
  })
  @IsOptional()
  @IsEnum(NigerianState)
  state?: NigerianState;

  @ApiProperty({ 
    example: 'Ikeja',
    description: 'City within state',
    required: false 
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  city?: string;

  @ApiProperty({ 
    example: 'Victoria Island Estate',
    description: 'Estate or compound name',
    required: false 
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  estate?: string;

  // Onboarding Tracking
  @ApiProperty({ 
    example: 'phone_verification',
    description: 'Current onboarding step',
    enum: OnboardingStep,
    required: false,
    default: OnboardingStep.WELCOME 
  })
  @IsOptional()
  @IsEnum(OnboardingStep)
  onboardingStep?: OnboardingStep = OnboardingStep.WELCOME;

  // Preferences
  @ApiProperty({ 
    example: 'en',
    description: 'Preferred language',
    required: false,
    default: 'en' 
  })
  @IsOptional()
  @IsString()
  preferredLanguage?: string = 'en';

  @ApiProperty({ 
    description: 'User consent to terms and conditions',
    example: true 
  })
  @IsBoolean({ message: 'Terms acceptance must be a boolean' })
  @Type(() => Boolean)
  acceptsTerms: boolean;

  @ApiProperty({ 
    description: 'User consent to privacy policy',
    example: true 
  })
  @IsBoolean({ message: 'Privacy policy acceptance must be a boolean' })
  @Type(() => Boolean)
  acceptsPrivacyPolicy: boolean;

  // Device Information (for security)
  @ApiProperty({ 
    example: 'mobile_12345',
    description: 'Device identifier',
    required: false 
  })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiProperty({ 
    example: 'ios',
    description: 'Device type',
    required: false 
  })
  @IsOptional()
  @IsString()
  deviceType?: string;
}

export class UpdateOnboardingStepDto {
  @ApiProperty({ 
    example: 'location_setup',
    description: 'Next onboarding step to set',
    enum: OnboardingStep 
  })
  @IsEnum(OnboardingStep)
  onboardingStep: OnboardingStep;

  @ApiProperty({ 
    example: 'user123',
    description: 'User ID to update' 
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}