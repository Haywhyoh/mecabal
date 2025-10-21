# Fix SSH Authentication RIGHT NOW

## Your Current Error

```
ssh: handshake failed: ssh: unable to authenticate,
attempted methods [none publickey], no supported methods remain
```

**This means:** The SSH key in GitHub Secrets doesn't match the key on your server.

## 🚀 Quick Fix (5 Minutes)

### Option 1: Use Your Server's Existing SSH Setup (FASTEST)

If you can already SSH into your server with `ssh root@YOUR_SERVER_IP`:

```bash
# 1. Find your current private key
ls -la ~/.ssh/
# Look for files like: id_rsa, id_ed25519, id_ecdsa

# 2. Copy the private key content
cat ~/.ssh/id_ed25519  # or id_rsa, whichever you use
# Copy ENTIRE output including BEGIN/END lines

# 3. Add to GitHub Secrets
# Go to: https://github.com/Haywhyoh/mecabal/settings/secrets/actions
# Click "New repository secret"
# Name: PRODUCTION_SSH_KEY
# Value: Paste the key
# Click "Add secret"

# 4. Verify other secrets:
# - PRODUCTION_HOST: Your server IP (e.g., 123.45.67.89)
# - PRODUCTION_USERNAME: root (or ubuntu, whatever you use)
# - PRODUCTION_PORT: 22
# - PRODUCTION_PROJECT_PATH: /root/mecabal/backend

# 5. Re-run GitHub Actions workflow
```

### Option 2: Generate New Key Specifically for GitHub Actions

```bash
# 1. Generate new key (NO passphrase - just press Enter)
ssh-keygen -t ed25519 -C "github-actions-mecabal" -f ~/.ssh/mecabal_github -N ""

# 2. Copy public key to server
ssh-copy-id -i ~/.ssh/mecabal_github.pub root@YOUR_SERVER_IP

# 3. Test it works
ssh -i ~/.ssh/mecabal_github root@YOUR_SERVER_IP "echo 'Connection successful'"

# If successful, continue:

# 4. Get private key
cat ~/.ssh/mecabal_github

# 5. Add to GitHub Secrets
# Name: PRODUCTION_SSH_KEY
# Value: Paste entire private key output
```

## 🔍 Common Mistakes

### ❌ Wrong: Copying Public Key (.pub file)
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGq... github-actions
```

### ✅ Correct: Copying Private Key (no .pub)
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtz
c2gtZWQyNTUxOQAAACBqk8/aKgXqEiKMmDfZZqm5NmxkHfXmLkKMxQp0JwFbJwAA
... (many more lines)
-----END OPENSSH PRIVATE KEY-----
```

## 🛠️ Debugging Steps

### Step 1: Verify SSH Key Format

```bash
# Check your private key starts with:
head -1 ~/.ssh/id_ed25519
# Should show: -----BEGIN OPENSSH PRIVATE KEY-----

# NOT this (that's public key):
# ssh-ed25519 AAAAC3NzaC...
```

### Step 2: Verify Key is Added to Server

```bash
# SSH into server
ssh root@YOUR_SERVER_IP

# Check authorized_keys
cat ~/.ssh/authorized_keys

# Should contain a line starting with:
# ssh-ed25519 AAAAC3NzaC... (your public key)
```

### Step 3: Test Manual SSH Connection

```bash
# From your local machine
ssh -i ~/.ssh/id_ed25519 root@YOUR_SERVER_IP

# If this works, the key is correct
# Copy this same key to GitHub Secrets
cat ~/.ssh/id_ed25519
```

### Step 4: Check GitHub Secret

1. Go to: https://github.com/Haywhyoh/mecabal/settings/secrets/actions
2. Find `PRODUCTION_SSH_KEY`
3. Click "Update"
4. Make sure it contains the PRIVATE key (with BEGIN/END lines)

## 📋 Checklist Before Re-Running Workflow

