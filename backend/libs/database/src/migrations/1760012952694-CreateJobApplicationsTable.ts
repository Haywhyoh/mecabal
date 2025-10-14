import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateJobApplicationsTable1760012952694 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'job_applications',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'job_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'cover_letter',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'resume_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'portfolio_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'expected_salary',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'availability_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'additional_info',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'job_applications',
      new TableIndex({
        name: 'IDX_job_applications_job_id',
        columnNames: ['job_id']
      }),
    );

    await queryRunner.createIndex(
      'job_applications',
      new TableIndex({
        name: 'IDX_job_applications_user_id',
        columnNames: ['user_id']
      }),
    );

    await queryRunner.createIndex(
      'job_applications',
      new TableIndex({
        name: 'IDX_job_applications_status',
        columnNames: ['status']
      }),
    );

    await queryRunner.createIndex(
      'job_applications',
      new TableIndex({
        name: 'IDX_job_applications_job_user',
        columnNames: ['job_id', 'user_id']
      }),
    );

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE job_applications 
      ADD CONSTRAINT FK_job_applications_job_id 
      FOREIGN KEY (job_id) REFERENCES listings(id) ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE job_applications 
      ADD CONSTRAINT FK_job_applications_user_id 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    `);

    // Add unique constraint to prevent duplicate applications
    await queryRunner.query(`
      ALTER TABLE job_applications 
      ADD CONSTRAINT UQ_job_applications_job_user 
      UNIQUE (job_id, user_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('job_applications');
  }
}
