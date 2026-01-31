# Fix: Git Merge Conflict on Server

## Problem
The deployment script has local modifications on the server that conflict with the updated version in git.

```
error: Your local changes to the following files would be overwritten by merge:
        backend/scripts/deploy.sh
Please commit your changes or stash them before you merge.
```

## Solution

SSH into your server and run these commands:

### Option 1: Keep Server Changes (Recommended)

If the server version is just the old script, replace it with the new one:

```bash
cd ~/mecabal/backend

# Backup the current script
cp scripts/deploy.sh scripts/deploy.sh.backup

# Discard local changes and pull the new version
git checkout -- scripts/deploy.sh

# Pull latest code
git pull origin main

# Verify the script has the docker-compose detection
grep "DOCKER_COMPOSE" scripts/deploy.sh

# You should see lines like:
# if command -v docker-compose &> /dev/null; then
#     DOCKER_COMPOSE="docker-compose"
```

### Option 2: Stash Changes Temporarily

If you want to preserve any local modifications:

```bash
cd ~/mecabal/backend

# Stash local changes
git stash

# Pull latest code
git pull origin main

# View what was stashed (optional)
git stash show -p

# If you need the old version, you can get it from stash:
# git stash pop
```

### Option 3: Commit Local Changes First

If the server has important modifications you want to keep:

```bash
cd ~/mecabal/backend

# See what changed
git diff scripts/deploy.sh

# If changes look important, commit them
git add scripts/deploy.sh
git commit -m "Server-specific deploy script modifications"

# Pull with merge
git pull origin main

# Resolve any conflicts manually
```

## After Fixing Git

Once git pull succeeds, deploy normally:

```bash
cd ~/mecabal/backend

# Make script executable
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh

# Or skip git pull since you just did it
./scripts/deploy.sh --skip-pull
```

## Quick Fix (One-Liner)

If you just want to deploy right now with the new script:

```bash
cd ~/mecabal/backend && \
git checkout -- scripts/deploy.sh && \
git pull origin main && \
chmod +x scripts/deploy.sh && \
./scripts/deploy.sh --skip-pull
```

This will:
1. Discard local changes to deploy.sh
2. Pull the latest code
3. Make script executable
4. Run deployment (skipping git pull since we just did it)

## Preventing This in the Future

To avoid this conflict in future deployments:

1. **Never manually edit files on the server** - Always make changes in git
2. **Use the --skip-pull flag** if you've already updated code manually
3. **Commit all changes before deploying** - Keep server and git in sync

## Understanding the Conflict

The server has an old version of `deploy.sh` that doesn't have:
- Docker-compose V1/V2 auto-detection
- Updated Dockerfile reference
- Improved error handling

The new version from git has all these fixes, which is why you're seeing the conflict.

**Recommendation**: Discard the server changes and use the new version from git (Option 1).
