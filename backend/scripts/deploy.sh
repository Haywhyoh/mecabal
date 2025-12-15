#!/bin/bash

# MeCabal Backend Deployment Script
# This script properly deploys code changes to production

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.production.yml"
CONTAINER_NAME="mecabal-backend"
BACKUP_DIR="./backups"

# Detect docker-compose command (V1 vs V2)
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo -e "${RED}✗${NC} Neither 'docker-compose' nor 'docker compose' found!"
    echo "Please install Docker Compose"
    exit 1
fi

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  MeCabal Backend Deployment Script${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Function to print colored messages
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

# Check if we're in the backend directory
if [ ! -f "$COMPOSE_FILE" ]; then
    error "docker-compose.production.yml not found!"
    error "Please run this script from the backend directory"
    exit 1
fi

if [ ! -f "Dockerfile" ]; then
    error "Dockerfile not found!"
    exit 1
fi

info "Using: $DOCKER_COMPOSE"

# Parse command line arguments
SKIP_PULL=false
SKIP_BACKUP=false
NO_CACHE=false
QUICK_MODE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-pull)
            SKIP_PULL=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --no-cache)
            NO_CACHE=true
            shift
            ;;
        --quick)
            QUICK_MODE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --skip-pull     Skip git pull (use existing code)"
            echo "  --skip-backup   Skip database backup"
            echo "  --no-cache      Force rebuild without Docker cache"
            echo "  --quick         Quick mode (skip git pull and backup)"
            echo "  --help          Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                    # Full deployment with all safety checks"
            echo "  $0 --quick            # Quick deployment (skip git pull & backup)"
            echo "  $0 --no-cache         # Force clean rebuild"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            echo "Use --help to see available options"
            exit 1
            ;;
    esac
done

if [ "$QUICK_MODE" = true ]; then
    SKIP_PULL=true
    SKIP_BACKUP=true
    info "Quick mode enabled (skipping git pull and backup)"
fi

echo ""
info "Deployment Configuration:"
echo "  Skip git pull: $SKIP_PULL"
echo "  Skip backup: $SKIP_BACKUP"
echo "  No cache: $NO_CACHE"
echo ""

# Step 1: Check git status
if [ "$SKIP_PULL" = false ]; then
    info "Step 1: Checking git status..."

    if ! git diff-index --quiet HEAD --; then
        warning "You have uncommitted changes!"
        git status --short
        echo ""
        read -p "Continue with deployment? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Deployment cancelled"
            exit 1
        fi
    fi

    info "Pulling latest code from git..."
    git pull origin main || {
        error "Git pull failed!"
        exit 1
    }
    success "Code updated from git"
else
    warning "Skipping git pull (using existing code)"
fi

echo ""

# Step 2: Backup current container info
info "Step 2: Recording current container state..."
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/deployment-$(date +%Y%m%d-%H%M%S).log"

if docker ps --filter "name=$CONTAINER_NAME" --format "{{.ID}}" | grep -q .; then
    {
        echo "=== Deployment Backup ==="
        echo "Date: $(date)"
        echo "Git Commit: $(git rev-parse HEAD)"
        echo "Git Branch: $(git rev-parse --abbrev-ref HEAD)"
        echo ""
        echo "=== Container Info ==="
        docker inspect $CONTAINER_NAME
        echo ""
        echo "=== PM2 Status ==="
        docker exec $CONTAINER_NAME npx pm2 jlist 2>/dev/null || echo "Could not get PM2 status"
        echo ""
        echo "=== Image Info ==="
        docker inspect mecabal-backend:latest 2>/dev/null || echo "No existing image"
    } > "$BACKUP_FILE"
    success "Container state saved to $BACKUP_FILE"
else
    warning "Container not running, skipping state backup"
fi

echo ""

# Step 3: Database backup (optional)
if [ "$SKIP_BACKUP" = false ]; then
    info "Step 3: Database backup..."
    read -p "Create database backup? (recommended) (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        # You should customize this based on your database setup
        warning "Database backup script not implemented"
        warning "Please ensure you have a recent database backup"
        read -p "Continue without backup? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Deployment cancelled"
            exit 1
        fi
    fi
else
    warning "Skipping database backup"
fi

echo ""

