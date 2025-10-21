#!/bin/bash

# MeCabal Backend Server Setup Script
# This script prepares a server for MeCabal backend deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

print_status "Starting MeCabal Server Setup..."

# Update system packages
print_status "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install required packages
print_status "Installing required packages..."
sudo apt-get install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    htop \
    vim \
    ufw \
    fail2ban

# Install Docker
print_status "Installing Docker..."
sudo apt-get update
sudo apt-get install -y docker.io docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
print_warning "You need to log out and log back in for Docker group changes to take effect"

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Configure firewall
print_status "Configuring firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000:3009/tcp  # Backend services (all 10 microservices)
sudo ufw allow 5432/tcp       # PostgreSQL
sudo ufw allow 6379/tcp       # Redis
sudo ufw allow 9000:9001/tcp  # MinIO
sudo ufw allow 5672/tcp       # RabbitMQ
sudo ufw allow 15672/tcp      # RabbitMQ Management

# Configure fail2ban
print_status "Configuring fail2ban..."
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# Create application directory
print_status "Creating application directory..."
sudo mkdir -p /opt/mecabal
sudo chown $USER:$USER /opt/mecabal

# Create necessary directories
mkdir -p /opt/mecabal/{logs,ssl,data/{postgres,redis,minio,rabbitmq},backups}

# Set proper permissions
chmod 755 /opt/mecabal/logs
chmod 700 /opt/mecabal/ssl
chmod 700 /opt/mecabal/data
chmod 700 /opt/mecabal/backups

# Create systemd service for auto-start
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/mecabal-backend.service > /dev/null <<EOF
[Unit]
Description=MeCabal Backend Services
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/mecabal
ExecStart=/usr/bin/docker-compose -f docker-compose.production.yml up -d
ExecStop=/usr/bin/docker-compose -f docker-compose.production.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# Enable the service
sudo systemctl daemon-reload
sudo systemctl enable mecabal-backend.service

# Create log rotation configuration
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/mecabal > /dev/null <<EOF
/opt/mecabal/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        /usr/bin/docker-compose -f /opt/mecabal/docker-compose.production.yml restart > /dev/null 2>&1 || true
    endscript
}
EOF

# Create backup script
print_status "Creating backup script..."
tee /opt/mecabal/backup.sh > /dev/null <<'EOF'
#!/bin/bash
# MeCabal Backup Script

BACKUP_DIR="/opt/mecabal/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="mecabal_backup_$DATE.tar.gz"

cd /opt/mecabal

# Create backup
tar -czf "$BACKUP_DIR/$BACKUP_FILE" \
    --exclude=node_modules \
    --exclude=dist \
    --exclude=logs \
    --exclude=data \
    .

# Database backup
docker-compose -f docker-compose.production.yml exec -T postgres pg_dump -U $DATABASE_USERNAME $DATABASE_NAME > "$BACKUP_DIR/database_$DATE.sql"

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "mecabal_backup_*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "database_*.sql" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
EOF

chmod +x /opt/mecabal/backup.sh

# Add backup to crontab
print_status "Setting up automated backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/mecabal/backup.sh") | crontab -

# Create monitoring script
print_status "Creating monitoring script..."
tee /opt/mecabal/monitor.sh > /dev/null <<'EOF'
#!/bin/bash
# MeCabal Monitoring Script

LOG_FILE="/opt/mecabal/logs/monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "[$DATE] ERROR: Docker is not running" >> $LOG_FILE
    sudo systemctl start docker
    exit 1
fi

# Check if services are running
cd /opt/mecabal
if ! docker-compose -f docker-compose.production.yml ps | grep -q "Up"; then
    echo "[$DATE] WARNING: Some services are not running" >> $LOG_FILE
    docker-compose -f docker-compose.production.yml up -d
fi

