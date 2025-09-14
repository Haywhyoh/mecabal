# MeCabal Backend Deployment Guide

This guide will help you deploy the MeCabal backend infrastructure with automatic Docker installation support.

## Quick Start

### Step 1: First Time Setup (After Cloning)
```bash
# Make scripts executable and setup environment
chmod +x setup.sh
./setup.sh
```

Or run the all-in-one setup command:
```bash
chmod +x setup.sh && ./setup.sh
```

### Step 2: Deploy Backend

#### For Linux/macOS Users:
```bash
./deploy.sh
```

#### For Windows Users:
```cmd
deploy.bat
```

## Alternative: Manual Permission Fix

If you get "Permission denied" when running scripts after cloning:

```bash
# Fix permissions for all scripts
chmod +x setup.sh deploy.sh

# Then run setup
./setup.sh
```

## What the Deployment Script Does

1. **Checks System Requirements**
   - Detects your operating system
   - Checks if Docker is installed
   - Offers to install Docker automatically if missing

2. **Docker Installation Support**
   - **Ubuntu/Debian**: Installs via official Docker repository
   - **CentOS/RHEL/Fedora**: Installs via yum package manager
   - **Arch Linux**: Installs via pacman
   - **macOS**: Installs Docker Desktop via Homebrew
   - **Windows**: Guides you to install Docker Desktop manually

3. **Environment Setup**
   - Creates `.env` file from `.env.example` if missing
   - Creates necessary directories (logs, ssl, data)
   - Sets proper permissions

4. **Application Build**
   - Installs Node.js dependencies
   - Builds the NestJS application

5. **Infrastructure Deployment**
   - Starts PostgreSQL with PostGIS extension
   - Starts Redis for caching
   - Starts RabbitMQ for messaging
   - Starts MinIO for file storage
   - Deploys all microservices with Nginx reverse proxy

6. **Health Checks**
   - Verifies database connectivity
   - Tests API endpoints
   - Shows container status

## Prerequisites

The script will install Docker for you, but you need:

- **Linux**: `curl`, `sudo` access
- **macOS**: Homebrew (script will check and guide you)
- **Windows**: Administrator privileges (for Docker Desktop)
- **All platforms**: Node.js 18+ and npm

## Manual Docker Installation

If you prefer to install Docker manually:

### Ubuntu/Debian:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### macOS:
```bash
brew install --cask docker
```

### Windows:
Download and install Docker Desktop from: https://docs.docker.com/desktop/install/windows-install/

## Environment Configuration

Before running the deployment script, configure your environment variables:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your actual values:
   ```bash
   # Required for email OTP
   BREVO_API_KEY=your_brevo_api_key_here
   BREVO_SMTP_USER=your_brevo_smtp_username
   BREVO_FROM_EMAIL=noreply@mecabal.com

   # Required for SMS OTP  
   SMARTSMS_API_TOKEN=your_smartsms_api_token_here

   # Required for WhatsApp OTP
   MESSAGE_CENTRAL_AUTH_TOKEN=your_message_central_auth_token
   MESSAGE_CENTRAL_CUSTOMER_ID=your_customer_id_here

   # JWT secrets (generate strong random strings)
   JWT_ACCESS_SECRET=your_jwt_access_secret_key_here
   JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
   ```

## Services and Ports

After deployment, these services will be available:

| Service | Port | URL |
|---------|------|-----|
| API Gateway | 3000 | http://localhost:3000 |
| Auth Service | 3001 | http://localhost:3001 |
| User Service | 3002 | http://localhost:3002 |
| Social Service | 3003 | http://localhost:3003 |
| Messaging Service | 3004 | http://localhost:3004 |
| Marketplace Service | 3005 | http://localhost:3005 |
| Events Service | 3006 | http://localhost:3006 |
| Notification Service | 3007 | http://localhost:3007 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |
| MinIO | 9000 | http://localhost:9000 |
| RabbitMQ Management | 15672 | http://localhost:15672 |

## Testing the Deployment

1. **Health Check**:
   ```bash
   curl http://localhost:3000/health
   ```

2. **Auth Service**:
   ```bash
   curl http://localhost:3001/auth/health
   ```

3. **Send Email OTP**:
   ```bash
   curl -X POST http://localhost:3001/auth/email/send-otp \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","purpose":"registration"}'
   ```

## SSL Certificate Setup (Production)

For production deployment with `api.mecabal.com`:

### Option 1: Let's Encrypt (Automatic)
The script will offer to generate SSL certificates automatically using Let's Encrypt.

### Option 2: Manual Certificate
Place your SSL certificates in the `ssl/` directory:
- `ssl/api.mecabal.com.pem` (certificate)
- `ssl/api.mecabal.com.key` (private key)

## Common Commands

### Start Services
```bash
# Linux/macOS
docker-compose -f docker-compose.production.yml up -d

# Windows
docker-compose -f docker-compose.production.yml up -d
```

### Stop Services
```bash
docker-compose -f docker-compose.production.yml down
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.production.yml logs -f

# Specific service
docker-compose -f docker-compose.production.yml logs -f auth-service
```

### Restart Services
```bash
docker-compose -f docker-compose.production.yml restart
```

### Update Services
```bash
./deploy.sh  # Re-run deployment script
```

## Troubleshooting

### Docker Not Starting (Linux)
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

### Permission Denied (Linux)
```bash
sudo usermod -aG docker $USER
newgrp docker  # Or logout and login again
```

### Docker Desktop Not Running (Windows/macOS)
1. Start Docker Desktop application
2. Wait for it to show "Docker Desktop is running" 
3. Re-run the deployment script

### Database Connection Issues
```bash
# Check if PostgreSQL container is running
docker ps | grep postgres

# Check PostgreSQL logs
docker-compose -f docker-compose.production.yml logs postgres
```

### Port Already in Use
```bash
# Find what's using the port
lsof -i :3000  # Linux/macOS
netstat -ano | findstr :3000  # Windows

# Stop conflicting services
docker-compose -f docker-compose.production.yml down
```

## Production Considerations

1. **Security**: Change all default passwords in `.env`
2. **SSL**: Set up proper SSL certificates
3. **Monitoring**: Consider adding monitoring tools
4. **Backups**: Set up automated database backups
5. **Updates**: Plan for regular security updates
6. **Scaling**: Consider load balancing for high traffic

## Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify environment variables in `.env`
3. Ensure all external services (Brevo, SmartSMS) are configured
4. Check firewall settings for port access

For deployment-specific issues, check:
- Docker installation and status
- Available disk space and memory
- Network connectivity for external services