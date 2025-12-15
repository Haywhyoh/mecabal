#!/bin/bash

# Script to clean up deprecated Docker files

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Cleanup Deprecated Docker Files${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check if we're in the backend directory
if [ ! -f "docker-compose.production.yml" ]; then
    error "docker-compose.production.yml not found!"
    error "Please run this script from the backend directory"
    exit 1
fi

info "This script will remove deprecated Docker files:"
echo "  - Dockerfile.optimized"
echo "  - docker-compose.optimized.yml"
echo ""
warning "These files are no longer needed as their functionality"
warning "has been merged into the standard Dockerfile and docker-compose.production.yml"
echo ""

# Check if deprecated files exist
DOCKERFILE_OPTIMIZED_EXISTS=false
COMPOSE_OPTIMIZED_EXISTS=false

if [ -f "Dockerfile.optimized" ]; then
    DOCKERFILE_OPTIMIZED_EXISTS=true
fi

if [ -f "docker-compose.optimized.yml" ]; then
    COMPOSE_OPTIMIZED_EXISTS=true
fi

if [ "$DOCKERFILE_OPTIMIZED_EXISTS" = false ] && [ "$COMPOSE_OPTIMIZED_EXISTS" = false ]; then
    success "No deprecated files found - already cleaned up!"
    exit 0
fi

echo "Files to be removed:"
if [ "$DOCKERFILE_OPTIMIZED_EXISTS" = true ]; then
    echo "  ✗ Dockerfile.optimized"
fi
if [ "$COMPOSE_OPTIMIZED_EXISTS" = true ]; then
    echo "  ✗ docker-compose.optimized.yml"
fi
echo ""

# Confirm with user
read -p "Do you want to remove these files? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    warning "Cleanup cancelled"
    exit 0
fi

# Remove files
info "Removing deprecated files..."

if [ "$DOCKERFILE_OPTIMIZED_EXISTS" = true ]; then
    rm Dockerfile.optimized
    success "Removed Dockerfile.optimized"
fi

if [ "$COMPOSE_OPTIMIZED_EXISTS" = true ]; then
    rm docker-compose.optimized.yml
    success "Removed docker-compose.optimized.yml"
fi

echo ""
success "Cleanup completed!"
echo ""

# Ask if user wants to commit
read -p "Do you want to commit this change? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    info "Committing changes..."

    git add -A
    git commit -m "Remove deprecated Docker files (Dockerfile.optimized, docker-compose.optimized.yml)

- Functionality merged into standard Dockerfile
- Production deployments now use Dockerfile and docker-compose.production.yml
- Simplifies deployment process and reduces confusion"

    success "Changes committed!"
    echo ""

    read -p "Do you want to push to remote? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push origin main
        success "Changes pushed to remote!"
    else
        info "Changes committed locally but not pushed"
        info "Push manually with: git push origin main"
    fi
else
    info "Changes not committed"
    info "The files have been removed but not committed to git"
    info "To commit manually:"
    echo "  git add -A"
    echo "  git commit -m 'Remove deprecated Docker files'"
    echo "  git push origin main"
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  Cleanup Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
info "Your project now uses only:"
echo "  ✓ Dockerfile (for production builds)"
echo "  ✓ docker-compose.production.yml (for production deployment)"
echo "  ✓ docker-compose.yml (for local development dependencies)"
echo ""
info "For deployment, use:"
echo "  ./scripts/deploy.sh"
echo ""
info "Or manually:"
echo "  docker compose -f docker-compose.production.yml build backend"
echo "  docker compose -f docker-compose.production.yml up -d"
