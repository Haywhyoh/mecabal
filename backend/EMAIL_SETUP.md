# Email Service Configuration Guide

## Overview
The MeCabal backend uses SMTP email service for sending OTP codes and notifications. You can use any SMTP-compatible email provider.

## Email Service Configuration

The email service requires the following environment variables to be set:

```bash
EMAIL_HOST=your-smtp-host
EMAIL_PORT=587
EMAIL_SENDER=your-email@domain.com
EMAIL_HOST_USER=your-smtp-username
EMAIL_HOST_PASSWORD=your-smtp-password
CLIENT_URL=https://mecabal.com
```

### Supported Email Providers

**Brevo (formerly SendinBlue) - Recommended:**
```bash
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_SENDER=noreply@mecabal.com
EMAIL_HOST_USER=your-brevo-smtp-user
EMAIL_HOST_PASSWORD=your-brevo-api-key
CLIENT_URL=https://mecabal.com
```

**Gmail SMTP:**
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SENDER=your-email@gmail.com
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
CLIENT_URL=https://mecabal.com
```

**Other SMTP Providers:**
Use your provider's SMTP settings with the same environment variable names.

## Environment Variables

Create a `.env` file in the backend root directory with the following variables:

```bash
# Email Service Configuration
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_SENDER=noreply@mecabal.com
EMAIL_HOST_USER=your-brevo-smtp-user
EMAIL_HOST_PASSWORD=your-brevo-api-key
CLIENT_URL=https://mecabal.com

# Other required environment variables
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=MeCabal_user
DATABASE_PASSWORD=MeCabalpassword
DATABASE_NAME=MeCabal_dev

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

API_GATEWAY_PORT=3000
AUTH_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
SOCIAL_SERVICE_URL=http://localhost:3003
MESSAGING_SERVICE_URL=http://localhost:3004
MARKETPLACE_SERVICE_URL=http://localhost:3005
EVENTS_SERVICE_URL=http://localhost:3006
NOTIFICATION_SERVICE_URL=http://localhost:3007

BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN=http://localhost:3001
LOG_LEVEL=debug
```

## Development Mode

For development, you can use either:
1. **Brevo (Recommended)**: Set up a free Brevo account for email sending
2. **Gmail SMTP**: Use your Gmail account with an App Password
3. **Other SMTP providers**: Configure any SMTP-compatible email service

## Testing Email Functionality

### 1. Test Email Endpoint
```bash
POST /auth/test/email
Authorization: Bearer <your-jwt-token>
```

### 2. Registration Flow
```bash
POST /auth/register
{
  "email": "test@example.com",
  "firstName": "Test",
  "lastName": "User",
  "password": "TestPassword123!"
}
```

### 3. OTP Verification
```bash
POST /auth/verify-otp
{
  "email": "test@example.com",
  "otpCode": "123456",
  "purpose": "registration"
}
```

## Email Templates

The system includes beautiful HTML email templates with:
- Nigerian-themed design
- Responsive layout
- Clear OTP display
- Security warnings
- Branding elements

## Troubleshooting

### Common Issues

1. **"Missing credentials for PLAIN" error**
   - Check that your email credentials are properly set
   - Verify the SMTP user and password are correct
   - Ensure 2FA is enabled for Gmail accounts

2. **"Email service not configured" error**
   - Check that your email credentials are properly set in environment variables
   - Verify the SMTP configuration is correct

3. **Emails not being received**
   - Check spam folder
   - Verify email address is correct
   - Check email service provider logs

### Debug Mode

Enable debug logging by setting:
```bash
LOG_LEVEL=debug
```

This will provide detailed logs about email sending attempts and any errors.

## Production Considerations

1. **Rate Limiting**: Implement proper rate limiting for email sending
2. **Monitoring**: Set up monitoring for email delivery rates
3. **Backup Provider**: Configure multiple email providers for redundancy
4. **Security**: Use environment variables for all credentials
5. **Templates**: Customize email templates for your brand

## Security Notes

- Never commit email credentials to version control
- Use environment variables for all sensitive data
- Regularly rotate API keys and passwords
- Monitor email sending for suspicious activity
- Implement proper rate limiting to prevent abuse
