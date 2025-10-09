import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

export enum DocumentType {
  NIN_CARD = 'nin_card',
  DRIVERS_LICENSE = 'drivers_license',
  VOTERS_CARD = 'voters_card',
  PASSPORT = 'passport',
  UTILITY_BILL = 'utility_bill',
  BANK_STATEMENT = 'bank_statement',
  RESIDENCE_PERMIT = 'residence_permit',
  OTHER = 'other',
}

@Entity('identity_documents')
@Index(['userId', 'documentType'])
export class IdentityDocument {
  @ApiProperty({ description: 'Document ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID' })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Document type', enum: DocumentType })
  @Column({ name: 'document_type', type: 'varchar', length: 50 })
  documentType: DocumentType;

  @ApiProperty({ description: 'Document number' })
  @Column({ name: 'document_number', length: 100, nullable: true })
  documentNumber?: string;

  @ApiProperty({ description: 'Document URL' })
  @Column({ name: 'document_url', length: 500 })
  documentUrl: string;

  @ApiProperty({ description: 'File size in bytes' })
  @Column({ name: 'file_size', type: 'int' })
  fileSize: number;

  @ApiProperty({ description: 'MIME type' })
  @Column({ name: 'mime_type', length: 100 })
  mimeType: string;

  @ApiProperty({ description: 'Is verified' })
  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  @ApiProperty({ description: 'Verified at timestamp' })
  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt?: Date;

  @ApiProperty({ description: 'Verified by (admin user ID)' })
  @Column({ name: 'verified_by', type: 'uuid', nullable: true })
  verifiedBy?: string;

  @ApiProperty({ description: 'Rejection reason' })
  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string;

  @ApiProperty({ description: 'Document expiry date' })
  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate?: Date;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