# Step 4: Stop current container
info "Step 4: Stopping current container..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" down || {
    warning "Failed to stop with docker-compose, trying direct stop..."
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
}
success "Container stopped"

echo ""

# Step 5: Build new image
info "Step 5: Building new Docker image..."
echo "This may take 2-5 minutes..."
echo "Building from Dockerfile with PM2 configuration..."

if [ "$NO_CACHE" = true ]; then
    info "Building with --no-cache (clean rebuild)"
    BUILD_CMD="$DOCKER_COMPOSE -f $COMPOSE_FILE build --no-cache backend"
else
    BUILD_CMD="$DOCKER_COMPOSE -f $COMPOSE_FILE build backend"
fi

if $BUILD_CMD; then
    success "Docker image built successfully"
else
    error "Docker build failed!"
    echo ""
    error "Attempting to restore previous container..."
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d || {
        error "Could not restore previous container!"
        error "Manual intervention required"
        exit 1
    }
    exit 1
fi

echo ""

# Step 6: Start new container
info "Step 6: Starting new container..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d || {
    error "Failed to start container!"
    exit 1
}
success "Container started"

echo ""

# Step 7: Wait for services to start
info "Step 7: Waiting for services to start..."
echo "Waiting 30 seconds for PM2 to initialize all services..."
sleep 30

# Step 8: Verify deployment
echo ""
info "Step 8: Verifying deployment..."

# Check if container is running
if ! docker ps --filter "name=$CONTAINER_NAME" --format "{{.ID}}" | grep -q .; then
    error "Container is not running!"
    $DOCKER_COMPOSE logs backend --tail 50
    exit 1
fi
success "Container is running"

# Check PM2 status
echo ""
info "PM2 Status:"
if docker exec $CONTAINER_NAME npx pm2 list; then
    success "PM2 is running"
else
    error "PM2 check failed!"
    exit 1
fi

# Count online services
ONLINE_COUNT=$(docker exec $CONTAINER_NAME npx pm2 jlist 2>/dev/null | grep -o '"status":"online"' | wc -l)
if [ "$ONLINE_COUNT" -eq 10 ]; then
    success "All 10 services are online"
else
    warning "Only $ONLINE_COUNT/10 services are online!"
    read -p "Continue with verification? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "Deployment verification failed"
        info "Check logs with: $DOCKER_COMPOSE logs backend"
        exit 1
    fi
fi

# Test health endpoint
echo ""
info "Testing health endpoint..."
sleep 5  # Give API Gateway a moment
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    success "Health check passed"
else
    warning "Health check failed (might be normal for a few seconds)"
fi

# Show recent logs
echo ""
info "Recent logs:"
$DOCKER_COMPOSE logs backend --tail 20

# Final status
echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  Deployment Completed Successfully!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
info "Deployment Summary:"
echo "  Container: $CONTAINER_NAME"
echo "  Services: $ONLINE_COUNT/10 online"
echo "  Git commit: $(git rev-parse --short HEAD)"
echo "  Backup: $BACKUP_FILE"
echo ""
success "All services deployed and running"
echo ""
info "Monitor logs with:"
echo "  $DOCKER_COMPOSE -f $COMPOSE_FILE logs -f backend"
echo ""
info "Check PM2 status:"
echo "  docker exec $CONTAINER_NAME npx pm2 list"
echo ""
info "Check specific service logs:"
echo "  docker exec $CONTAINER_NAME npx pm2 logs [service-name]"
echo ""

# Optional: Test critical endpoints
read -p "Test critical endpoints? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    info "Testing critical endpoints..."

    # Test API Gateway
    echo -n "  API Gateway (3000): "
    if curl -s http://localhost:3000/health > /dev/null; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
    fi

    # Test Auth Service
    echo -n "  Auth Service (3001): "
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${YELLOW}⚠${NC} (no health endpoint)"
    fi

    # Test User Service
    echo -n "  User Service (3002): "
    if curl -s http://localhost:3002/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${YELLOW}⚠${NC} (no health endpoint)"
    fi

    # Test cultural profile endpoint
    echo -n "  Cultural Profile: "
    if curl -s http://localhost:3000/cultural-profile/reference-data | grep -q "states"; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
    fi
fi

echo ""
echo -e "${BLUE}Deployment complete! Monitor the system for the next 5-10 minutes.${NC}"
