import { MigrationInterface, QueryRunner } from "typeorm";

export class FixLGAStateIdNullValues20251017160000 implements MigrationInterface {
    name = 'FixLGAStateIdNullValues20251017160000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if there are any LGAs with null state_id values
        const nullStateIdLGAs = await queryRunner.query(`
            SELECT id, name FROM local_government_areas 
            WHERE state_id IS NULL
        `);

        if (nullStateIdLGAs.length > 0) {
            // Get the first state ID to use as default
            const firstState = await queryRunner.query(`
                SELECT id FROM states LIMIT 1
            `);

            if (firstState.length > 0) {
                const defaultStateId = firstState[0].id;
                
                // Update all LGAs with null state_id to use the default state
                await queryRunner.query(`
                    UPDATE local_government_areas 
                    SET state_id = $1 
                    WHERE state_id IS NULL
                `, [defaultStateId]);
            } else {
                // If no states exist, create a default state
                await queryRunner.query(`
                    INSERT INTO states (id, name, code, country, created_at, updated_at)
                    VALUES (uuid_generate_v4(), 'Lagos State', 'LAG', 'Nigeria', now(), now())
                `);
                
                const newState = await queryRunner.query(`
                    SELECT id FROM states WHERE code = 'LAG' LIMIT 1
                `);
                
                if (newState.length > 0) {
                    const defaultStateId = newState[0].id;
                    
                    // Update all LGAs with null state_id to use the new state
                    await queryRunner.query(`
                        UPDATE local_government_areas 
                        SET state_id = $1 
                        WHERE state_id IS NULL
                    `, [defaultStateId]);
                }
            }
        }

        // Now make the state_id column NOT NULL
        await queryRunner.query(`
            ALTER TABLE "local_government_areas" 
            ALTER COLUMN "state_id" SET NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Make the state_id column nullable again
        await queryRunner.query(`
            ALTER TABLE "local_government_areas" 
            ALTER COLUMN "state_id" DROP NOT NULL
        `);
    }
}
