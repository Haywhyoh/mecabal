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

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  FAILED = 'failed',
}

export enum VerificationMethod {
  API = 'api',
  MANUAL = 'manual',
  HYBRID = 'hybrid',
}

@Entity('nin_verifications')
@Index(['userId'], { unique: true })
export class NinVerification {
  @ApiProperty({ description: 'Verification ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID' })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'NIN number (encrypted)' })
  @Column({ name: 'nin_number', length: 11 })
  ninNumber: string;

  @ApiProperty({ description: 'First name from NIN' })
  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @ApiProperty({ description: 'Last name from NIN' })
  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @ApiProperty({ description: 'Middle name from NIN' })
  @Column({ name: 'middle_name', length: 100, nullable: true })
  middleName?: string;

  @ApiProperty({ description: 'Date of birth' })
  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth: Date;

  @ApiProperty({ description: 'Gender' })
  @Column({ length: 10 })
  gender: string;

  @ApiProperty({ description: 'State of origin' })
  @Column({ name: 'state_of_origin', length: 50 })
  stateOfOrigin: string;

  @ApiProperty({ description: 'LGA of origin' })
  @Column({ name: 'lga_of_origin', length: 100, nullable: true })
  lgaOfOrigin?: string;

  @ApiProperty({ description: 'Phone number from NIN' })
  @Column({ name: 'phone_number', length: 20, nullable: true })
  phoneNumber?: string;

  @ApiProperty({ description: 'Photo URL' })
  @Column({ name: 'photo_url', length: 500, nullable: true })
  photoUrl?: string;

  @ApiProperty({ description: 'Verification status', enum: VerificationStatus })
  @Column({
    name: 'verification_status',
    type: 'varchar',
    length: 20,
    default: VerificationStatus.PENDING,
  })
  verificationStatus: VerificationStatus;

  @ApiProperty({ description: 'Verification method', enum: VerificationMethod })
  @Column({
    name: 'verification_method',
    type: 'varchar',
    length: 50,
    default: VerificationMethod.API,
  })
  verificationMethod: VerificationMethod;

  @ApiProperty({ description: 'Verified at timestamp' })
  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt?: Date;

  @ApiProperty({ description: 'Verified by (admin user ID)' })
  @Column({ name: 'verified_by', type: 'uuid', nullable: true })
  verifiedBy?: string;

  @ApiProperty({ description: 'API provider name' })
  @Column({ name: 'api_provider', length: 50, nullable: true })
  apiProvider?: string;

  @ApiProperty({ description: 'API reference ID' })
  @Column({ name: 'api_reference', length: 255, nullable: true })
  apiReference?: string;

  @ApiProperty({ description: 'API response data' })
  @Column({ name: 'api_response', type: 'jsonb', nullable: true })
  apiResponse?: any;

  @ApiProperty({ description: 'Failure reason' })
  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason?: string;

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
