import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional } from 'class-validator';

export class GoogleAuthMobileDeviceDto {
  @ApiProperty({ description: 'Google ID token from mobile app' })
  @IsString()
  idToken: string;

  @ApiProperty({ description: 'Device ID for mobile authentication', required: false })
  @IsOptional()
  @IsString()
  deviceId?: string;
}

