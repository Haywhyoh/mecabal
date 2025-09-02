import { IsString, IsEmail, IsOptional, IsEnum, IsNotEmpty, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum SocialProvider {
  GOOGLE = 'google',
  APPLE = 'apple',
  FACEBOOK = 'facebook'
}

export class SocialAuthDto {
  @ApiProperty({ 
    example: 'google',
    description: 'Social authentication provider',
    enum: SocialProvider 
  })
  @IsEnum(SocialProvider, { message: 'Provider must be google, apple, or facebook' })
  provider: SocialProvider;

  @ApiProperty({ 
    example: 'google_user_id_12345',
    description: 'Unique user ID from social provider' 
  })
  @IsString({ message: 'Social ID must be a string' })
  @IsNotEmpty({ message: 'Social ID is required' })
  socialId: string;

  @ApiProperty({ 
    example: 'user@example.com',
    description: 'Email from social provider' 
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({ 
    example: 'John',
    description: 'First name from social provider' 
  })
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @ApiProperty({ 
    example: 'Doe',
    description: 'Last name from social provider' 
  })
  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @ApiProperty({ 
    example: 'https://example.com/profile.jpg',
    description: 'Profile picture URL from social provider',
    required: false 
  })
  @IsOptional()
  @IsString()
  profilePictureUrl?: string;

  @ApiProperty({ 
    example: 'ya29.A0ARrdaM...',
    description: 'Access token from social provider for verification' 
  })
  @IsString({ message: 'Access token must be a string' })
  @IsNotEmpty({ message: 'Access token is required' })
  accessToken: string;
}

export class SocialAuthWithPhoneDto extends SocialAuthDto {
  @ApiProperty({ 
    example: '+2348123456789',
    description: 'Nigerian phone number for additional verification',
    required: false 
  })
  @IsOptional()
  @IsPhoneNumber('NG', { message: 'Please provide a valid Nigerian phone number' })
  phoneNumber?: string;

  @ApiProperty({ 
    example: 'signup',
    description: 'Action being performed (signup, login)',
    enum: ['signup', 'login'] 
  })
  @IsEnum(['signup', 'login'], { 
    message: 'Action must be signup or login' 
  })
  action: 'signup' | 'login';
}

export class LinkSocialAccountDto {
  @ApiProperty({ 
    example: 'google',
    description: 'Social provider to link',
    enum: SocialProvider 
  })
  @IsEnum(SocialProvider)
  provider: SocialProvider;

  @ApiProperty({ 
    example: 'google_user_id_12345',
    description: 'Social account ID to link' 
  })
  @IsString()
  @IsNotEmpty()
  socialId: string;

  @ApiProperty({ 
    example: 'ya29.A0ARrdaM...',
    description: 'Access token for verification' 
  })
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}

export class UnlinkSocialAccountDto {
  @ApiProperty({ 
    example: 'google',
    description: 'Social provider to unlink',
    enum: SocialProvider 
  })
  @IsEnum(SocialProvider)
  provider: SocialProvider;
}