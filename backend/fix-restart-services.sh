#!/bin/bash

# Fix and Restart MeCabal Services
# This script rebuilds and restarts all services

set -e

echo "======================================"
echo "MeCabal Services Fix & Restart"
echo "======================================"

# Navigate to backend directory
cd /root/mecabal/backend

echo ""
echo "Step 1: Stopping all services..."
docker-compose -f docker-compose.production.yml down

echo ""
echo "Step 2: Removing old images..."
docker images | grep mecabal | awk '{print $3}' | xargs -r docker rmi -f || true

echo ""
echo "Step 3: Building all services (this may take 5-10 minutes)..."
docker-compose -f docker-compose.production.yml build --no-cache

echo ""
echo "Step 4: Starting services..."
docker-compose -f docker-compose.production.yml up -d

echo ""
echo "Step 5: Waiting for services to initialize (30 seconds)..."
sleep 30

echo ""
echo "Step 6: Checking service status..."
docker-compose -f docker-compose.production.yml ps

echo ""
echo "======================================"
echo "Service Health Check"
echo "======================================"

echo ""
echo "Auth Service Logs:"
docker logs mecabal-auth-service --tail 20

echo ""
echo "API Gateway Logs:"
docker logs mecabal-api-gateway --tail 20

echo ""
echo "======================================"
echo "Fix Complete!"
echo "======================================"
echo ""
echo "To check individual service logs, run:"
echo "  docker logs mecabal-<service-name>"
echo ""
echo "To monitor all services:"
echo "  docker-compose -f docker-compose.production.yml logs -f"
