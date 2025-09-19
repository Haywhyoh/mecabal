import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ description: 'Whether the operation was successful' })
  success: boolean;

  @ApiProperty({ description: 'Response message', required: false })
  message?: string;

  @ApiProperty({
    description: 'Error message if operation failed',
    required: false,
  })
  error?: string;

  @ApiProperty({
    description: 'User data if operation successful',
    required: false,
  })
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    phoneVerified: boolean;
    isVerified: boolean;
    verificationLevel: 'unverified' | 'phone' | 'identity' | 'full';
    state?: string;
    city?: string;
    estate?: string;
    location?: any;
    address?: string;
    addressVerified?: boolean;
    preferredLanguage?: string;
    createdAt?: Date;
    updatedAt?: Date;
  };

  @ApiProperty({ description: 'JWT access token', required: false })
  accessToken?: string;

  @ApiProperty({ description: 'JWT refresh token', required: false })
  refreshToken?: string;

  @ApiProperty({ description: 'Token expiration time', required: false })
  expiresAt?: Date;
}

export class OtpResponseDto {
  @ApiProperty({ description: 'Whether the operation was successful' })
  success: boolean;

  @ApiProperty({ description: 'Response message', required: false })
  message?: string;

  @ApiProperty({
    description: 'Error message if operation failed',
    required: false,
  })
  error?: string;

  @ApiProperty({ description: 'Nigerian carrier detected', required: false })
  carrier?: string;

  @ApiProperty({ description: 'Carrier brand color', required: false })
  carrierColor?: string;

  @ApiProperty({ description: 'OTP expiration time', required: false })
  expiresAt?: Date;

  @ApiProperty({ description: 'Delivery method used', required: false })
  method?: 'sms' | 'whatsapp' | 'email';

  @ApiProperty({
    description: 'Whether OTP was verified successfully',
    required: false,
  })
  verified?: boolean;

  // For development purposes only - remove in production
  @ApiProperty({ description: 'OTP code (development only)', required: false })
  otpCode?: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token to exchange for new access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
}
