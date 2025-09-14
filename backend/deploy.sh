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

# Ensure script has execute permissions (fix for cloned repos)
if [ ! -x "$0" ]; then
    print_status "Fixing script permissions..."
    chmod +x "$0"
    print_success "Script permissions fixed!"
fi

# Function to install Docker
install_docker() {
    print_status "Installing Docker..."
    
    # Detect operating system
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v apt-get &> /dev/null; then
            # Ubuntu/Debian
            print_status "Detected Ubuntu/Debian. Installing Docker..."
            sudo apt-get update
            sudo apt-get install -y ca-certificates curl gnupg lsb-release
            
            # Add Docker's official GPG key
            sudo mkdir -p /etc/apt/keyrings
            curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
            
            # Set up repository
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
            
            # Install Docker Engine
            sudo apt-get update
            sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            
        elif command -v yum &> /dev/null; then
            # CentOS/RHEL/Fedora
            print_status "Detected CentOS/RHEL/Fedora. Installing Docker..."
            sudo yum update -y
            sudo yum install -y yum-utils
            sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
            sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            
        elif command -v pacman &> /dev/null; then
            # Arch Linux
            print_status "Detected Arch Linux. Installing Docker..."
            sudo pacman -Sy docker docker-compose
            
        else
            print_error "Unsupported Linux distribution. Please install Docker manually."
            print_status "Visit: https://docs.docker.com/engine/install/"
            exit 1
        fi
        
        # Start and enable Docker service
        sudo systemctl start docker
        sudo systemctl enable docker
        
        # Add current user to docker group
        sudo usermod -aG docker $USER
        print_warning "You need to log out and log back in for Docker group changes to take effect."
        print_status "Or run: newgrp docker"
        
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        print_status "Detected macOS. Installing Docker..."
        
        if command -v brew &> /dev/null; then
            # Install via Homebrew
            brew install --cask docker
            print_status "Docker Desktop installed via Homebrew."
            print_warning "Please start Docker Desktop from Applications folder."
        else
            print_error "Homebrew not found. Please install Docker Desktop manually."
            print_status "Download from: https://docs.docker.com/desktop/install/mac-install/"
            exit 1
        fi
        
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        # Windows (Git Bash/MSYS2)
        print_status "Detected Windows. Please install Docker Desktop manually."
        print_status "Download from: https://docs.docker.com/desktop/install/windows-install/"
        print_warning "After installation, restart this script."
        exit 1
        
    else
        print_error "Unsupported operating system: $OSTYPE"
        print_status "Please install Docker manually from: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    print_success "Docker installation completed!"
}

# Function to install Docker Compose (for older systems)
install_docker_compose() {
    print_status "Installing Docker Compose..."
    
    # Get latest version
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    
    # Download and install
    sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    # Create symlink if needed
    if [ ! -f "/usr/bin/docker-compose" ]; then
        sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
    fi
    
    print_success "Docker Compose $DOCKER_COMPOSE_VERSION installed!"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_warning "Docker is not installed."
    read -p "Do you want to install Docker automatically? (y/n): " install_docker_choice
    
    if [ "$install_docker_choice" = "y" ] || [ "$install_docker_choice" = "Y" ]; then
        install_docker
    else
        print_error "Docker is required. Please install Docker manually and run this script again."
        print_status "Installation guide: https://docs.docker.com/get-docker/"
        exit 1
    fi
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_warning "Docker Compose is not installed."
    
    # Check if it's the new docker compose plugin
    if docker compose version &> /dev/null; then
        print_success "Docker Compose (plugin) is available"
        COMPOSE_COMMAND="docker compose"
    else
        read -p "Do you want to install Docker Compose? (y/n): " install_compose_choice
        
        if [ "$install_compose_choice" = "y" ] || [ "$install_compose_choice" = "Y" ]; then
            install_docker_compose
            COMPOSE_COMMAND="docker-compose"
        else
            print_error "Docker Compose is required. Please install it manually."
            print_status "Installation guide: https://docs.docker.com/compose/install/"
            exit 1
        fi
    fi
else
    if command -v docker-compose &> /dev/null; then
        COMPOSE_COMMAND="docker-compose"
    else
        COMPOSE_COMMAND="docker compose"
    fi
fi

# Verify Docker is running
if ! docker info &> /dev/null; then
    print_error "Docker is installed but not running. Please start Docker and try again."
    print_status "On Linux: sudo systemctl start docker"
    print_status "On macOS/Windows: Start Docker Desktop"
    exit 1
fi

print_success "Docker and Docker Compose are ready!"

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
$COMPOSE_COMMAND -f docker-compose.production.yml down 2>/dev/null || true

# Pull latest images
print_status "Pulling latest base images..."
$COMPOSE_COMMAND -f docker-compose.production.yml pull

# Start the infrastructure
print_status "Starting MeCabal infrastructure..."
$COMPOSE_COMMAND -f docker-compose.production.yml up -d

# Wait for databases to be ready
print_status "Waiting for databases to be ready..."
sleep 30

# Run database migrations
print_status "Running database migrations..."
$COMPOSE_COMMAND -f docker-compose.production.yml exec -T postgres psql -U "$DATABASE_USERNAME" -d "$DATABASE_NAME" -c "SELECT 1;" > /dev/null 2>&1

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
$COMPOSE_COMMAND -f docker-compose.production.yml ps

print_success "Deployment script completed successfully!"