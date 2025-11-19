# Database Seeding Guide

## Overview

Your backend has seeding scripts in `package.json`. Here's how to run them in the containerized environment.

## Available Seed Commands

From your `package.json`:

```json
{
  "seed:neighborhoods": "ts-node scripts/seed-neighborhoods.ts",
  "seed:location": "node -r ./scripts/setup-crypto.js -r ts-node/register -r tsconfig-paths/register scripts/seed-location.ts",
  "seed:event-categories": "ts-node seed-event-categories.ts",
  "seed:all": "ts-node scripts/run-seeder.ts",
  "seed:marketplace": "ts-node scripts/run-marketplace-seeder.ts",
  "seed:categories": "ts-node scripts/marketplace-seeder.ts",
  "seed:sample-data": "ts-node scripts/sample-data-seeder.ts"
}
```

## Method 1: Seed from Backend Container (Recommended)

### Seed All Data

```bash
# Run the main seeder (seeds everything)
docker exec mecabal-backend npm run seed:all
```

### Seed Specific Data

```bash
# Seed locations/neighborhoods
docker exec mecabal-backend npm run seed:neighborhoods
docker exec mecabal-backend npm run seed:location

# Seed marketplace data
docker exec mecabal-backend npm run seed:marketplace
docker exec mecabal-backend npm run seed:categories

# Seed event categories
docker exec mecabal-backend npm run seed:event-categories

# Seed sample data
docker exec mecabal-backend npm run seed:sample-data
```

## Method 2: Seed During First Deployment

Add seeding to migration script for first-time setup:

```bash
# Edit migrate-to-optimized.sh
# After "Step 9: Starting all services..."
# Add:

echo -e "${YELLOW}Step 10: Seeding database (first deployment)...${NC}"
docker exec mecabal-backend npm run seed:all || {
  echo -e "${YELLOW}⚠ Seeding failed or already seeded${NC}"
}
echo ""
```

## Method 3: Manual Seeding with SQL

If you have SQL dump files:

```bash
# Import SQL file
cat seed-data.sql | docker exec -i mecabal-postgres psql -U mecabal -d mecabal_prod

# Or with docker-compose
cat seed-data.sql | docker-compose -f docker-compose.production.yml exec -T postgres psql -U mecabal -d mecabal_prod
```

## Method 4: Seed from Host Machine

If you want to run seeders from your local machine:

```bash
cd ~/mecabal/backend

# Install dependencies (if not already)
npm install

# Copy .env.production to .env (for database connection)
cp .env.production .env

# Run seeders
npm run seed:all
```

**Note:** Make sure database ports are exposed (5432:5432 in docker-compose)

## Seeding Best Practices

### 1. Check Before Seeding

Most seeders should check if data already exists:

```typescript
// Example: Check before seeding
const existingData = await repository.find();
if (existingData.length > 0) {
  console.log('Data already seeded, skipping...');
  return;
}
```

### 2. Idempotent Seeders

Make seeders safe to run multiple times:

```typescript
// Use upsert instead of insert
await repository.upsert(data, ['uniqueColumn']);
```

### 3. Seed Order Matters

Seed in dependency order:

```bash
# 1. Reference data first
docker exec mecabal-backend npm run seed:neighborhoods
docker exec mecabal-backend npm run seed:categories

# 2. Then dependent data
docker exec mecabal-backend npm run seed:marketplace
docker exec mecabal-backend npm run seed:sample-data
```

## Automated Seeding on First Deployment

Create a setup script:

```bash
#!/bin/bash
# setup-database.sh

echo "Setting up database..."

# Wait for database to be ready
sleep 10

# Run migrations
docker exec mecabal-backend npm run migration:run

# Check if database is empty
RECORD_COUNT=$(docker exec mecabal-postgres psql -U mecabal -d mecabal_prod -t -c "SELECT COUNT(*) FROM neighborhoods")

if [ "$RECORD_COUNT" -eq 0 ]; then
  echo "Database is empty, running seeders..."
  docker exec mecabal-backend npm run seed:all
else
  echo "Database already has data, skipping seeders"
fi

echo "Database setup complete!"
```

Make it executable and run:

```bash
chmod +x setup-database.sh
./setup-database.sh
```

## Seed Data in Development vs Production

### Development
```bash
# Use sample/test data
docker exec mecabal-backend npm run seed:sample-data
```

### Production
```bash
# Use real data only
docker exec mecabal-backend npm run seed:neighborhoods
docker exec mecabal-backend npm run seed:categories
# Don't use seed:sample-data in production!
```

## Troubleshooting

### Seeder Fails with "Cannot find module"

```bash
# Make sure ts-node and dependencies are installed
docker exec mecabal-backend npm install ts-node tsconfig-paths typescript

# Or rebuild the image
cd ~/mecabal/backend
docker-compose -f docker-compose.production.yml build backend
```

### Database Connection Refused

```bash
# Check database is running
docker-compose -f docker-compose.production.yml ps postgres

# Check database health
docker exec mecabal-postgres pg_isready -U mecabal

# Test connection from backend
docker exec mecabal-backend psql -h postgres -U mecabal -d mecabal_prod -c "SELECT 1"
```

### Seeder Times Out

```bash
# Increase timeout in seeder script
# Or run seeders one by one instead of seed:all
docker exec mecabal-backend npm run seed:neighborhoods
docker exec mecabal-backend npm run seed:location
# etc...
```

## Export Seeded Data

To backup seeded data for future use:

```bash
# Export only data (no schema)
docker exec mecabal-postgres pg_dump -U mecabal -d mecabal_prod --data-only > seed-data.sql

# Export specific tables
docker exec mecabal-postgres pg_dump -U mecabal -d mecabal_prod -t neighborhoods -t categories --data-only > reference-data.sql

# Compress for storage
gzip seed-data.sql
```

## Quick Reference

```bash
# Seed everything
docker exec mecabal-backend npm run seed:all

# Seed specific categories
docker exec mecabal-backend npm run seed:neighborhoods
docker exec mecabal-backend npm run seed:marketplace
docker exec mecabal-backend npm run seed:categories

# Check what's seeded
docker exec mecabal-postgres psql -U mecabal -d mecabal_prod -c "SELECT COUNT(*) FROM neighborhoods"
docker exec mecabal-postgres psql -U mecabal -d mecabal_prod -c "SELECT COUNT(*) FROM categories"

# Clear and re-seed (CAREFUL!)
docker exec mecabal-backend npm run db:reset
docker exec mecabal-backend npm run seed:all
```

## Production Seeding Checklist

- [ ] Database is running and healthy
- [ ] Migrations have been run
- [ ] Backup database before seeding (just in case)
- [ ] Test seeders in staging first
- [ ] Run seeders in correct order
- [ ] Verify data after seeding
- [ ] Create backup after seeding

---

**Next Steps:**
1. Run migrations: `docker exec mecabal-backend npm run migration:run`
2. Seed data: `docker exec mecabal-backend npm run seed:all`
3. Verify: Check database has data
