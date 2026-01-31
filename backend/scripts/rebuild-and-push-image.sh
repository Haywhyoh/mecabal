#!/bin/bash

# Script to rebuild Docker image from latest code and push to registry
# This should be run on the build server (or locally if you have registry access)

set -e

echo "🔨 Rebuilding Docker Image from Latest Code"
echo "============================================"
echo ""

# Check if we're in the right directory
if [ ! -f "Dockerfile.optimized" ]; then
    echo "❌ Error: Dockerfile.optimized not found"
    echo "Please run this script from the backend directory"
    exit 1
fi

# Get current commit hash
CURRENT_COMMIT=$(git rev-parse HEAD)
CURRENT_COMMIT_SHORT=$(git rev-parse --short HEAD)
echo "📝 Current commit: $CURRENT_COMMIT ($CURRENT_COMMIT_SHORT)"
echo ""

# Verify the source code has the searchEstates implementation
echo "🔍 Verifying source code has searchEstates implementation..."
if grep -q "async searchEstates" apps/auth-service/src/auth/auth.controller.ts; then
    echo "✅ searchEstates method found in source code"
else
    echo "❌ Error: searchEstates method not found in source code"
    echo "Please ensure you're on the latest commit with the implementation"
    exit 1
fi

# Check if "Method not implemented" still exists in source
if grep -q "Method not implemented yet" apps/auth-service/src/auth/auth.controller.ts; then
    echo "⚠️  WARNING: 'Method not implemented yet' still found in source code"
    echo "   This might be from other methods, but searchEstates should be implemented"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🏗️  Building Docker image..."
echo "   This may take several minutes..."
echo ""

# Build the image
# Note: Adjust the image name/tag based on your registry setup
IMAGE_NAME="${IMAGE_NAME:-ghcr.io/haywhyoh/mecabal-backend}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

echo "Building: $IMAGE_NAME:$IMAGE_TAG"
docker build \
    -f Dockerfile.optimized \
    -t "$IMAGE_NAME:$IMAGE_TAG" \
    -t "$IMAGE_NAME:$CURRENT_COMMIT_SHORT" \
    --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
    --build-arg VCS_REF="$CURRENT_COMMIT" \
    .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully"
    echo ""
else
    echo "❌ Docker image build failed"
    exit 1
fi

# Verify the built image contains the new code
echo "🔍 Verifying built image contains new code..."
echo ""

# Create a temporary container to check
TEMP_CONTAINER=$(docker create "$IMAGE_NAME:$IMAGE_TAG")
if docker cp "$TEMP_CONTAINER:/app/dist/apps/auth-service/main.js" /tmp/check_main.js 2>/dev/null; then
    if grep -q "Method not implemented yet" /tmp/check_main.js 2>/dev/null; then
        echo "❌ ERROR: Built image still contains 'Method not implemented yet'"
        echo "   The build may have failed or used cached layers"
        docker rm "$TEMP_CONTAINER" > /dev/null 2>&1
        rm -f /tmp/check_main.js
        exit 1
    else
        echo "✅ Built image contains new code (no 'Method not implemented')"
    fi
    rm -f /tmp/check_main.js
else
    echo "⚠️  Could not verify built image (container extraction failed)"
fi
docker rm "$TEMP_CONTAINER" > /dev/null 2>&1

echo ""
echo "📤 Pushing image to registry..."
echo ""

# Check if we need to login
if [ -z "$GH_PAT" ] && [ -z "$GITHUB_TOKEN" ]; then
    echo "⚠️  No GitHub token found. You may need to login:"
    echo "   echo \$GH_PAT | docker login ghcr.io -u \$GH_ACTOR --password-stdin"
    echo ""
    read -p "Continue with push? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Image built but not pushed. You can push it manually later."
        exit 0
    fi
fi

# Push the image
docker push "$IMAGE_NAME:$IMAGE_TAG"
docker push "$IMAGE_NAME:$CURRENT_COMMIT_SHORT"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Docker image pushed successfully"
    echo ""
    echo "📋 Image details:"
    echo "   Latest: $IMAGE_NAME:$IMAGE_TAG"
    echo "   Tagged: $IMAGE_NAME:$CURRENT_COMMIT_SHORT"
    echo "   Commit: $CURRENT_COMMIT"
    echo ""
    echo "🔄 Next steps on production server:"
    echo "   1. Pull the new image:"
    echo "      docker-compose -f docker-compose.production.yml pull backend"
    echo ""
    echo "   2. Restart the container:"
    echo "      docker-compose -f docker-compose.production.yml up -d backend"
    echo ""
    echo "   3. Verify the new code:"
    echo "      ./scripts/verify-docker-image-code.sh"
    echo ""
else
    echo "❌ Docker image push failed"
    echo "   Image was built but not pushed to registry"
    exit 1
fi





