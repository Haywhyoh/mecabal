import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateBusinessProfileFields1760012952695 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns as nullable first
    await queryRunner.query(`
      ALTER TABLE business_profiles 
      ADD COLUMN IF NOT EXISTS services_offered jsonb
    `);

    await queryRunner.query(`
      ALTER TABLE business_profiles 
      ADD COLUMN IF NOT EXISTS service_areas jsonb
    `);

    await queryRunner.query(`
      ALTER TABLE business_profiles 
      ADD COLUMN IF NOT EXISTS response_time integer DEFAULT 24
    `);

    await queryRunner.query(`
      ALTER TABLE business_profiles 
      ADD COLUMN IF NOT EXISTS contact_preferences jsonb
    `);

    // Update existing records with default values
    await queryRunner.query(`
      UPDATE business_profiles 
      SET service_areas = '{"type": "neighborhood", "radius": 5}'::jsonb
      WHERE service_areas IS NULL
    `);

    await queryRunner.query(`
      UPDATE business_profiles 
      SET contact_preferences = '{"allowCalls": true, "allowMessages": true, "allowWhatsApp": true, "preferredTime": "9:00-17:00"}'::jsonb
      WHERE contact_preferences IS NULL
    `);

    // Now make the columns NOT NULL (optional - you can keep them nullable)
    // await queryRunner.query(`
    //   ALTER TABLE business_profiles 
    //   ALTER COLUMN service_areas SET NOT NULL
    // `);

    // await queryRunner.query(`
    //   ALTER TABLE business_profiles 
    //   ALTER COLUMN contact_preferences SET NOT NULL
    // `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the added columns
    await queryRunner.query(`
      ALTER TABLE business_profiles 
      DROP COLUMN IF EXISTS services_offered
    `);

    await queryRunner.query(`
      ALTER TABLE business_profiles 
      DROP COLUMN IF EXISTS service_areas
    `);

    await queryRunner.query(`
      ALTER TABLE business_profiles 
      DROP COLUMN IF EXISTS response_time
    `);

    await queryRunner.query(`
      ALTER TABLE business_profiles 
      DROP COLUMN IF EXISTS contact_preferences
    `);
  }
}
