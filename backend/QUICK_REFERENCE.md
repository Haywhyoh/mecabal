# MeCabal Backend - Quick Reference Card

## 🚀 Quick Start

```bash
# On Ubuntu Server
git clone https://github.com/yourusername/mecabal.git
cd mecabal/backend
chmod +x server-setup.sh deployment-helper.sh
./server-setup.sh
# Log out and back in
./deployment-helper.sh start
```

## 📦 All 10 Services

| Service | Port | Health Check |
|---------|------|--------------|
| API Gateway | 3000 | `curl http://localhost:3000/health` |
| Auth | 3001 | `curl http://localhost:3001/health` |
| User | 3002 | `curl http://localhost:3002/health` |
| Social | 3003 | `curl http://localhost:3003/health` |
| Messaging | 3004 | `curl http://localhost:3004/health` |
| Marketplace | 3005 | `curl http://localhost:3005/health` |
| Events | 3006 | `curl http://localhost:3006/health` |
| Notification | 3007 | `curl http://localhost:3007/health` |
| Location | 3008 | `curl http://localhost:3008/health` |
| Business | 3009 | `curl http://localhost:3009/health` |

## ⚡ Essential Commands

```bash
# Health check all services
./deployment-helper.sh health

# Start all services
./deployment-helper.sh start

# Stop all services
./deployment-helper.sh stop

# View logs
./deployment-helper.sh logs [service-name]

# Create backup
./deployment-helper.sh backup

# Restore backup
./deployment-helper.sh restore backups/file.sql

# Rollback deployment
./deployment-helper.sh rollback

# Update to latest
./deployment-helper.sh update

# Check resources
./deployment-helper.sh stats

# Run migrations
./deployment-helper.sh migrate

# All commands
./deployment-helper.sh help
```

## 🔑 GitHub Secrets (Required)

```
PRODUCTION_HOST=your.server.ip
PRODUCTION_USERNAME=ubuntu
PRODUCTION_SSH_KEY=<private-key-content>
PRODUCTION_PORT=22
PRODUCTION_PROJECT_PATH=/home/ubuntu/mecabal/backend
PRODUCTION_ENV=<base64-encoded-.env-file>
```

**Encode .env file:**
```bash
cat .env.production | base64 -w 0
```

## 🔧 Docker Commands

```bash
# Status
docker-compose -f docker-compose.production.yml ps

# Start
docker-compose -f docker-compose.production.yml up -d

# Stop


docker-compose -f docker-compose.production.yml down

# Logs (all)
docker-compose -f docker-compose.production.yml logs -f

# Logs (specific service)
docker-compose -f docker-compose.production.yml logs -f auth-service

# Restart
docker-compose -f docker-compose.production.yml restart

# Rebuild
docker-compose -f docker-compose.production.yml build --no-cache
```

## 🔒 Security Essentials

```bash
# Generate secrets
openssl rand -base64 32  # JWT_ACCESS_SECRET
openssl rand -base64 32  # JWT_REFRESH_SECRET
openssl rand -base64 24  # DATABASE_PASSWORD

# Check firewall
sudo ufw status

# Check fail2ban
sudo fail2ban-client status

# SSL certificate (Let's Encrypt)
sudo certbot certonly --standalone -d api.mecabal.com
```

## 📊 Monitoring

```bash
# Disk space
df -h

# Memory
free -h

# CPU & processes
htop

# Docker stats
docker stats

# Service logs
journalctl -u mecabal-backend -f
```

## 🚨 Emergency Procedures

### Service Down
```bash
# Check status
docker-compose -f docker-compose.production.yml ps

# Check logs
./deployment-helper.sh logs [service-name]

# Restart
docker-compose -f docker-compose.production.yml restart [service-name]
```

### Database Issues
```bash
# Check PostgreSQL
docker-compose -f docker-compose.production.yml logs postgres

# Connect to DB
docker-compose -f docker-compose.production.yml exec postgres psql -U mecabal_user -d mecabal_production

# Restore from backup
./deployment-helper.sh restore backups/latest.sql
```

### Deployment Failed
```bash
# Rollback
./deployment-helper.sh rollback

# Or manual rollback
git reset --hard HEAD^
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d
```

### Out of Space
```bash
# Clean Docker
./deployment-helper.sh clean

# Remove old backups
ls -t backups/*.sql | tail -n +8 | xargs rm

# Clean system
docker system prune -a
```

## 🔄 Deployment Triggers

**Automatic:**
```bash
# Staging
git push origin develop

# Production
git push origin main
```

**Manual:**
- GitHub → Actions → Deploy MeCabal Backend → Run workflow

## 📁 Important Files

| File | Location | Purpose |
|------|----------|---------|
| .env | `/home/ubuntu/mecabal/backend/.env` | Environment variables |
| Logs | `/opt/mecabal/logs/` | Application logs |
| Backups | `/opt/mecabal/backups/` | Database backups |
| SSL | `/opt/mecabal/ssl/` | SSL certificates |

## 🔍 Troubleshooting

| Symptom | Check |
|---------|-------|
| Service won't start | `./deployment-helper.sh logs [service]` |
| Health check fails | `./deployment-helper.sh env-check` |
| High memory | `./deployment-helper.sh stats` |
| Disk full | `df -h` then `./deployment-helper.sh clean` |
| Database error | `docker-compose logs postgres` |
| Migration fails | `./deployment-helper.sh migrate` |

## 📞 Quick Links

- [Full Deployment Guide](DEPLOYMENT.md)
- [GitHub Secrets Setup](GITHUB_SECRETS_SETUP.md)
- [CI/CD Summary](CICD_SETUP_SUMMARY.md)
- [Helper Script Docs](deployment-helper.sh) (run with `--help`)

## ✅ Pre-Production Checklist

- [ ] All services health checks passing
- [ ] .env configured with production values
- [ ] Strong passwords set (min 32 chars for secrets)
- [ ] SSL certificate installed
- [ ] GitHub Secrets configured
- [ ] Firewall configured
- [ ] Backups running automatically
- [ ] Tested rollback mechanism
- [ ] Monitoring set up

## 🎯 Service URLs (Production)

```
API: https://api.mecabal.com
Health: https://api.mecabal.com/health
Swagger: https://api.mecabal.com/api
```

## 💡 Tips

- Always test on staging first
- Keep backups before major changes
- Monitor logs after deployment
- Use deployment helper for common tasks
- Check health after any changes
- Keep secrets secure, never commit
