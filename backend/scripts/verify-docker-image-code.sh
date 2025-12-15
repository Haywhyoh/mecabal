#!/bin/bash

# Script to verify that the Docker image contains the new code with implemented searchEstates
# This checks if the compiled JavaScript in the image has the new implementation

set -e

echo "🔍 Verifying Docker Image Contains New Code"
echo "============================================="
echo ""

# Check if container is running
if ! docker ps | grep -q mecabal-backend; then
    echo "❌ Error: mecabal-backend container is not running"
    echo "Please start the container first:"
    echo "  docker-compose -f docker-compose.production.yml up -d"
    exit 1
fi

echo "📦 Checking Docker image information..."
IMAGE_ID=$(docker inspect mecabal-backend --format='{{.Image}}')
IMAGE_NAME=$(docker inspect mecabal-backend --format='{{.Config.Image}}')
echo "  Image ID: $IMAGE_ID"
echo "  Image Name: $IMAGE_NAME"
echo ""

# Check if the compiled auth-service code exists
echo "📂 Checking compiled auth-service code..."
if docker exec mecabal-backend test -f /app/dist/apps/auth-service/main.js; then
    echo "✅ Compiled auth-service code found"
else
    echo "❌ Error: Compiled auth-service code not found"
    echo "The Docker image may not have been built correctly"
    exit 1
fi

echo ""
echo "🔍 Checking for 'Method not implemented' in compiled code..."
echo ""

# Search for "Method not implemented" in the compiled JavaScript
SEARCH_RESULT=$(docker exec mecabal-backend grep -o "Method not implemented yet" /app/dist/apps/auth-service/main.js 2>/dev/null | head -1 || echo "")

if [ -n "$SEARCH_RESULT" ]; then
    echo "❌ PROBLEM FOUND: The Docker image contains OLD code!"
    echo "   The compiled code still has 'Method not implemented yet'"
    echo ""
    echo "   This means the Docker image was built from old source code"
    echo "   that doesn't have the searchEstates implementation."
    echo ""
    echo "   SOLUTION: Rebuild the Docker image from the latest code:"
    echo ""
    echo "   1. On the build server (GitHub Actions or local):"
    echo "      docker build -f Dockerfile.optimized -t ghcr.io/haywhyoh/mecabal-backend:latest ."
    echo "      docker push ghcr.io/haywhyoh/mecabal-backend:latest"
    echo ""
    echo "   2. On the production server:"
    echo "      docker-compose -f docker-compose.production.yml pull backend"
    echo "      docker-compose -f docker-compose.production.yml up -d backend"
    echo ""
    exit 1
else
    echo "✅ GOOD: No 'Method not implemented' found in compiled code"
    echo "   The Docker image appears to contain the new code"
    echo ""
fi

# Check for searchEstates method in compiled code
echo "🔍 Checking for searchEstates implementation in compiled code..."
SEARCH_ESTATES_FOUND=$(docker exec mecabal-backend grep -o "searchEstates" /app/dist/apps/auth-service/main.js 2>/dev/null | head -1 || echo "")

if [ -n "$SEARCH_ESTATES_FOUND" ]; then
    echo "✅ searchEstates method found in compiled code"
else
    echo "⚠️  WARNING: searchEstates method not found in compiled code"
    echo "   This might indicate the method wasn't compiled correctly"
    echo ""
fi

# Check for the actual implementation patterns
echo ""
echo "🔍 Checking for implementation patterns..."
echo ""

# Check for validation logic (UUID regex)
UUID_REGEX_FOUND=$(docker exec mecabal-backend grep -o "0-9a-f.*8.*4.*4.*4.*4.*12" /app/dist/apps/auth-service/main.js 2>/dev/null | head -1 || echo "")
if [ -n "$UUID_REGEX_FOUND" ]; then
    echo "✅ UUID validation found (indicates new implementation)"
else
    echo "⚠️  UUID validation pattern not found"
fi

# Check for BadRequestException usage
BAD_REQUEST_FOUND=$(docker exec mecabal-backend grep -o "BadRequestException" /app/dist/apps/auth-service/main.js 2>/dev/null | head -1 || echo "")
if [ -n "$BAD_REQUEST_FOUND" ]; then
    echo "✅ BadRequestException found (indicates proper error handling)"
else
    echo "⚠️  BadRequestException not found"
fi

# Check for neighborhoodRepository usage
NEIGHBORHOOD_REPO_FOUND=$(docker exec mecabal-backend grep -o "neighborhoodRepository" /app/dist/apps/auth-service/main.js 2>/dev/null | head -1 || echo "")
if [ -n "$NEIGHBORHOOD_REPO_FOUND" ]; then
    echo "✅ neighborhoodRepository found (indicates service implementation)"
else
    echo "⚠️  neighborhoodRepository not found"
fi

echo ""
echo "============================================="
echo "Summary:"
echo ""

if [ -z "$SEARCH_RESULT" ] && [ -n "$SEARCH_ESTATES_FOUND" ]; then
    echo "✅ The Docker image contains the NEW code with searchEstates implementation"
    echo "   The port conflict is the main issue preventing the service from starting"
    echo ""
    echo "   Next steps:"
    echo "   1. Fix the port conflict (run: ./scripts/fix-port-conflict.sh)"
    echo "   2. Restart the backend (run: ./scripts/restart-backend.sh)"
    echo "   3. Test the endpoint (run: ./scripts/verify-estate-search.sh)"
else
    echo "❌ The Docker image contains OLD code without the searchEstates implementation"
    echo "   The image needs to be rebuilt from the latest source code"
    echo ""
    echo "   The deployment log showed:"
    echo "   'Some service image(s) must be built from source by running: docker-compose build backend'"
    echo ""
    echo "   This confirms the image in the registry is outdated."
    echo ""
    echo "   ACTION REQUIRED: Rebuild and push the Docker image with the latest code"
fi

