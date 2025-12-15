# Estate Search Production Fix - Deployment Instructions

## Problem Summary

The estate search endpoint (`/auth/location/estates`) was throwing "Method not implemented yet" errors in production. The latest code has been deployed (commit `59d5c66`), but the backend container failed to start due to a port conflict on port 3000.

## Current Status

- ✅ Latest code deployed (commit: `59d5c66d89cfbe8c849c5dac88ffbeddcd1dd2b1`)
- ✅ Docker images pulled successfully
- ❌ Backend container failed to start (port 3000 conflict)
- ❌ Services on ports 3000, 3001, 3003, 3005, 3007, 3008, 3009 not responding
- ✅ Services on ports 3002, 3004, 3006 are healthy (partial startup)

## Implementation Verification

The estate search implementation is **correctly implemented** in the source code:

1. **Controller** (`apps/auth-service/src/auth/auth.controller.ts` lines 993-1050):
   - ✅ Properly validates query parameters (query, stateId, lgaId, limit)
   - ✅ Validates UUID formats for stateId and lgaId
   - ✅ Validates limit is between 1 and 100
   - ✅ Calls `authService.searchEstates()` with proper error handling
   - ✅ Returns estates array directly (NestJS will serialize it)

2. **Service** (`apps/auth-service/src/services/auth.service.ts` lines 1737-1801):
   - ✅ Uses TypeORM QueryBuilder to search neighborhoods
   - ✅ Filters by `type = ESTATE` and `isGated = true`
   - ✅ Supports query string search, stateId, lgaId filtering
   - ✅ Proper error handling and logging

3. **Frontend Compatibility**:
   - ✅ Frontend API client handles both array and object responses
   - ✅ Response format is compatible (direct array return)

## Critical Issue: Docker Image May Contain Old Code

**IMPORTANT:** The deployment log showed:
```
Some service image(s) must be built from source by running:
    docker-compose build backend
```

This indicates the Docker image in the registry may not contain the latest code with the `searchEstates` implementation.

### Step 0: Verify Docker Image Contains New Code

**FIRST, verify if the current Docker image has the new code:**

```bash
cd /path/to/mecabal/backend
chmod +x scripts/verify-docker-image-code.sh
./scripts/verify-docker-image-code.sh
```

This script will:
- Check if the compiled code in the Docker image contains "Method not implemented yet"
- Verify if `searchEstates` method exists in the compiled code
- Tell you if the image needs to be rebuilt

**If the image contains old code, you MUST rebuild it before fixing the port conflict.**

### Step 0.5: Rebuild Docker Image (If Needed)

If the verification shows the image contains old code:

**On Build Server (GitHub Actions or CI/CD):**
```bash
cd /path/to/mecabal/backend
chmod +x scripts/rebuild-and-push-image.sh
./scripts/rebuild-and-push-image.sh
```

**Or manually:**
```bash
# Build the image
docker build -f Dockerfile.optimized -t ghcr.io/haywhyoh/mecabal-backend:latest .

# Verify it contains new code (check for "Method not implemented")
docker run --rm ghcr.io/haywhyoh/mecabal-backend:latest \
  grep -q "Method not implemented yet" /app/dist/apps/auth-service/main.js && \
  echo "❌ Image still has old code!" || echo "✅ Image has new code"

# Push to registry
docker push ghcr.io/haywhyoh/mecabal-backend:latest
```

**Then on Production Server:**
```bash
# Pull the new image
docker-compose -f docker-compose.production.yml pull backend

# Verify the new image
./scripts/verify-docker-image-code.sh
```

## Fix Steps

### Step 1: Fix Port Conflict

Run the port conflict fix script on the production server:

```bash
cd /path/to/mecabal/backend
chmod +x scripts/fix-port-conflict.sh
./scripts/fix-port-conflict.sh
```

Or manually:

