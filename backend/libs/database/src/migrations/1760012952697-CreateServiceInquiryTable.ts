import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateServiceInquiryTable1760012952697 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'service_inquiries',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'business_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'customer_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'service_type',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'urgency',
            type: 'varchar',
            length: '20',
            default: "'normal'",
            isNullable: false,
          },
          {
            name: 'budget_min',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'budget_max',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'preferred_contact',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'business_response',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'responded_at',
            type: 'timestamp',
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
    await queryRunner.query(`
      CREATE INDEX IDX_service_inquiries_business_id ON service_inquiries (business_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_service_inquiries_customer_id ON service_inquiries (customer_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_service_inquiries_status ON service_inquiries (status)
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_service_inquiries_urgency ON service_inquiries (urgency)
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_service_inquiries_created_at ON service_inquiries (created_at)
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE service_inquiries 
      ADD CONSTRAINT FK_service_inquiries_business_id 
      FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE service_inquiries 
      ADD CONSTRAINT FK_service_inquiries_customer_id 
      FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('service_inquiries');
  }
}
