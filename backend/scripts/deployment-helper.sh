#!/bin/bash
#############################################
# MeCabal Backend - Deployment Helper Script
# Use this for manual server operations
#############################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BACKEND_DIR="${BACKEND_DIR:-$(pwd)}"
COMPOSE_FILE="docker-compose.production.yml"
BACKUP_DIR="$BACKEND_DIR/backups"

# Ensure we're in the right directory
cd "$BACKEND_DIR"

# Helper functions
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Service ports
declare -A SERVICE_PORTS=(
    ["api-gateway"]=3000
    ["auth-service"]=3001
    ["user-service"]=3002
    ["social-service"]=3003
    ["messaging-service"]=3004
    ["marketplace-service"]=3005
    ["events-service"]=3006
    ["notification-service"]=3007
    ["location-service"]=3008
    ["business-service"]=3009
)

# Commands
cmd_start() {
    print_info "Starting all MeCabal services..."
    docker-compose -f $COMPOSE_FILE up -d

    print_info "Waiting for services to be ready..."
    sleep 10

    cmd_health
}

cmd_stop() {
    print_info "Stopping all MeCabal services..."
    docker-compose -f $COMPOSE_FILE down
    print_success "All services stopped"
}

cmd_restart() {
    print_info "Restarting all MeCabal services..."
    docker-compose -f $COMPOSE_FILE restart
    print_success "All services restarted"
}

cmd_status() {
    print_info "Service Status:"
    echo ""
    docker-compose -f $COMPOSE_FILE ps
}

cmd_logs() {
    local service=${1:-}

    if [ -z "$service" ]; then
        print_info "Showing logs for all services (Ctrl+C to exit)..."
        docker-compose -f $COMPOSE_FILE logs -f --tail=100
    else
        print_info "Showing logs for $service (Ctrl+C to exit)..."
        docker-compose -f $COMPOSE_FILE logs -f --tail=100 $service
    fi
}

cmd_health() {
    print_info "Checking health of all services..."
    echo ""

    local all_healthy=true

    for service in "${!SERVICE_PORTS[@]}"; do
        local port=${SERVICE_PORTS[$service]}

        if curl -sf http://localhost:$port/health > /dev/null 2>&1; then
            print_success "$service (port $port) - Healthy"
        else
            print_error "$service (port $port) - Unhealthy or not responding"
            all_healthy=false
        fi
    done

    echo ""
    if [ "$all_healthy" = true ]; then
        print_success "All services are healthy!"
        return 0
    else
        print_error "Some services are unhealthy"
        return 1
    fi
}

cmd_backup() {
    print_info "Creating database backup..."

    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"

    # Create timestamped backup
    local backup_file="$BACKUP_DIR/backup_manual_$(date +%Y%m%d_%H%M%S).sql"

    # Check if postgres container is running
    if ! docker-compose -f $COMPOSE_FILE ps postgres | grep -q "Up"; then
        print_error "PostgreSQL container is not running"
        return 1
    fi

    # Load DATABASE variables from .env
    if [ -f .env ]; then
        source .env
    fi

    docker-compose -f $COMPOSE_FILE exec -T postgres pg_dump \
        -U ${DATABASE_USERNAME:-mecabal_user} \
        ${DATABASE_NAME:-mecabal_production} > "$backup_file"

    print_success "Backup saved to: $backup_file"

    # Show backup size
    local size=$(du -h "$backup_file" | cut -f1)
    print_info "Backup size: $size"

    # Clean old backups (keep last 7)
    local old_backups=$(ls -t "$BACKUP_DIR"/backup_manual_*.sql 2>/dev/null | tail -n +8)
    if [ -n "$old_backups" ]; then
        echo "$old_backups" | xargs rm -f
        print_info "Cleaned up old backups"
    fi
}

