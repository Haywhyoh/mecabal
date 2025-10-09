import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID, IsDateString, IsBoolean } from 'class-validator';
import { DocumentType } from '@app/database';

export class UploadDocumentDto {
  @ApiProperty({
    description: 'Type of document being uploaded',
    enum: DocumentType,
    example: DocumentType.NIN_CARD,
  })
  @IsEnum(DocumentType)
  @IsNotEmpty()
  documentType: DocumentType;

  @ApiProperty({
    description: 'Document number (if applicable)',
    example: '12345678901',
    required: false,
  })
  @IsString()
  @IsOptional()
  documentNumber?: string;

  @ApiProperty({
    description: 'Document expiry date (if applicable)',
    example: '2025-12-31',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;
}

export class VerifyDocumentDto {
  @ApiProperty({
    description: 'ID of the document to verify',
    example: 'uuid-here',
  })
  @IsUUID()
  @IsNotEmpty()
  documentId: string;

  @ApiProperty({
    description: 'Whether the document is verified',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  isVerified: boolean;

  @ApiProperty({
    description: 'Reason for rejection (if not verified)',
    example: 'Document is blurry or unclear',
    required: false,
  })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

export class DocumentResponseDto {
  @ApiProperty({
    description: 'Whether the operation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Document uploaded successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Document ID (if applicable)',
    example: 'uuid-here',
    required: false,
  })
  documentId?: string;
}

export class DocumentStatsDto {
  @ApiProperty({
    description: 'Total number of documents',
    example: 5,
  })
  totalDocuments: number;

  @ApiProperty({
    description: 'Number of verified documents',
    example: 3,
  })
  verifiedDocuments: number;

  @ApiProperty({
    description: 'Number of pending documents',
    example: 1,
  })
  pendingDocuments: number;

  @ApiProperty({
    description: 'Number of rejected documents',
    example: 1,
  })
  rejectedDocuments: number;

  @ApiProperty({
    description: 'Number of documents by type',
    example: { nin_card: 2, drivers_license: 1, passport: 1 },
  })
  documentsByType: Record<DocumentType, number>;

  @ApiProperty({
    description: 'Recently uploaded documents',
    type: 'array',
  })
  recentUploads: any[];
}

export class UserDocumentsResponseDto {
  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'User documents data',
    type: 'object',
  })
  data: {
    documents: any[];
    stats: DocumentStatsDto;
  };

  @ApiProperty({
    description: 'Response message',
    example: 'User documents retrieved successfully',
  })
  message: string;
}

export class DocumentInfoDto {
  @ApiProperty({
    description: 'Document ID',
    example: 'uuid-here',
  })
  id: string;

  @ApiProperty({
    description: 'User ID',
    example: 'uuid-here',
  })
  userId: string;

  @ApiProperty({
    description: 'Document type',
    enum: DocumentType,
    example: DocumentType.NIN_CARD,
  })
  documentType: DocumentType;

  @ApiProperty({
    description: 'Document number',
    example: '12345678901',
    required: false,
  })
  documentNumber?: string;

  @ApiProperty({
    description: 'Document URL',
    example: 'https://storage.example.com/documents/user123/nin_card/document.jpg',
  })
  documentUrl: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000,
  })
  fileSize: number;

  @ApiProperty({
    description: 'MIME type',
    example: 'image/jpeg',
  })
  mimeType: string;

  @ApiProperty({
    description: 'Whether the document is verified',
    example: true,
  })
  isVerified: boolean;

  @ApiProperty({
    description: 'Verified at timestamp',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  verifiedAt?: Date;

  @ApiProperty({
    description: 'Verified by user ID',
    example: 'uuid-here',
    required: false,
  })
  verifiedBy?: string;

  @ApiProperty({
    description: 'Rejection reason',
    example: 'Document is blurry',
    required: false,
  })
  rejectionReason?: string;

  @ApiProperty({
    description: 'Document expiry date',
    example: '2025-12-31',
    required: false,
  })
  expiryDate?: Date;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Update timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;
}

export class PendingDocumentsResponseDto {
  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Pending documents data',
    type: 'array',
    items: { $ref: '#/components/schemas/DocumentInfoDto' },
  })
  data: DocumentInfoDto[];

  @ApiProperty({
    description: 'Response message',
    example: 'Pending documents retrieved successfully',
  })
  message: string;
}
