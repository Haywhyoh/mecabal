# JWT Signing Keys Management Guide

## 🔐 Overview

This guide explains how to properly manage JWT signing keys in the MeCabal application to avoid authentication inconsistencies.

## 🚨 The Problem

**JWT Signing Key Inconsistency** occurs when:
- Different services use different secrets to sign/verify JWT tokens
- Access tokens and refresh tokens use the same secret (security risk)
- Default/weak secrets are used in production
- Secrets are not properly synchronized across services

## 🛠️ Current Architecture

### Token Types
1. **Access Tokens** - Short-lived (15 minutes), signed with `JWT_SECRET`
2. **Refresh Tokens** - Long-lived (7 days), signed with `JWT_REFRESH_SECRET`

### Services Using JWT
- **Auth Service** - Signs tokens with both secrets
- **API Gateway** - Validates access tokens with `JWT_SECRET`
- **Social Service** - Validates access tokens via API Gateway
- **All Microservices** - Should only validate access tokens

## 🔧 Solution Implementation

### 1. Separate JWT Strategies
- `JwtStrategy` - For access tokens (uses `JWT_SECRET`)
- `JwtRefreshStrategy` - For refresh tokens (uses `JWT_REFRESH_SECRET`)

### 2. JWT Configuration Service
- Centralized secret management
- Secret validation
- Secure secret generation

### 3. Environment Variables
```bash
# Access token secret (15 min expiry)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Refresh token secret (7 days expiry)
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# Token expiration times
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

## 🚀 Quick Fix

### Generate Secure Secrets
```bash
# Run the secret generator
node scripts/generate-jwt-secrets.js

# Copy the output to your .env file
```

### Update Environment
1. Generate new secrets using the script
2. Update `.env` file with new secrets
3. Restart all services
4. Test authentication flow

## 🔒 Security Best Practices

### 1. Secret Requirements
- **Minimum 32 characters** (recommended 64+)
- **Cryptographically random** (use crypto.randomBytes)
- **Different secrets** for access and refresh tokens
- **Environment-specific** secrets (dev, staging, prod)

### 2. Secret Rotation
- Rotate secrets regularly (every 90 days)
- Implement gradual rotation for zero-downtime
- Invalidate all existing tokens when rotating

### 3. Secret Storage
- Never commit secrets to version control
- Use environment variables or secret management services
- Encrypt secrets at rest
- Limit access to production secrets

## 🧪 Testing

### Validate Secret Configuration
```typescript
// In your service
const jwtConfig = new JwtConfigService(configService);
const validation = jwtConfig.validateSecrets();

if (!validation.isValid) {
  console.error('JWT Configuration Issues:', validation.issues);
}
```

### Test Token Validation
```bash
# Test access token validation
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" http://localhost:3000/api/posts

# Test refresh token validation
curl -X POST -H "Authorization: Bearer YOUR_REFRESH_TOKEN" http://localhost:3001/auth/refresh
```

## 🚨 Common Issues

### 1. "Invalid token" errors
- **Cause**: Wrong secret used for validation
- **Fix**: Ensure all services use correct secrets

### 2. "Token expired" errors
- **Cause**: Token past expiration time
- **Fix**: Refresh token or re-authenticate

### 3. "Invalid signature" errors
- **Cause**: Secret mismatch between signing and validation
- **Fix**: Synchronize secrets across all services

### 4. "User not found" errors
- **Cause**: Token valid but user doesn't exist in database
- **Fix**: Check user ID in token payload

## 📋 Checklist

- [ ] Generate secure secrets using the script
- [ ] Update `.env` file with new secrets
- [ ] Ensure secrets are different for access and refresh tokens
- [ ] Verify secret length is at least 32 characters
- [ ] Test authentication flow end-to-end
- [ ] Document secret rotation process
- [ ] Set up monitoring for authentication failures
- [ ] Implement secret validation in startup

## 🔄 Migration Guide

### From Inconsistent to Consistent
1. **Backup current secrets** (if any)
2. **Generate new secure secrets**
3. **Update all environment files**
4. **Deploy changes gradually**
5. **Monitor authentication metrics**
6. **Clean up old secrets**

### Zero-Downtime Rotation
1. **Add new secrets** alongside old ones
2. **Update services** to accept both secrets
3. **Issue new tokens** with new secrets
4. **Remove old secrets** after grace period
5. **Update services** to only use new secrets

## 📞 Support

If you encounter issues with JWT signing keys:
1. Check the validation output from `JwtConfigService`
2. Verify environment variables are loaded correctly
3. Test token generation and validation separately
4. Check service logs for authentication errors
5. Ensure all services are using the same secret configuration

---

**Remember**: JWT signing key consistency is critical for authentication security. Always use different, secure secrets for access and refresh tokens, and rotate them regularly.