- [ ] `PRODUCTION_SSH_KEY` contains **private** key (not public)
- [ ] Private key includes `-----BEGIN` and `-----END` lines
- [ ] Public key is added to server's `~/.ssh/authorized_keys`
- [ ] You can manually SSH with: `ssh -i ~/.ssh/YOUR_KEY root@SERVER_IP`
- [ ] `PRODUCTION_HOST` is set to your server IP
- [ ] `PRODUCTION_USERNAME` matches your SSH user (usually `root`)
- [ ] `PRODUCTION_PROJECT_PATH` is correct (e.g., `/root/mecabal/backend`)

## 🎯 Exact Commands to Fix (Copy-Paste Ready)

Replace `YOUR_SERVER_IP` with your actual server IP:

```bash
# === RUN ON YOUR LOCAL MACHINE ===

# 1. Check if you can SSH normally
ssh root@YOUR_SERVER_IP
# If YES, continue. If NO, fix SSH access first.

# 2. Find your SSH key
ls -la ~/.ssh/
# Common files: id_ed25519, id_rsa, id_ecdsa

# 3. Copy private key (replace id_ed25519 with your key name)
cat ~/.ssh/id_ed25519

# 4. Verify public key is on server
ssh root@YOUR_SERVER_IP "cat ~/.ssh/authorized_keys | grep -o '^ssh-[^ ]*'"

# If empty, add it:
ssh-copy-id root@YOUR_SERVER_IP

# 5. Test connection with exact key
ssh -i ~/.ssh/id_ed25519 root@YOUR_SERVER_IP "echo 'Success!'"

# If all above works, copy the private key:
cat ~/.ssh/id_ed25519
# Copy ENTIRE output to GitHub Secret PRODUCTION_SSH_KEY
```

## 🔐 Alternative: Generate Dedicated Key

If you want a separate key just for GitHub Actions:

```bash
# 1. Generate key (press Enter for no passphrase)
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_key
# Press Enter (no passphrase)
# Press Enter (no passphrase)

# 2. Copy to server
ssh-copy-id -i ~/.ssh/github_actions_key.pub root@YOUR_SERVER_IP

# 3. Test it
ssh -i ~/.ssh/github_actions_key root@YOUR_SERVER_IP "whoami"

# 4. If successful, get private key
cat ~/.ssh/github_actions_key

# 5. Add to GitHub Secrets as PRODUCTION_SSH_KEY
```

## ⚡ Emergency: Skip GitHub Actions for Now

If you need to deploy urgently, skip CI/CD:

```bash
# 1. SSH into server
ssh root@YOUR_SERVER_IP

# 2. Navigate to project
cd /root/mecabal/backend

# 3. Pull latest code
git pull origin main

# 4. Create .env if missing
if [ ! -f .env ]; then
  cp .env.minimal .env
  nano .env  # Edit with values
fi

# 5. Deploy
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d

# 6. Check health
sleep 30
./deployment-helper.sh health
```

## 📞 Still Not Working?

### Get detailed SSH debug info:

```bash
# Test SSH with verbose output
ssh -vvv -i ~/.ssh/id_ed25519 root@YOUR_SERVER_IP

# Look for lines like:
# "Offering public key: ..." (shows which key is being used)
# "Server accepts key: ..." (shows if server accepts it)
# "Authentication succeeded" (shows success)
```

### Common Issues:

1. **Wrong username**
   - Try: `ubuntu` instead of `root`
   - Check: `ssh ubuntu@YOUR_SERVER_IP`

2. **Wrong path**
   - Server might be: `/home/ubuntu/mecabal/backend`
   - Not: `/root/mecabal/backend`

3. **Server firewall**
   - Check SSH port is open
   - Default: 22

4. **Key permissions on server**
   ```bash
   # On server
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys
   ```

## ✅ Success Looks Like:

After fixing, GitHub Actions logs should show:

```
======CMD======
# Navigate to project directory
cd /root/mecabal/backend

Previous commit: abc123...
Creating database backup: backup_production_20251021_214719.sql
...
Production deployment completed successfully!
======END======
```

---

## 🎯 TL;DR - Copy This Private Key to GitHub:

```bash
# Run this command:
cat ~/.ssh/id_ed25519

# Copy ENTIRE output (including BEGIN/END lines)
# Paste into GitHub Secret: PRODUCTION_SSH_KEY
```

That's it. Then re-run the workflow.
