#!/bin/bash
set -e

# This script runs automatically when PostgreSQL container starts for the first time
# It creates the database if it doesn't exist

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    -- Create database if it doesn't exist
    SELECT 'CREATE DATABASE ${POSTGRES_DB}'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${POSTGRES_DB}')\gexec

    -- Connect to the database and enable PostGIS
    \c ${POSTGRES_DB}

    CREATE EXTENSION IF NOT EXISTS postgis;
    CREATE EXTENSION IF NOT EXISTS postgis_topology;

    -- Log success
    SELECT 'Database ${POSTGRES_DB} initialized successfully with PostGIS extensions';
EOSQL
