import { MigrationInterface, QueryRunner } from "typeorm";

export class FixLGACodeColumn20251017140000 implements MigrationInterface {
    name = 'FixLGACodeColumn20251017140000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, check if the code column exists and has null values
        const hasCodeColumn = await queryRunner.hasColumn('local_government_areas', 'code');
        
        if (hasCodeColumn) {
            // Get all LGAs with null code values
            const nullCodeLGAs = await queryRunner.query(`
                SELECT id, name FROM local_government_areas 
                WHERE code IS NULL OR code = ''
            `);

            // Update null code values with a generated code based on the name
            for (const lga of nullCodeLGAs) {
                // Generate a code from the LGA name (first 3 characters, uppercase)
                const generatedCode = lga.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
                const finalCode = generatedCode || 'LGA'; // fallback if no valid characters
                
                await queryRunner.query(`
                    UPDATE local_government_areas 
                    SET code = $1 
                    WHERE id = $2
                `, [finalCode, lga.id]);
            }

            // Now make the code column NOT NULL
            await queryRunner.query(`
                ALTER TABLE "local_government_areas" 
                ALTER COLUMN "code" SET NOT NULL
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Make the code column nullable again
        await queryRunner.query(`
            ALTER TABLE "local_government_areas" 
            ALTER COLUMN "code" DROP NOT NULL
        `);
    }
}
