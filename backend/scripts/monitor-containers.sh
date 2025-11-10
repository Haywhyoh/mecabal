#!/bin/bash

# MeCabal Container Monitoring Script
# This script monitors containers and restarts them if they stop unexpectedly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to check container status
check_container_status() {
    local container_name=$1
    local status=$(docker ps -a --filter "name=$container_name" --format "{{.Status}}" 2>/dev/null || echo "not found")
    
    if [[ "$status" == "not found" ]] || [[ -z "$status" ]]; then
        echo "not_running"
    elif [[ "$status" == *"Up"* ]]; then
        echo "running"
    else
        echo "stopped"
    fi
}

# Function to restart container
restart_container() {
    local container_name=$1
    print_warning "Restarting container: $container_name"
    
    # Use docker-compose to restart the specific service
    local service_name=$(echo $container_name | sed 's/mecabal-//')
    $COMPOSE_CMD -f $COMPOSE_FILE restart $service_name 2>/dev/null || \
    $COMPOSE_CMD -f $COMPOSE_FILE up -d $service_name
    
    sleep 5
    
    # Verify it's running
    local new_status=$(check_container_status $container_name)
    if [[ "$new_status" == "running" ]]; then
        print_success "Container $container_name restarted successfully"
        return 0
    else
        print_error "Failed to restart container $container_name"
        return 1
    fi
}

# Main monitoring function
monitor_containers() {
    print_status "Checking container status..."
    
    # List of critical containers
    declare -a critical_containers=(
        "mecabal-postgres"
        "mecabal-redis"
        "mecabal-api-gateway"
        "mecabal-auth-service"
    )
    
    local restarted_count=0
    
    for container in "${critical_containers[@]}"; do
        local status=$(check_container_status $container)
        
        case $status in
            "running")
                print_success "$container is running"
                ;;
            "stopped")
                print_warning "$container is stopped - attempting restart..."
                if restart_container $container; then
                    ((restarted_count++))
                fi
                ;;
            "not_running")
                print_error "$container not found - may need to start services"
                ;;
        esac
    done
    
    if [ $restarted_count -gt 0 ]; then
        print_warning "$restarted_count container(s) were restarted"
    fi
    
    return $restarted_count
}

# Function to show container status summary
show_status() {
    print_status "Container Status Summary:"
    echo ""
    $COMPOSE_CMD -f $COMPOSE_FILE ps
    echo ""
    
    # Check disk usage
    print_status "Volume Disk Usage:"
    docker system df -v | grep -E "VOLUME|postgres_data|redis_data" || true
    echo ""
}

# Main execution
case "${1:-monitor}" in
    "monitor")
        monitor_containers
        ;;
    "status")
        show_status
        ;;
    "restart-all")
        print_status "Restarting all services..."
        $COMPOSE_CMD -f $COMPOSE_FILE restart
        print_success "All services restarted"
        ;;
    *)
        echo "Usage: $0 [monitor|status|restart-all]"
        echo "  monitor     - Check and restart stopped containers (default)"
        echo "  status      - Show container status summary"
        echo "  restart-all - Restart all services"
        exit 1
        ;;
esac

