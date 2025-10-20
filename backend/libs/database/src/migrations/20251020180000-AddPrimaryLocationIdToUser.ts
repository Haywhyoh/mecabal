import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPrimaryLocationIdToUser20251020180000 implements MigrationInterface {
  name = 'AddPrimaryLocationIdToUser20251020180000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add primary_location_id column to users table
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "primary_location_id" uuid;
    `);

    // Add foreign key constraint to user_locations table
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD CONSTRAINT "FK_users_primary_location" 
      FOREIGN KEY ("primary_location_id") 
      REFERENCES "user_locations"("id") 
      ON DELETE SET NULL;
    `);

    // Add index for better query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_users_primary_location_id" 
      ON "users" ("primary_location_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP CONSTRAINT "FK_users_primary_location";
    `);

    // Drop the index
    await queryRunner.query(`
      DROP INDEX "IDX_users_primary_location_id";
    `);

    // Drop the column
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN "primary_location_id";
    `);
  }
}
