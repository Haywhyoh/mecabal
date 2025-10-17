import { IsString, IsUUID, IsBoolean, IsOptional, IsObject, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VerificationStatus } from '@app/database';

export class CreateUserLocationDto {
  @ApiProperty({ description: 'State ID' })
  @IsUUID()
  stateId: string;

  @ApiProperty({ description: 'LGA ID' })
  @IsUUID()
  lgaId: string;

  @ApiProperty({ description: 'Ward ID', required: false })
  @IsOptional()
  @IsUUID()
  wardId?: string;

  @ApiProperty({ description: 'Neighborhood ID' })
  @IsUUID()
  neighborhoodId: string;

  @ApiProperty({ description: 'City or town name', required: false })
  @IsOptional()
  @IsString()
  cityTown?: string;

  @ApiProperty({ description: 'Full address', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ 
    description: 'User coordinates',
    required: false,
    example: { latitude: 6.5244, longitude: 3.3792 }
  })
  @IsOptional()
  @IsObject()
  coordinates?: {
    latitude: number;
    longitude: number;
  };

  @ApiProperty({ description: 'Whether this is the primary location', default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class UpdateUserLocationDto {
  @ApiProperty({ description: 'State ID', required: false })
  @IsOptional()
  @IsUUID()
  stateId?: string;

  @ApiProperty({ description: 'LGA ID', required: false })
  @IsOptional()
  @IsUUID()
  lgaId?: string;

  @ApiProperty({ description: 'Ward ID', required: false })
  @IsOptional()
  @IsUUID()
  wardId?: string;

  @ApiProperty({ description: 'Neighborhood ID', required: false })
  @IsOptional()
  @IsUUID()
  neighborhoodId?: string;

  @ApiProperty({ description: 'City or town name', required: false })
  @IsOptional()
  @IsString()
  cityTown?: string;

  @ApiProperty({ description: 'Full address', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ 
    description: 'User coordinates',
    required: false,
    example: { latitude: 6.5244, longitude: 3.3792 }
  })
  @IsOptional()
  @IsObject()
  coordinates?: {
    latitude: number;
    longitude: number;
  };

  @ApiProperty({ description: 'Whether this is the primary location', required: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class UserLocationResponseDto {
  @ApiProperty({ description: 'Location ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'State ID' })
  stateId: string;

  @ApiProperty({ description: 'LGA ID' })
  lgaId: string;

  @ApiProperty({ description: 'Ward ID', required: false })
  wardId?: string;

  @ApiProperty({ description: 'Neighborhood ID' })
  neighborhoodId: string;

  @ApiProperty({ description: 'City or town name', required: false })
  cityTown?: string;

  @ApiProperty({ description: 'Full address', required: false })
  address?: string;

  @ApiProperty({ description: 'User coordinates', required: false })
  coordinates?: any;

  @ApiProperty({ description: 'Whether this is the primary location' })
  isPrimary: boolean;

  @ApiProperty({ 
    description: 'Location verification status',
    enum: VerificationStatus
  })
  verificationStatus: VerificationStatus;

  @ApiProperty({ description: 'Location creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Location update timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'State details', required: false })
  state?: {
    id: string;
    name: string;
    code: string;
  };

  @ApiProperty({ description: 'LGA details', required: false })
  lga?: {
    id: string;
    name: string;
    code: string;
  };

  @ApiProperty({ description: 'Ward details', required: false })
  ward?: {
    id: string;
    name: string;
    code: string;
  };

  @ApiProperty({ description: 'Neighborhood details', required: false })
  neighborhood?: {
    id: string;
    name: string;
    type: string;
    isGated: boolean;
  };
}

export class LocationVerificationDto {
  @ApiProperty({ description: 'Location ID' })
  @IsUUID()
  locationId: string;

  @ApiProperty({ 
    description: 'Verification status',
    enum: VerificationStatus
  })
  @IsEnum(VerificationStatus)
  verificationStatus: VerificationStatus;

  @ApiProperty({ description: 'Verification reason', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class NearbyUsersDto {
  @ApiProperty({ description: 'Search radius in meters', default: 5000 })
  @IsOptional()
  @IsNumber()
  radius?: number;

  @ApiProperty({ description: 'Maximum number of results', default: 50 })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class LocationStatsDto {
  @ApiProperty({ description: 'Total locations' })
  totalLocations: number;

  @ApiProperty({ description: 'Verified locations' })
  verifiedLocations: number;

  @ApiProperty({ description: 'Pending locations' })
  pendingLocations: number;

  @ApiProperty({ description: 'Unverified locations' })
  unverifiedLocations: number;
}
