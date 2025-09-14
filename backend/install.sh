#!/bin/bash

# MeCabal Backend One-Line Installer
# Usage: curl -sSL https://raw.githubusercontent.com/your-org/mecabal/main/backend/install.sh | bash
# Or after cloning: bash install.sh

set -e

echo "🏠 MeCabal Backend Installer"
echo "========================="

# Fix permissions for all scripts
echo "Fixing script permissions..."
chmod +x setup.sh deploy.sh install.sh 2>/dev/null || echo "Some scripts may not exist yet"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the backend directory."
    echo "   cd mecabal/backend"
    exit 1
fi

echo "✅ Setting up environment..."
if [ -f "setup.sh" ]; then
    ./setup.sh
else
    echo "❌ setup.sh not found. Running basic setup..."
    
    # Basic setup if setup.sh is missing
    mkdir -p logs ssl data/postgres data/redis data/minio
    
    if [ -f ".env.example" ] && [ ! -f ".env" ]; then
        cp .env.example .env
        echo "⚠️  Created .env file. Please edit it with your configuration."
    fi
fi

echo ""
echo "🚀 Setup complete! Now you can run:"
echo "   ./deploy.sh"
echo ""
echo "📝 Don't forget to:"
echo "   1. Edit .env file with your API keys"
echo "   2. Ensure Docker is installed"
echo "   3. Run ./deploy.sh to start all services"