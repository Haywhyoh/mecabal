# Deployment Guide - How to Deploy Code Changes

## Problem Overview

Your production backend runs inside a Docker container using **multi-stage builds**. This means:

1. Source code is compiled **during the Docker build process** (Stage 3: Builder)
2. Only the compiled `dist` folder is copied to the final container (Stage 4: Runner)
3. Source code changes (like git pull) **will NOT take effect** until you rebuild the Docker image

## Current Architecture

- **Docker Image**: Built from `Dockerfile`
- **Docker Compose**: `docker-compose.production.yml`
- **Container Name**: `mecabal-backend`
- **Process Manager**: PM2 (via `ecosystem.config.js`)
- **All 10 microservices** run inside one container on different ports

## How to Deploy Code Changes

### Option 1: Quick Rebuild (Recommended for Most Changes)

This rebuilds the Docker image and restarts the container with new code:

```bash
# SSH into your server
ssh your-server

# Navigate to backend directory
cd ~/mecabal/backend

# Pull latest code
git pull origin main

# Stop and remove old container
# Use 'docker-compose' (V1) or 'docker compose' (V2) depending on your installation
docker-compose -f docker-compose.production.yml down
# OR
docker compose -f docker-compose.production.yml down

# Rebuild the image (this compiles your TypeScript code)
docker-compose -f docker-compose.production.yml build --no-cache backend
# OR
docker compose -f docker-compose.production.yml build --no-cache backend

# Start the new container
docker-compose -f docker-compose.production.yml up -d
# OR
docker compose -f docker-compose.production.yml up -d

# Verify all services are running
docker exec mecabal-backend npx pm2 list

# Check logs
docker-compose logs -f backend
# OR
docker compose logs -f backend
```

**Note**: The deployment script (`./scripts/deploy.sh`) automatically detects which version you have installed.

### Option 2: Full Clean Rebuild (For Major Changes)

Use this when you've made significant changes or changed dependencies:

```bash
cd ~/mecabal/backend

# Pull latest code
git pull origin main

# Stop everything
docker-compose -f docker-compose.production.yml down

# Remove old images to force fresh build
docker rmi mecabal-backend:latest

# Clean rebuild
docker-compose -f docker-compose.production.yml build --no-cache

# Start services
docker-compose -f docker-compose.production.yml up -d

# Monitor startup
docker-compose logs -f backend
```

### Option 3: Using GitHub Container Registry (For Production CI/CD)

If you want to use a registry-based deployment:

```bash
# On your development machine or CI/CD server
cd mecabal/backend

# Build and tag image
docker build -f Dockerfile -t ghcr.io/haywhyoh/mecabal-backend:latest .

# Push to registry
docker push ghcr.io/haywhyoh/mecabal-backend:latest

# On production server
docker pull ghcr.io/haywhyoh/mecabal-backend:latest

# Update docker-compose.production.yml to use:
# image: ghcr.io/haywhyoh/mecabal-backend:latest
# (Remove the build: section)

# Restart with new image
docker-compose -f docker-compose.production.yml up -d
```

## What NOT to Do

### ❌ Don't: Git pull and expect changes to work
```bash
# This WON'T work - changes won't be picked up!
git pull
docker exec mecabal-backend npx pm2 restart all
```

**Why**: The container is running compiled code from the `dist` folder that was built when the Docker image was created. Source code changes don't affect the running container.

### ❌ Don't: Try to build inside the container
```bash
# This usually fails due to missing dev dependencies
docker exec mecabal-backend npm run build
```

**Why**: The production container only has production dependencies. TypeScript compilation requires dev dependencies.

### ❌ Don't: Use sed to patch compiled code (What we did for the emergency fix)
```bash
# This is a temporary fix only - changes will be lost on rebuild!
docker exec mecabal-backend sed -i 's/old/new/g' /app/dist/...
```

**Why**: These changes are ephemeral and will be lost when you rebuild or restart the container.

## Understanding the Build Process

### What Happens During `docker build`:

1. **Stage 1 (base)**: Sets up Node.js 22 alpine base
2. **Stage 2 (deps)**: Installs all dependencies (including dev dependencies)
3. **Stage 3 (builder)**:
   - Copies all source code
   - **Compiles TypeScript → JavaScript** for all 10 services
   - Creates `dist` folder with compiled code