# Check disk space
DISK_USAGE=$(df /opt/mecabal | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "[$DATE] WARNING: Disk usage is $DISK_USAGE%" >> $LOG_FILE
fi

# Check memory usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.2f", $3*100/$2}')
if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
    echo "[$DATE] WARNING: Memory usage is $MEMORY_USAGE%" >> $LOG_FILE
fi

echo "[$DATE] Health check completed" >> $LOG_FILE
EOF

chmod +x /opt/mecabal/monitor.sh

# Add monitoring to crontab (every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/mecabal/monitor.sh") | crontab -

# Initialize database container and create database
print_status "Initializing database..."

# Check if .env file exists
if [ ! -f /opt/mecabal/.env ]; then
    print_warning "No .env file found. Creating from env.example..."
    if [ -f env.example ]; then
        cp env.example /opt/mecabal/.env
        print_warning "Please update /opt/mecabal/.env with production values"
    else
        print_error ".env file not found. Database initialization will be skipped."
        print_warning "You need to create /opt/mecabal/.env manually before first deployment"
    fi
fi

# If .env exists, initialize database
if [ -f /opt/mecabal/.env ]; then
    print_status "Loading environment variables..."
    export $(cat /opt/mecabal/.env | grep -E "^DATABASE_|^POSTGRES_" | grep -v '^#' | xargs)

    print_status "Starting PostgreSQL container..."
    cd /opt/mecabal

    # Start only PostgreSQL first
    docker-compose -f docker-compose.production.yml up -d postgres

    print_status "Waiting for PostgreSQL to be ready..."
    for i in {1..30}; do
        if docker-compose -f docker-compose.production.yml exec -T postgres pg_isready -U ${DATABASE_USERNAME:-mecabal_user} > /dev/null 2>&1; then
            print_success "PostgreSQL is ready!"
            break
        fi
        echo "Waiting for PostgreSQL... ($i/30)"
        sleep 2
    done

    # Check if database exists, create if it doesn't
    print_status "Checking if database exists..."
    DB_EXISTS=$(docker-compose -f docker-compose.production.yml exec -T postgres psql -U ${DATABASE_USERNAME:-mecabal_user} -lqt | cut -d \| -f 1 | grep -w ${DATABASE_NAME:-mecabal_production} | wc -l)

    if [ $DB_EXISTS -eq 0 ]; then
        print_status "Creating database ${DATABASE_NAME:-mecabal_production}..."
        docker-compose -f docker-compose.production.yml exec -T postgres psql -U ${DATABASE_USERNAME:-mecabal_user} -c "CREATE DATABASE ${DATABASE_NAME:-mecabal_production};"
        print_success "Database created successfully!"
    else
        print_success "Database ${DATABASE_NAME:-mecabal_production} already exists"
    fi

    # Enable PostGIS extension
    print_status "Enabling PostGIS extension..."
    docker-compose -f docker-compose.production.yml exec -T postgres psql -U ${DATABASE_USERNAME:-mecabal_user} -d ${DATABASE_NAME:-mecabal_production} -c "CREATE EXTENSION IF NOT EXISTS postgis;"
    docker-compose -f docker-compose.production.yml exec -T postgres psql -U ${DATABASE_USERNAME:-mecabal_user} -d ${DATABASE_NAME:-mecabal_production} -c "CREATE EXTENSION IF NOT EXISTS postgis_topology;"
    print_success "PostGIS extension enabled!"

    # Stop PostgreSQL for now (will be started by deployment)
    print_status "Stopping PostgreSQL container..."
    docker-compose -f docker-compose.production.yml down

    print_success "Database initialization completed!"
fi

# Create environment files
print_status "Creating environment file templates..."
if [ -f env.staging ]; then
    cp env.staging /opt/mecabal/.env.staging 2>/dev/null || print_warning "env.staging not found in current directory"
fi
if [ -f env.production ]; then
    cp env.production /opt/mecabal/.env.production 2>/dev/null || print_warning "env.production not found in current directory"
fi

# Create README for server
print_status "Creating server documentation..."
tee /opt/mecabal/README.md > /dev/null <<'EOF'
# MeCabal Backend Server

This server is configured to run the MeCabal backend services.

## Services
- API Gateway: Port 3000
- Auth Service: Port 3001
- User Service: Port 3002
- Social Service: Port 3003
- Messaging Service: Port 3004
- Marketplace Service: Port 3005
- Events Service: Port 3006
- Notification Service: Port 3007
- Location Service: Port 3008
- Business Service: Port 3009

## Management Commands

### Start Services
```bash
sudo systemctl start mecabal-backend
```

### Stop Services
```bash
sudo systemctl stop mecabal-backend
```

### Restart Services
```bash
sudo systemctl restart mecabal-backend
```

### View Logs
```bash
docker-compose -f docker-compose.production.yml logs -f
```

### Manual Backup
```bash
/opt/mecabal/backup.sh
```

### Health Check
```bash
curl http://localhost:3000/health
```

## Directory Structure
- `/opt/mecabal/` - Main application directory
- `/opt/mecabal/logs/` - Application logs
- `/opt/mecabal/ssl/` - SSL certificates
- `/opt/mecabal/data/` - Persistent data
- `/opt/mecabal/backups/` - Backup files

## Security
- Firewall configured (UFW)
- Fail2ban enabled
- Docker security best practices
- Regular automated backups
EOF

print_success "Server setup completed successfully!"
echo
echo "=== Next Steps ==="
echo "1. Log out and log back in to apply Docker group changes"
echo "2. IMPORTANT: Update /opt/mecabal/.env with production values"
echo "3. Set up SSL certificates in /opt/mecabal/ssl/"
echo "4. Configure GitHub Actions secrets for deployment"
echo "5. Test the deployment with: sudo systemctl start mecabal-backend"
echo
echo "=== GitHub Secrets Required ==="
echo "PRODUCTION_HOST=your-production-server-ip"
echo "PRODUCTION_USERNAME=your-username"
echo "PRODUCTION_SSH_KEY=your-private-ssh-key"
echo "PRODUCTION_PORT=22"
echo "PRODUCTION_PROJECT_PATH=/opt/mecabal"
echo "PRODUCTION_ENV=base64-encoded-.env-file"
echo
echo "To create PRODUCTION_ENV secret:"
echo "1. Update /opt/mecabal/.env with all production values"
echo "2. Run: cat /opt/mecabal/.env | base64 -w 0"
echo "3. Copy the output and add to GitHub Secrets as PRODUCTION_ENV"
echo
print_success "Setup script completed!"
echo
print_warning "Database has been initialized. Next deployment will run migrations automatically."