cmd_restore() {
    local backup_file=$1

    if [ -z "$backup_file" ]; then
        print_error "Usage: $0 restore <backup_file>"
        echo ""
        print_info "Available backups:"
        ls -lh "$BACKUP_DIR"/*.sql 2>/dev/null || echo "No backups found"
        return 1
    fi

    if [ ! -f "$backup_file" ]; then
        print_error "Backup file not found: $backup_file"
        return 1
    fi

    print_warning "This will restore database from: $backup_file"
    read -p "Are you sure? (yes/no): " -r

    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_info "Restore cancelled"
        return 0
    fi

    print_info "Restoring database..."

    # Load DATABASE variables from .env
    if [ -f .env ]; then
        source .env
    fi

    docker-compose -f $COMPOSE_FILE exec -T postgres psql \
        -U ${DATABASE_USERNAME:-mecabal_user} \
        -d ${DATABASE_NAME:-mecabal_production} < "$backup_file"

    print_success "Database restored successfully"
}

cmd_migrate() {
    print_info "Running database migrations..."

    docker-compose -f $COMPOSE_FILE run --rm api-gateway npm run migration:run

    print_success "Migrations completed"
}

cmd_migrate_revert() {
    print_warning "Reverting last migration..."

    docker-compose -f $COMPOSE_FILE run --rm api-gateway npm run migration:revert

    print_success "Migration reverted"
}

cmd_clean() {
    print_info "Cleaning up Docker resources..."

    # Remove unused images
    docker image prune -f

    # Remove unused volumes (be careful!)
    read -p "Remove unused volumes? This might delete data! (yes/no): " -r
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        docker volume prune -f
    fi

    print_success "Cleanup completed"
}

cmd_update() {
    print_info "Updating MeCabal backend..."

    # Create backup first
    cmd_backup

    # Pull latest code
    print_info "Pulling latest code..."
    git pull

    # Pull latest images
    print_info "Pulling latest Docker images..."
    docker-compose -f $COMPOSE_FILE pull

    # Stop services
    print_info "Stopping services..."
    docker-compose -f $COMPOSE_FILE down

    # Run migrations
    cmd_migrate

    # Start services
    print_info "Starting updated services..."
    docker-compose -f $COMPOSE_FILE up -d

    # Wait and check health
    sleep 15
    cmd_health

    print_success "Update completed!"
}

cmd_rebuild() {
    print_warning "This will rebuild all containers from scratch"
    read -p "Continue? (yes/no): " -r

    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_info "Rebuild cancelled"
        return 0
    fi

    print_info "Stopping and removing containers..."
    docker-compose -f $COMPOSE_FILE down

    print_info "Rebuilding containers..."
    docker-compose -f $COMPOSE_FILE build --no-cache

    print_info "Starting rebuilt containers..."
    docker-compose -f $COMPOSE_FILE up -d

    print_success "Rebuild completed"
}

cmd_shell() {
    local service=${1:-api-gateway}

    print_info "Opening shell in $service..."
    docker-compose -f $COMPOSE_FILE exec $service sh
}

cmd_db_shell() {
    print_info "Opening PostgreSQL shell..."

    if [ -f .env ]; then
        source .env
    fi

    docker-compose -f $COMPOSE_FILE exec postgres psql \
        -U ${DATABASE_USERNAME:-mecabal_user} \
        -d ${DATABASE_NAME:-mecabal_production}
}

cmd_stats() {
    print_info "Resource usage statistics:"
    echo ""
    docker stats --no-stream \
        $(docker-compose -f $COMPOSE_FILE ps -q)
}

cmd_env_check() {
    print_info "Checking environment configuration..."
    echo ""

    if [ ! -f .env ]; then
        print_error ".env file not found!"
        return 1
    fi

    # Required variables
    local required_vars=(
        "DATABASE_PASSWORD"
        "JWT_ACCESS_SECRET"
        "JWT_REFRESH_SECRET"
        "REDIS_PASSWORD"
    )

    local missing=false
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" .env; then
            print_error "Missing required variable: $var"
            missing=true
        else
            print_success "Found: $var"
        fi
    done

    if [ "$missing" = true ]; then
        print_error "Some required environment variables are missing"
        return 1
    else
        print_success "All required environment variables are set"
    fi
}

cmd_rollback() {
    print_warning "Rolling back to previous deployment..."

    # Find the most recent backup
    local latest_backup=$(ls -t "$BACKUP_DIR"/backup_*.sql 2>/dev/null | head -n1)

    if [ -z "$latest_backup" ]; then
        print_error "No backup found for rollback"
        return 1
    fi

    print_info "Latest backup: $latest_backup"
    read -p "Rollback using this backup? (yes/no): " -r

    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_info "Rollback cancelled"
        return 0
    fi

    # Restore database
    cmd_restore "$latest_backup"

    # Restart services
    cmd_restart

    print_success "Rollback completed"
}

# Help text
cmd_help() {
    cat << EOF
MeCabal Backend Deployment Helper

Usage: $0 <command> [options]

Commands:
  start              Start all services
  stop               Stop all services
  restart            Restart all services
  status             Show service status
  logs [service]     View logs (all services or specific service)
  health             Check health of all services

  backup             Create database backup
  restore <file>     Restore database from backup
  rollback           Rollback to previous deployment using latest backup

  migrate            Run database migrations
  migrate:revert     Revert last migration

  update             Pull latest code and update deployment
  rebuild            Rebuild all containers from scratch
  clean              Clean up unused Docker resources

  shell [service]    Open shell in container (default: api-gateway)
  db-shell           Open PostgreSQL shell
  stats              Show resource usage statistics
  env-check          Verify environment configuration

  help               Show this help message

Examples:
  $0 start                           # Start all services
  $0 logs auth-service               # View auth service logs
  $0 backup                          # Create database backup
  $0 restore backups/backup.sql      # Restore from backup
  $0 health                          # Check all services
  $0 shell user-service              # Open shell in user-service

EOF
}

# Main command dispatcher
case "${1:-help}" in
    start)
        cmd_start
        ;;
    stop)
        cmd_stop
        ;;
    restart)
        cmd_restart
        ;;
    status)
        cmd_status
        ;;
    logs)
        cmd_logs "$2"
        ;;
    health)
        cmd_health
        ;;
    backup)
        cmd_backup
        ;;
    restore)
        cmd_restore "$2"
        ;;
    rollback)
        cmd_rollback
        ;;
    migrate)
        cmd_migrate
        ;;
    migrate:revert)
        cmd_migrate_revert
        ;;
    update)
        cmd_update
        ;;
    rebuild)
        cmd_rebuild
        ;;
    clean)
        cmd_clean
        ;;
    shell)
        cmd_shell "$2"
        ;;
    db-shell)
        cmd_db_shell
        ;;
    stats)
        cmd_stats
        ;;
    env-check)
        cmd_env_check
        ;;
    help|--help|-h)
        cmd_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        cmd_help
        exit 1
        ;;
esac
