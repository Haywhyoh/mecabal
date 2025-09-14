import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendEmailOtpDto {
  @ApiProperty({
    description: 'Email address to send OTP to',
    example: 'user@example.com'
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'Purpose of the OTP',
    enum: ['registration', 'login', 'password_reset'],
    example: 'registration'
  })
  @IsEnum(['registration', 'login', 'password_reset'], {
    message: 'Purpose must be one of: registration, login, password_reset'
  })
  purpose: 'registration' | 'login' | 'password_reset';
}

export class VerifyEmailOtpDto {
  @ApiProperty({
    description: 'Email address the OTP was sent to',
    example: 'user@example.com'
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: '6-digit OTP code',
    example: '123456',
    minLength: 6,
    maxLength: 6
  })
  otpCode: string;

  @ApiProperty({
    description: 'Purpose of the OTP verification',
    enum: ['registration', 'login', 'password_reset'],
    example: 'registration'
  })
  @IsEnum(['registration', 'login', 'password_reset'])
  purpose: 'registration' | 'login' | 'password_reset';
}