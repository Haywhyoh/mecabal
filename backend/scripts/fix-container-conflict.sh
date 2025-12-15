#!/bin/bash

# Fix container name conflict and clean up

set -e

echo "🔧 Fixing Container Conflict"
echo "============================="
echo ""

# Find all containers with mecabal-backend name
echo "🔍 Finding all mecabal-backend containers..."
ALL_CONTAINERS=$(docker ps -a --filter "name=mecabal-backend" --format "{{.ID}} {{.Status}} {{.Names}}")

if [ -z "$ALL_CONTAINERS" ]; then
    echo "✅ No containers found with name mecabal-backend"
else
    echo "Found containers:"
    echo "$ALL_CONTAINERS"
    echo ""
    
    # Stop all
    echo "🛑 Stopping all mecabal-backend containers..."
    docker ps -a --filter "name=mecabal-backend" -q | xargs -r docker stop 2>/dev/null || true
    echo "✅ All containers stopped"
    echo ""
    
    # Remove all
    echo "🗑️  Removing all mecabal-backend containers..."
    docker ps -a --filter "name=mecabal-backend" -q | xargs -r docker rm -f 2>/dev/null || true
    echo "✅ All containers removed"
    echo ""
fi

# Verify no containers remain
REMAINING=$(docker ps -a --filter "name=mecabal-backend" -q)
if [ -z "$REMAINING" ]; then
    echo "✅ No mecabal-backend containers remaining"
    echo ""
else
    echo "⚠️  Warning: Some containers still exist:"
    docker ps -a --filter "name=mecabal-backend"
    echo ""
    echo "Force removing..."
    docker ps -a --filter "name=mecabal-backend" -q | xargs -r docker rm -f
fi

echo "============================================="
echo ""
echo "✅ Container conflict resolved!"
echo ""
echo "⚠️  IMPORTANT: The Docker image in the registry has OLD CODE"
echo "   The pull message said: 'Some service image(s) must be built from source'"
echo ""
echo "   You need to rebuild the Docker image with the latest code."
echo ""
echo "   Options:"
echo "   1. Rebuild on build server/CI:"
echo "      ./scripts/rebuild-and-push-image.sh"
echo ""
echo "   2. Build locally (if you have registry access):"
echo "      docker build -f Dockerfile.optimized -t ghcr.io/haywhyoh/mecabal-backend:latest ."
echo "      docker push ghcr.io/haywhyoh/mecabal-backend:latest"
echo ""
echo "   3. Build directly on production (not recommended but works):"
echo "      docker-compose -f docker-compose.production.yml build backend"
echo "      docker-compose -f docker-compose.production.yml up -d backend"
echo ""

