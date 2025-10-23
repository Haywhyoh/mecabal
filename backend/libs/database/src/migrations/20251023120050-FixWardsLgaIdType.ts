import { MigrationInterface, QueryRunner } from "typeorm";

export class FixWardsLgaIdType20251023120050 implements MigrationInterface {
    name = 'FixWardsLgaIdType20251023120050'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, check the actual data types
        const lgaIdType = await queryRunner.query(`
            SELECT data_type
            FROM information_schema.columns
            WHERE table_name = 'local_government_areas' AND column_name = 'id'
        `);

        const wardLgaIdType = await queryRunner.query(`
            SELECT data_type
            FROM information_schema.columns
            WHERE table_name = 'wards' AND column_name = 'lga_id'
        `);

        console.log(`LGA ID type: ${lgaIdType[0]?.data_type}`);
        console.log(`Ward lga_id type: ${wardLgaIdType[0]?.data_type}`);

        // If LGA uses integer and wards uses UUID, we need to align them
        if (lgaIdType[0]?.data_type === 'integer' && wardLgaIdType[0]?.data_type === 'uuid') {
            console.log('Fixing wards.lga_id to match LGA integer ID type...');

            // Drop existing foreign key constraint if it exists
            await queryRunner.query(`
                ALTER TABLE wards DROP CONSTRAINT IF EXISTS "FK_wards_lga_id"
            `);

            // Drop the column and recreate with correct type
            await queryRunner.query(`
                ALTER TABLE wards DROP COLUMN IF EXISTS lga_id
            `);

            await queryRunner.query(`
                ALTER TABLE wards ADD COLUMN lga_id integer
            `);

            // Add foreign key constraint
            await queryRunner.query(`
                ALTER TABLE wards
                ADD CONSTRAINT "FK_wards_lga_id"
                FOREIGN KEY (lga_id)
                REFERENCES local_government_areas(id)
                ON DELETE CASCADE
            `);

            // Create index
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "IDX_wards_lga_id" ON wards(lga_id)
            `);

            console.log('Successfully fixed wards.lga_id type to integer');
        } else if (lgaIdType[0]?.data_type === 'uuid' && wardLgaIdType[0]?.data_type === 'integer') {
            console.log('Fixing wards.lga_id to match LGA UUID type...');

            // Drop existing foreign key constraint if it exists
            await queryRunner.query(`
                ALTER TABLE wards DROP CONSTRAINT IF EXISTS "FK_wards_lga_id"
            `);

            // Drop the column and recreate with correct type
            await queryRunner.query(`
                ALTER TABLE wards DROP COLUMN IF EXISTS lga_id
            `);

            await queryRunner.query(`
                ALTER TABLE wards ADD COLUMN lga_id uuid
            `);

            // Add foreign key constraint
            await queryRunner.query(`
                ALTER TABLE wards
                ADD CONSTRAINT "FK_wards_lga_id"
                FOREIGN KEY (lga_id)
                REFERENCES local_government_areas(id)
                ON DELETE CASCADE
            `);

            // Create index
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "IDX_wards_lga_id" ON wards(lga_id)
            `);

            console.log('Successfully fixed wards.lga_id type to uuid');
        } else {
            console.log(`Types already match: LGA=${lgaIdType[0]?.data_type}, Ward lga_id=${wardLgaIdType[0]?.data_type}`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Rollback is complex and risky, so we'll just log a message
        console.log('Rollback of ID type changes is not supported - please restore from backup if needed');
    }
}