```bash
# Identify what's using port 3000
sudo lsof -i :3000
# OR
sudo netstat -tulpn | grep :3000

# Check for duplicate containers
docker ps -a | grep mecabal

# Kill the process or remove stale containers
# (Follow prompts from the script or manually kill the process)
```

### Step 2: Restart Backend Container

After fixing the port conflict, restart the backend:

```bash
cd /path/to/mecabal/backend
chmod +x scripts/restart-backend.sh
./scripts/restart-backend.sh
```

Or manually:

```bash
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d
```

### Step 3: Verify Services Are Healthy

Check that all services are running:

```bash
docker-compose -f docker-compose.production.yml ps

# Check backend logs
docker logs mecabal-backend --tail 100

# Verify no "Method not implemented" errors
docker logs mecabal-backend 2>&1 | grep -i "method not implemented"
```

### Step 4: Test Estate Search Endpoint

Run the verification script:

```bash
cd /path/to/mecabal/backend
chmod +x scripts/verify-estate-search.sh
./scripts/verify-estate-search.sh
```

Or manually test:

```bash
# Test basic search
curl "http://localhost:3001/auth/location/estates?query=test&limit=10"

# Test with stateId (if you have a valid UUID)
curl "http://localhost:3001/auth/location/estates?stateId=<uuid>&limit=10"

# Test invalid limit (should return 400)
curl "http://localhost:3001/auth/location/estates?limit=200"
```

### Step 5: Monitor Logs

Monitor the backend logs to ensure no errors:

```bash
docker logs mecabal-backend -f
```

Look for:
- ✅ No "Method not implemented" errors
- ✅ Successful estate search requests
- ✅ Proper error handling for invalid requests

## Expected Response Format

The endpoint returns a JSON array of estate objects:

```json
[
  {
    "id": "uuid",
    "name": "Estate Name",
    "type": "ESTATE",
    "isGated": true,
    "lga": { ... },
    "state": { ... },
    ...
  }
]
```

The frontend API client automatically wraps this in:
```json
{
  "success": true,
  "data": [ ... ]
}
```

## Troubleshooting

### If port conflict persists:

1. Check for zombie processes:
   ```bash
   ps aux | grep node
   ps aux | grep pm2
   ```

2. Check for other Docker containers:
   ```bash
   docker ps -a
   ```

3. Check system services:
   ```bash
   sudo systemctl list-units | grep -i docker
   ```

### If "Method not implemented" error still appears:

1. Verify the code was properly compiled:
   ```bash
   docker exec mecabal-backend ls -la /app/dist/apps/auth-service/
   ```

2. Check if the container is using the latest image:
   ```bash
   docker images | grep mecabal-backend
   ```

3. Rebuild the container if needed:
   ```bash
   docker-compose -f docker-compose.production.yml build backend
   docker-compose -f docker-compose.production.yml up -d backend
   ```

### If services don't start:

1. Check container logs:
   ```bash
   docker logs mecabal-backend --tail 200
   ```

2. Check resource usage:
   ```bash
   docker stats mecabal-backend
   ```

3. Verify environment variables:
   ```bash
   docker exec mecabal-backend env | grep -E "DATABASE|REDIS"
   ```

## Success Criteria

✅ All services (ports 3000-3009) are healthy and responding  
✅ No "Method not implemented" errors in logs  
✅ Estate search endpoint returns 200 status with estate data  
✅ Invalid requests (e.g., limit > 100) return 400 status  
✅ Frontend can successfully search for estates  

## Files Modified/Created

- `scripts/fix-port-conflict.sh` - Script to identify and fix port conflicts
- `scripts/restart-backend.sh` - Script to restart backend container
- `scripts/verify-estate-search.sh` - Script to test estate search endpoint
- `DEPLOYMENT_FIX_INSTRUCTIONS.md` - This file

## Notes

- The source code implementation is correct and doesn't need changes
- The issue is purely a deployment/infrastructure problem (port conflict)
- Once the backend container starts successfully, the estate search should work
- The frontend is already correctly configured to call this endpoint

