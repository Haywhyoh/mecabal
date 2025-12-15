# Quick Fix Guide - Estate Search Production Error

## Problem
Backend container failed to start due to port 3000 conflict. Estate search endpoint shows "Method not implemented yet" error.

## ⚠️ IMPORTANT: Check Docker Image First!

The container on port 3000 might have OLD code. Always verify first!

## Recommended: All-in-One Fix

```bash
# Navigate to backend directory
cd /path/to/mecabal/backend

# Run the comprehensive check and fix script
chmod +x scripts/quick-check-and-fix.sh
./scripts/quick-check-and-fix.sh
```

This script will:
1. ✅ Check if current container has old or new code
2. ✅ If old code: Stop container, pull new image, start fresh
3. ✅ If new code: Just restart to fix port conflict
4. ✅ Verify everything works

## Step-by-Step Alternative

### Step 1: Check Current Container Code

```bash
# Quick check: Does the running container have old code?
docker exec mecabal-backend grep -q "Method not implemented yet" /app/dist/apps/auth-service/main.js && \
  echo "❌ HAS OLD CODE - Need to rebuild image" || \
  echo "✅ HAS NEW CODE - Just need to restart"
```

### Step 2A: If Container Has OLD Code

```bash
# Stop and remove old container
docker stop mecabal-backend
docker rm mecabal-backend

# Pull latest image (if it was rebuilt)
docker-compose -f docker-compose.production.yml pull backend

# Verify new image has new code (should return nothing)
docker run --rm --entrypoint sh $(docker-compose -f docker-compose.production.yml config | grep -A 5 "backend:" | grep "image:" | awk '{print $2}') \
  -c "grep -q 'Method not implemented yet' /app/dist/apps/auth-service/main.js && echo 'OLD CODE' || echo 'NEW CODE'"

# If still old code, you need to rebuild the image first (see below)

# Start new container
docker-compose -f docker-compose.production.yml up -d backend
```

### Step 2B: If Container Has NEW Code

```bash
# Just restart to fix port conflict
docker stop mecabal-backend
docker start mecabal-backend

# OR use docker-compose
docker-compose -f docker-compose.production.yml restart backend
```

### Step 3: Verify Estate Search Works

```bash
chmod +x scripts/verify-estate-search.sh
./scripts/verify-estate-search.sh
```

## If Docker Image Needs Rebuilding

If the image in the registry has old code, rebuild it:

**On Build Server:**
```bash
cd /path/to/mecabal/backend
chmod +x scripts/rebuild-and-push-image.sh
./scripts/rebuild-and-push-image.sh
```

**Then on Production:**
```bash
docker-compose -f docker-compose.production.yml pull backend
docker-compose -f docker-compose.production.yml up -d backend
```

## Manual Alternative

If scripts don't work, run these commands manually:

```bash
# Find what's using port 3000
sudo lsof -i :3000
# OR
sudo netstat -tulpn | grep :3000

# Kill the process (replace <PID> with actual process ID)
sudo kill -9 <PID>

# Restart containers
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d

# Wait for services to start
sleep 30

# Check status
docker-compose -f docker-compose.production.yml ps

# Test endpoint
curl "http://localhost:3001/auth/location/estates?query=test&limit=10"

# Check logs
docker logs mecabal-backend --tail 100 | grep -i "method not implemented"
```

## Expected Result

- All services (ports 3000-3009) should be healthy
- No "Method not implemented" errors in logs
- Estate search endpoint should return 200 with estate data

