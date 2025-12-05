import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccessCodeToVisitorPass20251202000000 implements MigrationInterface {
  name = 'AddAccessCodeToVisitorPass20251202000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if table exists
    const tableExists = await queryRunner.hasTable('visitor_passes');
    
    if (tableExists) {
      // Add access_code column
      await queryRunner.query(`
        DO $$ BEGIN
          ALTER TABLE "visitor_passes"
          ADD COLUMN "access_code" character varying(4);
        EXCEPTION
          WHEN duplicate_column THEN null;
        END $$;
      `);

      // Add send_method column
      await queryRunner.query(`
        DO $$ BEGIN
          ALTER TABLE "visitor_passes"
          ADD COLUMN "send_method" character varying;
        EXCEPTION
          WHEN duplicate_column THEN null;
        END $$;
      `);

      // Create index for access_code
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_visitor_passes_access_code" 
        ON "visitor_passes" ("access_code")
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('visitor_passes');
    
    if (tableExists) {
      // Drop index
      await queryRunner.query(`
        DROP INDEX IF EXISTS "IDX_visitor_passes_access_code"
      `);

      // Drop columns
      await queryRunner.query(`
        ALTER TABLE "visitor_passes" 
        DROP COLUMN IF EXISTS "send_method"
      `);

      await queryRunner.query(`
        ALTER TABLE "visitor_passes" 
        DROP COLUMN IF EXISTS "access_code"
      `);
    }
  }
}






