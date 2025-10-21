# GitHub Secrets Setup Guide for MeCabal Backend CI/CD

This guide will help you configure GitHub Secrets for automated deployment of the MeCabal backend.

## Prerequisites

- GitHub repository with admin access
- Ubuntu server(s) for staging and/or production
- SSH access to your server(s)

## Step 1: Generate SSH Keys

On your local machine, generate a deployment SSH key:

```bash
ssh-keygen -t ed25519 -C "github-actions-mecabal-deploy" -f ~/.ssh/mecabal_deploy
```

This creates two files:
- `~/.ssh/mecabal_deploy` (private key - for GitHub)
- `~/.ssh/mecabal_deploy.pub` (public key - for server)

## Step 2: Add Public Key to Server

Copy the public key to your server:

```bash
# For production server
ssh-copy-id -i ~/.ssh/mecabal_deploy.pub ubuntu@your.production.server.ip

# For staging server (if separate)
ssh-copy-id -i ~/.ssh/mecabal_deploy.pub ubuntu@your.staging.server.ip
```

Test the connection:

```bash
ssh -i ~/.ssh/mecabal_deploy ubuntu@your.server.ip
```

## Step 3: Create GitHub Secrets

Go to your GitHub repository:
1. Click **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**

### Required Secrets for Production

#### Server Connection

```
Name: PRODUCTION_HOST
Value: your.production.server.ip (or domain name)
```

```
Name: PRODUCTION_USERNAME
Value: ubuntu (or your server username)
```

```
Name: PRODUCTION_SSH_KEY
Value: [paste entire content of ~/.ssh/mecabal_deploy private key]
```

To get the private key content:
```bash
cat ~/.ssh/mecabal_deploy
```

Copy everything including:
```
-----BEGIN OPENSSH PRIVATE KEY-----
... key content ...
-----END OPENSSH PRIVATE KEY-----
```

```
Name: PRODUCTION_PORT
Value: 22 (or your custom SSH port)
```

```
Name: PRODUCTION_PROJECT_PATH
Value: /home/ubuntu/mecabal/backend (or your deployment directory)
```

#### Environment Variables

Create a `.env.production` file with all your production environment variables:

```bash
# Example .env.production
NODE_ENV=production
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USERNAME=mecabal_user
DATABASE_PASSWORD=your_secure_db_password
DATABASE_NAME=mecabal_production
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_secure_redis_password
JWT_ACCESS_SECRET=your_super_secret_jwt_access_key_min_32_chars
JWT_REFRESH_SECRET=your_super_secret_jwt_refresh_key_min_32_chars
# ... all other env vars from env.example
```

Then encode it to base64:

**On Linux/macOS:**
```bash
cat .env.production | base64 -w 0
```

**On Windows (PowerShell):**
```powershell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((Get-Content .env.production -Raw)))
```

Create the secret:
```
Name: PRODUCTION_ENV
Value: [paste the base64 encoded output]
```

### Required Secrets for Staging (Optional)

If you have a separate staging server, repeat the above for staging:

```
STAGING_HOST=your.staging.server.ip
STAGING_USERNAME=ubuntu
STAGING_SSH_KEY=[private key content]
STAGING_PORT=22
STAGING_PROJECT_PATH=/home/ubuntu/mecabal/backend
STAGING_ENV=[base64 encoded .env.staging content]
```

### Optional Secrets

#### Slack Notifications

If you want deployment notifications in Slack:

1. Create a Slack webhook: https://api.slack.com/messaging/webhooks
2. Add the secret:

```
Name: SLACK_WEBHOOK_URL
Value: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

## Step 4: Verify Secrets

After adding all secrets, you should have:

### For Production Only:
- ✅ PRODUCTION_HOST
- ✅ PRODUCTION_USERNAME
- ✅ PRODUCTION_SSH_KEY
- ✅ PRODUCTION_PORT
- ✅ PRODUCTION_PROJECT_PATH
- ✅ PRODUCTION_ENV

### For Staging + Production:
- ✅ All production secrets above
- ✅ STAGING_HOST
- ✅ STAGING_USERNAME
- ✅ STAGING_SSH_KEY
- ✅ STAGING_PORT
- ✅ STAGING_PROJECT_PATH
- ✅ STAGING_ENV

### Optional:
- ☑️ SLACK_WEBHOOK_URL

## Step 5: Test the Deployment

### Manual Trigger Test

1. Go to **Actions** tab in your repository
2. Select **Deploy MeCabal Backend** workflow
3. Click **Run workflow**
4. Select environment (staging/production)
5. Click **Run workflow**

### Automatic Trigger Test

**For Staging:**
```bash
git checkout develop
git commit --allow-empty -m "Test staging deployment"
git push origin develop
```

**For Production:**
```bash
git checkout main
git commit --allow-empty -m "Test production deployment"
git push origin main
```

## Environment Variables Template

Here's a complete template for your `.env.production` file:

```bash
# Environment
NODE_ENV=production

# Database Configuration
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USERNAME=mecabal_user
DATABASE_PASSWORD=CHANGE_THIS_SECURE_PASSWORD
DATABASE_NAME=mecabal_production

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=CHANGE_THIS_SECURE_PASSWORD

