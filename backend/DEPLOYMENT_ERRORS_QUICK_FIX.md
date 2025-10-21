# Quick Fix Guide for Common Deployment Errors

## 🚨 **YOUR CURRENT ISSUE:** SSH Authentication Failed

**Error in your GitHub Actions:**
```
ssh: handshake failed: ssh: unable to authenticate,
attempted methods [none publickey], no supported methods remain
```

**What this means:** The SSH private key in GitHub Secrets doesn't match your server.

### ⚡ **FASTEST FIX** (2 minutes):

```bash
# 1. Get your existing SSH private key
cat ~/.ssh/id_ed25519  # or id_rsa, whichever you use to SSH

# 2. Copy ENTIRE output (including -----BEGIN and -----END lines)

# 3. Update GitHub Secret:
#    Go to: https://github.com/Haywhyoh/mecabal/settings/secrets/actions
#    Secret name: PRODUCTION_SSH_KEY
#    Value: Paste the private key
#    Click "Update secret"

# 4. Re-run the failed workflow in GitHub Actions
```

**📖 DETAILED GUIDE:** [FIX_SSH_NOW.md](FIX_SSH_NOW.md) ← **START HERE**

---

## 🔴 Error 1: "ssh: no key found" in GitHub Actions

**Symptom:**
```
ssh: handshake failed: ssh: unable to authenticate
ssh: no key found
```

**Cause:** SSH private key not properly configured in GitHub Secrets

**Quick Fix:**
1. Generate SSH key: `ssh-keygen -t ed25519 -f ~/.ssh/mecabal_deploy -N ""`
2. Copy to server: `ssh-copy-id -i ~/.ssh/mecabal_deploy.pub root@YOUR_SERVER_IP`
3. Add to GitHub Secret `PRODUCTION_SSH_KEY`: `cat ~/.ssh/mecabal_deploy`

**Full Guide:** [SSH_KEY_SETUP.md](SSH_KEY_SETUP.md)

---

## 🔴 Error 2: "denied: installation not allowed to Create organization package"

**Symptom:**
```
ERROR: failed to push ghcr.io/.../mecabal-backend:main:
denied: installation not allowed to Create organization package
```

**Cause:** GitHub Actions doesn't have permission to create packages

**Quick Fix:**
1. Go to: `https://github.com/YOUR_USERNAME/mecabal/settings/actions`
2. Select: "Read and write permissions"
3. Check: "Allow GitHub Actions to create and approve pull requests"
4. Save and re-run workflow

**Full Guide:** [GITHUB_PACKAGES_SETUP.md](GITHUB_PACKAGES_SETUP.md)

---

## 🔴 Error 3: "Container is unhealthy" on Server

**Symptom:**
```
WARNING: The DATABASE_NAME variable is not set
ERROR: for postgres  Container "xxx" is unhealthy
```

**Cause:** Missing or incorrect `.env` file on server

**Quick Fix:**
```bash
# On server
cd ~/mecabal/backend
cp .env.minimal .env
nano .env  # Edit with proper values

# Generate secrets
openssl rand -base64 32  # For JWT_ACCESS_SECRET
openssl rand -base64 32  # For JWT_REFRESH_SECRET
openssl rand -base64 24  # For DATABASE_PASSWORD

# Clean and restart
docker-compose -f docker-compose.production.yml down -v
docker-compose -f docker-compose.production.yml up -d
```

**Full Guide:** [DEPLOYMENT_TROUBLESHOOTING.md](DEPLOYMENT_TROUBLESHOOTING.md)

---

## 🔴 Error 4: Port Already in Use

**Symptom:**
```
Error: bind: address already in use
```

**Quick Fix:**
```bash
# Find what's using the port
sudo lsof -i :3000

# Stop all containers
docker-compose -f docker-compose.production.yml down

# Or kill specific process
sudo kill -9 <PID>

# Restart
docker-compose -f docker-compose.production.yml up -d
```

---

## 🔴 Error 5: Out of Disk Space

**Symptom:**
```
no space left on device
```

**Quick Fix:**
```bash
# Clean Docker
docker system prune -a -f

# Remove old images
docker image prune -a -f

# Check space
df -h

# If still full, remove old backups
cd ~/mecabal/backend
ls -t backup_*.sql | tail -n +8 | xargs rm
```

---

## 🔴 Error 6: Database Migration Failed

**Symptom:**
```
Migration failed!
TypeORM error: ...
```

**Quick Fix:**
```bash
# Check what's wrong
docker-compose -f docker-compose.production.yml logs api-gateway

# Try running migrations manually
docker-compose -f docker-compose.production.yml run --rm api-gateway npm run migration:run

# If fails, revert last migration
docker-compose -f docker-compose.production.yml run --rm api-gateway npm run migration:revert

# Check database is accessible
docker-compose -f docker-compose.production.yml exec postgres psql -U mecabal_user -d mecabal_production
```

