# SSH Key Setup for GitHub Actions

## Error: "ssh: no key found" / "ssh: handshake failed"

This means GitHub Actions cannot authenticate to your server via SSH.

## Quick Fix Guide

### Step 1: Generate SSH Key (On Your Local Machine)

```bash
# Generate a new ED25519 SSH key (more secure than RSA)
ssh-keygen -t ed25519 -C "github-actions-mecabal" -f ~/.ssh/mecabal_deploy -N ""

# This creates two files:
# ~/.ssh/mecabal_deploy     (private key - for GitHub)
# ~/.ssh/mecabal_deploy.pub (public key - for server)
```

**Important:** Leave the passphrase empty (just press Enter) when prompted.

### Step 2: Add Public Key to Your Server

```bash
# Copy public key to server
ssh-copy-id -i ~/.ssh/mecabal_deploy.pub root@YOUR_SERVER_IP

# Or manually:
cat ~/.ssh/mecabal_deploy.pub
# Copy the output, then on server:
# mkdir -p ~/.ssh
# echo "PASTE_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
# chmod 600 ~/.ssh/authorized_keys
# chmod 700 ~/.ssh
```

### Step 3: Test SSH Connection

```bash
# Test connection with the new key
ssh -i ~/.ssh/mecabal_deploy root@YOUR_SERVER_IP

# If successful, you should login without password
```

### Step 4: Add Private Key to GitHub Secrets

1. **Copy the ENTIRE private key:**
   ```bash
   cat ~/.ssh/mecabal_deploy
   ```

   Copy **everything** including:
   ```
   -----BEGIN OPENSSH PRIVATE KEY-----
   b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtz
   ... (all lines in between)
   -----END OPENSSH PRIVATE KEY-----
   ```

2. **Go to GitHub repository:**
   ```
   https://github.com/Haywhyoh/mecabal/settings/secrets/actions
   ```

3. **Click "New repository secret"**

4. **Add secret:**
   - **Name:** `PRODUCTION_SSH_KEY`
   - **Value:** Paste the entire private key (including BEGIN/END lines)
   - Click "Add secret"

### Step 5: Add Other Required Secrets

While you're in GitHub Secrets, add these as well:

#### For Production:

| Secret Name | Example Value | Notes |
|-------------|---------------|-------|
| `PRODUCTION_HOST` | `123.45.67.89` | Your server IP or domain |
| `PRODUCTION_USERNAME` | `root` | SSH username |
| `PRODUCTION_SSH_KEY` | `-----BEGIN OPENSSH...` | Private key (from Step 4) |
| `PRODUCTION_PORT` | `22` | SSH port (usually 22) |
| `PRODUCTION_PROJECT_PATH` | `/root/mecabal/backend` | Path on server |
| `PRODUCTION_ENV` | `<base64 encoded .env>` | See below |

#### Create PRODUCTION_ENV:

```bash
# On your local machine, create .env.production with all values
cd backend
nano .env.production  # Add all production settings

# Then encode it
cat .env.production | base64 -w 0

# Copy the output and add as PRODUCTION_ENV secret
```

**Example .env.production:**
```env
NODE_ENV=production
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=mecabal_production
DATABASE_USERNAME=mecabal_user
DATABASE_PASSWORD=YOUR_STRONG_PASSWORD_HERE
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD_HERE
JWT_ACCESS_SECRET=YOUR_JWT_ACCESS_SECRET_MIN_32_CHARS
JWT_REFRESH_SECRET=YOUR_JWT_REFRESH_SECRET_MIN_32_CHARS
# ... (all other env vars from env.example)
```

### Step 6: Verify All Secrets Are Set

In GitHub repository → Settings → Secrets and variables → Actions, you should see:

✅ Secrets (7):
- `PRODUCTION_HOST`
- `PRODUCTION_USERNAME`
- `PRODUCTION_SSH_KEY`
- `PRODUCTION_PORT`
- `PRODUCTION_PROJECT_PATH`
- `PRODUCTION_ENV`
- _(Optional)_ `SLACK_WEBHOOK_URL`

