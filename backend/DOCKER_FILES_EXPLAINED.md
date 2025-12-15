# Docker Files Explained

## Active Files (USE THESE)

### `Dockerfile`
- **Purpose**: Main production Dockerfile
- **What it does**: Builds all 10 microservices and runs them with PM2
- **When to use**: Always use this for production builds
- **Multi-stage build**:
  1. Stage 1 (base): Node.js 22 Alpine base
  2. Stage 2 (deps): Installs dependencies
  3. Stage 3 (builder): Compiles TypeScript to JavaScript
  4. Stage 4 (runner): Runs all services with PM2

### `docker-compose.production.yml`
- **Purpose**: Production docker-compose configuration
- **What it does**: Defines all services (Redis, MinIO, Nginx, Backend)
- **Uses**: `Dockerfile` to build backend container
- **When to use**: For production deployments

### `ecosystem.config.js`
- **Purpose**: PM2 process manager configuration
- **What it does**: Defines all 10 microservices and their settings
- **Copied into**: Docker container during build
- **Important**: All port configurations and environment variables for services

## Deprecated Files (DON'T USE)

### `Dockerfile.optimized` ❌
- **Status**: DEPRECATED - functionality merged into `Dockerfile`
- **Action**: Can be deleted
- **Reason**: Causes confusion - standard `Dockerfile` now has all optimizations

### `docker-compose.optimized.yml` ❌
- **Status**: DEPRECATED - use `docker-compose.production.yml` instead
- **Action**: Can be deleted
- **Reason**: Duplicate of production compose file

### `docker-compose.yml` ⚠️
- **Status**: Development only
- **Purpose**: Local development with PostgreSQL, Redis, MinIO, RabbitMQ
- **Important**: Does NOT include backend service (backend runs outside Docker locally)
- **When to use**: Only for local development to run dependencies

## File Usage Summary

| File | Status | Purpose |
|------|--------|---------|
| `Dockerfile` | ✅ ACTIVE | Production build with PM2 |
| `docker-compose.production.yml` | ✅ ACTIVE | Production deployment |
| `ecosystem.config.js` | ✅ ACTIVE | PM2 configuration |
| `docker-compose.yml` | ⚠️ DEV ONLY | Local development dependencies |
| `Dockerfile.optimized` | ❌ DEPRECATED | Delete this |
| `docker-compose.optimized.yml` | ❌ DEPRECATED | Delete this |

## Quick Commands Reference

### Production Deployment
```bash
# Deploy with standard files
docker compose -f docker-compose.production.yml build backend
docker compose -f docker-compose.production.yml up -d

# Or use the deployment script
./scripts/deploy.sh
```

### Local Development
```bash
# Start dependencies only (Postgres, Redis, etc.)
docker compose up -d

# Run backend services locally
npm run start:dev api-gateway
# (or use PM2 locally: pm2 start ecosystem.config.js)
```

## Migration Path

If you have old deployments using `Dockerfile.optimized`:

1. The standard `Dockerfile` now has all the same features
2. `docker-compose.production.yml` now uses `Dockerfile`
3. Next deployment will automatically use the correct files
4. No changes needed to your deployment process

## Cleanup (Optional)

Once you verify everything works with the standard files:

```bash
# Remove deprecated files
rm Dockerfile.optimized
rm docker-compose.optimized.yml

# Commit changes
git add -A
git commit -m "Remove deprecated Docker files, use standard Dockerfile"
git push
```

## Why This Change?

**Before**: Multiple Dockerfiles caused confusion about which to use

**After**:
- One production Dockerfile
- One production docker-compose file
- Clear naming convention
- Less confusion for future deployments

## Need Help?

- **Deployment Guide**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Quick Start**: See [QUICK_START.md](./QUICK_START.md)
- **Deployment Script**: Run `./scripts/deploy.sh --help`
