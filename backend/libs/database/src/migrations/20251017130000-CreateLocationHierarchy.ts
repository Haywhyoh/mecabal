import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLocationHierarchy20251017130000 implements MigrationInterface {
    name = 'CreateLocationHierarchy20251017130000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable PostGIS extension if not already enabled
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "postgis"`);
        
        // Check if states table exists and update it
        const statesTableExists = await queryRunner.hasTable('states');
        if (statesTableExists) {
            // Update existing states table with new columns
            await queryRunner.query(`ALTER TABLE "states" ADD COLUMN IF NOT EXISTS "country" character varying(100) DEFAULT 'Nigeria'`);
            await queryRunner.query(`ALTER TABLE "states" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP DEFAULT now()`);
        } else {
            // Create states table
            await queryRunner.query(`
                CREATE TABLE "states" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "name" character varying(100) NOT NULL,
                    "code" character varying(10) NOT NULL,
                    "country" character varying(100) NOT NULL DEFAULT 'Nigeria',
                    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                    "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "UQ_states_code" UNIQUE ("code"),
                    CONSTRAINT "PK_states" PRIMARY KEY ("id")
                )
            `);
        }

        // Create index on states
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_states_code" ON "states" ("code")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_states_name" ON "states" ("name")`);

        // Check if LGAs table exists and update it
        const lgasTableExists = await queryRunner.hasTable('local_government_areas');
        if (lgasTableExists) {
            // Update existing LGAs table with new columns
            await queryRunner.query(`ALTER TABLE "local_government_areas" ADD COLUMN IF NOT EXISTS "code" character varying(10)`);
            await queryRunner.query(`ALTER TABLE "local_government_areas" ADD COLUMN IF NOT EXISTS "type" character varying(10) DEFAULT 'LGA'`);
            await queryRunner.query(`ALTER TABLE "local_government_areas" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP DEFAULT now()`);
        } else {
            // Create LGAs table
            await queryRunner.query(`
                CREATE TABLE "local_government_areas" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "name" character varying(100) NOT NULL,
                    "code" character varying(10) NOT NULL,
                    "state_id" uuid NOT NULL,
                    "type" character varying(10) NOT NULL DEFAULT 'LGA',
                    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                    "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_local_government_areas" PRIMARY KEY ("id")
                )
            `);
        }

        // Create indexes on LGAs
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_lgas_state_id" ON "local_government_areas" ("state_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_lgas_type" ON "local_government_areas" ("type")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_lgas_name" ON "local_government_areas" ("name")`);

        // Check if wards table exists before creating
        const wardsTableExists = await queryRunner.hasTable('wards');
        if (!wardsTableExists) {
            // Create wards table
            await queryRunner.query(`
                CREATE TABLE "wards" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "name" character varying(100) NOT NULL,
                    "code" character varying(10) NOT NULL,
                    "lga_id" uuid NOT NULL,
                    "boundaries" geometry(Polygon,4326),
                    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                    "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_wards" PRIMARY KEY ("id")
                )
            `);
        }

        // Create indexes on wards (only if table exists)
        if (wardsTableExists || await queryRunner.hasTable('wards')) {
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_wards_lga_id" ON "wards" ("lga_id")`);
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_wards_name" ON "wards" ("name")`);
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_wards_boundaries_gist" ON "wards" USING gist ("boundaries")`);
        }

        // Check if neighborhoods table exists and update it
        const neighborhoodsTableExists = await queryRunner.hasTable('neighborhoods');
        if (neighborhoodsTableExists) {
            // Update existing neighborhoods table
            await queryRunner.query(`ALTER TABLE "neighborhoods" ADD COLUMN IF NOT EXISTS "type" character varying(20) DEFAULT 'AREA'`);
            await queryRunner.query(`ALTER TABLE "neighborhoods" ADD COLUMN IF NOT EXISTS "ward_id" uuid`);
            await queryRunner.query(`ALTER TABLE "neighborhoods" ADD COLUMN IF NOT EXISTS "parent_neighborhood_id" uuid`);
            await queryRunner.query(`ALTER TABLE "neighborhoods" ADD COLUMN IF NOT EXISTS "boundaries" geometry(Polygon,4326)`);
            await queryRunner.query(`ALTER TABLE "neighborhoods" ADD COLUMN IF NOT EXISTS "is_gated" boolean DEFAULT false`);
            await queryRunner.query(`ALTER TABLE "neighborhoods" ADD COLUMN IF NOT EXISTS "requires_verification" boolean DEFAULT false`);
            await queryRunner.query(`ALTER TABLE "neighborhoods" ADD COLUMN IF NOT EXISTS "admin_user_id" uuid`);
            // Skip ID type conversion for now to avoid complex migration issues
            // await queryRunner.query(`ALTER TABLE "neighborhoods" ALTER COLUMN "id" TYPE uuid USING "id"::uuid`);
            // await queryRunner.query(`ALTER TABLE "neighborhoods" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
            // await queryRunner.query(`ALTER TABLE "neighborhoods" ALTER COLUMN "lga_id" TYPE uuid USING "lga_id"::uuid`);
        } else {
            // Create neighborhoods table
            await queryRunner.query(`
                CREATE TABLE "neighborhoods" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "name" character varying(200) NOT NULL,
                    "type" character varying(20) NOT NULL DEFAULT 'AREA',
                    "lga_id" uuid NOT NULL,
                    "ward_id" uuid,
                    "parent_neighborhood_id" uuid,
                    "boundaries" geometry(Polygon,4326),
                    "is_gated" boolean NOT NULL DEFAULT false,
                    "requires_verification" boolean NOT NULL DEFAULT false,
                    "admin_user_id" uuid,
                    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                    "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_neighborhoods" PRIMARY KEY ("id")
                )
            `);
        }

        // Create indexes on neighborhoods
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_neighborhoods_ward_id" ON "neighborhoods" ("ward_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_neighborhoods_parent_id" ON "neighborhoods" ("parent_neighborhood_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_neighborhoods_type" ON "neighborhoods" ("type")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_neighborhoods_is_gated" ON "neighborhoods" ("is_gated")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_neighborhoods_name" ON "neighborhoods" ("name")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_neighborhoods_boundaries_gist" ON "neighborhoods" USING gist ("boundaries")`);

        // Check if landmarks table exists before creating
        const landmarksTableExists = await queryRunner.hasTable('landmarks');
        if (!landmarksTableExists) {
            // Create landmarks table
            await queryRunner.query(`
                CREATE TABLE "landmarks" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "name" character varying(200) NOT NULL,
                    "type" character varying(20) NOT NULL DEFAULT 'OTHER',
                    "neighborhood_id" uuid NOT NULL,
                    "location" geometry(Point,4326),
                    "address" text,
                    "description" text,
                    "created_by" uuid,
                    "verification_status" character varying(20) NOT NULL DEFAULT 'PENDING',
                    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                    "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_landmarks" PRIMARY KEY ("id")
                )
            `);
        }

        // Create indexes on landmarks (only if table exists)
        if (landmarksTableExists || await queryRunner.hasTable('landmarks')) {
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_landmarks_neighborhood_id" ON "landmarks" ("neighborhood_id")`);
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_landmarks_type" ON "landmarks" ("type")`);
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_landmarks_verification_status" ON "landmarks" ("verification_status")`);
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_landmarks_location_gist" ON "landmarks" USING gist ("location")`);
        }

        // Check if user_locations table exists before creating
        const userLocationsTableExists = await queryRunner.hasTable('user_locations');
        if (!userLocationsTableExists) {
            // Create user_locations table
            await queryRunner.query(`
                CREATE TABLE "user_locations" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "user_id" uuid NOT NULL,
                    "state_id" uuid NOT NULL,
                    "lga_id" uuid NOT NULL,
                    "ward_id" uuid,
                    "neighborhood_id" uuid NOT NULL,
                    "city_town" character varying(100),
                    "address" text,
                    "coordinates" geometry(Point,4326),
                    "is_primary" boolean NOT NULL DEFAULT false,
                    "verification_status" character varying(20) NOT NULL DEFAULT 'UNVERIFIED',
                    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                    "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_user_locations" PRIMARY KEY ("id")
                )
            `);
        }

        // Create indexes on user_locations (only if table exists)
        if (userLocationsTableExists || await queryRunner.hasTable('user_locations')) {
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_user_locations_user_id" ON "user_locations" ("user_id")`);
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_user_locations_state_id" ON "user_locations" ("state_id")`);
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_user_locations_lga_id" ON "user_locations" ("lga_id")`);
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_user_locations_ward_id" ON "user_locations" ("ward_id")`);
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_user_locations_neighborhood_id" ON "user_locations" ("neighborhood_id")`);
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_user_locations_is_primary" ON "user_locations" ("is_primary")`);
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_user_locations_coordinates_gist" ON "user_locations" USING gist ("coordinates")`);

            // Create unique constraint for primary location per user
            await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_user_primary_location" ON "user_locations" ("user_id") WHERE "is_primary" = true`);
        }

        // Skip foreign key constraints for now due to type mismatches
        // These will be added in a separate migration after ID type conversions
        console.log('Note: Foreign key constraints skipped - will be added in a separate migration after ID type conversions');

        // Add check constraints
        await queryRunner.query(`ALTER TABLE "neighborhoods" ADD CONSTRAINT "chk_no_self_reference" CHECK ("id" != "parent_neighborhood_id")`);
        await queryRunner.query(`ALTER TABLE "user_locations" ADD CONSTRAINT "chk_nigeria_bounds" CHECK (
            ST_Y("coordinates") BETWEEN 4.0 AND 14.0 AND
            ST_X("coordinates") BETWEEN 2.5 AND 15.0
        )`);

        // Create full-text search indexes
        await queryRunner.query(`CREATE INDEX "IDX_states_name_fulltext" ON "states" USING gin(to_tsvector('english', "name"))`);
        await queryRunner.query(`CREATE INDEX "IDX_lgas_name_fulltext" ON "local_government_areas" USING gin(to_tsvector('english', "name"))`);
        await queryRunner.query(`CREATE INDEX "IDX_neighborhoods_name_fulltext" ON "neighborhoods" USING gin(to_tsvector('english', "name"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "user_locations" DROP CONSTRAINT "FK_user_locations_neighborhood_id"`);
        await queryRunner.query(`ALTER TABLE "user_locations" DROP CONSTRAINT "FK_user_locations_ward_id"`);
        await queryRunner.query(`ALTER TABLE "user_locations" DROP CONSTRAINT "FK_user_locations_lga_id"`);
        await queryRunner.query(`ALTER TABLE "user_locations" DROP CONSTRAINT "FK_user_locations_state_id"`);
        await queryRunner.query(`ALTER TABLE "user_locations" DROP CONSTRAINT "FK_user_locations_user_id"`);
        await queryRunner.query(`ALTER TABLE "landmarks" DROP CONSTRAINT "FK_landmarks_neighborhood_id"`);
        await queryRunner.query(`ALTER TABLE "neighborhoods" DROP CONSTRAINT "FK_neighborhoods_parent_id"`);
        await queryRunner.query(`ALTER TABLE "neighborhoods" DROP CONSTRAINT "FK_neighborhoods_ward_id"`);
        await queryRunner.query(`ALTER TABLE "wards" DROP CONSTRAINT "FK_wards_lga_id"`);
        await queryRunner.query(`ALTER TABLE "lgas" DROP CONSTRAINT "FK_lgas_state_id"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "user_locations"`);
        await queryRunner.query(`DROP TABLE "landmarks"`);
        await queryRunner.query(`DROP TABLE "neighborhoods"`);
        await queryRunner.query(`DROP TABLE "wards"`);
        await queryRunner.query(`DROP TABLE "local_government_areas"`);
        await queryRunner.query(`DROP TABLE "states"`);
    }
}
