#!/bin/bash

# Script to restart backend container after fixing port conflict
# This ensures all services start properly

set -e

echo "🔄 Restarting Backend Container"
echo "================================"
echo ""

# Check if docker-compose file exists
if [ ! -f "docker-compose.production.yml" ]; then
    echo "❌ Error: docker-compose.production.yml not found"
    echo "Please run this script from the backend directory"
    exit 1
fi

# Check current container status
echo "📊 Current container status:"
docker-compose -f docker-compose.production.yml ps
echo ""

# Stop containers gracefully
echo "🛑 Stopping containers..."
docker-compose -f docker-compose.production.yml down --timeout 30
echo "✓ Containers stopped"
echo ""

# Wait a moment to ensure ports are released
echo "⏳ Waiting for ports to be released..."
sleep 5
echo ""

# Start containers
echo "🚀 Starting containers..."
docker-compose -f docker-compose.production.yml up -d
echo "✓ Containers started"
echo ""

# Wait for services to initialize
echo "⏳ Waiting for services to initialize (30 seconds)..."
sleep 30
echo ""

# Check container status
echo "📊 Container status after restart:"
docker-compose -f docker-compose.production.yml ps
echo ""

# Check backend logs for errors
echo "📋 Recent backend logs (last 50 lines):"
docker logs mecabal-backend --tail 50 2>&1 | tail -20
echo ""

# Check for "Method not implemented" errors
echo "🔍 Checking for 'Method not implemented' errors..."
if docker logs mecabal-backend 2>&1 | grep -qi "method not implemented"; then
    echo "⚠️  WARNING: Found 'Method not implemented' errors in logs"
    echo "   This suggests the code may not be properly compiled"
    echo ""
else
    echo "✅ No 'Method not implemented' errors found"
    echo ""
fi

# Health check
echo "🏥 Running health checks..."
HEALTHY=0
for PORT in 3000 3001 3002 3003 3004 3005 3006 3007 3008 3009; do
    if curl -f -s "http://localhost:$PORT/health" > /dev/null 2>&1; then
        echo "✅ Service on port $PORT is healthy"
        HEALTHY=$((HEALTHY + 1))
    else
        echo "❌ Service on port $PORT not responding"
    fi
done

echo ""
echo "================================"
echo "Summary:"
echo "  Healthy services: $HEALTHY/10"
if [ $HEALTHY -eq 10 ]; then
    echo "✅ All services are healthy!"
    exit 0
else
    echo "⚠️  Some services are not healthy. Please check logs:"
    echo "   docker logs mecabal-backend --tail 100"
    exit 1
fi





