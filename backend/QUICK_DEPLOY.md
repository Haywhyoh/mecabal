# Quick Deploy Reference

## The Easy Way (Recommended)

```bash
cd ~/mecabal/backend
./scripts/deploy.sh
```

That's it! The script handles everything automatically.

## Manual Deployment (If Script Doesn't Work)

```bash
cd ~/mecabal/backend

# 1. Pull latest code
git pull origin main

# 2. Stop container
docker-compose -f docker-compose.production.yml down

# 3. Rebuild
docker-compose -f docker-compose.production.yml build backend

# 4. Start
docker-compose -f docker-compose.production.yml up -d

# 5. Verify
docker exec mecabal-backend npx pm2 list
```

## Quick Checks

```bash
# Check if container is running
docker ps | grep mecabal-backend

# Check PM2 status
docker exec mecabal-backend npx pm2 list

# View logs
docker-compose logs -f backend

# Check specific service
docker exec mecabal-backend npx pm2 logs api-gateway

# Restart specific service
docker exec mecabal-backend npx pm2 restart notification-service
```

## Common Issues

### "unknown shorthand flag: 'f' in -f"
Your server uses `docker-compose` (with hyphen), not `docker compose` (space).
The deploy script handles this automatically.

### "Container not starting"
```bash
# Check logs
docker-compose logs backend --tail 100

# Check PM2 inside container
docker exec mecabal-backend npx pm2 logs --lines 50
```

### "Services keep restarting"
```bash
# Check which service is failing
docker exec mecabal-backend npx pm2 list

# View that service's logs
docker exec mecabal-backend npx pm2 logs [service-name] --lines 100
```

## Port Conflicts Fixed

The notification-service port issue has been fixed:
- ✅ Notification Service: Port 3007
- ✅ API Gateway: Port 3000
- ✅ All services properly configured in `ecosystem.config.js`

## Remember

Every code change requires a rebuild. Git pull alone won't work!

## Need More Help?

- Full guide: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- Docker files explained: [DOCKER_FILES_EXPLAINED.md](./DOCKER_FILES_EXPLAINED.md)
