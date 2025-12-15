# Quick Fix Guide - Estate Search Production Error

## Problem
Backend container failed to start due to port 3000 conflict. Estate search endpoint shows "Method not implemented yet" error.

## Quick Fix (Run on Production Server)

```bash
# 1. Navigate to backend directory
cd /path/to/mecabal/backend

# 2. Fix port conflict
chmod +x scripts/fix-port-conflict.sh
./scripts/fix-port-conflict.sh

# 3. Restart backend
chmod +x scripts/restart-backend.sh
./scripts/restart-backend.sh

# 4. Verify estate search works
chmod +x scripts/verify-estate-search.sh
./scripts/verify-estate-search.sh
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

