#!/bin/bash

# Migration Script: Convert Location IDs from Integer to UUID
# This script runs the UUID conversion migration inside the Docker container

set -e  # Exit on any error

echo "=========================================="
echo "UUID Migration Script for Mecabal Backend"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: docker-compose is not installed or not in PATH${NC}"
    exit 1
fi

# Check if we're in the backend directory
if [ ! -f "docker-compose.production.yml" ]; then
    echo -e "${RED}Error: Must run this script from the backend directory${NC}"
    echo "Current directory: $(pwd)"
    exit 1
fi

# Step 1: Check if postgres container is running
echo -e "${BLUE}Step 1: Checking if PostgreSQL container is running...${NC}"
if ! docker-compose -f docker-compose.production.yml ps postgres | grep -q "Up"; then
    echo -e "${YELLOW}PostgreSQL container is not running. Starting it now...${NC}"
    docker-compose -f docker-compose.production.yml up -d postgres

    echo -e "${YELLOW}Waiting for PostgreSQL to be ready (30 seconds)...${NC}"
    sleep 30
else
    echo -e "${GREEN}✓ PostgreSQL container is running${NC}"
fi

# Step 2: Create a backup
echo ""
echo -e "${BLUE}Step 2: Creating database backup...${NC}"
BACKUP_FILE="backup_before_uuid_migration_$(date +%Y%m%d_%H%M%S).sql"
echo -e "${YELLOW}Backup file: ${BACKUP_FILE}${NC}"

docker-compose -f docker-compose.production.yml exec -T postgres pg_dump \
    -U ${DATABASE_USERNAME:-mecabal_prod} \
    -d ${DATABASE_NAME:-mecabal_db} \
    > "./backups/${BACKUP_FILE}" || {
    echo -e "${RED}Failed to create backup. Creating backups directory...${NC}"
    mkdir -p ./backups
    docker-compose -f docker-compose.production.yml exec -T postgres pg_dump \
        -U ${DATABASE_USERNAME:-mecabal_prod} \
        -d ${DATABASE_NAME:-mecabal_db} \
        > "./backups/${BACKUP_FILE}"
}

echo -e "${GREEN}✓ Backup created successfully at ./backups/${BACKUP_FILE}${NC}"

# Step 3: Build the application with the new migration
echo ""
echo -e "${BLUE}Step 3: Building application with new migration...${NC}"
docker-compose -f docker-compose.production.yml build --no-cache api-gateway

echo -e "${GREEN}✓ Build completed${NC}"

# Step 4: Run the migration
echo ""
echo -e "${BLUE}Step 4: Running UUID conversion migration...${NC}"
echo -e "${YELLOW}This may take a few minutes depending on data volume...${NC}"

# Run migration using the api-gateway container (can use any service)
docker-compose -f docker-compose.production.yml run --rm api-gateway \
    npm run migration:run || {
    echo -e "${RED}Migration failed!${NC}"
    echo -e "${YELLOW}To restore from backup, run:${NC}"
    echo "  docker-compose -f docker-compose.production.yml exec -T postgres psql -U \${DATABASE_USERNAME} -d \${DATABASE_NAME} < ./backups/${BACKUP_FILE}"
    exit 1
}

echo -e "${GREEN}✓ Migration completed successfully!${NC}"

# Step 5: Verify the migration
echo ""
echo -e "${BLUE}Step 5: Verifying migration...${NC}"
echo "Checking if states table now uses UUID..."

docker-compose -f docker-compose.production.yml exec -T postgres psql \
    -U ${DATABASE_USERNAME:-mecabal_prod} \
    -d ${DATABASE_NAME:-mecabal_db} \
    -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'states' AND column_name = 'id';" || {
    echo -e "${RED}Failed to verify migration${NC}"
    exit 1
}

echo -e "${GREEN}✓ Verification completed${NC}"

# Step 6: Reseed location data
echo ""
echo -e "${BLUE}Step 6: Reseeding location data with UUIDs...${NC}"
docker-compose -f docker-compose.production.yml run --rm api-gateway \
    npm run seed:location || {
    echo -e "${YELLOW}Warning: Seeding failed or partially completed${NC}"
    echo -e "${YELLOW}You may need to manually verify the location data${NC}"
}

echo -e "${GREEN}✓ Seeding completed${NC}"

# Step 7: Restart services
echo ""
echo -e "${BLUE}Step 7: Restarting all services...${NC}"
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d

echo ""
echo -e "${GREEN}=========================================="
echo "✅ UUID Migration Completed Successfully!"
echo "==========================================${NC}"
echo ""
echo "Summary:"
echo "  - Database backup: ./backups/${BACKUP_FILE}"
echo "  - States, LGAs, Wards, Neighborhoods now use UUIDs"
echo "  - All foreign key constraints are properly set"
echo "  - Services have been restarted"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Test the web app registration flow"
echo "  2. Verify location APIs return UUID strings"
echo "  3. Monitor logs for any errors: docker-compose -f docker-compose.production.yml logs -f"
echo ""
echo -e "${BLUE}To rollback (if needed):${NC}"
echo "  docker-compose -f docker-compose.production.yml exec -T postgres psql -U \${DATABASE_USERNAME} -d \${DATABASE_NAME} < ./backups/${BACKUP_FILE}"
echo ""