# JWT Configuration
JWT_ACCESS_SECRET=CHANGE_THIS_SUPER_SECRET_KEY_MIN_32_CHARS
JWT_REFRESH_SECRET=CHANGE_THIS_SUPER_SECRET_REFRESH_KEY_MIN_32_CHARS
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Object Storage (MinIO)
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=CHANGE_THIS_MINIO_PASSWORD
S3_BUCKET_NAME=mecabal-uploads
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=CHANGE_THIS_MINIO_PASSWORD

# Message Queue (RabbitMQ)
RABBITMQ_URL=amqp://admin:CHANGE_THIS_RABBITMQ_PASSWORD@rabbitmq:5672
RABBITMQ_USERNAME=admin
RABBITMQ_PASSWORD=CHANGE_THIS_RABBITMQ_PASSWORD

# Brevo Email Service
BREVO_API_KEY=your_brevo_api_key_here
BREVO_SMTP_USER=your_brevo_smtp_username
BREVO_FROM_EMAIL=noreply@mecabal.com
EMAIL_FROM_NAME=MeCabal Community
EMAIL_FROM_ADDRESS=noreply@mecabal.com
EMAIL_HOST=smtp-relay.sendinblue.com
EMAIL_PORT=587
EMAIL_HOST_USER=your_brevo_smtp_username
EMAIL_HOST_PASSWORD=your_brevo_smtp_password
EMAIL_SENDER=noreply@mecabal.com
FRONTEND_URL=https://mecabal.com

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://api.mecabal.com/auth/google/callback
GOOGLE_IOS_CLIENT_ID=your_ios_client_id
GOOGLE_ANDROID_CLIENT_ID=your_android_client_id

# Service URLs (Internal Docker Network)
API_GATEWAY_PORT=3000
AUTH_SERVICE_URL=http://auth-service:3001
USER_SERVICE_URL=http://user-service:3002
SOCIAL_SERVICE_URL=http://social-service:3003
MESSAGING_SERVICE_URL=http://messaging-service:3004
MARKETPLACE_SERVICE_URL=http://marketplace-service:3005
EVENTS_SERVICE_URL=http://events-service:3006
NOTIFICATION_SERVICE_URL=http://notification-service:3007
LOCATION_SERVICE_URL=http://location-service:3008
BUSINESS_SERVICE_URL=http://business-service:3009

# Security
BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN=https://mecabal.com,https://www.mecabal.com

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Troubleshooting

### SSH Connection Failed

**Error:** `Permission denied (publickey)`

**Solution:**
1. Verify public key is in server's `~/.ssh/authorized_keys`
2. Check private key format in GitHub secret (include BEGIN/END lines)
3. Test SSH connection manually: `ssh -i ~/.ssh/mecabal_deploy ubuntu@server.ip`

### Deployment Failed at Health Check

**Error:** Health checks failing for services

**Solution:**
1. SSH into server and check logs: `docker-compose -f docker-compose.production.yml logs`
2. Verify all environment variables are set correctly
3. Check if all services started: `docker-compose -f docker-compose.production.yml ps`

### Base64 Encoding Issues

**Error:** Environment variables not being read correctly

**Solution:**
1. Ensure no line breaks in base64 output (use `-w 0` flag on Linux)
2. Verify base64 encoding with: `echo "YOUR_BASE64" | base64 -d`
3. Check for special characters in .env file that might need escaping

### Database Migration Failed

**Error:** Migration fails during deployment

**Solution:**
1. Test migration locally first: `npm run migration:run`
2. Check database connection in logs
3. Verify DATABASE_* environment variables
4. Ensure TypeORM entities are properly exported

## Security Best Practices

1. **Never commit .env files** - Always add to .gitignore
2. **Rotate secrets regularly** - Update JWT secrets, passwords periodically
3. **Use strong passwords** - Minimum 32 characters for secrets
4. **Limit SSH access** - Use SSH keys only, disable password auth
5. **Monitor logs** - Check GitHub Actions logs for any exposed secrets
6. **Use GitHub Environments** - Set up environment protection rules
7. **Enable 2FA** - On GitHub account with access to secrets

## GitHub Environment Protection (Recommended)

1. Go to **Settings** → **Environments**
2. Create `production` and `staging` environments
3. For production, add:
   - Required reviewers (team members who must approve)
   - Wait timer (e.g., 5 minutes before deployment)
   - Deployment branches (only `main`)

This adds an extra layer of protection for production deployments.

## Next Steps

After setting up secrets:

1. ✅ Test deployment to staging first
2. ✅ Verify all services are running
3. ✅ Check health endpoints
4. ✅ Test API functionality
5. ✅ Review logs for errors
6. ✅ Set up monitoring/alerting
7. ✅ Deploy to production

## Support

If you encounter issues:
- Check GitHub Actions logs for detailed error messages
- Review server logs: `ssh user@server "docker-compose -f ~/mecabal/backend/docker-compose.production.yml logs"`
- Verify all secrets are correctly set in GitHub
- Ensure server has enough resources (CPU, RAM, disk space)
