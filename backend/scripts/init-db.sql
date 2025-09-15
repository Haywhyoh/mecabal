-- Initialize MeCabal Database with PostGIS
-- This script runs when the PostgreSQL container starts for the first time

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the main database if it doesn't exist
-- (This is handled by the POSTGRES_DB environment variable)

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE MeCabal_dev TO MeCabal_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO MeCabal_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO MeCabal_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO MeCabal_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO MeCabal_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO MeCabal_user;