---

## 🔴 Error 7: Services Won't Start

**Symptom:**
```
Container ... exited with code 1
```

**Quick Fix:**
```bash
# View logs to see exact error
docker-compose -f docker-compose.production.yml logs [service-name]

# Common fixes:
# 1. Check .env file exists and has correct values
cat .env | grep DATABASE

# 2. Verify infrastructure is running
docker-compose -f docker-compose.production.yml ps postgres redis

# 3. Restart in correct order
docker-compose -f docker-compose.production.yml up -d postgres redis rabbitmq minio
sleep 15
docker-compose -f docker-compose.production.yml up -d
```

---

## 🔴 Error 8: Health Checks Failing

**Symptom:**
```
Health check failed for service on port 3000
curl: (7) Failed to connect to localhost port 3000
```

**Quick Fix:**
```bash
# Wait longer (services take time to start)
sleep 30

# Check if service is actually running
docker ps | grep api-gateway

# Check service logs
docker-compose -f docker-compose.production.yml logs api-gateway

# Verify port is open
netstat -tuln | grep 3000

# If service crashed, check why
docker-compose -f docker-compose.production.yml ps
```

---

## 📋 Pre-Deployment Checklist

Before running deployment, verify:

**On GitHub:**
- [ ] `PRODUCTION_HOST` secret is set
- [ ] `PRODUCTION_SSH_KEY` secret is set (entire private key)
- [ ] `PRODUCTION_USERNAME` secret is set
- [ ] `PRODUCTION_PROJECT_PATH` secret is set
- [ ] `PRODUCTION_ENV` secret is set (base64 encoded .env)
- [ ] Repository has "Read and write permissions" enabled

**On Server:**
- [ ] `.env` file exists with proper values
- [ ] SSH key is in `~/.ssh/authorized_keys`
- [ ] Docker is running: `docker ps`
- [ ] Ports are available: `netstat -tuln | grep 3000`
- [ ] Enough disk space: `df -h` (min 10GB free)
- [ ] Project directory exists: `ls ~/mecabal/backend`

---

## 🚀 Emergency Recovery Commands

If everything is broken, nuclear option:

```bash
# On server
cd ~/mecabal/backend

# Stop everything
docker-compose -f docker-compose.production.yml down -v

# Remove all MeCabal containers
docker rm -f $(docker ps -a | grep mecabal | awk '{print $1}')

# Remove all MeCabal volumes
docker volume rm $(docker volume ls | grep backend | awk '{print $2}')

# Clean Docker
docker system prune -a -f

# Recreate .env
cp .env.minimal .env
nano .env  # Set proper values

# Start fresh
docker-compose -f docker-compose.production.yml up -d --build

# Wait and check
sleep 45
./deployment-helper.sh health
```

---

## 📞 Getting Help

If none of these fixes work:

1. **Gather information:**
   ```bash
   # System info
   docker version
   docker-compose version
   df -h
   free -h

   # Logs
   docker-compose -f docker-compose.production.yml logs > error.log 2>&1

   # Status
   docker-compose -f docker-compose.production.yml ps
   ```

2. **Check documentation:**
   - [DEPLOYMENT.md](DEPLOYMENT.md) - Full deployment guide
   - [SSH_KEY_SETUP.md](SSH_KEY_SETUP.md) - SSH configuration
   - [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md) - GitHub Secrets
   - [DEPLOYMENT_TROUBLESHOOTING.md](DEPLOYMENT_TROUBLESHOOTING.md) - Detailed troubleshooting

3. **Open GitHub issue** with:
   - Error message
   - What you tried
   - System info
   - Relevant logs

---

## ✅ Success Indicators

Deployment is successful when:

```bash
# All containers are running
docker-compose -f docker-compose.production.yml ps
# Should show all services "Up (healthy)"

# All health checks pass
./deployment-helper.sh health
# Should show ✓ for all 10 services

# Services are accessible
curl http://localhost:3000/health  # Returns 200 OK
```

---

**Most Common Issues (in order):**

1. 🔴 Missing `.env` file → [DEPLOYMENT_TROUBLESHOOTING.md](DEPLOYMENT_TROUBLESHOOTING.md)
2. 🔴 Wrong SSH key → [SSH_KEY_SETUP.md](SSH_KEY_SETUP.md)
3. 🔴 GHCR permissions → [GITHUB_PACKAGES_SETUP.md](GITHUB_PACKAGES_SETUP.md)
4. 🔴 Database unhealthy → Check `.env` has DATABASE_* vars
5. 🔴 Port conflicts → `docker-compose down` then restart
