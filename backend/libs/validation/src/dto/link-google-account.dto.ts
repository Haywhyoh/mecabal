import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional } from 'class-validator';

export class LinkGoogleAccountDto {
  @ApiProperty({ description: 'Google ID token' })
  @IsString()
  idToken: string;

  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User first name', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ description: 'User last name', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ description: 'User profile picture URL', required: false })
  @IsOptional()
  @IsString()
  profilePicture?: string;
}

