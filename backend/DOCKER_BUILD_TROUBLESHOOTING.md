# Docker Build Troubleshooting Guide

## Issue: API Gateway Build Failure

The API Gateway service is failing to build in Docker, but builds successfully with NestJS CLI locally.

## Investigation Results

✅ **API Gateway Source Code**: All TypeScript files are valid  
✅ **NestJS Build**: `npx nest build api-gateway` succeeds  
✅ **Build Artifacts**: `dist/apps/api-gateway/main.js` exists  
✅ **Docker Configuration**: docker-compose.yml looks correct  

## Likely Causes & Solutions

### 1. **Docker Context Issues**

The build might be failing due to Docker context or file copying issues.

**Solution A: Clean Docker Build**
```bash
# Remove any cached Docker layers
docker system prune -a -f

# Rebuild without cache
docker-compose -f docker-compose.production.yml build --no-cache api-gateway
```

**Solution B: Check .dockerignore**
Ensure `.dockerignore` doesn't exclude necessary files:
```
# Make sure these are NOT in .dockerignore
!dist/
!apps/
!libs/
!package.json
!package-lock.json
```

### 2. **Multi-stage Build Issue**

The Dockerfile uses multi-stage builds. The issue might be in the build stage.

**Solution: Debug Build Stages**
```bash
# Build only to the builder stage
docker build --target builder -t mecabal-debug .

# Run the builder stage interactively
docker run -it mecabal-debug /bin/sh

# Inside container, check if build succeeded
ls -la dist/apps/api-gateway/
```

### 3. **Node.js Version Compatibility**

The Dockerfile uses Node.js 22-alpine, which might have compatibility issues.

**Solution: Try Node.js 20**
Update Dockerfile:
```dockerfile
# Change from:
FROM node:22-alpine AS base

# To:
FROM node:20-alpine AS base
```

### 4. **Missing Dependencies During Build**

Some dependencies might be missing during the Docker build process.

**Solution: Enhanced Dockerfile**
```dockerfile
# Stage 3: Builder (Enhanced)
FROM base AS builder
COPY package.json package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules

# Copy source files
COPY . .

# Ensure all required files are present
RUN ls -la apps/api-gateway/src/
RUN ls -la nest-cli.json

# Build with verbose output
RUN npm run build --verbose

# Verify build output
RUN ls -la dist/apps/api-gateway/
RUN test -f dist/apps/api-gateway/main.js || (echo "API Gateway build failed" && exit 1)
```

### 5. **TypeScript Configuration Issues**

The tsconfig might have issues in Docker environment.

**Solution: Verify TypeScript Config**
```bash
# In Docker builder stage, check TypeScript compilation
RUN npx tsc --noEmit --project apps/api-gateway/tsconfig.app.json
```

### 6. **Memory Issues During Build**

Docker might be running out of memory during the build process.

**Solution: Increase Docker Memory**
```bash
# Increase Docker memory limit (Docker Desktop)
# Settings > Resources > Memory: Increase to 4GB+

# Or build with memory limit
docker build --memory=4g .
```

## Immediate Workaround

If Docker build continues to fail, you can use the already-built artifacts:

**Option 1: Use Pre-built Artifacts**
```dockerfile
# In Dockerfile, after the build stage fails, copy local build
COPY dist/apps/api-gateway ./dist/apps/api-gateway
```

**Option 2: Build Locally, Copy to Container**
```bash
# Build locally first
npm run build

# Then build Docker with pre-built artifacts
docker-compose -f docker-compose.production.yml build api-gateway
```

## Debugging Commands

Run these commands to debug the build:

```bash
# 1. Check Docker version and info
docker --version
docker info

# 2. Build with verbose output
docker-compose -f docker-compose.production.yml build api-gateway --progress=plain

# 3. Check build logs
docker-compose -f docker-compose.production.yml logs api-gateway

# 4. Run build stage interactively
docker build --target builder -t debug-build .
docker run -it debug-build sh

# Inside container:
ls -la
npm run build
ls -la dist/apps/
```

## Current Status

- ✅ API Gateway TypeScript code is valid
- ✅ Local NestJS build succeeds  
- ✅ Build artifacts are generated correctly
- ❓ Docker build fails (needs Docker environment to debug)

## Recommended Action

1. **Try Solution 3**: Update to Node.js 20-alpine
2. **Try Solution 1**: Clean Docker build with no cache
3. **Try Solution 4**: Enhanced Dockerfile with verification steps

The API Gateway should work fine once the Docker build issue is resolved. The application code itself is correct and functional.