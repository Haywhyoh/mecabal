# MeCabal Backend GitHub Actions Deployment Guide

This guide will help you set up automated deployment of your MeCabal backend using GitHub Actions.

## Overview

The deployment setup includes:
- ✅ **Automated Testing**: Runs tests on every push/PR
- ✅ **Docker Build**: Builds and pushes Docker images to GitHub Container Registry
- ✅ **Multi-Environment**: Supports staging and production deployments
- ✅ **Health Checks**: Verifies deployment success
- ✅ **Rollback Support**: Easy rollback with Docker image tags
- ✅ **Monitoring**: Automated health checks and logging

## Prerequisites

### 1. Server Requirements
- Ubuntu 20.04+ (recommended)
- Minimum 4GB RAM, 2 CPU cores
- 50GB+ disk space
- Docker and Docker Compose installed
- SSH access configured

### 2. GitHub Repository
- Repository with your MeCabal backend code
- GitHub Actions enabled
- Container registry access (automatically enabled)

## Setup Instructions

### Step 1: Prepare Your Server

1. **Connect to your server via SSH:**
   ```bash
   ssh your-username@your-server-ip
   ```

2. **Run the server setup script:**
   ```bash
   # Download and run the setup script
   curl -O https://raw.githubusercontent.com/your-username/mecabal/main/backend/server-setup.sh
   chmod +x server-setup.sh
   ./server-setup.sh
   ```

3. **Log out and log back in** to apply Docker group changes:
   ```bash
   exit
   ssh your-username@your-server-ip
   ```

### Step 2: Clone Your Repository

1. **Clone the repository to the server:**
   ```bash
   cd /opt/mecabal
   git clone https://github.com/your-username/mecabal.git .
   ```

2. **Set up environment files:**
   ```bash
   # Copy environment templates
   cp env.staging .env.staging
   cp env.production .env.production
   
   # Edit with your actual values
   nano .env.staging
   nano .env.production
   ```

### Step 3: Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add these secrets:

#### Required Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `STAGING_HOST` | Staging server IP address | `192.168.1.100` |
| `STAGING_USERNAME` | SSH username for staging | `ubuntu` |
| `STAGING_SSH_KEY` | Private SSH key for staging | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `STAGING_PROJECT_PATH` | Path to project on staging server | `/opt/mecabal` |
| `PRODUCTION_HOST` | Production server IP address | `203.0.113.10` |
| `PRODUCTION_USERNAME` | SSH username for production | `ubuntu` |
| `PRODUCTION_SSH_KEY` | Private SSH key for production | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `PRODUCTION_PROJECT_PATH` | Path to project on production server | `/opt/mecabal` |

#### Optional Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SLACK_WEBHOOK_URL` | Slack webhook for notifications | `https://hooks.slack.com/services/...` |

### Step 4: Generate SSH Keys

1. **Generate SSH key pair on your local machine:**
   ```bash
   ssh-keygen -t ed25519 -C "mecabal-deployment" -f ~/.ssh/mecabal_deploy
   ```

2. **Add public key to server:**
   ```bash
   # Copy public key to server
   ssh-copy-id -i ~/.ssh/mecabal_deploy.pub your-username@your-server-ip
   
   # Or manually add to authorized_keys
   cat ~/.ssh/mecabal_deploy.pub | ssh your-username@your-server-ip 'cat >> ~/.ssh/authorized_keys'
   ```

3. **Add private key to GitHub secrets:**
   ```bash
   # Copy private key content
   cat ~/.ssh/mecabal_deploy
   # Copy the entire output and paste it as STAGING_SSH_KEY and PRODUCTION_SSH_KEY
   ```

### Step 5: Configure Environment Variables

Edit your environment files with actual values:

#### Staging Environment (`/opt/mecabal/.env.staging`)
```bash
# Database
DATABASE_PASSWORD=your_secure_staging_password
JWT_ACCESS_SECRET=your_jwt_secret_for_staging
JWT_REFRESH_SECRET=your_refresh_secret_for_staging

# External Services
BREVO_API_KEY=your_brevo_api_key
SMARTSMS_API_TOKEN=your_smartsms_token
MESSAGE_CENTRAL_AUTH_TOKEN=your_message_central_token
```

#### Production Environment (`/opt/mecabal/.env.production`)
```bash
# Database
DATABASE_PASSWORD=your_secure_production_password
JWT_ACCESS_SECRET=your_jwt_secret_for_production
JWT_REFRESH_SECRET=your_refresh_secret_for_production

# External Services
BREVO_API_KEY=your_brevo_api_key
SMARTSMS_API_TOKEN=your_smartsms_token
MESSAGE_CENTRAL_AUTH_TOKEN=your_message_central_token
```

