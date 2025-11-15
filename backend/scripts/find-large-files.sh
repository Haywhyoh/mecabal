#!/bin/bash

# Script to find what's taking up disk space

echo "🔍 Finding Large Files and Directories"
echo "======================================="
echo ""

echo "📊 Current Disk Usage:"
df -h

echo ""
echo "📁 Top 20 Largest Directories in /:"
du -h --max-depth=1 / 2>/dev/null | sort -rh | head -20

echo ""
echo "📁 Top 20 Largest Directories in /var:"
du -h --max-depth=1 /var 2>/dev/null | sort -rh | head -20

echo ""
echo "📁 Top 20 Largest Directories in /var/lib/docker:"
du -h --max-depth=1 /var/lib/docker 2>/dev/null | sort -rh | head -20

echo ""
echo "📁 Docker Overlay2 (container filesystems):"
du -sh /var/lib/docker/overlay2/* 2>/dev/null | sort -rh | head -20

echo ""
echo "📄 Large Files (>100MB) in /var/log:"
find /var/log -type f -size +100M -exec ls -lh {} \; 2>/dev/null | awk '{print $5, $9}'

echo ""
echo "📄 Large Files (>100MB) in /tmp:"
find /tmp -type f -size +100M -exec ls -lh {} \; 2>/dev/null | awk '{print $5, $9}'

echo ""
echo "🐳 Docker Image Sizes:"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | sort -k3 -h -r

echo ""
echo "📦 Docker Container Disk Usage:"
docker ps -a --format "table {{.Names}}\t{{.Size}}"

