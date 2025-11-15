#!/bin/bash

# Aggressive cleanup script for disk space emergency
# WARNING: This will remove unused Docker resources

set -e

echo "🚨 AGGRESSIVE DISK CLEANUP - Emergency Mode"
echo "============================================"
echo ""
echo "Current disk usage:"
df -h / | tail -1

echo ""
echo "Starting cleanup..."

# 1. Stop all containers first
echo "⏹️  Step 1: Stopping all containers..."
docker-compose -f docker-compose.production.yml down 2>/dev/null || true
docker stop $(docker ps -aq) 2>/dev/null || true

# 2. Remove ALL stopped containers
echo "🗑️  Step 2: Removing all stopped containers..."
docker container prune -af || true

# 3. Remove unused images (this will free ~3.48GB)
echo "🗑️  Step 3: Removing unused Docker images (will free ~3.48GB)..."
docker image prune -a -f || true

# 4. Remove dangling and unused volumes (CAREFUL - but many are 0B)
echo "🗑️  Step 4: Removing unused volumes (keeping named data volumes)..."
# Only remove volumes with 0 links (truly unused)
docker volume ls -q | while read vol; do
    links=$(docker volume inspect "$vol" --format '{{.Mountpoint}}' 2>/dev/null | xargs -I {} sh -c 'docker ps -a --filter volume={} -q | wc -l' 2>/dev/null || echo "1")
    if [ "$links" = "0" ] && [[ ! "$vol" =~ ^(backend_postgres_data|backend_redis_data|backend_rabbitmq_data|backend_minio_data|backend_pgadmin_data)$ ]]; then
        echo "   Removing unused volume: $vol"
        docker volume rm "$vol" 2>/dev/null || true
    fi
done

# 5. Clean build cache
echo "🗑️  Step 5: Cleaning build cache..."
docker builder prune -a -f || true

# 6. System prune (removes everything unused)
echo "🗑️  Step 6: Running system prune..."
docker system prune -a -f || true

# 7. Clean container logs (postgres has 24M)
echo "🗑️  Step 7: Truncating container logs..."
# Truncate logs for all containers
docker ps -a --format "{{.Names}}" | while read container; do
    if [ -n "$container" ]; then
        log_path=$(docker inspect --format='{{.LogPath}}' "$container" 2>/dev/null || echo "")
        if [ -n "$log_path" ] && [ -f "$log_path" ]; then
            echo "   Truncating logs for: $container"
            truncate -s 0 "$log_path" 2>/dev/null || sudo truncate -s 0 "$log_path" 2>/dev/null || true
        fi
    fi
done

# 8. Find large files/directories
echo ""
echo "🔍 Step 8: Finding largest directories..."
echo "Top 10 largest directories in /var/lib/docker:"
du -h /var/lib/docker 2>/dev/null | sort -rh | head -10 || echo "   (Cannot access, may need sudo)"

echo ""
echo "Top 10 largest directories in root:"
du -h /* 2>/dev/null | sort -rh | head -10 || echo "   (Cannot access, may need sudo)"

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📊 Disk space after cleanup:"
df -h / | tail -1

echo ""
echo "💡 If still low on space, check:"
echo "   - Application logs: find /var/log -type f -size +100M"
echo "   - Old backups: find / -name '*.tar.gz' -o -name '*.backup' -size +100M 2>/dev/null"
echo "   - Docker overlay2: du -sh /var/lib/docker/overlay2/* | sort -rh | head -10"

