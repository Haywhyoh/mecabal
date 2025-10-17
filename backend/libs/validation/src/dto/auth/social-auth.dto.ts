import { IsEmail, IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  APPLE = 'apple',
}

export class SocialAuthResponseDto {
  @ApiProperty({
    description: 'User information',
    example: {
      id: 'uuid',
      email: 'user@gmail.com',
      firstName: 'John',
      lastName: 'Doe',
      profilePicture: 'https://lh3.googleusercontent.com/a/ACg8ocJ...',
      authProvider: 'google',
      isEmailVerified: true,
    },
  })
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    authProvider: AuthProvider;
    isEmailVerified: boolean;
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

  @ApiProperty({
    description: 'Social provider used for authentication',
    example: 'google',
    enum: AuthProvider,
  })
  provider: AuthProvider;
}

export class SocialAuthErrorDto {
  @ApiProperty({
    description: 'Error code',
    example: 'ACCOUNT_EXISTS_WITH_EMAIL',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Error message',
    example: 'An account with this email already exists. Would you like to link your Google account?',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Existing account email',
    example: 'user@gmail.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  existingEmail?: string;

  @ApiProperty({
    description: 'Suggested action',
    example: 'link_account',
    required: false,
  })
  @IsOptional()
  @IsString()
  suggestedAction?: string;
}

export class SocialAuthLinkRequestDto {
  @ApiProperty({
    description: 'Social provider',
    enum: AuthProvider,
    example: 'google',
  })
  @IsEnum(AuthProvider)
  provider: AuthProvider;

  @ApiProperty({
    description: 'Social provider access token or ID token',
    example: 'ya29.a0AfH6SMC...',
  })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'User ID to link the social account to',
    example: 'uuid',
  })
  @IsString()
  userId: string;
}

export class SocialAuthUnlinkRequestDto {
  @ApiProperty({
    description: 'Social provider to unlink',
    enum: AuthProvider,
    example: 'google',
  })
  @IsEnum(AuthProvider)
  provider: AuthProvider;

  @ApiProperty({
    description: 'User ID to unlink the social account from',
    example: 'uuid',
  })
  @IsString()
  userId: string;
}
