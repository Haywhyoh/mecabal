import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional } from 'class-validator';

export class GoogleProfileDto {
  @ApiProperty({ description: 'Google user ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User full name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'User first name', required: false })
  @IsOptional()
  @IsString()
  given_name?: string;

  @ApiProperty({ description: 'User last name', required: false })
  @IsOptional()
  @IsString()
  family_name?: string;

  @ApiProperty({ description: 'User profile picture URL', required: false })
  @IsOptional()
  @IsString()
  picture?: string;

  @ApiProperty({ description: 'Email verification status' })
  verified_email: boolean;

  // Additional fields for Google OAuth profile
  @ApiProperty({ description: 'User emails array', required: false })
  @IsOptional()
  emails?: Array<{ value: string; verified: boolean }>;

  @ApiProperty({ description: 'User photos array', required: false })
  @IsOptional()
  photos?: Array<{ value: string }>;

  @ApiProperty({ description: 'User name object', required: false })
  @IsOptional()
  nameObject?: {
    givenName?: string;
    familyName?: string;
  };

  @ApiProperty({ description: 'Email verification status (alternative field)', required: false })
  @IsOptional()
  email_verified?: boolean;

  // Fields that the auth service expects
  @ApiProperty({ description: 'User first name (alternative field)', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ description: 'User last name (alternative field)', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ description: 'User profile picture (alternative field)', required: false })
  @IsOptional()
  @IsString()
  profilePicture?: string;

  @ApiProperty({ description: 'Google ID (alternative field)', required: false })
  @IsOptional()
  @IsString()
  googleId?: string;

  @ApiProperty({ description: 'Email verification status (alternative field)', required: false })
  @IsOptional()
  emailVerified?: boolean;

  // Additional fields for auth service compatibility
  @ApiProperty({ description: 'Authentication provider', required: false })
  @IsOptional()
  @IsString()
  authProvider?: string;

  @ApiProperty({ description: 'Email verification status (alternative field)', required: false })
  @IsOptional()
  isEmailVerified?: boolean;
}

export class GoogleAuthResponseDto {
  @ApiProperty({ description: 'Access token' })
  @IsString()
  accessToken: string;

  @ApiProperty({ description: 'Refresh token', required: false })
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiProperty({ description: 'User profile information' })
  user: GoogleProfileDto;

  @ApiProperty({ description: 'Whether this is a new user registration' })
  isNewUser: boolean;
}
