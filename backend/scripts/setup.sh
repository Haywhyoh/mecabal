#!/bin/bash

# MeCabal Backend Setup Script
# Run this immediately after cloning the repository

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

print_status "Setting up MeCabal Backend..."

# Make scripts executable
print_status "Making scripts executable..."
chmod +x deploy.sh
chmod +x setup.sh

# Check if we're in the right directory
if [ ! -f "deploy.sh" ]; then
    print_error "deploy.sh not found. Make sure you're in the backend directory."
    exit 1
fi

if [ ! -f "package.json" ]; then
    print_error "package.json not found. Make sure you're in the backend directory."
    exit 1
fi

print_success "Scripts are now executable!"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        print_status "Creating .env file from .env.example..."
        cp .env.example .env
        print_success ".env file created!"
        print_warning "Please edit .env file with your actual configuration values before running deploy.sh"
        echo
        echo "Key environment variables to configure:"
        echo "- BREVO_API_KEY (for email OTP)"
        echo "- SMARTSMS_API_TOKEN (for SMS OTP)"
        echo "- MESSAGE_CENTRAL_AUTH_TOKEN (for WhatsApp OTP)"
        echo "- JWT_ACCESS_SECRET and JWT_REFRESH_SECRET (generate random strings)"
        echo
    else
        print_warning ".env.example not found, you'll need to create .env manually"
    fi
else
    print_success ".env file already exists"
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs ssl data/postgres data/redis data/minio

print_success "Directories created successfully!"

# Check Node.js version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
    
    # Check if Node version is 18 or higher
    NODE_MAJOR_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
        print_warning "Node.js version is $NODE_VERSION. Recommended: v18 or higher"
        print_status "You can install Node.js 18+ from: https://nodejs.org/"
    fi
else
    print_warning "Node.js not found. Installing Node.js..."
    
    # Try to install Node.js based on package manager
    if command -v apt-get &> /dev/null; then
        # Ubuntu/Debian
        print_status "Installing Node.js via apt..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif command -v yum &> /dev/null; then
        # CentOS/RHEL/Fedora
        print_status "Installing Node.js via yum..."
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs npm
    elif command -v pacman &> /dev/null; then
        # Arch Linux
        print_status "Installing Node.js via pacman..."
        sudo pacman -Sy nodejs npm
    else
        print_error "Could not install Node.js automatically. Please install manually:"
        print_status "Visit: https://nodejs.org/"
        exit 1
    fi
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm found: $NPM_VERSION"
else
    print_error "npm not found. Please install npm."
    exit 1
fi

# Install dependencies (optional, for faster deployment later)
read -p "Do you want to install Node.js dependencies now? (y/n): " install_deps
if [ "$install_deps" = "y" ] || [ "$install_deps" = "Y" ]; then
    print_status "Installing Node.js dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        print_success "Dependencies installed successfully!"
    else
        print_warning "Failed to install dependencies. You can try again later with: npm install"
    fi
fi

print_success "Setup completed successfully!"
echo
echo "=== Next Steps ==="
echo "1. Edit .env file with your configuration:"
echo "   nano .env  # or use your preferred editor"
echo
echo "2. Run the deployment script:"
echo "   ./deploy.sh"
echo
echo "=== Quick Start Commands ==="
echo "Edit environment: nano .env"
echo "Deploy backend:   ./deploy.sh"
echo "Check status:     docker-compose -f docker-compose.production.yml ps"
echo "View logs:        docker-compose -f docker-compose.production.yml logs -f"
echo "Stop services:    docker-compose -f docker-compose.production.yml down"
echo

print_status "You can now run: ./deploy.sh"