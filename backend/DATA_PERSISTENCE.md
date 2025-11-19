# Data Persistence Strategy - Never Lose Your Data

## Your Concern: "Don't restart databases unnecessarily"

**You're absolutely right!** Databases should **NEVER** be rebuilt or data volumes deleted during normal deployments.

## Current Setup (Already Protected!)

### PostgreSQL Data Volume

In `docker-compose.optimized.yml`:

```yaml
postgres:
  volumes:
    - postgres_data:/var/lib/postgresql/data  # ✅ Persistent volume

volumes:
  postgres_data:
    driver: local  # ✅ Data persists on host
```

**What this means:**
- Database data is stored on the **host machine** (not in container)
- Even if you **delete the container**, data remains
- Only way to lose data: explicitly delete the volume

### Protected in Migration Script

The migration script already has this safeguard:

```bash
# IMPORTANT: DO NOT remove PostgreSQL volume in production
# This preserves all data between deployments
# Only manually remove volume if absolutely necessary for recovery
echo "Preserving PostgreSQL data volume..."
```

## What Happens During Different Operations

### ✅ Safe Operations (Data Preserved)

| Operation | Command | Data Safe? | Explanation |
|-----------|---------|------------|-------------|
| **Restart container** | `docker-compose restart postgres` | ✅ YES | Container restarts, volume untouched |
| **Stop & start** | `docker-compose stop/start postgres` | ✅ YES | Volume remains mounted |
| **Rebuild image** | `docker-compose build postgres` | ✅ YES | Only image rebuilt, volume untouched |
| **Update backend** | `docker-compose up -d backend` | ✅ YES | Backend restarts, DB untouched |
| **Full restart** | `docker-compose down && up -d` | ✅ YES | Volume persists between restarts |
| **Server reboot** | `sudo reboot` | ✅ YES | Volume on disk, survives reboot |

### ⚠️ Risky Operations (Could Lose Data)

| Operation | Command | Data Safe? | Warning |
|-----------|---------|------------|---------|
| **Down with volumes** | `docker-compose down -v` | ❌ NO | **NEVER USE -v flag!** |
| **Remove volume** | `docker volume rm postgres_data` | ❌ NO | Only for recovery |
| **Prune volumes** | `docker volume prune -f` | ❌ NO | Only when safe |

## Deployment Strategy: Smart Updates

### Update Backend Only (DB Untouched)

```bash
cd ~/mecabal/backend

# Pull latest code
git pull origin main

# Rebuild backend image only
docker-compose -f docker-compose.production.yml build backend

# Restart backend only
docker-compose -f docker-compose.production.yml up -d backend

# Database never stops, data never touched ✅
```

### Update Everything (DB Still Safe)

```bash
cd ~/mecabal/backend

# Stop all services
docker-compose -f docker-compose.production.yml down

# ✅ Volume remains on disk

# Start all services
docker-compose -f docker-compose.production.yml up -d

# ✅ Database reconnects to existing volume
# ✅ All your data is still there
```

### Rolling Backend Update (Zero Downtime)

```bash
# 1. Build new backend image
docker build -f Dockerfile.optimized -t mecabal-backend:v2 .

# 2. Create new backend container (DB stays up)
docker run -d --name mecabal-backend-v2 \
  --network mecabal_network \
  -p 3100:3000 \
  mecabal-backend:v2

# 3. Test new version
curl http://localhost:3100/health

# 4. Update nginx to point to new version
# Edit nginx.conf to use mecabal-backend-v2

# 5. Reload nginx (no downtime)
docker exec mecabal-nginx nginx -s reload

# 6. Stop old backend
docker stop mecabal-backend

# Database never stopped during entire process ✅
```

## When Should You Restart Database?

### ✅ Restart Database If:

1. **Configuration change** (memory settings, max connections, etc.)
2. **Database becomes unresponsive** (hung connections)
3. **Upgrading PostgreSQL version** (with proper migration)
4. **After restoring from backup**

```bash
# Safe database restart
docker-compose -f docker-compose.production.yml restart postgres

# Or
docker restart mecabal-postgres
```

### ❌ DON'T Restart Database For:

1. ❌ Backend code updates
2. ❌ New migrations (migrations run without restart)
3. ❌ Backend container restart
4. ❌ Nginx configuration changes
5. ❌ Web app updates
6. ❌ Regular deployments

## Migration Strategy (Safe for Data)

Migrations **add to** the database, they don't replace it:

```bash
# Run migrations (database keeps running)
docker exec mecabal-backend npm run migration:run

# Migrations create/alter tables, but data remains ✅
```

