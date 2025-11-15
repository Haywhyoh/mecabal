#!/bin/bash

# Script to apply CORS fix changes on the server
# This script rebuilds location-service and reloads nginx

set -e

echo "🔧 Applying CORS fix changes..."

# Navigate to backend directory (adjust path if needed)
cd "$(dirname "$0")" || exit

# Step 1: Rebuild location-service container with new code
echo "📦 Rebuilding location-service container..."
docker-compose -f docker-compose.production.yml build location-service

# Step 2: Restart location-service to apply code changes
echo "🔄 Restarting location-service..."
docker-compose -f docker-compose.production.yml up -d --no-deps location-service

# Step 3: Test nginx configuration
echo "✅ Testing nginx configuration..."
docker exec mecabal-nginx nginx -t

# Step 4: Reload nginx (graceful reload, no downtime)
echo "🔄 Reloading nginx configuration..."
docker exec mecabal-nginx nginx -s reload

# Step 5: Verify containers are running
echo "🔍 Verifying containers are running..."
docker ps --filter "name=mecabal-location-service" --filter "name=mecabal-nginx" --format "table {{.Names}}\t{{.Status}}"

echo ""
echo "✅ CORS fix applied successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Test the endpoint: curl -I https://api.mecabal.com/location/states"
echo "   2. Check nginx logs: docker logs mecabal-nginx"
echo "   3. Check location-service logs: docker logs mecabal-location-service"

