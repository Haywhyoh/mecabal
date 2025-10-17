import { IsEmail, IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleAuthDto {
  @ApiProperty({
    description: 'User email address from Google',
    example: 'user@gmail.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'User first name from Google',
    example: 'John',
    required: false,
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    description: 'User last name from Google',
    example: 'Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'Profile picture URL from Google',
    example: 'https://lh3.googleusercontent.com/a/ACg8ocJ...',
    required: false,
  })
  @IsOptional()
  @IsString()
  profilePicture?: string;

  @ApiProperty({
    description: 'Google user ID',
    example: '123456789012345678901',
  })
  @IsString()
  googleId: string;

  @ApiProperty({
    description: 'Whether this is a new user registration',
    example: true,
  })
  @IsBoolean()
  isNewUser: boolean;
}

export class GoogleAuthMobileDto {
  @ApiProperty({
    description: 'Google ID token from mobile app',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2NzI...',
  })
  @IsString()
  idToken: string;

  @ApiProperty({
    description: 'Nigerian phone number in international format',
    example: '+2348123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

export class GoogleAuthResponseDto {
  @ApiProperty({
    description: 'User information',
    example: {
      id: 'uuid',
      email: 'user@gmail.com',
      firstName: 'John',
      lastName: 'Doe',
      profilePicture: 'https://lh3.googleusercontent.com/a/ACg8ocJ...',
      googleId: '123456789012345678901',
      authProvider: 'google',
      isEmailVerified: true,
    },
  })
  user: {
    id: string;
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    googleId?: string;
    authProvider: 'google';
    isEmailVerified: boolean;
    verified_email?: boolean;
  };

  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Whether this is a new user registration',
    example: true,
  })
  isNewUser: boolean;
}

export class LinkGoogleAccountDto {
  @ApiProperty({
    description: 'Google ID token for account linking',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2NzI...',
  })
  @IsString()
  idToken: string;

  @ApiProperty({
    description: 'User ID to link Google account to',
    example: 'uuid',
  })
  @IsString()
  userId: string;
}

export class GoogleProfileDto {
  @ApiProperty({
    description: 'Google user ID',
    example: '123456789012345678901',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@gmail.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    required: false,
  })
  @IsOptional()
  @IsString()
  given_name?: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  family_name?: string;

  @ApiProperty({
    description: 'Profile picture URL',
    example: 'https://lh3.googleusercontent.com/a/ACg8ocJ...',
    required: false,
  })
  @IsOptional()
  @IsString()
  picture?: string;

  @ApiProperty({
    description: 'Email verification status',
    example: true,
  })
  @IsBoolean()
  email_verified: boolean;

  // Additional fields that Google OAuth strategy provides
  @ApiProperty({
    description: 'User emails array from Google',
    required: false,
  })
  @IsOptional()
  emails?: Array<{ value: string; verified: boolean }>;

  @ApiProperty({
    description: 'User name object from Google',
    required: false,
  })
  @IsOptional()
  name?: {
    givenName?: string;
    familyName?: string;
    given_name?: string;
    family_name?: string;
  };

  @ApiProperty({
    description: 'User photos array from Google',
    required: false,
  })
  @IsOptional()
  photos?: Array<{ value: string }>;
}
