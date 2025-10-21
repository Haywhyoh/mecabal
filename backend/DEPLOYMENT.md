# MeCabal Backend Deployment Guide

Complete guide for deploying the MeCabal backend with all 10 microservices using GitHub Actions CI/CD.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Quick Start](#quick-start)
- [Server Setup](#server-setup)
- [GitHub CI/CD Setup](#github-cicd-setup)
- [Manual Deployment](#manual-deployment)
- [Environment Configuration](#environment-configuration)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

## Architecture Overview

### Microservices (All 10 Services)

| Service | Port | Description |
|---------|------|-------------|
| API Gateway | 3000 | Main entry point, routes requests to services |
| Auth Service | 3001 | Authentication, JWT, OTP verification |
| User Service | 3002 | User profiles and management |
| Social Service | 3003 | Community feed, posts, interactions |
| Messaging Service | 3004 | Real-time messaging, WebSocket |
| Marketplace Service | 3005 | Local commerce, listings |
| Events Service | 3006 | Community events management |
| Notification Service | 3007 | Push notifications, alerts |
| Location Service | 3008 | Nigerian locations, GPS, neighborhoods |
| Business Service | 3009 | Business profiles and services |

### Infrastructure Services

- **PostgreSQL with PostGIS** - Database with geographic extensions
- **Redis** - Caching and session management
- **RabbitMQ** - Message queue for async operations
- **MinIO** - S3-compatible object storage
- **Nginx** - Reverse proxy and load balancer

## Quick Start

### For Automated Deployment (Recommended)

1. **Set up your Ubuntu server:**
   ```bash
   chmod +x server-setup.sh
   ./server-setup.sh
   ```

2. **Configure GitHub Secrets** (see [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md))

3. **Push to trigger deployment:**
   ```bash
   # Deploy to staging
   git push origin develop

   # Deploy to production
   git push origin main
   ```

### For Manual Deployment

1. **Clone and setup:**
   ```bash
   git clone https://github.com/yourusername/mecabal.git
   cd mecabal/backend
   chmod +x deployment-helper.sh
   ```

2. **Configure environment:**
   ```bash
   cp env.example .env
   nano .env  # Edit with your values
   ```

3. **Deploy:**
   ```bash
   ./deployment-helper.sh start
   ```

## Server Setup

### Automated Server Setup (Ubuntu)

Run the server setup script on your fresh Ubuntu server:

```bash
# 1. SSH into your server
ssh ubuntu@your.server.ip

# 2. Clone the repository
git clone https://github.com/yourusername/mecabal.git
cd mecabal/backend

# 3. Run the setup script
chmod +x server-setup.sh
./server-setup.sh

# 4. Log out and back in for Docker permissions
exit
ssh ubuntu@your.server.ip
```

### What the Server Setup Script Does

1. **System Updates**
   - Updates all system packages
   - Installs essential build tools

2. **Docker Installation**
   - Installs Docker Engine and Docker Compose
   - Adds user to docker group
   - Configures Docker to start on boot

3. **Node.js Installation**
   - Installs Node.js 22.x
   - Installs npm package manager

4. **Security Configuration**
   - Configures UFW firewall
   - Sets up fail2ban
   - Opens required ports (80, 443, 3000-3009)

5. **Directory Structure**
   - Creates `/opt/mecabal` directory
   - Sets up logs, ssl, data, backups directories
   - Sets proper permissions

6. **Monitoring & Automation**
   - Creates systemd service for auto-start
   - Sets up log rotation
   - Configures automated backups (daily at 2 AM)
   - Creates monitoring script (runs every 5 minutes)

## GitHub CI/CD Setup

### Overview

The CI/CD pipeline automatically:
- ✅ Runs tests on every push
- ✅ Builds Docker images
- ✅ Deploys to staging on `develop` branch
- ✅ Deploys to production on `main` branch
- ✅ Runs database migrations
- ✅ Health checks all 10 services
- ✅ Automatic rollback on failure

### Setup Steps

1. **Configure GitHub Secrets**

   Follow the detailed guide: [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md)

   Required secrets:
   - `PRODUCTION_HOST` - Server IP or domain
   - `PRODUCTION_USERNAME` - SSH username
   - `PRODUCTION_SSH_KEY` - Private SSH key
   - `PRODUCTION_PROJECT_PATH` - Deployment directory
   - `PRODUCTION_ENV` - Base64 encoded .env file

2. **Deployment Workflow**

   ```
   Push to GitHub
        ↓
   Run Tests (lint, unit, e2e)
        ↓
   Build Docker Images
        ↓
   Push to GitHub Container Registry
        ↓
   Deploy to Server (staging/production)
        ↓
   Run Database Migrations
        ↓
   Health Check All Services
        ↓
   Rollback if Failed ❌ / Success ✅
   ```

3. **Triggering Deployments**

   **Automatic:**
   ```bash
   # Deploy to staging
   git checkout develop
   git push origin develop

   # Deploy to production
   git checkout main
   git push origin main
   ```

   **Manual:**
   - Go to GitHub Actions tab
   - Select "Deploy MeCabal Backend"
   - Click "Run workflow"
   - Choose environment (staging/production)

### CI/CD Features

#### Automated Testing
- ESLint code quality checks
- Unit tests with Jest
- E2E tests for critical flows

#### Database Migration Strategy
- Automatic backup before migration
- Migration runs in isolated container
- Rollback on migration failure

#### Health Checks
All 10 services must pass health checks:
```bash
✓ API Gateway (3000)
✓ Auth Service (3001)
✓ User Service (3002)
✓ Social Service (3003)
✓ Messaging Service (3004)
✓ Marketplace Service (3005)
✓ Events Service (3006)
✓ Notification Service (3007)
✓ Location Service (3008)
✓ Business Service (3009)
```

#### Rollback Mechanism
If any health check fails:
1. Stop new containers
2. Restore previous git commit
3. Restore database from backup
4. Restart old containers

## Manual Deployment

### Using Deployment Helper Script

The `deployment-helper.sh` script provides easy management:

```bash
# Make executable
chmod +x deployment-helper.sh

# Start all services
./deployment-helper.sh start

# Check health
./deployment-helper.sh health

# View logs
./deployment-helper.sh logs auth-service

# Create backup
./deployment-helper.sh backup

# See all commands
./deployment-helper.sh help
```

### Available Commands

| Command | Description |
|---------|-------------|
| `start` | Start all services |
| `stop` | Stop all services |
| `restart` | Restart all services |
| `status` | Show service status |
| `logs [service]` | View logs |
| `health` | Check all services health |
| `backup` | Create database backup |
| `restore <file>` | Restore from backup |
| `migrate` | Run migrations |
| `update` | Pull latest code & deploy |
| `rollback` | Rollback to previous version |

### Manual Deployment Steps

1. **SSH into server:**
   ```bash
   ssh ubuntu@your.server.ip
   cd /opt/mecabal/backend  # or your path
   ```

2. **Pull latest code:**
   ```bash
   git pull origin main
   ```

3. **Build and deploy:**
   ```bash
   docker-compose -f docker-compose.production.yml build
   docker-compose -f docker-compose.production.yml up -d
   ```

4. **Check health:**
   ```bash
   ./deployment-helper.sh health
   ```

## Environment Configuration

### Required Environment Variables

1. **Copy example file:**
   ```bash
   cp env.example .env
   ```

2. **Edit critical variables:**
   ```bash
   nano .env
   ```

   **Must change (security-critical):**
   ```env
   DATABASE_PASSWORD=use_strong_random_password_here
   JWT_ACCESS_SECRET=use_random_string_min_32_chars
   JWT_REFRESH_SECRET=use_different_random_string_min_32_chars
   REDIS_PASSWORD=use_strong_random_password_here
   ```

   **Must configure (service credentials):**
   ```env
   # Email service (Brevo)
   BREVO_API_KEY=your_actual_brevo_api_key
   EMAIL_HOST_USER=your_brevo_smtp_username
   EMAIL_HOST_PASSWORD=your_brevo_smtp_password

   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

3. **Generate secure secrets:**
   ```bash
   # Generate random secrets
   openssl rand -base64 32  # For JWT_ACCESS_SECRET
   openssl rand -base64 32  # For JWT_REFRESH_SECRET
   openssl rand -base64 24  # For DATABASE_PASSWORD
   ```

### Environment Files for Different Environments

- `.env` - Local development (not committed)
- `.env.staging` - Staging environment (base64 encoded in GitHub Secrets)
- `.env.production` - Production environment (base64 encoded in GitHub Secrets)

See [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md) for encoding instructions.

## Services and Ports

After deployment, these services will be available:

| Service | Port | Internal URL | Health Check |
|---------|------|--------------|--------------|
| API Gateway | 3000 | http://localhost:3000 | `/health` |
| Auth Service | 3001 | http://localhost:3001 | `/health` |
| User Service | 3002 | http://localhost:3002 | `/health` |
| Social Service | 3003 | http://localhost:3003 | `/health` |
| Messaging Service | 3004 | http://localhost:3004 | `/health` |
| Marketplace Service | 3005 | http://localhost:3005 | `/health` |
| Events Service | 3006 | http://localhost:3006 | `/health` |
| Notification Service | 3007 | http://localhost:3007 | `/health` |
| Location Service | 3008 | http://localhost:3008 | `/health` |
| Business Service | 3009 | http://localhost:3009 | `/health` |
| PostgreSQL | 5432 | localhost:5432 | - |
| Redis | 6379 | localhost:6379 | - |
| MinIO | 9000/9001 | http://localhost:9000 | Console: 9001 |
| RabbitMQ | 5672/15672 | http://localhost:15672 | Management UI |

## Monitoring & Maintenance

### Health Checks

**Check all services at once:**
```bash
./deployment-helper.sh health
```

**Check individual service:**
```bash
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3001/health  # Auth Service
# ... etc for all services
```

### Viewing Logs

**All services:**
```bash
./deployment-helper.sh logs
```

**Specific service:**
```bash
./deployment-helper.sh logs auth-service
./deployment-helper.sh logs location-service
```

**Docker Compose:**
```bash
docker-compose -f docker-compose.production.yml logs -f --tail=100
```

### Database Backups

**Manual backup:**
```bash
./deployment-helper.sh backup
```

**Automated backups:**
- Configured by server-setup.sh
- Runs daily at 2 AM
- Keeps last 7 backups
- Location: `/opt/mecabal/backups/`

**Restore from backup:**
```bash
./deployment-helper.sh restore backups/backup_20250101_020000.sql
```

### Resource Monitoring

**Check resource usage:**
```bash
./deployment-helper.sh stats
```

**Monitor disk space:**
```bash
df -h /opt/mecabal
```

**Monitor memory:**
```bash
free -h
```

### Updating Services

**Automated via CI/CD:**
- Push to `main` or `develop` branch
- GitHub Actions handles the rest

**Manual update:**
```bash
./deployment-helper.sh update
```

This will:
1. Create database backup
2. Pull latest code
3. Pull new Docker images
4. Run migrations
5. Restart services
6. Check health

## SSL Certificate Setup (Production)

### Using Let's Encrypt (Recommended)

1. **Point your domain to server:**
   ```
   A record: api.mecabal.com → your.server.ip
   ```

2. **Generate certificate:**
   ```bash
   sudo certbot certonly --standalone -d api.mecabal.com --email admin@mecabal.com --agree-tos
   ```

3. **Copy to project:**
   ```bash
   sudo cp /etc/letsencrypt/live/api.mecabal.com/fullchain.pem ~/mecabal/backend/ssl/api.mecabal.com.pem
   sudo cp /etc/letsencrypt/live/api.mecabal.com/privkey.pem ~/mecabal/backend/ssl/api.mecabal.com.key
   sudo chown $USER:$USER ~/mecabal/backend/ssl/*
   ```

4. **Setup auto-renewal:**
   ```bash
   sudo crontab -e
   # Add this line:
   0 3 * * * certbot renew --quiet --deploy-hook "docker-compose -f ~/mecabal/backend/docker-compose.production.yml restart nginx"
   ```

### Using Custom Certificate

Place your certificates in the `ssl/` directory:
```bash
backend/ssl/
├── api.mecabal.com.pem  # Full chain certificate
└── api.mecabal.com.key  # Private key
```

## Troubleshooting

### Common Issues and Solutions

#### Services Not Starting

**Problem:** Containers fail to start

**Solutions:**
```bash
# Check logs for specific service
docker-compose -f docker-compose.production.yml logs auth-service

# Check all container status
docker-compose -f docker-compose.production.yml ps

# Rebuild and restart
./deployment-helper.sh rebuild
```

#### Health Checks Failing

**Problem:** Services show as unhealthy

**Solutions:**
```bash
# Check if service is actually running
docker ps | grep auth-service

# Check service logs for errors
./deployment-helper.sh logs auth-service

# Verify environment variables
./deployment-helper.sh env-check

# Restart unhealthy service
docker-compose -f docker-compose.production.yml restart auth-service
```

#### Database Connection Failed

**Problem:** Services can't connect to PostgreSQL

**Solutions:**
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check PostgreSQL logs
docker-compose -f docker-compose.production.yml logs postgres

# Verify DATABASE_* variables in .env
grep DATABASE .env

# Test database connection
docker-compose -f docker-compose.production.yml exec postgres psql -U mecabal_user -d mecabal_production
```

#### Port Already in Use

**Problem:** Ports 3000-3009 are already occupied

**Solutions:**
```bash
# Find what's using the port (Linux/macOS)
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>

# Or stop all services and restart
./deployment-helper.sh stop
./deployment-helper.sh start
```

#### GitHub Actions Deployment Failed

**Problem:** CI/CD pipeline fails

**Solutions:**
1. Check GitHub Actions logs for specific error
2. Verify all GitHub Secrets are correctly set
3. Ensure SSH key has proper permissions on server
4. Test SSH connection manually:
   ```bash
   ssh -i ~/.ssh/mecabal_deploy ubuntu@your.server.ip
   ```

#### Migration Failed

**Problem:** Database migrations fail during deployment

**Solutions:**
```bash
# Check migration logs
docker-compose -f docker-compose.production.yml logs api-gateway

# Try running migrations manually
docker-compose -f docker-compose.production.yml run --rm api-gateway npm run migration:run

# Revert last migration if needed
./deployment-helper.sh migrate:revert

# Check TypeORM configuration
cat ormconfig.ts
```

#### Out of Disk Space

**Problem:** Server running out of storage

**Solutions:**
```bash
# Check disk usage
df -h

# Clean up old Docker images
./deployment-helper.sh clean

# Remove old backups (keeps last 7)
ls -t ~/mecabal/backend/backups/*.sql | tail -n +8 | xargs rm

# Clean up old logs
docker system prune -a
```

#### Memory Issues

**Problem:** Services crashing due to low memory

**Solutions:**
```bash
# Check memory usage
free -h

# Check which service is using most memory
./deployment-helper.sh stats

# Restart heavy services
docker-compose -f docker-compose.production.yml restart messaging-service

# Consider upgrading server RAM or adding swap
```

## Production Checklist

Before going to production, ensure:

### Security
- [ ] All default passwords changed in `.env`
- [ ] JWT secrets are strong (min 32 characters)
- [ ] SSL certificate is installed and valid
- [ ] Firewall is configured (only necessary ports open)
- [ ] fail2ban is active
- [ ] Database backups are automated
- [ ] Secrets are not committed to git

### Performance
- [ ] Server has adequate resources (min 4GB RAM recommended)
- [ ] Redis is configured for caching
- [ ] Database indexes are optimized
- [ ] Rate limiting is configured
- [ ] Compression is enabled (gzip)

### Monitoring
- [ ] Health checks are passing for all 10 services
- [ ] Log rotation is configured
- [ ] Automated backups are running
- [ ] Monitoring script is active
- [ ] Disk space alerts are set up

### Functionality
- [ ] All environment variables are set correctly
- [ ] Email service (Brevo) is working
- [ ] Google OAuth is configured
- [ ] File uploads work (MinIO)
- [ ] WebSocket connections work
- [ ] Database migrations succeed

### CI/CD
- [ ] GitHub Secrets are configured
- [ ] SSH access to server works
- [ ] Automated deployment to staging works
- [ ] Rollback mechanism is tested
- [ ] Production deployment requires approval

## Getting Help

### Documentation
- [GitHub Secrets Setup](GITHUB_SECRETS_SETUP.md) - CI/CD configuration
- [Backend Architecture](Backend_Architecture_Overview.md) - System design
- [API Documentation](API_Documentation.md) - API endpoints
- [Database Schema](Database_Schema.md) - Database structure

### Logs to Check
```bash
# Application logs
./deployment-helper.sh logs [service-name]

# System logs
journalctl -u mecabal-backend

# Docker logs
docker-compose -f docker-compose.production.yml logs
```

### Support Contacts
- Open an issue on GitHub repository
- Check existing issues for similar problems
- Review GitHub Actions workflow runs
- SSH into server and check service status

### Emergency Rollback

If deployment is completely broken:

```bash
# Option 1: Use deployment helper
./deployment-helper.sh rollback

# Option 2: Manual rollback
cd ~/mecabal/backend
git reset --hard <previous-commit-sha>
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d

# Option 3: Restore from backup
./deployment-helper.sh restore backups/backup_<timestamp>.sql
```

## Additional Resources

- **NestJS Documentation:** https://docs.nestjs.com
- **Docker Documentation:** https://docs.docker.com
- **PostgreSQL Documentation:** https://www.postgresql.org/docs
- **GitHub Actions Documentation:** https://docs.github.com/actions
- **Ubuntu Server Guide:** https://ubuntu.com/server/docs

---

**Last Updated:** 2025-01-21
**Version:** 1.0.0
**Maintainer:** MeCabal Team