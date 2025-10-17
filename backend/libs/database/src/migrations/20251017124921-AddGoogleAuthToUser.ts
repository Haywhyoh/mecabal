import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleAuthToUser20251017124921 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create auth_provider enum if it doesn't exist
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE auth_provider_enum AS ENUM ('local', 'google', 'facebook', 'apple');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Add google_id column if it doesn't exist
    await queryRunner.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
    `);

    // 3. Add auth_provider column with default value
    await queryRunner.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS auth_provider auth_provider_enum DEFAULT 'local';
    `);

    // 4. Add is_email_verified column
    await queryRunner.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT false;
    `);

    // 5. Make password_hash nullable for OAuth users
    await queryRunner.query(`
      ALTER TABLE users 
      ALTER COLUMN password_hash DROP NOT NULL;
    `);

    // 6. Create composite index on email and auth_provider
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email_auth_provider 
      ON users(email, auth_provider);
    `);

    // 7. Create index on google_id for faster lookups
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_google_id 
      ON users(google_id) WHERE google_id IS NOT NULL;
    `);

    // 8. Update existing users to have is_email_verified = true if they are already verified
    await queryRunner.query(`
      UPDATE users 
      SET is_email_verified = true 
      WHERE is_verified = true;
    `);

    // 9. Add constraint to ensure at least one authentication method exists
    await queryRunner.query(`
      ALTER TABLE users 
      ADD CONSTRAINT chk_auth_method_exists 
      CHECK (
        (auth_provider = 'local' AND password_hash IS NOT NULL) OR
        (auth_provider IN ('google', 'facebook', 'apple') AND google_id IS NOT NULL)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove constraint
    await queryRunner.query(`
      ALTER TABLE users 
      DROP CONSTRAINT IF EXISTS chk_auth_method_exists;
    `);

    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_users_google_id;
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_users_email_auth_provider;
    `);

    // Make password_hash NOT NULL again (this might fail if there are OAuth-only users)
    await queryRunner.query(`
      ALTER TABLE users 
      ALTER COLUMN password_hash SET NOT NULL;
    `);

    // Drop columns
    await queryRunner.query(`
      ALTER TABLE users 
      DROP COLUMN IF EXISTS is_email_verified;
    `);
    await queryRunner.query(`
      ALTER TABLE users 
      DROP COLUMN IF EXISTS auth_provider;
    `);
    await queryRunner.query(`
      ALTER TABLE users 
      DROP COLUMN IF EXISTS google_id;
    `);

    // Drop enum type
    await queryRunner.query(`
      DROP TYPE IF EXISTS auth_provider_enum;
    `);
  }
}
