-- MeCabal Database Initialization Script
-- This script runs automatically when the PostgreSQL container starts for the first time
-- It enables PostGIS extension and sets up the database for geospatial queries

-- Connect to the default database
\c MeCabal_dev;

-- Enable PostGIS extension (provides geometry and geography types)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable PostGIS Topology extension (optional, for advanced topology support)
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Enable PostGIS SFCGAL extension (optional, for 3D operations)
-- Uncomment if you need 3D geometry support
-- CREATE EXTENSION IF NOT EXISTS postgis_sfcgal;

-- Enable pg_trgm for better text search (useful for neighborhood name search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable uuid-ossp for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable btree_gist for exclusion constraints (useful for preventing overlapping date ranges)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Verify PostGIS installation
SELECT PostGIS_Version();

-- Show all installed extensions
SELECT * FROM pg_extension;

-- Grant necessary permissions to the MeCabal user
GRANT ALL PRIVILEGES ON DATABASE MeCabal_dev TO MeCabal_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO MeCabal_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO MeCabal_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO MeCabal_user;

-- Ensure future tables also have permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO MeCabal_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO MeCabal_user;

-- Display success message
DO $$
BEGIN
    RAISE NOTICE 'PostGIS and extensions successfully installed and configured!';
    RAISE NOTICE 'Database: MeCabal_dev';
    RAISE NOTICE 'User: MeCabal_user';
END
$$;
