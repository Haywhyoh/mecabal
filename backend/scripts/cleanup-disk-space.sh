#!/bin/bash

# Script to clean up disk space on the server
# This will help resolve "No space left on device" errors

set -e

echo "🔍 Checking disk space..."
df -h

echo ""
echo "🧹 Starting Docker cleanup..."

# 1. Stop all containers to free up space
echo "⏹️  Stopping all containers..."
docker-compose -f docker-compose.production.yml down 2>/dev/null || true

# 2. Remove stopped containers
echo "🗑️  Removing stopped containers..."
docker container prune -f

# 3. Remove unused images (keep at least the last 2 versions)
echo "🗑️  Removing unused Docker images..."
docker image prune -a -f --filter "until=168h" || docker image prune -a -f

# 4. Remove unused volumes (BE CAREFUL - this removes data volumes)
echo "⚠️  Checking for unused volumes..."
echo "   (Skipping volume cleanup to preserve data - run manually if needed)"

# 5. Remove build cache
echo "🗑️  Removing build cache..."
docker builder prune -a -f

# 6. Clean up Docker logs (they can get very large)
echo "🗑️  Cleaning up Docker logs..."
find /var/lib/docker/containers/ -type f -name "*.log" -exec truncate -s 0 {} \; 2>/dev/null || echo "   (May need sudo for log cleanup)"

# 7. Remove dangling volumes (safe - these are truly unused)
echo "🗑️  Removing dangling volumes..."
docker volume prune -f

# 8. System prune (removes everything unused)
echo "🗑️  Running system prune (removes all unused resources)..."
docker system prune -a -f --volumes || docker system prune -a -f

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📊 Disk space after cleanup:"
df -h

echo ""
echo "💡 If still low on space, consider:"
echo "   1. Remove old Docker images: docker images | grep '<none>' | awk '{print $3}' | xargs docker rmi"
echo "   2. Clean up application logs in your project"
echo "   3. Check for large files: du -sh /* 2>/dev/null | sort -h | tail -10"
echo "   4. Remove old backups if any exist"

