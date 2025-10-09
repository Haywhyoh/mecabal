import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class AddVerificationTables1760012952693 implements MigrationInterface {
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
            comment: 'youverify, dojah, nimc, mock',
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
