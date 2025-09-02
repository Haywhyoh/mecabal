import { IsPhoneNumber, IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum NigerianCarrier {
  MTN = 'MTN',
  AIRTEL = 'Airtel',
  GLO = 'Glo',
  NINE_MOBILE = '9mobile',
  UNKNOWN = 'Unknown'
}

export class InitiatePhoneVerificationDto {
  @ApiProperty({ 
    example: '+2348123456789',
    description: 'Nigerian phone number to verify' 
  })
  @IsPhoneNumber('NG', { message: 'Please provide a valid Nigerian phone number' })
  @Transform(({ value }) => value?.trim())
  phoneNumber: string;

  @ApiProperty({ 
    example: 'signup',
    description: 'Purpose of verification (signup, login, profile_update)',
    enum: ['signup', 'login', 'profile_update'] 
  })
  @IsEnum(['signup', 'login', 'profile_update'], { 
    message: 'Purpose must be signup, login, or profile_update' 
  })
  purpose: 'signup' | 'login' | 'profile_update';

  @ApiProperty({ 
    example: 'MTN',
    description: 'Detected carrier (optional, will be auto-detected)',
    enum: NigerianCarrier,
    required: false 
  })
  @IsOptional()
  @IsEnum(NigerianCarrier)
  detectedCarrier?: NigerianCarrier;

  @ApiProperty({ 
    example: 'en',
    description: 'Language preference for SMS',
    required: false,
    default: 'en'
  })
  @IsOptional()
  @IsString()
  language?: string = 'en';
}

export class VerifyPhoneOtpDto {
  @ApiProperty({ 
    example: '+2348123456789',
    description: 'Phone number being verified' 
  })
  @IsPhoneNumber('NG', { message: 'Please provide a valid Nigerian phone number' })
  @Transform(({ value }) => value?.trim())
  phoneNumber: string;

  @ApiProperty({ 
    example: '123456',
    description: '6-digit OTP code' 
  })
  @IsString({ message: 'OTP must be a string' })
  @IsNotEmpty({ message: 'OTP is required' })
  @Transform(({ value }) => value?.trim())
  otpCode: string;

  @ApiProperty({ 
    example: 'signup',
    description: 'Purpose that initiated the verification',
    enum: ['signup', 'login', 'profile_update'] 
  })
  @IsEnum(['signup', 'login', 'profile_update'])
  purpose: 'signup' | 'login' | 'profile_update';

  @ApiProperty({ 
    description: 'User ID for profile updates (optional)',
    required: false 
  })
  @IsOptional()
  @IsString()
  userId?: string;
}

export class ResendPhoneOtpDto {
  @ApiProperty({ 
    example: '+2348123456789',
    description: 'Phone number to resend OTP to' 
  })
  @IsPhoneNumber('NG', { message: 'Please provide a valid Nigerian phone number' })
  @Transform(({ value }) => value?.trim())
  phoneNumber: string;

  @ApiProperty({ 
    example: 'signup',
    description: 'Purpose of verification',
    enum: ['signup', 'login', 'profile_update'] 
  })
  @IsEnum(['signup', 'login', 'profile_update'])
  purpose: 'signup' | 'login' | 'profile_update';
}

export class AlternativeVerificationDto {
  @ApiProperty({ 
    example: '+2348123456789',
    description: 'Phone number to verify' 
  })
  @IsPhoneNumber('NG', { message: 'Please provide a valid Nigerian phone number' })
  @Transform(({ value }) => value?.trim())
  phoneNumber: string;

  @ApiProperty({ 
    example: 'call',
    description: 'Alternative method (call, ussd)',
    enum: ['call', 'ussd'] 
  })
  @IsEnum(['call', 'ussd'], { 
    message: 'Method must be call or ussd' 
  })
  method: 'call' | 'ussd';

  @ApiProperty({ 
    example: 'signup',
    description: 'Purpose of verification',
    enum: ['signup', 'login', 'profile_update'] 
  })
  @IsEnum(['signup', 'login', 'profile_update'])
  purpose: 'signup' | 'login' | 'profile_update';
}