### Step 6: Test the Deployment

1. **Push to develop branch to trigger staging deployment:**
   ```bash
   git checkout develop
   git push origin develop
   ```

2. **Check GitHub Actions:**
   - Go to your repository → Actions tab
   - Watch the deployment workflow run
   - Check for any errors

3. **Verify staging deployment:**
   ```bash
   # On your server
   curl http://localhost:3000/health
   curl http://localhost:3001/auth/health
   ```

4. **Deploy to production:**
   ```bash
   git checkout main
   git push origin main
   ```

## Deployment Workflow

### Automatic Deployments

- **Staging**: Deploys automatically when you push to `develop` branch
- **Production**: Deploys automatically when you push to `main` branch

### Manual Deployments

1. Go to your repository → Actions tab
2. Select "Deploy MeCabal Backend" workflow
3. Click "Run workflow"
4. Choose environment (staging/production)
5. Click "Run workflow"

### Deployment Process

1. **Test Phase**: Runs linting, unit tests, and e2e tests
2. **Build Phase**: Builds Docker image and pushes to GitHub Container Registry
3. **Deploy Phase**: 
   - Connects to server via SSH
   - Pulls latest code
   - Updates environment variables
   - Pulls latest Docker image
   - Stops old containers
   - Starts new containers
   - Runs health checks
4. **Notify Phase**: Sends notifications (if configured)

## Monitoring and Maintenance

### Health Checks

The deployment includes comprehensive health checks:
- API Gateway: `http://localhost:3000/health`
- Auth Service: `http://localhost:3001/auth/health`
- All microservices: Ports 3002-3007

### Logs

View logs on your server:
```bash
# All services
docker-compose -f docker-compose.production.yml logs -f

# Specific service
docker-compose -f docker-compose.production.yml logs -f auth-service

# System logs
tail -f /opt/mecabal/logs/monitor.log
```

### Backups

Automated backups run daily at 2 AM:
- Application code backup
- Database backup
- Old backups are automatically cleaned (7 days retention)

Manual backup:
```bash
/opt/mecabal/backup.sh
```

### Service Management

```bash
# Start services
sudo systemctl start mecabal-backend

# Stop services
sudo systemctl stop mecabal-backend

# Restart services
sudo systemctl restart mecabal-backend

# Check status
sudo systemctl status mecabal-backend
```

## Troubleshooting

### Common Issues

1. **SSH Connection Failed**
   - Verify SSH key is correct
   - Check server IP and username
   - Ensure SSH key is in `~/.ssh/authorized_keys`

2. **Docker Build Failed**
   - Check Dockerfile syntax
   - Verify all dependencies are installed
   - Check GitHub Actions logs for specific errors

3. **Health Check Failed**
   - Check if all services are running: `docker ps`
   - Check service logs: `docker-compose logs service-name`
   - Verify environment variables are correct

4. **Database Connection Failed**
   - Check database credentials in `.env` file
   - Verify PostgreSQL container is running
   - Check database logs: `docker-compose logs postgres`

### Debug Commands

```bash
# Check container status
docker ps -a

# Check service logs
docker-compose -f docker-compose.production.yml logs

# Check system resources
htop
df -h

# Check network connectivity
curl -I http://localhost:3000/health
```

### Rollback

If deployment fails, you can rollback:

1. **Quick rollback (on server):**
   ```bash
   cd /opt/mecabal
   git checkout previous-commit-hash
   docker-compose -f docker-compose.production.yml up -d
   ```

2. **Rollback via GitHub Actions:**
   - Go to Actions tab
   - Find the last successful deployment
   - Click "Re-run jobs"

## Security Considerations

1. **SSH Keys**: Use strong, unique SSH keys for each environment
2. **Environment Variables**: Never commit sensitive data to repository
3. **Firewall**: Server is configured with UFW firewall
4. **Fail2ban**: Brute force protection enabled
5. **Docker Security**: Containers run as non-root user
6. **SSL Certificates**: Configure SSL for production

## Next Steps

1. **Set up monitoring**: Consider adding monitoring tools like Prometheus/Grafana
2. **Load balancing**: For high traffic, set up load balancer
3. **Database clustering**: For production, consider database clustering
4. **CDN**: Set up CDN for static assets
5. **Backup strategy**: Implement off-site backups

## Support

If you encounter issues:
1. Check the GitHub Actions logs
2. Check server logs: `/opt/mecabal/logs/`
3. Verify all secrets are correctly configured
4. Ensure server meets minimum requirements

For additional help, check the troubleshooting section or create an issue in the repository.
