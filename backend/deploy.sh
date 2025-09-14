#!/bin/bash

# MeCabal Backend Deployment Script
# This script sets up the entire MeCabal backend infrastructure

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

print_status "Starting MeCabal Backend Deployment..."

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        print_warning ".env file not found. Creating from .env.example..."
        cp .env.example .env
        print_warning "Please edit .env file with your actual configuration values."
        read -p "Press Enter to continue after editing .env file..."
    else
        print_error ".env file not found and no .env.example available"
        exit 1
    fi
fi

# Load environment variables
source .env

print_status "Environment loaded successfully"

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs ssl data/postgres data/redis data/minio

# Set proper permissions
chmod 755 logs ssl data
chmod 700 data/postgres data/redis data/minio

print_success "Directories created successfully"

# Check if SSL certificates exist (for production)
if [ "$NODE_ENV" = "production" ]; then
    if [ ! -f "ssl/api.mecabal.com.pem" ] || [ ! -f "ssl/api.mecabal.com.key" ]; then
        print_warning "SSL certificates not found in ssl/ directory"
        print_status "You can either:"
        print_status "1. Place your SSL certificates in ssl/ directory"
        print_status "2. Use Let's Encrypt to generate certificates automatically"
        
        read -p "Do you want to generate Let's Encrypt certificates? (y/n): " generate_ssl
        
        if [ "$generate_ssl" = "y" ] || [ "$generate_ssl" = "Y" ]; then
            print_status "Setting up Let's Encrypt certificates..."
            
            # Create temporary nginx config for certificate generation
            cat > nginx-certbot.conf << EOF
server {
    listen 80;
    server_name api.mecabal.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}
EOF
            
            # Start nginx with temporary config
            docker run -d --name temp-nginx \
                -p 80:80 \
                -v $(pwd)/nginx-certbot.conf:/etc/nginx/conf.d/default.conf \
                -v $(pwd)/ssl:/var/www/certbot \
                nginx:alpine
            
            # Generate certificates
            docker run --rm \
                -v $(pwd)/ssl:/etc/letsencrypt/live/api.mecabal.com \
                -v $(pwd)/ssl:/var/www/certbot \
                certbot/certbot certonly \
                --webroot \
                --webroot-path=/var/www/certbot \
                --email admin@mecabal.com \
                --agree-tos \
                --no-eff-email \
                -d api.mecabal.com
            
            # Stop temporary nginx
            docker stop temp-nginx
            docker rm temp-nginx
            
            # Copy certificates to correct location
            cp ssl/live/api.mecabal.com/fullchain.pem ssl/api.mecabal.com.pem
            cp ssl/live/api.mecabal.com/privkey.pem ssl/api.mecabal.com.key
            
            print_success "SSL certificates generated successfully"
        fi
    fi
fi

# Build the application
print_status "Building the application..."
npm install
npm run build

if [ $? -eq 0 ]; then
    print_success "Application built successfully"
else
    print_error "Application build failed"
    exit 1
fi

# Stop any running containers
print_status "Stopping any running containers..."
docker-compose -f docker-compose.production.yml down 2>/dev/null || true

# Pull latest images
print_status "Pulling latest base images..."
docker-compose -f docker-compose.production.yml pull

# Start the infrastructure
print_status "Starting MeCabal infrastructure..."
docker-compose -f docker-compose.production.yml up -d

# Wait for databases to be ready
print_status "Waiting for databases to be ready..."
sleep 30

# Run database migrations
print_status "Running database migrations..."
docker-compose -f docker-compose.production.yml exec -T postgres psql -U "$DATABASE_USERNAME" -d "$DATABASE_NAME" -c "SELECT 1;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    print_success "Database is ready"
    
    # Run migrations (when available)
    # npm run migration:run
    
    # Seed database (if needed)
    # npm run db:seed
    
else
    print_error "Database is not ready"
    exit 1
fi

# Health check
print_status "Performing health checks..."
sleep 10

# Check API Gateway
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    print_success "API Gateway is healthy"
else
    print_warning "API Gateway health check failed"
fi

# Check Auth Service
if curl -f http://localhost:3001/auth/health > /dev/null 2>&1; then
    print_success "Auth Service is healthy"
else
    print_warning "Auth Service health check failed"
fi

# Display deployment summary
print_success "MeCabal Backend deployment completed!"
echo
echo "=== Deployment Summary ==="
echo "API Gateway: http://localhost:3000"
echo "Auth Service: http://localhost:3001"
echo "User Service: http://localhost:3002"
echo "Social Service: http://localhost:3003"
echo "Messaging Service: http://localhost:3004"
echo "Marketplace Service: http://localhost:3005"
echo "Events Service: http://localhost:3006"
echo "Notification Service: http://localhost:3007"
echo
echo "Database: PostgreSQL on localhost:5432"
echo "Redis: Redis on localhost:6379"
echo "MinIO: S3-compatible storage on localhost:9000"
echo "RabbitMQ: Message queue on localhost:5672 (Management: localhost:15672)"
echo

if [ "$NODE_ENV" = "production" ]; then
    echo "Production URL: https://api.mecabal.com"
    echo "Nginx is handling SSL termination and load balancing"
fi

echo
echo "=== Next Steps ==="
echo "1. Configure your environment variables in .env"
echo "2. Set up SSL certificates for production"
echo "3. Configure external services (Brevo, SmartSMS, Message Central)"
echo "4. Test the API endpoints"
echo "5. Update mobile app to use the new backend"
echo

# Display container status
print_status "Container status:"
docker-compose -f docker-compose.production.yml ps

print_success "Deployment script completed successfully!"