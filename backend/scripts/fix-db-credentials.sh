#!/bin/bash
set -e

echo "=== Fixing Database Credentials ==="
echo "⚠️  WARNING: This script will DELETE ALL DATABASE DATA! ⚠️"
echo "This script removes the PostgreSQL volume, which will delete:"
echo "  - All tables and data"
echo "  - All migrations"
echo "  - All seeded data"
echo ""
read -p "Are you ABSOLUTELY SURE you want to continue? Type 'DELETE' to confirm: " confirm

if [ "$confirm" != "DELETE" ]; then
    echo "Aborted. Database data preserved."
    exit 1
fi

# Stop all services
echo "1. Stopping all services..."
docker-compose -f docker-compose.production.yml down

# Remove only the PostgreSQL volume (preserves Redis, RabbitMQ, MinIO data)
echo "2. Removing PostgreSQL volume to recreate with correct credentials..."
echo "⚠️  DELETING DATABASE VOLUME - ALL DATA WILL BE LOST! ⚠️"
sleep 5  # Give user time to cancel (Ctrl+C)
docker volume rm mecabal_postgres_data 2>/dev/null || \
docker volume rm backend_postgres_data 2>/dev/null || \
echo "Volume already removed or doesn't exist"

# Recreate PostgreSQL with correct credentials from .env.production
echo "3. Starting PostgreSQL with correct credentials..."
docker-compose -f docker-compose.production.yml up -d postgres

# Wait for PostgreSQL to be ready
echo "4. Waiting for PostgreSQL to initialize..."
sleep 10

for i in {1..30}; do
  if docker-compose -f docker-compose.production.yml exec -T postgres pg_isready -U mecabal > /dev/null 2>&1; then
    echo "✓ PostgreSQL is ready with new credentials!"
    break
  fi
  echo "   Waiting... ($i/30)"
  sleep 2
done

# Verify the database was created
echo "5. Verifying database setup..."
docker-compose -f docker-compose.production.yml exec -T postgres psql -U mecabal -d mecabal_prod -c "SELECT version();" || {
  echo "ERROR: Failed to connect to database"
  exit 1
}

echo ""
echo "✓ Database credentials fixed successfully!"
echo "  Username: mecabal"
echo "  Database: mecabal_prod"
echo ""
echo "You can now start all services with:"
echo "  DATABASE_SYNCHRONIZE=true docker-compose -f docker-compose.production.yml up -d"
