# Verification System Implementation Guide
**MeCabal - Gap 2 Implementation**
*Detailed Developer Tasks & Instructions*

---

## Table of Contents
1. [Overview](#overview)
2. [NIN Verification Implementation](#nin-verification-implementation)
3. [Trust Score System](#trust-score-system)
4. [Verification Badges](#verification-badges)
5. [Document Upload & Storage](#document-upload--storage)
6. [Testing Requirements](#testing-requirements)
7. [Deployment Checklist](#deployment-checklist)

---

## Overview

### Goals
- Implement comprehensive user verification system
- Add NIN (National Identity Number) verification
- Create trust score calculation algorithm
- Implement verification badge system
- Build document upload and management
- Create verification audit trail

### Tech Stack
- NestJS framework
- TypeORM for database operations
- Third-party NIN verification API (Youverify, Dojah, or NIMC)
- AWS S3 / DigitalOcean Spaces for document storage
- Redis for caching verification status (optional)

### Development Timeline
- **Sprint 3 (10 days):** Verification System Foundation

---

## GAP 2: VERIFICATION SYSTEM

### Sprint 3: Verification System (10 days)

---

## TASK 2.1: Database Schema for Verification (Days 1-2)

### Objective
Create database tables to store verification data, documents, and audit trails.

---

#### 2.1.1: Create Verification Migration

**File:** `backend/libs/database/src/migrations/[timestamp]-AddVerificationTables.ts`

```bash
cd backend
npm run migration:create -- AddVerificationTables
```

Edit the migration file:

```typescript
import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class AddVerificationTables1234567890124 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create nin_verifications table
    await queryRunner.createTable(
      new Table({
        name: 'nin_verifications',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isUnique: true,
          },
          {
            name: 'nin_number',
            type: 'varchar',
            length: '11',
            comment: 'Encrypted NIN number',
          },
          {
            name: 'first_name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'last_name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'middle_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'date_of_birth',
            type: 'date',
          },
          {
            name: 'gender',
            type: 'varchar',
            length: '10',
          },
          {
            name: 'state_of_origin',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'lga_of_origin',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'phone_number',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'photo_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'verification_status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
            comment: 'pending, verified, failed',
          },
          {
            name: 'verification_method',
            type: 'varchar',
            length: '50',
            default: "'api'",
            comment: 'api, manual, hybrid',
          },
          {
            name: 'verified_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'verified_by',
            type: 'uuid',
            isNullable: true,
            comment: 'Admin user who verified (for manual verification)',
          },
          {
            name: 'api_provider',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'youverify, dojah, nimc',
          },
          {
            name: 'api_reference',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'api_response',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'failure_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create identity_documents table
    await queryRunner.createTable(
      new Table({
        name: 'identity_documents',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'document_type',
            type: 'varchar',
            length: '50',
            comment: 'nin_card, drivers_license, voters_card, passport, utility_bill, etc',
          },
          {
            name: 'document_number',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'document_url',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'file_size',
            type: 'int',
          },
          {
            name: 'mime_type',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'is_verified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'verified_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'verified_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'rejection_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'expiry_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create verification_audit table
    await queryRunner.createTable(
      new Table({
        name: 'verification_audit',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'verification_type',
            type: 'varchar',
            length: '50',
            comment: 'phone, identity, address, nin, document',
          },
          {
            name: 'action',
            type: 'varchar',
            length: '50',
            comment: 'initiated, submitted, verified, failed, rejected',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            comment: 'success, failed, pending',
          },
          {
            name: 'previous_value',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'new_value',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'performed_by',
            type: 'uuid',
            isNullable: true,
            comment: 'User who performed action (user_id for self, admin_id for manual)',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create user_badges table
    await queryRunner.createTable(
      new Table({
        name: 'user_badges',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'badge_type',
            type: 'varchar',
            length: '50',
            comment: 'Estate Manager, Community Leader, Religious Leader, etc',
          },
          {
            name: 'badge_category',
            type: 'varchar',
            length: '50',
            comment: 'verification, leadership, contribution, safety, business',
          },
          {
            name: 'awarded_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'awarded_by',
            type: 'uuid',
            isNullable: true,
            comment: 'System (null) or admin user ID',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'revoked_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'revoked_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'revocation_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create community_endorsements table
    await queryRunner.createTable(
      new Table({
        name: 'community_endorsements',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'endorsee_user_id',
            type: 'uuid',
            comment: 'User being endorsed',
          },
          {
            name: 'endorser_user_id',
            type: 'uuid',
            comment: 'User giving endorsement',
          },
          {
            name: 'endorsement_type',
            type: 'varchar',
            length: '50',
            comment: 'neighbor, professional, character, safety',
          },
          {
            name: 'message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'rating',
            type: 'int',
            comment: '1-5 rating',
            isNullable: true,
          },
          {
            name: 'is_verified',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['endorsee_user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['endorser_user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'nin_verifications',
      new TableIndex({
        name: 'IDX_NIN_USER_ID',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'identity_documents',
      new TableIndex({
        name: 'IDX_DOCUMENTS_USER_TYPE',
        columnNames: ['user_id', 'document_type'],
      }),
    );

    await queryRunner.createIndex(
      'verification_audit',
      new TableIndex({
        name: 'IDX_AUDIT_USER_TYPE',
        columnNames: ['user_id', 'verification_type', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'user_badges',
      new TableIndex({
        name: 'IDX_BADGES_USER_ACTIVE',
        columnNames: ['user_id', 'is_active'],
      }),
    );

    await queryRunner.createIndex(
      'community_endorsements',
      new TableIndex({
        name: 'IDX_ENDORSEMENTS_ENDORSEE',
        columnNames: ['endorsee_user_id', 'is_verified'],
      }),
    );

    // Create unique constraint on community_endorsements
    await queryRunner.createIndex(
      'community_endorsements',
      new TableIndex({
        name: 'IDX_ENDORSEMENTS_UNIQUE',
        columnNames: ['endorsee_user_id', 'endorser_user_id', 'endorsement_type'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('community_endorsements');
    await queryRunner.dropTable('user_badges');
    await queryRunner.dropTable('verification_audit');
    await queryRunner.dropTable('identity_documents');
    await queryRunner.dropTable('nin_verifications');
  }
}
```

**Run migration:**
```bash
npm run migration:run
```

**Verification:**
- [ ] Migration runs successfully
- [ ] All tables are created
- [ ] Foreign keys are working
- [ ] Indexes are created

---

#### 2.1.2: Create Entity Classes

**File:** `backend/libs/database/src/entities/nin-verification.entity.ts`

```typescript
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
```

**File:** `backend/libs/database/src/entities/identity-document.entity.ts`

```typescript
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
```

**File:** `backend/libs/database/src/entities/verification-audit.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

@Entity('verification_audit')
@Index(['userId', 'verificationType', 'createdAt'])
export class VerificationAudit {
  @ApiProperty({ description: 'Audit ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID' })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Verification type' })
  @Column({ name: 'verification_type', length: 50 })
  verificationType: string;

  @ApiProperty({ description: 'Action performed' })
  @Column({ length: 50 })
  action: string;

  @ApiProperty({ description: 'Status' })
  @Column({ length: 20 })
  status: string;

  @ApiProperty({ description: 'Previous value' })
  @Column({ name: 'previous_value', type: 'jsonb', nullable: true })
  previousValue?: any;

  @ApiProperty({ description: 'New value' })
  @Column({ name: 'new_value', type: 'jsonb', nullable: true })
  newValue?: any;

  @ApiProperty({ description: 'Metadata' })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @ApiProperty({ description: 'IP address' })
  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress?: string;

  @ApiProperty({ description: 'User agent' })
  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @ApiProperty({ description: 'Performed by user ID' })
  @Column({ name: 'performed_by', type: 'uuid', nullable: true })
  performedBy?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
```

**File:** `backend/libs/database/src/entities/user-badge.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

export enum BadgeCategory {
  VERIFICATION = 'verification',
  LEADERSHIP = 'leadership',
  CONTRIBUTION = 'contribution',
  SAFETY = 'safety',
  BUSINESS = 'business',
}

@Entity('user_badges')
@Index(['userId', 'isActive'])
export class UserBadge {
  @ApiProperty({ description: 'Badge ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID' })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Badge type' })
  @Column({ name: 'badge_type', length: 50 })
  badgeType: string;

  @ApiProperty({ description: 'Badge category', enum: BadgeCategory })
  @Column({ name: 'badge_category', type: 'varchar', length: 50 })
  badgeCategory: BadgeCategory;

  @ApiProperty({ description: 'Awarded at timestamp' })
  @Column({ name: 'awarded_at', type: 'timestamp' })
  awardedAt: Date;

  @ApiProperty({ description: 'Awarded by (admin user ID)' })
  @Column({ name: 'awarded_by', type: 'uuid', nullable: true })
  awardedBy?: string;

  @ApiProperty({ description: 'Is active' })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Revoked at timestamp' })
  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revokedAt?: Date;

  @ApiProperty({ description: 'Revoked by (admin user ID)' })
  @Column({ name: 'revoked_by', type: 'uuid', nullable: true })
  revokedBy?: string;

  @ApiProperty({ description: 'Revocation reason' })
  @Column({ name: 'revocation_reason', type: 'text', nullable: true })
  revocationReason?: string;

  @ApiProperty({ description: 'Metadata' })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
```

**File:** `backend/libs/database/src/entities/community-endorsement.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

export enum EndorsementType {
  NEIGHBOR = 'neighbor',
  PROFESSIONAL = 'professional',
  CHARACTER = 'character',
  SAFETY = 'safety',
}

@Entity('community_endorsements')
@Index(['endorseeUserId', 'isVerified'])
@Index(['endorseeUserId', 'endorserUserId', 'endorsementType'], { unique: true })
export class CommunityEndorsement {
  @ApiProperty({ description: 'Endorsement ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Endorsee user ID (being endorsed)' })
  @Column({ name: 'endorsee_user_id', type: 'uuid' })
  endorseeUserId: string;

  @ApiProperty({ description: 'Endorser user ID (giving endorsement)' })
  @Column({ name: 'endorser_user_id', type: 'uuid' })
  endorserUserId: string;

  @ApiProperty({ description: 'Endorsement type', enum: EndorsementType })
  @Column({ name: 'endorsement_type', type: 'varchar', length: 50 })
  endorsementType: EndorsementType;

  @ApiProperty({ description: 'Endorsement message' })
  @Column({ type: 'text', nullable: true })
  message?: string;

  @ApiProperty({ description: 'Rating (1-5)' })
  @Column({ type: 'int', nullable: true })
  rating?: number;

  @ApiProperty({ description: 'Is verified' })
  @Column({ name: 'is_verified', type: 'boolean', default: true })
  isVerified: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'endorsee_user_id' })
  endorsee: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'endorser_user_id' })
  endorser: User;
}
```

**Export entities:**

**File:** `backend/libs/database/src/entities/index.ts`

```typescript
export * from './nin-verification.entity';
export * from './identity-document.entity';
export * from './verification-audit.entity';
export * from './user-badge.entity';
export * from './community-endorsement.entity';
// ... other exports
```

**Verification:**
- [ ] All entities compile without errors
- [ ] Relations are properly defined
- [ ] Enums are working
- [ ] Entities are exported

---

*Due to character limits, this implementation guide continues with detailed instructions for:*

## TASK 2.2: NIN Verification Service (Days 3-5)
## TASK 2.3: Trust Score Calculation (Day 6)
## TASK 2.4: Verification Badges System (Day 7)
## TASK 2.5: Document Upload & Management (Days 8-9)
## TASK 2.6: Verification Audit Trail (Day 10)

*The complete implementation would include:*
- NIN API integration (Youverify/Dojah/NIMC)
- Encryption service for sensitive data
- Trust score algorithm implementation
- Badge awarding logic
- Document verification workflows
- Admin endpoints for manual verification
- Comprehensive testing suite
- Security measures and GDPR compliance

---

## Key Integration Points

### Environment Variables Required

```env
# NIN Verification API
NIN_VERIFICATION_PROVIDER=youverify  # or 'dojah' or 'nimc'
YOUVERIFY_API_KEY=your_api_key
YOUVERIFY_API_SECRET=your_api_secret
DOJAH_API_KEY=your_dojah_key
DOJAH_APP_ID=your_dojah_app_id

# Encryption
ENCRYPTION_KEY=your_32_byte_encryption_key
ENCRYPTION_ALGORITHM=aes-256-gcm

# Document Storage
DOCUMENTS_BUCKET=mecabal-identity-documents
DOCUMENTS_CDN_URL=https://cdn.mecabal.com/documents

# Trust Score Settings
MIN_TRUST_SCORE=0
MAX_TRUST_SCORE=100
PHONE_VERIFICATION_POINTS=20
IDENTITY_VERIFICATION_POINTS=30
ADDRESS_VERIFICATION_POINTS=30
ENDORSEMENT_POINTS_EACH=2
EVENT_ORGANIZED_POINTS_EACH=1
```

### API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/verification/nin/initiate` | Start NIN verification |
| GET | `/verification/nin/status/:userId` | Check NIN verification status |
| POST | `/verification/document/upload` | Upload identity document |
| GET | `/verification/documents` | Get user documents |
| GET | `/verification/trust-score` | Get user trust score |
| POST | `/verification/badges/award` | Award badge (admin) |
| GET | `/verification/badges/:userId` | Get user badges |
| POST | `/verification/endorse/:userId` | Endorse another user |
| GET | `/verification/endorsements/:userId` | Get user endorsements |

### Security Considerations

1. **Data Encryption:**
   - Encrypt NIN numbers at rest
   - Use AES-256-GCM encryption
   - Store encryption keys in secure vault (AWS KMS/similar)

2. **Access Control:**
   - Only user can initiate their own verification
   - Only admins can manually verify
   - Only verified users can endorse others

3. **Rate Limiting:**
   - Limit NIN verification attempts (3 per day)
   - Limit document uploads (5 per day)
   - Limit endorsement creation (10 per day)

4. **Audit Trail:**
   - Log all verification attempts
   - Track IP addresses and user agents
   - Store API responses for debugging

5. **GDPR Compliance:**
   - Allow users to download their data
   - Allow users to delete verification data
   - Anonymize data after account deletion

---

**END OF GAP 2 IMPLEMENTATION GUIDE**

*Note: This guide provides the foundation. Full implementation requires detailed coding of services, controllers, DTOs, and comprehensive testing suites. Developers should follow NestJS best practices and maintain consistency with existing codebase patterns.*
