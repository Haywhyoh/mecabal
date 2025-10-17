import { IsString, IsUUID, IsOptional, IsDateString, IsPhoneNumber } from 'class-validator';

export class EstateVerificationDto {
  @IsUUID()
  estateId: string;

  @IsString()
  address: string;

  @IsDateString()
  moveInDate: string; // ISO date string

  @IsPhoneNumber('NG') // Nigerian phone number format
  phone: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  houseNumber?: string;

  @IsOptional()
  @IsString()
  blockNumber?: string;

  @IsOptional()
  @IsString()
  streetName?: string;
}

export class EstateVerificationRequestDto {
  @IsUUID()
  id: string;

  @IsUUID()
  userId: string;

  @IsUUID()
  estateId: string;

  @IsString()
  address: string;

  @IsDateString()
  moveInDate: string;

  @IsPhoneNumber('NG')
  phone: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsString()
  status: 'PENDING' | 'APPROVED' | 'REJECTED';

  @IsDateString()
  createdAt: string;

  @IsDateString()
  updatedAt: string;
}

export class EstateVerificationResponseDto {
  @IsUUID()
  requestId: string;

  @IsString()
  status: 'PENDING' | 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsDateString()
  reviewedAt?: string;

  @IsOptional()
  @IsUUID()
  reviewedBy?: string;
}

export class EstateAdminAssignmentDto {
  @IsUUID()
  estateId: string;

  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  role?: string; // 'ADMIN', 'MODERATOR', etc.

  @IsOptional()
  @IsString()
  permissions?: string; // JSON string of permissions
}
