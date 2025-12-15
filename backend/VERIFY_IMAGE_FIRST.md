# ⚠️ CRITICAL: Verify Docker Image Before Fixing Port Conflict

## The Real Problem

The deployment log showed:
```
Some service image(s) must be built from source by running:
    docker-compose build backend
```

**This means the Docker image in the registry likely contains OLD code without the `searchEstates` implementation.**

## Why This Matters

Even if you fix the port conflict and restart the container, the service will still throw "Method not implemented yet" errors because the **compiled JavaScript in the Docker image** contains the old code.

## What You Must Do First

### 1. Verify the Current Image

Run this on the production server:

```bash
cd /path/to/mecabal/backend
chmod +x scripts/verify-docker-image-code.sh
./scripts/verify-docker-image-code.sh
```

This will tell you:
- ✅ If the image has new code → Fix port conflict and restart
- ❌ If the image has old code → **REBUILD THE IMAGE FIRST**

### 2. If Image Has Old Code: Rebuild It

**Option A: On GitHub Actions / CI/CD**

The image should be rebuilt automatically when code is pushed. Check:
- GitHub Actions workflow runs
- Docker image is built from latest commit
- Image is pushed to `ghcr.io/haywhyoh/mecabal-backend:latest`

**Option B: Manual Rebuild**

On the build server:

```bash
cd /path/to/mecabal/backend

# Verify you're on the right commit
git log -1 --oneline
# Should show commit with searchEstates implementation

# Build the image
docker build -f Dockerfile.optimized -t ghcr.io/haywhyoh/mecabal-backend:latest .

# Verify the built image (should NOT find "Method not implemented")
docker run --rm ghcr.io/haywhyoh/mecabal-backend:latest \
  sh -c "grep -q 'Method not implemented yet' /app/dist/apps/auth-service/main.js && echo '❌ OLD CODE' || echo '✅ NEW CODE'"

# Push to registry
docker push ghcr.io/haywhyoh/mecabal-backend:latest
```

**Option C: Use the Rebuild Script**

```bash
chmod +x scripts/rebuild-and-push-image.sh
./scripts/rebuild-and-push-image.sh
```

### 3. Pull and Verify on Production

After rebuilding and pushing:

```bash
# Pull the new image
docker-compose -f docker-compose.production.yml pull backend

# Verify it has new code
./scripts/verify-docker-image-code.sh

# Now fix port conflict and restart
./scripts/fix-port-conflict.sh
./scripts/restart-backend.sh
```

## How to Check Image Build Date

```bash
# Check when the image was built
docker inspect ghcr.io/haywhyoh/mecabal-backend:latest | grep -i created

# Check image layers
docker history ghcr.io/haywhyoh/mecabal-backend:latest

# Compare with your latest commit date
git log -1 --format="%ai %H"
```

If the image is older than your latest commit with `searchEstates`, it needs to be rebuilt.

## Summary

1. **ALWAYS verify the Docker image first** - Don't assume it has new code
2. **If image has old code** - Rebuild and push before doing anything else
3. **Then** fix port conflict and restart
4. **Finally** test the endpoint

The port conflict is a symptom, but the root cause might be that the Docker image itself contains old code.

