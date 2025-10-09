import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString, Matches, Length, IsIn } from 'class-validator';

export class InitiateNinVerificationDto {
  @ApiProperty({
    description: 'NIN number (11 digits)',
    example: '12345678901',
    minLength: 11,
    maxLength: 11,
  })
  @IsString()
  @IsNotEmpty()
  @Length(11, 11)
  @Matches(/^\d{11}$/, { message: 'NIN number must be exactly 11 digits' })
  ninNumber: string;

  @ApiProperty({
    description: 'First name as it appears on NIN',
    example: 'John',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  firstName: string;

  @ApiProperty({
    description: 'Last name as it appears on NIN',
    example: 'Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  lastName: string;

  @ApiProperty({
    description: 'Middle name as it appears on NIN (optional)',
    example: 'Michael',
    required: false,
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  middleName?: string;

  @ApiProperty({
    description: 'Date of birth as it appears on NIN (YYYY-MM-DD)',
    example: '1990-01-15',
  })
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @ApiProperty({
    description: 'Gender as it appears on NIN',
    example: 'male',
    enum: ['male', 'female', 'other'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['male', 'female', 'other'], { message: 'Gender must be male, female, or other' })
  gender: string;

  @ApiProperty({
    description: 'State of origin as it appears on NIN',
    example: 'Lagos',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  stateOfOrigin: string;

  @ApiProperty({
    description: 'LGA of origin as it appears on NIN (optional)',
    example: 'Ikeja',
    required: false,
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @Length(2, 100)
  lgaOfOrigin?: string;

  @ApiProperty({
    description: 'Phone number as it appears on NIN (optional)',
    example: '+2348012345678',
    required: false,
    maxLength: 20,
  })
  @IsString()
  @IsOptional()
  @Length(10, 20)
  phoneNumber?: string;
}

export class NinVerificationStatusDto {
  @ApiProperty({
    description: 'Verification status',
    example: 'verified',
    enum: ['pending', 'verified', 'failed'],
  })
  status: 'pending' | 'verified' | 'failed';

  @ApiProperty({
    description: 'Date when verification was completed',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  verifiedAt?: Date;

  @ApiProperty({
    description: 'Method used for verification',
    example: 'api',
    enum: ['api', 'manual', 'hybrid'],
    required: false,
  })
  verificationMethod?: 'api' | 'manual' | 'hybrid';

  @ApiProperty({
    description: 'Reason for verification failure',
    example: 'NIN not found in database',
    required: false,
  })
  failureReason?: string;
}

export class NinVerificationResponseDto {
  @ApiProperty({
    description: 'Whether the verification was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'NIN verification completed successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Verification ID (if successful)',
    example: 'uuid-here',
    required: false,
  })
  verificationId?: string;
}
