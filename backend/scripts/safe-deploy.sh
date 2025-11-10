#!/bin/bash

# Safe Deployment Script - Preserves Database and Volumes
# This script deploys updates without losing data

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

COMPOSE_FILE="docker-compose.production.yml"

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if docker-compose is available
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    print_error "Docker Compose not found!"
    exit 1
fi

# Function to backup volumes (optional)
backup_volumes() {
    print_status "Creating volume backups..."
    
    # Backup postgres volume
    if docker volume inspect mecabal_postgres_data &> /dev/null; then
        print_status "Backing up PostgreSQL data..."
        docker run --rm \
            -v mecabal_postgres_data:/data \
            -v $(pwd)/backups:/backup \
            alpine tar czf /backup/postgres_backup_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .
        print_success "PostgreSQL backup created"
    fi
}

# Function to verify volumes exist
verify_volumes() {
    print_status "Verifying data volumes exist..."
    
    local volumes=("mecabal_postgres_data" "mecabal_redis_data" "mecabal_rabbitmq_data" "mecabal_minio_data")
    local missing_volumes=()
    
    for volume in "${volumes[@]}"; do
        if ! docker volume inspect $volume &> /dev/null; then
            missing_volumes+=($volume)
            print_warning "Volume $volume not found (will be created)"
        else
            print_success "Volume $volume exists"
        fi
    done
    
    if [ ${#missing_volumes[@]} -gt 0 ]; then
        print_warning "Some volumes are missing - they will be created on startup"
    fi
}

# Main deployment function
deploy() {
    print_status "Starting safe deployment..."
    
    # Step 1: Verify volumes
    verify_volumes
    
    # Step 2: Optional backup (uncomment if needed)
    # backup_volumes
    
    # Step 3: Pull latest images
    print_status "Pulling latest images..."
    $COMPOSE_CMD -f $COMPOSE_FILE pull
    
    # Step 4: Stop containers gracefully (PRESERVES VOLUMES)
    print_status "Stopping containers gracefully (preserving data)..."
    $COMPOSE_CMD -f $COMPOSE_FILE stop
    
    # Step 5: Remove stopped containers (but keep volumes)
    print_status "Removing old containers (volumes preserved)..."
    $COMPOSE_CMD -f $COMPOSE_FILE rm -f
    
    # Step 6: Build/rebuild application containers
    print_status "Building application containers..."
    $COMPOSE_CMD -f $COMPOSE_FILE build --no-cache
    
    # Step 7: Start services
    print_status "Starting services..."
    $COMPOSE_CMD -f $COMPOSE_FILE up -d
    
    # Step 8: Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 15
    
    # Step 9: Health check
    print_status "Performing health checks..."
    
    # Check PostgreSQL
    if $COMPOSE_CMD -f $COMPOSE_FILE exec -T postgres pg_isready -U ${DATABASE_USERNAME:-mecabal_prod} &> /dev/null; then
        print_success "PostgreSQL is ready"
    else
        print_error "PostgreSQL health check failed"
    fi
    
    # Step 10: Show status
    print_status "Final container status:"
    $COMPOSE_CMD -f $COMPOSE_FILE ps
    
    print_success "Safe deployment completed!"
    print_warning "IMPORTANT: All data volumes have been preserved"
}

# Run deployment
deploy

