import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRichDataToStates1761002609031 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new columns to states table
        await queryRunner.query(`
            ALTER TABLE "states"
            ADD COLUMN IF NOT EXISTS "region" character varying(50),
            ADD COLUMN IF NOT EXISTS "capital" character varying(100),
            ADD COLUMN IF NOT EXISTS "population" integer,
            ADD COLUMN IF NOT EXISTS "area_sqkm" decimal(10,2)
        `);

        // Create index on region for filtering
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_states_region" ON "states" ("region")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the index
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_states_region"`);

        // Remove the columns
        await queryRunner.query(`
            ALTER TABLE "states"
            DROP COLUMN IF EXISTS "area_sqkm",
            DROP COLUMN IF EXISTS "population",
            DROP COLUMN IF EXISTS "capital",
            DROP COLUMN IF EXISTS "region"
        `);
    }

}