## Troubleshooting

### Problem: "Permission denied (publickey)"

**Solution:**
```bash
# On server, check authorized_keys permissions
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 700 ~

# Restart SSH service
sudo systemctl restart sshd
```

### Problem: Key has passphrase

**Solution:**
GitHub Actions cannot handle passphrases. Regenerate without passphrase:
```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/mecabal_deploy -N ""
```

### Problem: Wrong key format

**Solution:**
Make sure you're copying the **private key**, not the public key:
- ❌ Wrong: `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5...` (this is public key)
- ✅ Correct: `-----BEGIN OPENSSH PRIVATE KEY-----` (this is private key)

### Problem: Newlines in secret

**Solution:**
When pasting into GitHub Secrets, include all newlines. The secret should look like:
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmU...
(multiple lines)
-----END OPENSSH PRIVATE KEY-----
```

### Problem: Server not reachable

**Test connection:**
```bash
# From GitHub Actions runner (simulate)
ssh -i ~/.ssh/mecabal_deploy -p 22 root@YOUR_SERVER_IP "echo 'Connection successful'"
```

If this fails:
- Check server IP is correct
- Check firewall allows SSH (port 22)
- Check SSH service is running on server

## Alternative: Skip CI/CD Deployment for Now

If you want to deploy manually and skip GitHub Actions for now:

### On Your Server:

```bash
# SSH into server
ssh root@YOUR_SERVER_IP

# Navigate to project
cd /root/mecabal/backend

# Pull latest code manually
git pull origin main

# Create/update .env manually
nano .env

# Build and start services
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d

# Check health
./deployment-helper.sh health
```

This bypasses GitHub Actions entirely.

## Security Best Practices

1. ✅ **Use ED25519 keys** (more secure than RSA)
2. ✅ **No passphrase** for automation keys
3. ✅ **Unique key** for GitHub Actions (don't reuse personal keys)
4. ✅ **Restrict key** on server:
   ```bash
   # Add to ~/.ssh/authorized_keys before the key:
   command="cd /root/mecabal/backend && $SSH_ORIGINAL_COMMAND",no-port-forwarding,no-X11-forwarding,no-agent-forwarding ssh-ed25519 AAAA...
   ```
5. ✅ **Rotate keys** periodically
6. ✅ **Use secrets** (never commit keys to git)

## Testing GitHub Actions SSH Connection

After setting up secrets, test with a simple workflow:

```yaml
# .github/workflows/test-ssh.yml
name: Test SSH Connection
on: workflow_dispatch

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.PRODUCTION_USERNAME }}
          key: ${{ secrets.PRODUCTION_SSH_KEY }}
          port: ${{ secrets.PRODUCTION_PORT || 22 }}
          script: |
            echo "SSH connection successful!"
            whoami
            pwd
            docker --version
```

Run this workflow to verify SSH works before deploying.

## Common Issues Checklist

Before re-running GitHub Actions:

- [ ] Private key is copied completely (including BEGIN/END lines)
- [ ] Public key is added to server's `~/.ssh/authorized_keys`
- [ ] Server SSH port is accessible (not blocked by firewall)
- [ ] Username is correct (usually `root` or `ubuntu`)
- [ ] Project path exists on server
- [ ] No passphrase on private key
- [ ] All required secrets are set in GitHub

## Next Steps

After fixing SSH:

1. ✅ Re-run the failed GitHub Actions workflow
2. ✅ Watch the deployment logs
3. ✅ Verify services start successfully
4. ✅ Check health endpoints

---

**Quick Reference:**

```bash
# Generate key
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/mecabal_deploy -N ""

# Copy to server
ssh-copy-id -i ~/.ssh/mecabal_deploy.pub root@SERVER_IP

# Test connection
ssh -i ~/.ssh/mecabal_deploy root@SERVER_IP

# Get private key for GitHub Secret
cat ~/.ssh/mecabal_deploy

# Encode .env for GitHub Secret
cat .env.production | base64 -w 0
```
