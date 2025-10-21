# 🚀 MeCabal Backend Deployment - START HERE

## 📍 You Are Here

Your backend has **10 microservices**, CI/CD with GitHub Actions is set up, but you're getting deployment errors.

## ⚡ Your Current Blockers (Fix These First)

### 1. 🔴 SSH Authentication Failing

**Error:** `ssh: unable to authenticate, attempted methods [none publickey]`

**Fix NOW:** [FIX_SSH_NOW.md](FIX_SSH_NOW.md) ← **2 minutes**

### 2. 🟡 GitHub Packages Permission

**Error:** `denied: installation not allowed to Create organization package`

**Fix NOW:** [GITHUB_PACKAGES_SETUP.md](GITHUB_PACKAGES_SETUP.md) ← **2 minutes**

---

## 📚 Documentation Map

### For Fixing Current Issues:

| Priority | File | Time | Purpose |
|----------|------|------|---------|
| **🚨 1** | [FIX_SSH_NOW.md](FIX_SSH_NOW.md) | 2 min | Fix SSH authentication |
| **🚨 2** | [GITHUB_PACKAGES_SETUP.md](GITHUB_PACKAGES_SETUP.md) | 2 min | Enable package creation |
| **⚡ 3** | [DEPLOYMENT_ERRORS_QUICK_FIX.md](DEPLOYMENT_ERRORS_QUICK_FIX.md) | 5 min | All quick fixes |

### For Setting Up Properly:

| File | Purpose |
|------|---------|
| [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md) | Configure all GitHub Secrets |
| [SSH_KEY_SETUP.md](SSH_KEY_SETUP.md) | Detailed SSH setup guide |
| [DEPLOYMENT_TROUBLESHOOTING.md](DEPLOYMENT_TROUBLESHOOTING.md) | Debug deployment issues |

### For Reference:

| File | Purpose |
|------|---------|
| [DEPLOYMENT.md](DEPLOYMENT.md) | Complete deployment guide |
| [CICD_SETUP_SUMMARY.md](CICD_SETUP_SUMMARY.md) | CI/CD overview |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | Command cheat sheet |

### Helper Scripts:

| Script | Purpose |
|--------|---------|
| [deployment-helper.sh](deployment-helper.sh) | Server management tool |
| [fix-deployment.sh](fix-deployment.sh) | Auto-fix server issues |

---

## 🎯 Quick Start Guide

### Path 1: Fix GitHub Actions CI/CD (Recommended)

**Time:** 10 minutes
**Result:** Automated deployments on push to main/develop

1. **Fix SSH** (2 min)
   ```bash
   cat ~/.ssh/id_ed25519
   # Copy output to GitHub Secret: PRODUCTION_SSH_KEY
   ```
   See: [FIX_SSH_NOW.md](FIX_SSH_NOW.md)

2. **Fix GHCR Permissions** (2 min)
   - Go to: https://github.com/Haywhyoh/mecabal/settings/actions
   - Select: "Read and write permissions"
   - Save

   See: [GITHUB_PACKAGES_SETUP.md](GITHUB_PACKAGES_SETUP.md)

3. **Set Other Secrets** (5 min)
   - `PRODUCTION_HOST` - Your server IP
   - `PRODUCTION_USERNAME` - Usually `root`
   - `PRODUCTION_PROJECT_PATH` - `/root/mecabal/backend`
   - `PRODUCTION_ENV` - Base64 encoded .env file

   See: [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md)

4. **Deploy**
   ```bash
   git push origin main
   # Watch GitHub Actions tab
   ```

### Path 2: Manual Deployment (Skip CI/CD for Now)

**Time:** 5 minutes
**Result:** Backend running on server

```bash
# 1. SSH into server
ssh root@YOUR_SERVER_IP

# 2. Navigate to backend
cd /root/mecabal/backend

# 3. Setup environment
cp .env.minimal .env
nano .env  # Edit with your values

# 4. Deploy
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d

# 5. Wait and check
sleep 45
./deployment-helper.sh health
```

