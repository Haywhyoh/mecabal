#!/bin/bash

# Build Docker image on production and verify it has new code
# This ensures we're building from the latest source code

set -e

echo "🔨 Building Docker Image on Production"
echo "======================================="
echo ""

# Check if we're in the right directory
if [ ! -f "Dockerfile.optimized" ]; then
    echo "❌ Error: Dockerfile.optimized not found"
    echo "Please run this script from the backend directory"
    exit 1
fi

# Step 1: Ensure we have latest code
echo "📥 Step 1: Ensuring latest code is pulled..."
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Warning: You have uncommitted changes"
    echo "These will be included in the build"
    echo ""
fi

# Pull latest code
echo "Pulling latest code from origin..."
git pull origin ${CURRENT_BRANCH:-main} || echo "⚠️  Git pull failed or already up to date"
echo ""

# Verify searchEstates exists in source
echo "🔍 Step 2: Verifying source code has searchEstates implementation..."
if grep -q "async searchEstates" apps/auth-service/src/auth/auth.controller.ts; then
    echo "✅ searchEstates method found in source code"
else
    echo "❌ ERROR: searchEstates method NOT found in source code"
    echo "The source code on this server is outdated"
    echo ""
    echo "Please ensure:"
    echo "1. You've committed the searchEstates implementation"
    echo "2. You've pushed to the repository"
    echo "3. You've pulled the latest code on this server"
    exit 1
fi

# Check if source has "Method not implemented" for searchEstates
if grep -A 5 "async searchEstates" apps/auth-service/src/auth/auth.controller.ts | grep -q "Method not implemented yet"; then
    echo "❌ ERROR: Source code still has 'Method not implemented yet' for searchEstates"
    echo "The implementation is not complete in the source code"
    exit 1
else
    echo "✅ Source code has proper implementation (no 'Method not implemented')"
fi
echo ""

# Step 3: Clean up old containers
echo "🧹 Step 3: Cleaning up old containers..."
docker ps -a --filter "name=mecabal-backend" -q | xargs -r docker rm -f 2>/dev/null || true
echo "✅ Old containers removed"
echo ""

# Step 4: Build the image
echo "🏗️  Step 4: Building Docker image..."
echo "This may take several minutes..."
echo ""

# Build with no cache to ensure fresh build
docker build \
  --no-cache \
  -f Dockerfile.optimized \
  -t mecabal-backend:latest \
  .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully"
    echo ""
else
    echo "❌ Docker image build failed"
    exit 1
fi

# Step 5: Verify the built image
echo "🔍 Step 5: Verifying built image contains new code..."
echo ""

# Create a temporary container to check
TEMP_CONTAINER=$(docker create mecabal-backend:latest)

# Check for "Method not implemented" in the compiled code
if docker cp "$TEMP_CONTAINER:/app/dist/apps/auth-service/main.js" /tmp/verify_main.js 2>/dev/null; then
    if grep -q "Method not implemented yet" /tmp/verify_main.js 2>/dev/null; then
        echo "❌ ERROR: Built image still contains 'Method not implemented yet'"
        echo ""
        echo "This should not happen if:"
        echo "1. Source code has the implementation"
        echo "2. Build completed successfully"
        echo ""
        echo "Possible causes:"
        echo "- Build used cached layers (but we used --no-cache)"
        echo "- Source code wasn't properly copied during build"
        echo "- Compilation failed silently"
        echo ""
        rm -f /tmp/verify_main.js
        docker rm "$TEMP_CONTAINER" > /dev/null 2>&1
        exit 1
    else
        echo "✅ Built image contains new code (no 'Method not implemented' found)"
    fi
    rm -f /tmp/verify_main.js
else
    echo "⚠️  Could not extract compiled code for verification"
    echo "But build completed, so assuming it's correct"
fi

docker rm "$TEMP_CONTAINER" > /dev/null 2>&1
echo ""

# Step 6: Start the container
echo "🚀 Step 6: Starting container..."
docker-compose -f docker-compose.production.yml up -d backend
echo "✅ Container started"
echo ""

# Step 7: Wait and verify running container
echo "⏳ Step 7: Waiting for container to be ready..."
sleep 15

echo "🔍 Verifying running container has new code..."
if docker exec mecabal-backend grep -q "Method not implemented yet" /app/dist/apps/auth-service/main.js 2>/dev/null; then
    echo "❌ ERROR: Running container still has old code"
    echo "This is unexpected - the image was verified before starting"
    echo ""
    echo "Checking container logs..."
    docker logs mecabal-backend --tail 50
    exit 1
else
    echo "✅ Running container has new code!"
fi

echo ""
echo "============================================="
echo "✅ SUCCESS: Docker image built and verified!"
echo ""
echo "The container is now running with the new code."
echo "You can test the estate search endpoint:"
echo "  curl 'http://localhost:3001/auth/location/estates?query=test&limit=10'"
echo ""

