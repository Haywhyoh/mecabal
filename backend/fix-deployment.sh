#!/bin/bash
# Quick fix script for deployment issues

echo "🔧 MeCabal Deployment Fix Script"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "📝 Creating .env from env.example..."

    if [ -f env.example ]; then
        cp env.example .env
        echo "✅ .env file created"
        echo ""
        echo "⚠️  IMPORTANT: Edit .env with your actual values:"
        echo "   nano .env"
        echo ""
        echo "Required changes:"
        echo "  - DATABASE_NAME=mecabal_production"
        echo "  - DATABASE_USERNAME=mecabal_user"
        echo "  - DATABASE_PASSWORD=<set-strong-password>"
        echo "  - JWT_ACCESS_SECRET=<min-32-chars>"
        echo "  - JWT_REFRESH_SECRET=<min-32-chars>"
        echo "  - REDIS_PASSWORD=<set-strong-password>"
        echo ""
        echo "Generate strong secrets with:"
        echo "  openssl rand -base64 32"
        echo ""
    else
        echo "❌ env.example not found!"
        exit 1
    fi
else
    echo "✅ .env file exists"
fi

# Validate critical env vars
echo "🔍 Validating environment variables..."
source .env 2>/dev/null

errors=0
if [ -z "$DATABASE_NAME" ] || [ "$DATABASE_NAME" = "your-database-name" ]; then
    echo "❌ DATABASE_NAME not set"
    errors=$((errors+1))
fi

if [ -z "$DATABASE_USERNAME" ] || [ "$DATABASE_USERNAME" = "your-username" ]; then
    echo "❌ DATABASE_USERNAME not set"
    errors=$((errors+1))
fi

if [ -z "$DATABASE_PASSWORD" ] || [ "$DATABASE_PASSWORD" = "your-password" ]; then
    echo "❌ DATABASE_PASSWORD not set properly"
    errors=$((errors+1))
fi

if [ -z "$JWT_ACCESS_SECRET" ] || [ "$JWT_ACCESS_SECRET" = "your-super-secret-jwt-key-change-this-in-production" ]; then
    echo "❌ JWT_ACCESS_SECRET not set properly"
    errors=$((errors+1))
fi

if [ $errors -gt 0 ]; then
    echo ""
    echo "⚠️  Found $errors issue(s) in .env file"
    echo "Please edit .env and set proper values:"
    echo "  nano .env"
    echo ""
    exit 1
else
    echo "✅ Environment variables look good"
fi

# Check if docker-compose.production.yml exists
if [ ! -f docker-compose.production.yml ]; then
    echo "❌ docker-compose.production.yml not found!"
    exit 1
fi

echo ""
echo "🧹 Cleaning up any existing containers..."
docker-compose -f docker-compose.production.yml down -v 2>/dev/null || true

echo ""
echo "✅ Ready to deploy!"
echo ""
echo "📋 Next steps:"
echo "1. Review .env file: cat .env | grep -v '^#'"
echo "2. Start services: ./deployment-helper.sh start"
echo ""
echo "Or run directly:"
echo "  docker-compose -f docker-compose.production.yml up -d"
