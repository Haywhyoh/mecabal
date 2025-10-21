# GitHub Packages (GHCR) Setup Guide

## Error: "installation not allowed to Create organization package"

### What This Means

GitHub Actions doesn't have permission to create packages in your GitHub Container Registry (GHCR).

## Quick Fix

### Option 1: Enable Package Creation in Repository Settings (Recommended)

1. **Go to your GitHub repository**
   - Navigate to: `https://github.com/Haywhyoh/mecabal`

2. **Go to Settings → Actions → General**
   - Scroll down to **"Workflow permissions"**
   - Select: **"Read and write permissions"**
   - Check: **"Allow GitHub Actions to create and approve pull requests"**
   - Click **"Save"**

3. **Re-run the failed workflow**
   - Go to Actions tab
   - Click on the failed workflow
   - Click "Re-run all jobs"

### Option 2: Enable Package Creation for Organization

If this is an organization repository:

1. **Go to Organization Settings**
   - Navigate to: `https://github.com/organizations/YOUR_ORG/settings`

2. **Go to Packages**
   - Click on "Packages" in the left sidebar

3. **Enable Package Creation**
   - Under "Package creation", enable:
     - ✅ "Allow members to create packages"
     - ✅ "Allow GitHub Actions workflows to create packages"

4. **Save changes**

### Option 3: Use Docker Hub Instead

If you don't want to use GHCR, switch to Docker Hub:

#### Update `.github/workflows/deploy-backend.yml`:

```yaml
env:
  NODE_VERSION: '22'
  DOCKER_REGISTRY: docker.io  # Changed from ghcr.io
  IMAGE_NAME: YOUR_DOCKERHUB_USERNAME/mecabal-backend
```

#### Add Docker Hub credentials to GitHub Secrets:

1. Go to: Settings → Secrets → Actions
2. Add new secrets:
   - `DOCKERHUB_USERNAME` - Your Docker Hub username
   - `DOCKERHUB_TOKEN` - Your Docker Hub access token

#### Update login step in workflow:

```yaml
- name: Log in to Container Registry
  uses: docker/login-action@v3
  with:
    registry: docker.io
    username: ${{ secrets.DOCKERHUB_USERNAME }}
    password: ${{ secrets.DOCKERHUB_TOKEN }}
```

## Verification

After fixing permissions, verify it works:

1. **Trigger a new build:**
   ```bash
   git commit --allow-empty -m "Test GHCR permissions"
   git push origin main
   ```

2. **Check GitHub Actions logs**
   - Should see successful push to GHCR
   - No "denied: installation not allowed" error

3. **Verify package was created:**
   - Go to: `https://github.com/Haywhyoh?tab=packages`
   - Or: `https://github.com/Haywhyoh/mecabal/pkgs/container/mecabal-backend`

## Current Workflow Changes

I've already updated your workflow with:

1. ✅ **Added workflow-level permissions:**
   ```yaml
   permissions:
     contents: read
     packages: write
     id-token: write
   ```

2. ✅ **Added job-level permissions for build job:**
   ```yaml
   build:
     permissions:
       contents: read
       packages: write
       id-token: write
   ```

3. ✅ **Fixed image name:**
   - Changed from: `${{ github.repository }}/mecabal-backend`
   - To: `${{ github.repository_owner }}/mecabal-backend`

These changes ensure proper permissions when the repository settings allow it.

## Troubleshooting

### Still getting "denied" error?

**Check these:**

1. **Repository visibility:**
   - Private repo? Make sure package creation is enabled
   - Public repo? Should work once permissions are set

2. **Organization settings:**
   - If in an organization, check org-level package settings
   - May need admin approval to create packages

3. **GITHUB_TOKEN permissions:**
   - The workflow now explicitly requests `packages: write`
   - This should be sufficient for GHCR

### Alternative: Skip Docker Build for Now

If you want to deploy without building images in CI/CD:

1. **Comment out the build job** in `.github/workflows/deploy-backend.yml`:
   ```yaml
   # build:
   #   name: Build Docker Image
   #   ...
   ```

2. **Update deploy jobs** to not depend on build:
   ```yaml
   deploy-staging:
     needs: test  # Changed from: needs: build
   ```

3. **Build images directly on the server:**
   ```bash
   # On server
   cd ~/mecabal/backend
   docker-compose -f docker-compose.production.yml build
   docker-compose -f docker-compose.production.yml up -d
   ```

## Recommended Solution

For **Haywhyoh/mecabal** repository:

1. ✅ **Enable "Read and write permissions"** in repository settings
2. ✅ **Commit the updated workflow** (already done)
3. ✅ **Push to GitHub** to trigger new build
4. ✅ **Verify package creation** in GitHub packages

This is the simplest solution and keeps everything on GitHub.

## Package URL After Success

Once working, your Docker images will be available at:

```
ghcr.io/haywhyoh/mecabal-backend:latest
ghcr.io/haywhyoh/mecabal-backend:main
ghcr.io/haywhyoh/mecabal-backend:develop
```

You can pull them with:

```bash
docker pull ghcr.io/haywhyoh/mecabal-backend:latest
```

## Next Steps

After fixing permissions:

1. ✅ Re-run failed GitHub Actions workflow
2. ✅ Verify package appears in GitHub Packages
3. ✅ Update deployment scripts to use GHCR images
4. ✅ Set package visibility (public/private)

---

**Need Help?**

- Check GitHub's official docs: https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry
- Open an issue if problems persist
