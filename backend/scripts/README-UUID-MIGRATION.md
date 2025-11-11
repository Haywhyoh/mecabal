# UUID Migration Guide

## Overview
This migration converts location-related tables (States, LGAs, Wards, Neighborhoods, UserLocations) from integer primary keys to UUID primary keys.

## Why UUIDs?
- **Security**: Integer IDs are sequential and predictable
- **Distributed Systems**: UUIDs prevent ID collisions across services
- **Scalability**: Better for data merging and replication
- **Design Alignment**: Matches the original entity design intent

## Prerequisites
- Docker and Docker Compose installed
- Backend services containerized
- PostgreSQL database running in Docker
- **No production users yet** (this is a breaking change for existing data)

## Files Created

### 1. Migration File
- **Path**: `libs/database/src/migrations/20251111120000-ConvertLocationIDsToUUID.ts`
- **Purpose**: Converts all integer IDs to UUIDs while preserving data and relationships
- **Strategy**:
  - Creates temporary mapping tables (old ID → new UUID)
  - Adds new UUID columns to all tables
  - Updates all foreign key references
  - Swaps columns and adds proper constraints

### 2. Migration Scripts
- **Windows**: `scripts/migrate-to-uuid.bat`
- **Linux/Mac**: `scripts/migrate-to-uuid.sh`
- **Purpose**: Automated script to run migration in Docker environment

### 3. Seeder Script
- **Path**: `scripts/seed-location.ts`
- **Purpose**: Reseeds location data after migration
- **Command**: `npm run seed:location`

## How to Run the Migration

### On Windows:
```cmd
cd c:\Users\USER\Documents\Adedayo\mecabal\backend
scripts\migrate-to-uuid.bat
```

### On Linux/Mac:
```bash
cd /path/to/backend
chmod +x scripts/migrate-to-uuid.sh
./scripts/migrate-to-uuid.sh
```

## What the Script Does

1. **Checks PostgreSQL**: Ensures database container is running
2. **Creates Backup**: Saves a timestamped SQL dump to `./backups/`
3. **Builds Application**: Compiles code with new migration
4. **Runs Migration**: Executes UUID conversion
5. **Verifies Migration**: Checks that tables now use UUIDs
6. **Reseeds Data**: Populates location data with new UUIDs
7. **Restarts Services**: Brings all services back online

## Migration Steps (Internal)

The migration performs these operations in order:

1. Enable `uuid-ossp` extension
2. Create temporary ID mapping tables
3. Add new UUID columns (`id_new`, `state_id_new`, etc.)
4. Generate UUIDs for all existing records
5. Update all foreign key references using mapping tables
6. Drop old integer columns
7. Rename new UUID columns to original names
8. Add foreign key constraints
9. Clean up mapping tables

## Tables Affected

- ✅ `states` - ID changed to UUID
- ✅ `local_government_areas` - ID and state_id changed to UUID
- ✅ `wards` - ID and lga_id changed to UUID
- ✅ `neighborhoods` - ID, lga_id, ward_id, parent_neighborhood_id changed to UUID
- ✅ `user_locations` - state_id, lga_id, ward_id, neighborhood_id changed to UUID

## Rollback

If the migration fails or you need to rollback:

```bash
# Find your backup file in ./backups/
docker-compose -f docker-compose.production.yml exec -T postgres \
  psql -U mecabal_prod -d mecabal_db < backups/backup_before_uuid_migration_YYYYMMDD_HHMMSS.sql
```

**⚠️ Warning**: The migration's `down()` method intentionally throws an error to prevent accidental rollback. Always restore from backup instead.

## Verification

After migration, verify the changes:

```sql
-- Check states table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'states' AND column_name = 'id';

-- Should show: id | uuid

-- Check a sample state
SELECT id, name, code FROM states LIMIT 1;

-- Should show UUID like: 550e8400-e29b-41d4-a716-446655440000
```

## Testing After Migration

1. **Test Location API**:
   ```bash
   curl http://localhost:3000/api/locations/states
   ```
   Should return states with UUID `id` fields

2. **Test Registration Flow**:
   - Open web app
   - Try to register a new user
   - Complete location setup
   - Should work without UUID errors

3. **Monitor Logs**:
   ```bash
   docker-compose -f docker-compose.production.yml logs -f
   ```

## Troubleshooting

### Migration Fails
- **Check logs**: The script will show detailed error messages
- **Restore backup**: Use the backup created in step 2
- **Verify database**: Ensure PostgreSQL is running and accessible

### Seeding Fails
- **Manual reseed**: Run `npm run seed:location` again
- **Check data**: Query tables to see if data exists
- **Clear and reseed**: Delete existing data and reseed

### Services Won't Start
- **Check environment**: Verify .env.production has correct values
- **Rebuild images**: Run `docker-compose build --no-cache`
- **Check ports**: Ensure no port conflicts

## Support

If you encounter issues:
1. Check the backup file was created
2. Review migration logs for specific errors
3. Verify Docker containers are healthy
4. Check database connection settings

## Related Files

- Entity Definitions: `libs/database/src/entities/*.entity.ts`
- Original Migration: `libs/database/src/migrations/20251017130000-CreateLocationHierarchy.ts`
- Location Seeder: `libs/database/src/seeds/location.seed.ts`
- Auth Service: `apps/auth-service/src/services/auth.service.ts` (location setup logic)

## Notes

- **One-way migration**: Cannot automatically rollback, must restore from backup
- **Development only**: Should be run before production deployment
- **Foreign keys**: All relationships are preserved and properly constrained
- **Performance**: Migration time depends on data volume (~1-5 minutes for small datasets)
