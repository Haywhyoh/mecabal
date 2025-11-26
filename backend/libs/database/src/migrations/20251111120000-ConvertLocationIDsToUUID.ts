import { MigrationInterface, QueryRunner } from "typeorm";

export class ConvertLocationIDsToUUID20251111120000 implements MigrationInterface {
    name = 'ConvertLocationIDsToUUID20251111120000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        this.logger('Starting conversion of location tables from integer IDs to UUIDs...');

        // Enable UUID extension if not already enabled
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // Check if states table already uses UUIDs - if so, skip entire migration
        const statesIdTypeResult = await queryRunner.query(`
            SELECT data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND table_name = 'states' 
            AND column_name = 'id'
        `);

        // Also check if states table exists
        if (!statesIdTypeResult || statesIdTypeResult.length === 0) {
            this.logger('⚠️  States table not found. Skipping conversion migration.');
            return;
        }

        const dataType = statesIdTypeResult[0]?.data_type;
        this.logger(`States table ID data type: ${dataType}`);

        if (dataType === 'uuid') {
            this.logger('⚠️  States table already uses UUIDs. Skipping conversion migration.');
            this.logger('✅ Migration skipped - tables already converted.');
            return;
        }

        // Only proceed if states table has integer/bigint IDs
        if (dataType !== 'integer' && dataType !== 'bigint') {
            this.logger(`⚠️  States table ID type is ${dataType}, not integer. Skipping conversion.`);
            return;
        }

        // ============================================
        // STEP 1: Convert States Table
        // ============================================
        this.logger('Step 1: Converting states table...');

        // Create a mapping table to store old ID -> new UUID mappings
        // Use the actual data type from the states table
        const mappingTableType = dataType === 'bigint' ? 'bigint' : 'integer';
        
        await queryRunner.query(`
            CREATE TEMPORARY TABLE state_id_mapping (
                old_id ${mappingTableType} PRIMARY KEY,
                new_id uuid NOT NULL DEFAULT uuid_generate_v4()
            )
        `);

        // Populate mapping table with current state IDs
        await queryRunner.query(`
            INSERT INTO state_id_mapping (old_id)
            SELECT id FROM states
        `);

        // Add new UUID column to states
        await queryRunner.query(`
            ALTER TABLE states ADD COLUMN id_new uuid
        `);

        // Update new UUID column with mapped values
        await queryRunner.query(`
            UPDATE states s
            SET id_new = m.new_id
            FROM state_id_mapping m
            WHERE s.id = m.old_id
        `);

        // ============================================
        // STEP 2: Update LGAs to use new state UUIDs
        // ============================================
        this.logger('Step 2: Updating LGAs with new state UUIDs...');

        // Add new UUID columns to LGAs
        await queryRunner.query(`
            ALTER TABLE local_government_areas ADD COLUMN id_new uuid
        `);
        await queryRunner.query(`
            ALTER TABLE local_government_areas ADD COLUMN state_id_new uuid
        `);

        // Create LGA mapping table
        await queryRunner.query(`
            CREATE TEMPORARY TABLE lga_id_mapping (
                old_id integer PRIMARY KEY,
                new_id uuid NOT NULL DEFAULT uuid_generate_v4()
            )
        `);

        await queryRunner.query(`
            INSERT INTO lga_id_mapping (old_id)
            SELECT id FROM local_government_areas
        `);

        // Update LGA new IDs
        await queryRunner.query(`
            UPDATE local_government_areas lga
            SET id_new = m.new_id
            FROM lga_id_mapping m
            WHERE lga.id = m.old_id
        `);

        // Update LGA state_id references
        await queryRunner.query(`
            UPDATE local_government_areas lga
            SET state_id_new = sm.new_id
            FROM state_id_mapping sm
            WHERE lga.state_id = sm.old_id
        `);

        // ============================================
        // STEP 3: Update Wards
        // ============================================
        this.logger('Step 3: Converting wards table...');