See: [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 📋 Required GitHub Secrets

| Secret Name | Example | How to Get |
|-------------|---------|------------|
| `PRODUCTION_HOST` | `123.45.67.89` | Your server IP |
| `PRODUCTION_USERNAME` | `root` | Your SSH username |
| `PRODUCTION_SSH_KEY` | `-----BEGIN...` | `cat ~/.ssh/id_ed25519` |
| `PRODUCTION_PORT` | `22` | SSH port |
| `PRODUCTION_PROJECT_PATH` | `/root/mecabal/backend` | Path on server |
| `PRODUCTION_ENV` | `base64...` | `cat .env.production \| base64 -w 0` |

Add at: https://github.com/Haywhyoh/mecabal/settings/secrets/actions

---

## ✅ All 10 Services

Your backend has these microservices:

| Service | Port | Status in CI/CD |
|---------|------|-----------------|
| API Gateway | 3000 | ✅ Configured |
| Auth Service | 3001 | ✅ Configured |
| User Service | 3002 | ✅ Configured |
| Social Service | 3003 | ✅ Configured |
| Messaging Service | 3004 | ✅ Configured |
| Marketplace Service | 3005 | ✅ Configured |
| Events Service | 3006 | ✅ Configured |
| Notification Service | 3007 | ✅ Configured |
| Location Service | 3008 | ✅ Configured |
| Business Service | 3009 | ✅ Configured |

All services have health checks and rollback mechanisms.

---

## 🆘 Quick Help

### Issue: Can't SSH into server

```bash
# Test connection
ssh root@YOUR_SERVER_IP

# If fails, check:
# 1. Server IP is correct
# 2. Port 22 is open
# 3. SSH service is running
```

### Issue: Services won't start on server

```bash
# Check if .env exists
ls -la .env

# If missing
cp .env.minimal .env
nano .env  # Edit with values
```

### Issue: GitHub Actions keeps failing

**Read:** [DEPLOYMENT_ERRORS_QUICK_FIX.md](DEPLOYMENT_ERRORS_QUICK_FIX.md)

---

## 🎓 Learn More

- **What is CI/CD?** [CICD_SETUP_SUMMARY.md](CICD_SETUP_SUMMARY.md)
- **How does deployment work?** [DEPLOYMENT.md](DEPLOYMENT.md)
- **What commands can I use?** [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

---

## 📞 Getting Help

1. Check error in [DEPLOYMENT_ERRORS_QUICK_FIX.md](DEPLOYMENT_ERRORS_QUICK_FIX.md)
2. Search the specific guide for your issue
3. Check GitHub Actions logs for exact error
4. SSH into server and check: `docker-compose logs`

---

## 🎯 Success Criteria

You'll know it's working when:

✅ GitHub Actions workflow shows green checkmark
✅ All 10 services show "healthy" status
✅ Health endpoints return 200 OK:
```bash
curl http://YOUR_SERVER_IP:3000/health
curl http://YOUR_SERVER_IP:3001/health
# ... etc for 3002-3009
```

---

## 🔥 TL;DR - Fastest Path to Working Deployment

**Option 1 - Fix CI/CD (10 min):**
1. Read [FIX_SSH_NOW.md](FIX_SSH_NOW.md)
2. Read [GITHUB_PACKAGES_SETUP.md](GITHUB_PACKAGES_SETUP.md)
3. Re-run GitHub Actions

**Option 2 - Deploy Manually (5 min):**
1. SSH into server
2. Run commands in "Path 2" above
3. Skip GitHub Actions entirely

**Choose based on urgency.**

---

**Last Updated:** 2025-10-21
**All Documentation Ready:** ✅
**CI/CD Configured:** ✅
**Waiting For:** Your SSH key in GitHub Secrets
