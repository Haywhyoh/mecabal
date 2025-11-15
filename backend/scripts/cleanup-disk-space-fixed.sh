#!/bin/bash

# Fixed cleanup script with correct Docker commands

set -e

echo "🔍 Checking disk space before cleanup..."
df -h / | tail -1

echo ""
echo "🧹 Starting cleanup..."

# 1. Stop all containers first
echo "⏹️  Step 1: Stopping all containers..."
docker-compose -f docker-compose.production.yml down 2>/dev/null || true

# Stop any remaining containers
docker stop $(docker ps -q) 2>/dev/null || true

# 2. Remove stopped containers (FIXED: removed -a flag, it's not valid)
echo "🗑️  Step 2: Removing stopped containers..."
docker container prune -f

# 3. Remove unused images (this will free ~3.48GB)
echo "🗑️  Step 3: Removing unused Docker images..."
docker image prune -a -f

# 4. Remove dangling volumes
echo "🗑️  Step 4: Removing dangling volumes..."
docker volume prune -f

# 5. Clean build cache
echo "🗑️  Step 5: Cleaning build cache..."
docker builder prune -a -f

# 6. System prune (removes everything unused)
echo "🗑️  Step 6: Running system prune..."
docker system prune -a -f

# 7. Clean container logs
echo "🗑️  Step 7: Truncating container logs..."
docker ps -a --format "{{.Names}}" | while read container; do
    if [ -n "$container" ]; then
        log_path=$(docker inspect --format='{{.LogPath}}' "$container" 2>/dev/null || echo "")
        if [ -n "$log_path" ] && [ -f "$log_path" ]; then
            echo "   Truncating logs for: $container"
            truncate -s 0 "$log_path" 2>/dev/null || sudo truncate -s 0 "$log_path" 2>/dev/null || true
        fi
    fi
done

# 8. Remove unused networks (fix the network error)
echo "🗑️  Step 8: Removing unused networks..."
docker network prune -f

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📊 Disk space after cleanup:"
df -h / | tail -1

echo ""
echo "💡 If still low on space, you need to find what's using the other ~230GB:"
echo "   Run: sudo ./scripts/find-large-files.sh"

