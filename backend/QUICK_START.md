# Quick Start: Fix Your Server NOW

Your server is frozen due to memory exhaustion. Follow these steps **in order**.

## Step 1: Emergency Recovery (5 minutes)

SSH into your server and run:

```bash
cd ~/mecabal/backend

# Stop all containers to free memory immediately
docker stop $(docker ps -aq)

# Restart Docker daemon
sudo systemctl restart docker

# Set timeout
export COMPOSE_HTTP_TIMEOUT=300
echo 'export COMPOSE_HTTP_TIMEOUT=300' >> ~/.bashrc
```

## Step 2: Upload New Files to Server (10 minutes)

Use `scp` or SFTP to upload these files from your local machine to `~/mecabal/backend/`:

```bash
# From your local machine
scp ecosystem.config.js user@server:~/mecabal/backend/
scp Dockerfile.optimized user@server:~/mecabal/backend/
scp docker-compose.optimized.yml user@server:~/mecabal/backend/
scp migrate-to-optimized.sh user@server:~/mecabal/backend/
scp rollback.sh user@server:~/mecabal/backend/
```

## Step 3: Run Migration (15 minutes)

Back on your server:

```bash
cd ~/mecabal/backend

# Make scripts executable
chmod +x migrate-to-optimized.sh rollback.sh

# Run the migration
./migrate-to-optimized.sh
```

**This will:**
- ✅ Backup your database
- ✅ Stop all 17 containers
- ✅ Clean up Docker (free 3GB)
- ✅ Build optimized image
- ✅ Start 5 containers instead of 17
- ✅ Reduce RAM usage from 4.8GB to 2GB

## Step 4: Verify (2 minutes)

```bash
# Check containers (should see only 5)
docker ps

# Check PM2 services (should see 10 running)
docker exec mecabal-backend npx pm2 status

# Check memory (should have 3-4GB free)
free -h

# Test API
curl http://localhost:3000/health
```

## If Something Goes Wrong

```bash
./rollback.sh
```

This restores your old configuration.

## Next Steps

1. Commit and push the new files to GitHub
2. The next deployment will automatically use the optimized architecture
3. Monitor your server memory: `free -h`

---

**Total Time**: ~30 minutes
**Downtime**: ~10 minutes
**Risk**: Low (full rollback available)
