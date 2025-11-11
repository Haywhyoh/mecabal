-- Manual UUID Conversion Script
-- Run this directly in PostgreSQL to convert integer IDs to UUIDs

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1: Backup current state (in case of issues)
-- You should have already done this via pg_dump

-- Step 2: Drop all data from tables (since no production users yet)
-- This is simpler than converting existing integer IDs
TRUNCATE TABLE user_locations CASCADE;
TRUNCATE TABLE neighborhoods CASCADE;
TRUNCATE TABLE wards CASCADE;
TRUNCATE TABLE local_government_areas CASCADE;
TRUNCATE TABLE states CASCADE;

-- Step 3: Alter tables to use UUID
-- States table
ALTER TABLE states DROP CONSTRAINT IF EXISTS "PK_states";
ALTER TABLE states ALTER COLUMN id DROP DEFAULT;
ALTER TABLE states ALTER COLUMN id TYPE uuid USING uuid_generate_v4();
ALTER TABLE states ALTER COLUMN id SET DEFAULT uuid_generate_v4();
ALTER TABLE states ADD CONSTRAINT "PK_states" PRIMARY KEY (id);

-- Local Government Areas
ALTER TABLE local_government_areas DROP CONSTRAINT IF EXISTS "PK_local_government_areas";
ALTER TABLE local_government_areas ALTER COLUMN id DROP DEFAULT;
ALTER TABLE local_government_areas ALTER COLUMN id TYPE uuid USING uuid_generate_v4();
ALTER TABLE local_government_areas ALTER COLUMN id SET DEFAULT uuid_generate_v4();
ALTER TABLE local_government_areas ALTER COLUMN state_id TYPE uuid USING NULL::uuid;
ALTER TABLE local_government_areas ADD CONSTRAINT "PK_local_government_areas" PRIMARY KEY (id);

-- Wards
ALTER TABLE wards DROP CONSTRAINT IF EXISTS "PK_wards";
ALTER TABLE wards ALTER COLUMN id DROP DEFAULT;
ALTER TABLE wards ALTER COLUMN id TYPE uuid USING uuid_generate_v4();
ALTER TABLE wards ALTER COLUMN id SET DEFAULT uuid_generate_v4();
ALTER TABLE wards ALTER COLUMN lga_id TYPE uuid USING NULL::uuid;
ALTER TABLE wards ADD CONSTRAINT "PK_wards" PRIMARY KEY (id);

-- Neighborhoods
ALTER TABLE neighborhoods DROP CONSTRAINT IF EXISTS "PK_neighborhoods";
ALTER TABLE neighborhoods ALTER COLUMN id DROP DEFAULT;
ALTER TABLE neighborhoods ALTER COLUMN id TYPE uuid USING uuid_generate_v4();
ALTER TABLE neighborhoods ALTER COLUMN id SET DEFAULT uuid_generate_v4();
ALTER TABLE neighborhoods ALTER COLUMN lga_id TYPE uuid USING NULL::uuid;
ALTER TABLE neighborhoods ALTER COLUMN ward_id TYPE uuid USING NULL::uuid;
ALTER TABLE neighborhoods ALTER COLUMN parent_neighborhood_id TYPE uuid USING NULL::uuid;
ALTER TABLE neighborhoods ADD CONSTRAINT "PK_neighborhoods" PRIMARY KEY (id);

-- User Locations
ALTER TABLE user_locations ALTER COLUMN state_id TYPE uuid USING NULL::uuid;
ALTER TABLE user_locations ALTER COLUMN lga_id TYPE uuid USING NULL::uuid;
ALTER TABLE user_locations ALTER COLUMN ward_id TYPE uuid USING NULL::uuid;
ALTER TABLE user_locations ALTER COLUMN neighborhood_id TYPE uuid USING NULL::uuid;

-- Step 4: Add foreign key constraints
ALTER TABLE local_government_areas ADD CONSTRAINT "FK_lgas_state_id"
  FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE;

ALTER TABLE wards ADD CONSTRAINT "FK_wards_lga_id"
  FOREIGN KEY (lga_id) REFERENCES local_government_areas(id) ON DELETE CASCADE;

ALTER TABLE neighborhoods ADD CONSTRAINT "FK_neighborhoods_lga_id"
  FOREIGN KEY (lga_id) REFERENCES local_government_areas(id) ON DELETE CASCADE;

ALTER TABLE neighborhoods ADD CONSTRAINT "FK_neighborhoods_ward_id"
  FOREIGN KEY (ward_id) REFERENCES wards(id) ON DELETE SET NULL;

ALTER TABLE neighborhoods ADD CONSTRAINT "FK_neighborhoods_parent_id"
  FOREIGN KEY (parent_neighborhood_id) REFERENCES neighborhoods(id) ON DELETE SET NULL;

ALTER TABLE user_locations ADD CONSTRAINT "FK_user_locations_state_id"
  FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE;

ALTER TABLE user_locations ADD CONSTRAINT "FK_user_locations_lga_id"
  FOREIGN KEY (lga_id) REFERENCES local_government_areas(id) ON DELETE CASCADE;

ALTER TABLE user_locations ADD CONSTRAINT "FK_user_locations_ward_id"
  FOREIGN KEY (ward_id) REFERENCES wards(id) ON DELETE SET NULL;

ALTER TABLE user_locations ADD CONSTRAINT "FK_user_locations_neighborhood_id"
  FOREIGN KEY (neighborhood_id) REFERENCES neighborhoods(id) ON DELETE SET NULL;

-- Done!
SELECT 'UUID conversion completed!' AS status;
