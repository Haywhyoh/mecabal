#!/bin/bash

# Quick script to check disk space and Docker resource usage

echo "📊 Disk Space Usage:"
echo "==================="
df -h

echo ""
echo "🐳 Docker Disk Usage:"
echo "====================="
docker system df

echo ""
echo "📦 Largest Docker Images:"
echo "============================"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | head -10

echo ""
echo "💾 Docker Volumes:"
echo "=================="
docker volume ls
docker system df -v | grep -A 10 "VOLUME NAME" || echo "No volume details available"

echo ""
echo "📝 Container Log Sizes (top 10):"
echo "================================"
docker ps -a --format "{{.Names}}" | while read container; do
    if [ -n "$container" ]; then
        size=$(docker inspect --format='{{.LogPath}}' "$container" 2>/dev/null | xargs ls -lh 2>/dev/null | awk '{print $5}' || echo "N/A")
        echo "$container: $size"
    fi
done | sort -k2 -h -r | head -10

echo ""
echo "⚠️  If disk is full, run: ./scripts/cleanup-disk-space.sh"

