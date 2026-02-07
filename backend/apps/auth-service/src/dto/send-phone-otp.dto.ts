import { IsEnum, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendPhoneOtpDto {
  @ApiProperty({
    description: 'Nigerian phone number in international format',
    example: '+2348123456789',
  })
  @Matches(/^\+234[0-9]{10}$/, {
    message: 'Phone number must be in Nigerian format (+234XXXXXXXXXX)',
  })
  phoneNumber: string;

  @ApiProperty({
    description: 'Purpose of the OTP',
    enum: ['registration', 'login', 'password_reset'],
    example: 'registration',
  })
  @IsEnum(['registration', 'login', 'password_reset'], {
    message: 'Purpose must be one of: registration, login, password_reset',
  })
  purpose: 'registration' | 'login' | 'password_reset';

  @ApiProperty({
    description: 'Delivery method for OTP',
    enum: ['sms', 'whatsapp'],
    example: 'sms',
    required: false,
    default: 'sms',
  })
  @IsOptional()
  @IsEnum(['sms', 'whatsapp'], {
    message: 'Method must be either sms or whatsapp',
  })
  method?: 'sms' | 'whatsapp' = 'sms';
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
  otpCode: string;

  @ApiProperty({
    description: 'Purpose of the OTP verification',
    enum: ['registration', 'login', 'password_reset'],
    example: 'registration',
    required: false,
    default: 'registration',
  })
  @IsOptional()
  @IsEnum(['registration', 'login', 'password_reset'])
  purpose?: 'registration' | 'login' | 'password_reset';

  @ApiProperty({
    description: 'Device information for token generation',
    required: false,
  })
  @IsOptional()
  deviceInfo?: {
    deviceId?: string;
    deviceType?: string;
    ipAddress?: string;
    userAgent?: string;
  };
}