**What migrations do:**
- ✅ Create new tables
- ✅ Add new columns
- ✅ Create indexes
- ✅ **Preserve existing data**

**What migrations DON'T do:**
- ❌ Delete existing data
- ❌ Drop tables (unless explicitly written)
- ❌ Require database restart

## Backup Strategy

### Automated Backups (Recommended)

```bash
# Create backup script
cat > ~/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/mecabal_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

# Backup database
docker exec mecabal-postgres pg_dump -U mecabal mecabal_prod > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Keep only last 30 days
find $BACKUP_DIR -name "mecabal_*.sql.gz" -mtime +30 -delete

echo "Backup saved: ${BACKUP_FILE}.gz"
EOF

chmod +x ~/backup-db.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * ~/backup-db.sh") | crontab -
```

### Manual Backup Before Risky Operations

```bash
# Before major update
BACKUP_FILE="backup_before_update_$(date +%Y%m%d_%H%M%S).sql"
docker exec mecabal-postgres pg_dump -U mecabal mecabal_prod > $BACKUP_FILE

# Compress and store safely
gzip $BACKUP_FILE
mv ${BACKUP_FILE}.gz /safe/location/
```

### Restore from Backup

```bash
# Stop backend (optional, safer)
docker-compose -f docker-compose.production.yml stop backend

# Restore database
gunzip -c backup_file.sql.gz | docker exec -i mecabal-postgres psql -U mecabal -d mecabal_prod

# Start backend
docker-compose -f docker-compose.production.yml start backend
```

## Volume Management

### Check Volume Usage

```bash
# List volumes
docker volume ls

# Inspect postgres volume
docker volume inspect postgres_data

# Check size
docker system df -v | grep postgres_data
```

### Backup Volume (Filesystem Level)

```bash
# Stop database
docker-compose -f docker-compose.production.yml stop postgres

# Find volume location
VOLUME_PATH=$(docker volume inspect postgres_data --format '{{.Mountpoint}}')

# Backup entire volume
sudo tar -czf postgres_volume_backup.tar.gz $VOLUME_PATH

# Start database
docker-compose -f docker-compose.production.yml start postgres
```

### Restore Volume

```bash
# Stop database
docker-compose -f docker-compose.production.yml stop postgres

# Remove old volume (CAREFUL!)
docker volume rm postgres_data

# Recreate volume
docker volume create postgres_data

# Restore data
VOLUME_PATH=$(docker volume inspect postgres_data --format '{{.Mountpoint}}')
sudo tar -xzf postgres_volume_backup.tar.gz -C /

# Start database
docker-compose -f docker-compose.production.yml start postgres
```

## Monitoring Data Health

### Daily Health Checks

```bash
# Check database is running
docker-compose -f docker-compose.production.yml ps postgres

# Check database size
docker exec mecabal-postgres psql -U mecabal -d mecabal_prod -c "\l+"

# Check table sizes
docker exec mecabal-postgres psql -U mecabal -d mecabal_prod -c "
  SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
  LIMIT 10;
"

# Check connections
docker exec mecabal-postgres psql -U mecabal -d mecabal_prod -c "
  SELECT count(*) as active_connections
  FROM pg_stat_activity
  WHERE state = 'active';
"
```

## Summary: Data Protection Checklist

### ✅ Protected (Already Done)

- ✅ Database uses named volume (postgres_data)
- ✅ Volume persists on host filesystem
- ✅ Migration script preserves volume
- ✅ docker-compose down doesn't use -v flag
- ✅ Database only restarted when necessary

### ✅ Best Practices (Recommended)

- ✅ Set up automated backups (cron job)
- ✅ Test backup/restore process
- ✅ Monitor database health
- ✅ Document recovery procedures
- ✅ Keep backups in safe location
- ✅ Update backend without touching database

### ❌ Never Do These

- ❌ `docker-compose down -v` (removes volumes)
- ❌ `docker volume rm postgres_data` (deletes data)
- ❌ `docker volume prune` when postgres running
- ❌ Restart database for backend updates
- ❌ Delete volumes without backup

## Quick Reference

```bash
# Safe backend update (DB untouched)
docker-compose -f docker-compose.production.yml up -d backend --build

# Safe full restart (data preserved)
docker-compose -f docker-compose.production.yml restart

# Backup database
docker exec mecabal-postgres pg_dump -U mecabal mecabal_prod > backup.sql

# Check data is safe
docker volume inspect postgres_data

# Restart only database (if needed)
docker restart mecabal-postgres
```

---

**Bottom Line:** Your data is **already protected**! Database volumes persist through all normal operations. Only explicit volume deletion can lose data, and we've made sure that never happens accidentally. ✅
