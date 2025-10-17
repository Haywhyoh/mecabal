import { IsString, IsUUID, IsOptional, IsEnum, IsDateString, IsPhoneNumber, IsObject, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PhotoVerificationDto {
  @ApiProperty({ description: 'URL of the verification photo' })
  @IsString()
  photoUrl: string;

  @ApiProperty({ description: 'ID of the landmark in the photo', required: false })
  @IsOptional()
  @IsUUID()
  landmarkId?: string;

  @ApiProperty({ 
    description: 'Coordinates where photo was taken',
    example: { latitude: 6.5244, longitude: 3.3792 }
  })
  @IsObject()
  coordinates: {
    latitude: number;
    longitude: number;
  };

  @ApiProperty({ description: 'Timestamp when photo was taken' })
  @IsDateString()
  timestamp: string;

  @ApiProperty({ description: 'Description of the photo', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class DocumentVerificationDto {
  @ApiProperty({ description: 'URL of the verification document' })
  @IsString()
  documentUrl: string;

  @ApiProperty({ 
    description: 'Type of document',
    enum: ['utility_bill', 'bank_statement', 'government_id', 'lease_agreement', 'other']
  })
  @IsEnum(['utility_bill', 'bank_statement', 'government_id', 'lease_agreement', 'other'])
  documentType: string;

  @ApiProperty({ description: 'Address shown on the document' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'Document issue date', required: false })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiProperty({ description: 'Document expiry date', required: false })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}

export class SmsVerificationDto {
  @ApiProperty({ description: 'Phone number for SMS verification' })
  @IsPhoneNumber('NG')
  phoneNumber: string;

  @ApiProperty({ description: 'SMS verification code' })
  @IsString()
  code: string;

  @ApiProperty({ 
    description: 'Current user coordinates',
    example: { latitude: 6.5244, longitude: 3.3792 }
  })
  @IsObject()
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export class AdminVerificationDto {
  @ApiProperty({ description: 'Estate ID for verification' })
  @IsUUID()
  estateId: string;

  @ApiProperty({ description: 'Address within the estate' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'House number', required: false })
  @IsOptional()
  @IsString()
  houseNumber?: string;

  @ApiProperty({ description: 'Block number', required: false })
  @IsOptional()
  @IsString()
  blockNumber?: string;

  @ApiProperty({ description: 'Date moved into the estate' })
  @IsDateString()
  moveInDate: string;

  @ApiProperty({ description: 'Contact phone number' })
  @IsPhoneNumber('NG')
  phone: string;

  @ApiProperty({ description: 'Message to estate admin', required: false })
  @IsOptional()
  @IsString()
  message?: string;
}

export class VerificationRequestDto {
  @ApiProperty({ description: 'Verification request ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Location ID' })
  locationId: string;

  @ApiProperty({ 
    description: 'Verification type',
    enum: ['PHOTO', 'DOCUMENT', 'SMS', 'ADMIN']
  })
  type: string;

  @ApiProperty({ 
    description: 'Verification status',
    enum: ['PENDING', 'APPROVED', 'REJECTED']
  })
  status: string;

  @ApiProperty({ description: 'Verification data' })
  data: any;

  @ApiProperty({ description: 'Submission timestamp' })
  submittedAt: Date;

  @ApiProperty({ description: 'Review timestamp', required: false })
  reviewedAt?: Date;

  @ApiProperty({ description: 'Reviewed by user ID', required: false })
  reviewedBy?: string;

  @ApiProperty({ description: 'Review reason', required: false })
  reason?: string;
}

export class VerificationStatsDto {
  @ApiProperty({ description: 'Total verification requests' })
  totalRequests: number;

  @ApiProperty({ description: 'Pending verification requests' })
  pendingRequests: number;

  @ApiProperty({ description: 'Approved verification requests' })
  approvedRequests: number;

  @ApiProperty({ description: 'Rejected verification requests' })
  rejectedRequests: number;

  @ApiProperty({ description: 'Requests by type' })
  byType: Record<string, number>;
}

export class VerificationRequirementsDto {
  @ApiProperty({ description: 'Whether verification is required' })
  requiresVerification: boolean;

  @ApiProperty({ description: 'Allowed verification methods' })
  allowedMethods: string[];

  @ApiProperty({ description: 'Required document types' })
  requiredDocuments: string[];

  @ApiProperty({ description: 'Maximum distance for location verification (meters)' })
  maxDistance: number;
}

export class SendSmsCodeDto {
  @ApiProperty({ description: 'Phone number to send SMS to' })
  @IsPhoneNumber('NG')
  phoneNumber: string;
}

export class SmsCodeResponseDto {
  @ApiProperty({ description: 'Whether SMS was sent successfully' })
  success: boolean;

  @ApiProperty({ description: 'SMS message ID', required: false })
  messageId?: string;
}
