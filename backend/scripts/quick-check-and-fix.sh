#!/bin/bash

# Quick check and fix script - verifies code and fixes port conflict

set -e

echo "🔍 Quick Check: Does Current Container Have New Code?"
echo "====================================================="
echo ""

# Check if container is running
if ! docker ps --filter "name=mecabal-backend" --format "{{.ID}}" | grep -q .; then
    echo "❌ Container is not running"
    echo "Starting container..."
    docker-compose -f docker-compose.production.yml up -d backend
    sleep 10
fi

# Quick check: Does the compiled code have "Method not implemented"?
echo "Checking compiled code..."
if docker exec mecabal-backend grep -q "Method not implemented yet" /app/dist/apps/auth-service/main.js 2>/dev/null; then
    echo ""
    echo "❌ CONTAINER HAS OLD CODE!"
    echo ""
    echo "The running container was built from an outdated Docker image."
    echo "It will continue to throw 'Method not implemented' errors."
    echo ""
    echo "🔧 Fixing this now..."
    echo ""
    
    # Stop and remove old container
    echo "1. Stopping old container..."
    docker stop mecabal-backend 2>/dev/null || true
    docker rm mecabal-backend 2>/dev/null || true
    echo "   ✓ Old container removed"
    echo ""
    
    # Pull latest image
    echo "2. Pulling latest Docker image from registry..."
    docker-compose -f docker-compose.production.yml pull backend
    echo "   ✓ Image pulled"
    echo ""
    
    # Verify new image
    echo "3. Verifying new image has correct code..."
    TEMP_CONTAINER=$(docker create $(docker-compose -f docker-compose.production.yml config | grep -A 5 "backend:" | grep "image:" | awk '{print $2}' | head -1) 2>/dev/null || echo "mecabal-backend:latest")
    
    if docker run --rm --entrypoint sh "$TEMP_CONTAINER" -c "grep -q 'Method not implemented yet' /app/dist/apps/auth-service/main.js 2>/dev/null" 2>/dev/null; then
        echo "   ⚠️  WARNING: New image still has old code!"
        echo "   The Docker image in the registry needs to be rebuilt."
        echo ""
        echo "   You need to:"
        echo "   1. Rebuild the Docker image from latest code"
        echo "   2. Push it to the registry"
        echo "   3. Then pull and restart here"
        echo ""
        echo "   See: scripts/rebuild-and-push-image.sh"
        exit 1
    else
        echo "   ✅ New image has correct code"
    fi
    echo ""
    
    # Start new container
    echo "4. Starting new container with updated image..."
    docker-compose -f docker-compose.production.yml up -d backend
    echo "   ✓ Container started"
    echo ""
    
    # Wait and verify
    echo "5. Waiting for services to start..."
    sleep 15
    echo ""
    
    # Final check
    echo "6. Final verification..."
    if docker exec mecabal-backend grep -q "Method not implemented yet" /app/dist/apps/auth-service/main.js 2>/dev/null; then
        echo "   ❌ Still has old code - image rebuild required"
        exit 1
    else
        echo "   ✅ Container now has new code!"
    fi
    
else
    echo ""
    echo "✅ CONTAINER HAS NEW CODE!"
    echo ""
    echo "The container already has the correct implementation."
    echo "The port conflict is just preventing a clean restart."
    echo ""
    echo "🔧 Fixing port conflict..."
    echo ""
    
    # Just restart the container
    echo "Restarting container..."
    docker stop mecabal-backend
    sleep 3
    docker start mecabal-backend
    # OR use docker-compose
    # docker-compose -f docker-compose.production.yml restart backend
    
    echo "✅ Container restarted"
    echo ""
    echo "Waiting for services to be ready..."
    sleep 15
    
    # Check health
    echo ""
    echo "Checking service health..."
    HEALTHY=0
    for PORT in 3000 3001; do
        if curl -f -s "http://localhost:$PORT/health" > /dev/null 2>&1; then
            echo "✅ Port $PORT is healthy"
            HEALTHY=$((HEALTHY + 1))
        else
            echo "⚠️  Port $PORT not responding yet"
        fi
    done
    
    if [ $HEALTHY -gt 0 ]; then
        echo ""
        echo "✅ Services are starting up!"
    fi
fi

echo ""
echo "====================================================="
echo "Next: Test the estate search endpoint"
echo "  ./scripts/verify-estate-search.sh"
echo ""