        // Check if wards table exists and has data
        const wardsExist = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'wards'
            )
        `);

        if (wardsExist[0].exists) {
            const wardsCount = await queryRunner.query(`SELECT COUNT(*) as count FROM wards`);

            if (parseInt(wardsCount[0].count) > 0) {
                await queryRunner.query(`
                    ALTER TABLE wards ADD COLUMN id_new uuid
                `);
                await queryRunner.query(`
                    ALTER TABLE wards ADD COLUMN lga_id_new uuid
                `);

                await queryRunner.query(`
                    CREATE TEMPORARY TABLE ward_id_mapping (
                        old_id integer PRIMARY KEY,
                        new_id uuid NOT NULL DEFAULT uuid_generate_v4()
                    )
                `);

                await queryRunner.query(`
                    INSERT INTO ward_id_mapping (old_id)
                    SELECT id FROM wards
                `);

                await queryRunner.query(`
                    UPDATE wards w
                    SET id_new = m.new_id
                    FROM ward_id_mapping m
                    WHERE w.id = m.old_id
                `);

                await queryRunner.query(`
                    UPDATE wards w
                    SET lga_id_new = lm.new_id
                    FROM lga_id_mapping lm
                    WHERE w.lga_id = lm.old_id
                `);
            } else {
                this.logger('Wards table is empty, skipping...');
            }
        }

        // ============================================
        // STEP 4: Update Neighborhoods
        // ============================================
        this.logger('Step 4: Converting neighborhoods table...');

        const neighborhoodsExist = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'neighborhoods'
            )
        `);

        if (neighborhoodsExist[0].exists) {
            const neighborhoodsCount = await queryRunner.query(`SELECT COUNT(*) as count FROM neighborhoods`);

            if (parseInt(neighborhoodsCount[0].count) > 0) {
                await queryRunner.query(`
                    ALTER TABLE neighborhoods ADD COLUMN id_new uuid
                `);
                await queryRunner.query(`
                    ALTER TABLE neighborhoods ADD COLUMN lga_id_new uuid
                `);
                await queryRunner.query(`
                    ALTER TABLE neighborhoods ADD COLUMN ward_id_new uuid
                `);
                await queryRunner.query(`
                    ALTER TABLE neighborhoods ADD COLUMN parent_neighborhood_id_new uuid
                `);

                await queryRunner.query(`
                    CREATE TEMPORARY TABLE neighborhood_id_mapping (
                        old_id integer PRIMARY KEY,
                        new_id uuid NOT NULL DEFAULT uuid_generate_v4()
                    )
                `);

                await queryRunner.query(`
                    INSERT INTO neighborhood_id_mapping (old_id)
                    SELECT id FROM neighborhoods
                `);

                await queryRunner.query(`
                    UPDATE neighborhoods n
                    SET id_new = m.new_id
                    FROM neighborhood_id_mapping m
                    WHERE n.id = m.old_id
                `);

                await queryRunner.query(`
                    UPDATE neighborhoods n
                    SET lga_id_new = lm.new_id
                    FROM lga_id_mapping lm
                    WHERE n.lga_id = lm.old_id
                `);

                // Update ward_id if wards exist
                if (wardsExist[0].exists) {
                    await queryRunner.query(`
                        UPDATE neighborhoods n
                        SET ward_id_new = wm.new_id
                        FROM ward_id_mapping wm
                        WHERE n.ward_id = wm.old_id
                    `);
                }

                // Update parent_neighborhood_id
                await queryRunner.query(`
                    UPDATE neighborhoods n
                    SET parent_neighborhood_id_new = nm.new_id
                    FROM neighborhood_id_mapping nm
                    WHERE n.parent_neighborhood_id = nm.old_id
                `);
            } else {
                this.logger('Neighborhoods table is empty, skipping...');
            }
        }

        // ============================================
        // STEP 5: Update user_locations
        // ============================================
        this.logger('Step 5: Updating user_locations foreign keys...');

        const userLocationsExist = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'user_locations'
            )
        `);

        if (userLocationsExist[0].exists) {
            const userLocationsCount = await queryRunner.query(`SELECT COUNT(*) as count FROM user_locations`);

            if (parseInt(userLocationsCount[0].count) > 0) {
                await queryRunner.query(`
                    ALTER TABLE user_locations ADD COLUMN state_id_new uuid
                `);
                await queryRunner.query(`
                    ALTER TABLE user_locations ADD COLUMN lga_id_new uuid
                `);
                await queryRunner.query(`
                    ALTER TABLE user_locations ADD COLUMN ward_id_new uuid
                `);
                await queryRunner.query(`
                    ALTER TABLE user_locations ADD COLUMN neighborhood_id_new uuid
                `);

                await queryRunner.query(`
                    UPDATE user_locations ul
                    SET state_id_new = sm.new_id
                    FROM state_id_mapping sm
                    WHERE ul.state_id = sm.old_id::text
                `);

                await queryRunner.query(`
                    UPDATE user_locations ul
                    SET lga_id_new = lm.new_id
                    FROM lga_id_mapping lm
                    WHERE ul.lga_id = lm.old_id::text
                `);

                if (wardsExist[0].exists) {
                    await queryRunner.query(`
                        UPDATE user_locations ul
                        SET ward_id_new = wm.new_id
                        FROM ward_id_mapping wm
                        WHERE ul.ward_id = wm.old_id::text
                    `);
                }

                if (neighborhoodsExist[0].exists) {
                    await queryRunner.query(`
                        UPDATE user_locations ul
                        SET neighborhood_id_new = nm.new_id
                        FROM neighborhood_id_mapping nm
                        WHERE ul.neighborhood_id = nm.old_id::text
                    `);
                }
            }
        }

        // ============================================
        // STEP 6: Drop old columns and rename new ones
        // ============================================
        this.logger('Step 6: Swapping old integer IDs with new UUIDs...');

        // States
        await queryRunner.query(`ALTER TABLE states DROP CONSTRAINT IF EXISTS "PK_states"`);
        await queryRunner.query(`ALTER TABLE states DROP COLUMN id`);
        await queryRunner.query(`ALTER TABLE states RENAME COLUMN id_new TO id`);
        await queryRunner.query(`ALTER TABLE states ADD CONSTRAINT "PK_states" PRIMARY KEY (id)`);
        await queryRunner.query(`ALTER TABLE states ALTER COLUMN id SET DEFAULT uuid_generate_v4()`);

        // LGAs
        await queryRunner.query(`ALTER TABLE local_government_areas DROP CONSTRAINT IF EXISTS "PK_local_government_areas"`);
        await queryRunner.query(`ALTER TABLE local_government_areas DROP COLUMN id`);
        await queryRunner.query(`ALTER TABLE local_government_areas DROP COLUMN state_id`);
        await queryRunner.query(`ALTER TABLE local_government_areas RENAME COLUMN id_new TO id`);
        await queryRunner.query(`ALTER TABLE local_government_areas RENAME COLUMN state_id_new TO state_id`);
        await queryRunner.query(`ALTER TABLE local_government_areas ADD CONSTRAINT "PK_local_government_areas" PRIMARY KEY (id)`);
        await queryRunner.query(`ALTER TABLE local_government_areas ALTER COLUMN id SET DEFAULT uuid_generate_v4()`);

        // Wards (if exists and has data)
        if (wardsExist[0].exists) {
            const wardsCount = await queryRunner.query(`SELECT COUNT(*) as count FROM wards`);
            if (parseInt(wardsCount[0].count) > 0) {
                await queryRunner.query(`ALTER TABLE wards DROP CONSTRAINT IF EXISTS "PK_wards"`);
                await queryRunner.query(`ALTER TABLE wards DROP COLUMN id`);
                await queryRunner.query(`ALTER TABLE wards DROP COLUMN lga_id`);
                await queryRunner.query(`ALTER TABLE wards RENAME COLUMN id_new TO id`);
                await queryRunner.query(`ALTER TABLE wards RENAME COLUMN lga_id_new TO lga_id`);
                await queryRunner.query(`ALTER TABLE wards ADD CONSTRAINT "PK_wards" PRIMARY KEY (id)`);
                await queryRunner.query(`ALTER TABLE wards ALTER COLUMN id SET DEFAULT uuid_generate_v4()`);
            }
        }

        // Neighborhoods (if exists and has data)
        if (neighborhoodsExist[0].exists) {
            const neighborhoodsCount = await queryRunner.query(`SELECT COUNT(*) as count FROM neighborhoods`);
            if (parseInt(neighborhoodsCount[0].count) > 0) {
                await queryRunner.query(`ALTER TABLE neighborhoods DROP CONSTRAINT IF EXISTS "PK_neighborhoods"`);
                await queryRunner.query(`ALTER TABLE neighborhoods DROP COLUMN id`);
                await queryRunner.query(`ALTER TABLE neighborhoods DROP COLUMN lga_id`);
                await queryRunner.query(`ALTER TABLE neighborhoods DROP COLUMN IF EXISTS ward_id`);
                await queryRunner.query(`ALTER TABLE neighborhoods DROP COLUMN IF EXISTS parent_neighborhood_id`);
                await queryRunner.query(`ALTER TABLE neighborhoods RENAME COLUMN id_new TO id`);
                await queryRunner.query(`ALTER TABLE neighborhoods RENAME COLUMN lga_id_new TO lga_id`);
                await queryRunner.query(`ALTER TABLE neighborhoods RENAME COLUMN ward_id_new TO ward_id`);
                await queryRunner.query(`ALTER TABLE neighborhoods RENAME COLUMN parent_neighborhood_id_new TO parent_neighborhood_id`);
                await queryRunner.query(`ALTER TABLE neighborhoods ADD CONSTRAINT "PK_neighborhoods" PRIMARY KEY (id)`);
                await queryRunner.query(`ALTER TABLE neighborhoods ALTER COLUMN id SET DEFAULT uuid_generate_v4()`);
            }
        }

        // User Locations (if exists and has data)
        if (userLocationsExist[0].exists) {
            const userLocationsCount = await queryRunner.query(`SELECT COUNT(*) as count FROM user_locations`);
            if (parseInt(userLocationsCount[0].count) > 0) {
                await queryRunner.query(`ALTER TABLE user_locations DROP COLUMN state_id`);
                await queryRunner.query(`ALTER TABLE user_locations DROP COLUMN lga_id`);
                await queryRunner.query(`ALTER TABLE user_locations DROP COLUMN IF EXISTS ward_id`);
                await queryRunner.query(`ALTER TABLE user_locations DROP COLUMN IF EXISTS neighborhood_id`);
                await queryRunner.query(`ALTER TABLE user_locations RENAME COLUMN state_id_new TO state_id`);
                await queryRunner.query(`ALTER TABLE user_locations RENAME COLUMN lga_id_new TO lga_id`);
                await queryRunner.query(`ALTER TABLE user_locations RENAME COLUMN ward_id_new TO ward_id`);
                await queryRunner.query(`ALTER TABLE user_locations RENAME COLUMN neighborhood_id_new TO neighborhood_id`);
            }
        }

        // ============================================
        // STEP 7: Add Foreign Key Constraints
        // ============================================
        this.logger('Step 7: Adding foreign key constraints...');

        // LGAs -> States
        await queryRunner.query(`
            ALTER TABLE local_government_areas
            ADD CONSTRAINT "FK_lgas_state_id"
            FOREIGN KEY (state_id)
            REFERENCES states(id)
            ON DELETE CASCADE
        `);

        // Wards -> LGAs (if exists)
        if (wardsExist[0].exists) {
            const wardsCount = await queryRunner.query(`SELECT COUNT(*) as count FROM wards`);
            if (parseInt(wardsCount[0].count) > 0) {
                await queryRunner.query(`
                    ALTER TABLE wards
                    ADD CONSTRAINT "FK_wards_lga_id"
                    FOREIGN KEY (lga_id)
                    REFERENCES local_government_areas(id)
                    ON DELETE CASCADE
                `);
            }
        }

        // Neighborhoods -> LGAs (if exists)
        if (neighborhoodsExist[0].exists) {
            const neighborhoodsCount = await queryRunner.query(`SELECT COUNT(*) as count FROM neighborhoods`);
            if (parseInt(neighborhoodsCount[0].count) > 0) {
                await queryRunner.query(`
                    ALTER TABLE neighborhoods
                    ADD CONSTRAINT "FK_neighborhoods_lga_id"
                    FOREIGN KEY (lga_id)
                    REFERENCES local_government_areas(id)
                    ON DELETE CASCADE
                `);

                // Neighborhoods -> Wards (if wards exist)
                if (wardsExist[0].exists) {
                    await queryRunner.query(`
                        ALTER TABLE neighborhoods
                        ADD CONSTRAINT "FK_neighborhoods_ward_id"
                        FOREIGN KEY (ward_id)
                        REFERENCES wards(id)
                        ON DELETE SET NULL
                    `);
                }

                // Self-referencing for parent neighborhoods
                await queryRunner.query(`
                    ALTER TABLE neighborhoods
                    ADD CONSTRAINT "FK_neighborhoods_parent_id"
                    FOREIGN KEY (parent_neighborhood_id)
                    REFERENCES neighborhoods(id)
                    ON DELETE SET NULL
                `);
            }
        }

        // User Locations -> States, LGAs, Wards, Neighborhoods
        if (userLocationsExist[0].exists) {
            const userLocationsCount = await queryRunner.query(`SELECT COUNT(*) as count FROM user_locations`);
            if (parseInt(userLocationsCount[0].count) > 0) {
                await queryRunner.query(`
                    ALTER TABLE user_locations
                    ADD CONSTRAINT "FK_user_locations_state_id"
                    FOREIGN KEY (state_id)
                    REFERENCES states(id)
                    ON DELETE CASCADE
                `);

                await queryRunner.query(`
                    ALTER TABLE user_locations
                    ADD CONSTRAINT "FK_user_locations_lga_id"
                    FOREIGN KEY (lga_id)
                    REFERENCES local_government_areas(id)
                    ON DELETE CASCADE
                `);

                if (wardsExist[0].exists) {
                    await queryRunner.query(`
                        ALTER TABLE user_locations
                        ADD CONSTRAINT "FK_user_locations_ward_id"
                        FOREIGN KEY (ward_id)
                        REFERENCES wards(id)
                        ON DELETE SET NULL
                    `);
                }

                if (neighborhoodsExist[0].exists) {
                    await queryRunner.query(`
                        ALTER TABLE user_locations
                        ADD CONSTRAINT "FK_user_locations_neighborhood_id"
                        FOREIGN KEY (neighborhood_id)
                        REFERENCES neighborhoods(id)
                        ON DELETE SET NULL
                    `);
                }
            }
        }

        this.logger('✅ Successfully converted all location tables to use UUIDs!');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        this.logger('⚠️  Rolling back UUID conversion is not supported.');
        this.logger('⚠️  Please restore from a database backup if you need to revert this migration.');
        throw new Error('Rollback of UUID conversion is not supported. Please restore from backup.');
    }

    private logger(message: string): void {
        console.log(`[ConvertLocationIDsToUUID] ${message}`);
    }
}
