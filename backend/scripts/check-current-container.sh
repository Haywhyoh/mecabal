#!/bin/bash

# Quick script to check current container status and verify if it has new code

set -e

echo "🔍 Checking Current Container Status"
echo "====================================="
echo ""

# Check if container exists and is running
CONTAINER_ID=$(docker ps --filter "name=mecabal-backend" --format "{{.ID}}" | head -1)
if [ -z "$CONTAINER_ID" ]; then
    echo "❌ mecabal-backend container is not running"
    echo ""
    echo "Checking for stopped containers..."
    STOPPED_ID=$(docker ps -a --filter "name=mecabal-backend" --format "{{.ID}}" | head -1)
    if [ -n "$STOPPED_ID" ]; then
        echo "Found stopped container: $STOPPED_ID"
        docker ps -a --filter "name=mecabal-backend" --format "table {{.ID}}\t{{.Status}}\t{{.Image}}"
    fi
    exit 1
fi

echo "✅ Container is running: $CONTAINER_ID"
echo ""

# Get container info
echo "📦 Container Information:"
docker ps --filter "name=mecabal-backend" --format "table {{.ID}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Get image info
IMAGE_NAME=$(docker inspect mecabal-backend --format='{{.Config.Image}}')
IMAGE_ID=$(docker inspect mecabal-backend --format='{{.Image}}')
echo "🖼️  Image: $IMAGE_NAME"
echo "   Image ID: $IMAGE_ID"
echo ""

# Check when image was created
echo "📅 Image Creation Date:"
docker inspect mecabal-backend --format='{{.Created}}' | awk '{print $1, $2}'
echo ""

# Check if compiled code exists
echo "🔍 Checking compiled code in container..."
if docker exec mecabal-backend test -f /app/dist/apps/auth-service/main.js 2>/dev/null; then
    echo "✅ Compiled auth-service code exists"
    echo ""
    
    # Check for "Method not implemented"
    echo "🔍 Checking for 'Method not implemented' in compiled code..."
    if docker exec mecabal-backend grep -q "Method not implemented yet" /app/dist/apps/auth-service/main.js 2>/dev/null; then
        echo "❌ PROBLEM: Container has OLD code with 'Method not implemented yet'"
        echo ""
        echo "   This container was built from an outdated Docker image."
        echo "   Even if you fix the port conflict, it will still throw errors."
        echo ""
        echo "   SOLUTION:"
        echo "   1. Stop and remove this container:"
        echo "      docker stop mecabal-backend"
        echo "      docker rm mecabal-backend"
        echo ""
        echo "   2. Pull/rebuild the Docker image with new code"
        echo "   3. Start a new container"
    else
        echo "✅ Container has NEW code (no 'Method not implemented' found)"
        echo ""
        echo "   The container has the correct code, but there's a port conflict."
        echo "   This might be because:"
        echo "   - The container is already running but unhealthy"
        echo "   - A previous deployment left a stale container"
        echo ""
        echo "   SOLUTION:"
        echo "   1. Stop the current container:"
        echo "      docker stop mecabal-backend"
        echo ""
        echo "   2. Remove it:"
        echo "      docker rm mecabal-backend"
        echo ""
        echo "   3. Start fresh:"
        echo "      docker-compose -f docker-compose.production.yml up -d backend"
    fi
else
    echo "❌ Compiled auth-service code not found"
    echo "   The container may not be properly built"
fi

echo ""
echo "============================================="