4. **Stage 4 (runner)**:
   - Copies **only** the `dist` folder (compiled code)
   - Installs **only** production dependencies + PM2
   - Removes source code and dev dependencies
   - Starts PM2 with `ecosystem.config.js`

### Why Your Changes Weren't Working:

The fix we made to `notification-service/src/main.ts` only existed in the source code. The running container still had the old compiled JavaScript from when the image was originally built.

## Deployment Checklist

Before deploying changes:

- [ ] All changes committed to git
- [ ] Code tested locally
- [ ] `ecosystem.config.js` updated if ports/env vars changed
- [ ] `.env.production` updated if new env vars added
- [ ] Database migrations created if schema changed
- [ ] Backup database (if schema changes)

After deploying:

- [ ] All 10 services show "online" status in `pm2 list`
- [ ] No errors in logs: `docker compose logs backend`
- [ ] Health check passes: `curl http://localhost:3000/health`
- [ ] Test critical endpoints
- [ ] Monitor for 5-10 minutes

## Common Issues and Solutions

### Issue: "Cannot find module" errors after rebuild

**Solution**: You might have new dependencies
```bash
# Make sure package.json is committed
git add package.json package-lock.json
git commit -m "Update dependencies"

# Rebuild without cache
docker compose -f docker-compose.production.yml build --no-cache backend
```

### Issue: PM2 services keep restarting

**Solution**: Check the logs
```bash
docker exec mecabal-backend npx pm2 logs --lines 100
```

Common causes:
- Database connection issues (check `DATABASE_HOST` in `.env.production`)
- Missing environment variables (check `ecosystem.config.js`)
- Port conflicts (shouldn't happen inside container)
- Memory limits exceeded (check `docker stats mecabal-backend`)

### Issue: Changes still not appearing after rebuild

**Solution**: Verify the build actually happened
```bash
# Check when the image was created
docker inspect mecabal-backend --format='{{.Created}}'

# Should be recent! If not, rebuild didn't work
docker compose -f docker-compose.production.yml build --no-cache backend
```

## Emergency Rollback

If something breaks after deployment:

```bash
# Stop the new container
docker compose -f docker-compose.production.yml down

# Revert code
git reset --hard HEAD~1  # Or specific commit: git reset --hard abc123

# Rebuild with old code
docker compose -f docker-compose.production.yml build --no-cache backend
docker compose -f docker-compose.production.yml up -d
```

## Files That Affect Production

### Must rebuild container if changed:
- Any `.ts` files (source code)
- `package.json` / `package-lock.json` (dependencies)
- `Dockerfile` (build configuration)
- `libs/**` (shared libraries)

### Can update without rebuild:
- `.env.production` (then restart: `docker compose restart backend`)
- `ecosystem.config.js` (then restart PM2 inside container)

### How to update ecosystem.config.js without rebuild:

```bash
# Copy updated config to running container
docker cp ecosystem.config.js mecabal-backend:/app/ecosystem.config.js

# Restart PM2
docker exec mecabal-backend npx pm2 restart all --update-env
```

**Note**: This only works for PM2 configuration changes, not code changes!

## Summary

**To deploy code changes, you MUST rebuild the Docker image.** There's no way around it with the current architecture.

**Fastest deployment workflow:**
1. `git pull`
2. `docker-compose -f docker-compose.production.yml down`
3. `docker-compose -f docker-compose.production.yml build backend`
4. `docker-compose -f docker-compose.production.yml up -d`
5. Verify services are running

**Or use the automated script:** `./scripts/deploy.sh`

**Expected downtime:** 2-5 minutes (depending on build speed)

## Recommended Improvements

For faster deployments in the future, consider:

1. **Use a registry** (GitHub Container Registry or Docker Hub)
   - Build images in CI/CD pipeline
   - Production just pulls pre-built images
   - Much faster deployment

2. **Implement blue-green deployment**
   - Run two backend containers
   - Deploy to one while other serves traffic
   - Zero downtime deployments

3. **Add automated health checks**
   - Automatically rollback if health checks fail
   - Prevent bad deployments from going live

4. **Set up monitoring**
   - Sentry for error tracking
   - Prometheus + Grafana for metrics
   - Get alerts when things break
