import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEnhancedListingFields1760012952696 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add service-specific fields
    await queryRunner.query(`
      ALTER TABLE listings 
      ADD COLUMN IF NOT EXISTS service_type varchar(50)
    `);

    await queryRunner.query(`
      ALTER TABLE listings 
      ADD COLUMN IF NOT EXISTS availability_schedule jsonb
    `);

    await queryRunner.query(`
      ALTER TABLE listings 
      ADD COLUMN IF NOT EXISTS service_radius integer
    `);

    await queryRunner.query(`
      ALTER TABLE listings 
      ADD COLUMN IF NOT EXISTS professional_credentials jsonb
    `);

    await queryRunner.query(`
      ALTER TABLE listings 
      ADD COLUMN IF NOT EXISTS pricing_model varchar(50)
    `);

    await queryRunner.query(`
      ALTER TABLE listings 
      ADD COLUMN IF NOT EXISTS response_time integer
    `);

    // Add job-specific fields
    await queryRunner.query(`
      ALTER TABLE listings 
      ADD COLUMN IF NOT EXISTS employment_type varchar(20)
    `);

    await queryRunner.query(`
      ALTER TABLE listings 
      ADD COLUMN IF NOT EXISTS salary_min decimal(12,2)
    `);

    await queryRunner.query(`
      ALTER TABLE listings 
      ADD COLUMN IF NOT EXISTS salary_max decimal(12,2)
    `);

    await queryRunner.query(`
      ALTER TABLE listings 
      ADD COLUMN IF NOT EXISTS application_deadline timestamp
    `);

    await queryRunner.query(`
      ALTER TABLE listings 
      ADD COLUMN IF NOT EXISTS required_skills jsonb
    `);

    await queryRunner.query(`
      ALTER TABLE listings 
      ADD COLUMN IF NOT EXISTS work_location varchar(20)
    `);

    await queryRunner.query(`
      ALTER TABLE listings 
      ADD COLUMN IF NOT EXISTS company_info jsonb
    `);

    // Add enhanced property fields
    await queryRunner.query(`
      ALTER TABLE listings 
      ADD COLUMN IF NOT EXISTS property_amenities jsonb
    `);

    await queryRunner.query(`
      ALTER TABLE listings 
      ADD COLUMN IF NOT EXISTS utilities_included jsonb
    `);

    await queryRunner.query(`
      ALTER TABLE listings 
      ADD COLUMN IF NOT EXISTS pet_policy varchar(20)
    `);

    await queryRunner.query(`
      ALTER TABLE listings 
      ADD COLUMN IF NOT EXISTS parking_spaces integer
    `);

    await queryRunner.query(`
      ALTER TABLE listings 
      ADD COLUMN IF NOT EXISTS security_features jsonb
    `);

    await queryRunner.query(`
      ALTER TABLE listings 
      ADD COLUMN IF NOT EXISTS property_size decimal(10,2)
    `);

    await queryRunner.query(`
      ALTER TABLE listings 
      ADD COLUMN IF NOT EXISTS land_size decimal(10,2)
    `);

    // Add enhanced location fields
    await queryRunner.query(`
      ALTER TABLE listings 
      ADD COLUMN IF NOT EXISTS estate_id varchar(36)
    `);

    await queryRunner.query(`
      ALTER TABLE listings 
      ADD COLUMN IF NOT EXISTS city varchar(100)
    `);

    await queryRunner.query(`
      ALTER TABLE listings 
      ADD COLUMN IF NOT EXISTS state varchar(100)
    `);

    // Add enhanced status and metadata
    await queryRunner.query(`
      ALTER TABLE listings 
      ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE listings 
      ADD COLUMN IF NOT EXISTS boosted boolean DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE listings 
      ADD COLUMN IF NOT EXISTS verification_status varchar(20) DEFAULT 'pending'
    `);

    await queryRunner.query(`
      ALTER TABLE listings 
      ADD COLUMN IF NOT EXISTS contact_preferences jsonb
    `);

    // Add indexes for new fields
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_listings_service_type ON listings (service_type)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_listings_employment_type ON listings (employment_type)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_listings_work_location ON listings (work_location)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_listings_featured ON listings (featured)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_listings_verification_status ON listings (verification_status)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_listings_city ON listings (city)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_listings_state ON listings (state)
    `);

    // Add GIN indexes for JSONB fields
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_listings_required_skills_gin ON listings USING GIN (required_skills)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_listings_property_amenities_gin ON listings USING GIN (property_amenities)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_listings_utilities_included_gin ON listings USING GIN (utilities_included)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_listings_security_features_gin ON listings USING GIN (security_features)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_listings_service_type`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_listings_employment_type`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_listings_work_location`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_listings_featured`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_listings_verification_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_listings_city`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_listings_state`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_listings_required_skills_gin`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_listings_property_amenities_gin`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_listings_utilities_included_gin`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_listings_security_features_gin`);

    // Drop columns
    await queryRunner.query(`ALTER TABLE listings DROP COLUMN IF EXISTS service_type`);
    await queryRunner.query(`ALTER TABLE listings DROP COLUMN IF EXISTS availability_schedule`);
    await queryRunner.query(`ALTER TABLE listings DROP COLUMN IF EXISTS service_radius`);
    await queryRunner.query(`ALTER TABLE listings DROP COLUMN IF EXISTS professional_credentials`);
    await queryRunner.query(`ALTER TABLE listings DROP COLUMN IF EXISTS pricing_model`);
    await queryRunner.query(`ALTER TABLE listings DROP COLUMN IF EXISTS response_time`);
    await queryRunner.query(`ALTER TABLE listings DROP COLUMN IF EXISTS employment_type`);
    await queryRunner.query(`ALTER TABLE listings DROP COLUMN IF EXISTS salary_min`);
    await queryRunner.query(`ALTER TABLE listings DROP COLUMN IF EXISTS salary_max`);
    await queryRunner.query(`ALTER TABLE listings DROP COLUMN IF EXISTS application_deadline`);
    await queryRunner.query(`ALTER TABLE listings DROP COLUMN IF EXISTS required_skills`);
    await queryRunner.query(`ALTER TABLE listings DROP COLUMN IF EXISTS work_location`);
    await queryRunner.query(`ALTER TABLE listings DROP COLUMN IF EXISTS company_info`);
    await queryRunner.query(`ALTER TABLE listings DROP COLUMN IF EXISTS property_amenities`);
    await queryRunner.query(`ALTER TABLE listings DROP COLUMN IF EXISTS utilities_included`);
    await queryRunner.query(`ALTER TABLE listings DROP COLUMN IF EXISTS pet_policy`);
    await queryRunner.query(`ALTER TABLE listings DROP COLUMN IF EXISTS parking_spaces`);
    await queryRunner.query(`ALTER TABLE listings DROP COLUMN IF EXISTS security_features`);
    await queryRunner.query(`ALTER TABLE listings DROP COLUMN IF EXISTS property_size`);
    await queryRunner.query(`ALTER TABLE listings DROP COLUMN IF EXISTS land_size`);
    await queryRunner.query(`ALTER TABLE listings DROP COLUMN IF EXISTS estate_id`);
    await queryRunner.query(`ALTER TABLE listings DROP COLUMN IF EXISTS city`);
    await queryRunner.query(`ALTER TABLE listings DROP COLUMN IF EXISTS state`);
    await queryRunner.query(`ALTER TABLE listings DROP COLUMN IF EXISTS featured`);
    await queryRunner.query(`ALTER TABLE listings DROP COLUMN IF EXISTS boosted`);
    await queryRunner.query(`ALTER TABLE listings DROP COLUMN IF EXISTS verification_status`);
    await queryRunner.query(`ALTER TABLE listings DROP COLUMN IF EXISTS contact_preferences`);
  }
}
