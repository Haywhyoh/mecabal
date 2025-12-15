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

The pull message "Some service image(s) must be built from source" means the registry image is outdated.

### Option 1: Rebuild on Build Server/CI (Recommended)

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

### Option 2: Build Directly on Production (TEMPORARY FIX ONLY)

**⚠️ IMPORTANT:** If you see "❌ OLD CODE" after building, the source code on the server is outdated!

Use this comprehensive script that ensures latest code:

```bash
cd ~/mecabal/backend
chmod +x scripts/build-and-verify-on-production.sh
./scripts/build-and-verify-on-production.sh
```

This script will:
1. ✅ Pull latest code from git
2. ✅ Verify source code has searchEstates implementation
3. ✅ Build image with --no-cache
4. ✅ Verify built image has new code
5. ✅ Start container and verify it's running correctly

**OR manually:**

⚠️ **This is a temporary workaround. You should set up GitHub Actions to build automatically.**

If CI isn't set up yet, build directly on production:

```bash
cd /path/to/mecabal/backend

# Fix any container conflicts first
chmod +x scripts/fix-container-conflict.sh
./scripts/fix-container-conflict.sh

# Build the image from current code
docker-compose -f docker-compose.production.yml build backend

# Start the container
docker-compose -f docker-compose.production.yml up -d backend

# Verify it has new code
docker exec mecabal-backend grep -q "Method not implemented yet" /app/dist/apps/auth-service/main.js && \
  echo "❌ Still has old code" || \
  echo "✅ Has new code!"
```

**⚠️ Important:** After fixing this, set up GitHub Actions workflow (see `PROPER_BUILD_WORKFLOW.md`) so future builds happen automatically on CI, not on production.

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

