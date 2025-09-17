#!/usr/bin/env node

/**
 * Email Service Setup Script for MeCabal Backend
 * 
 * This script helps you configure email service credentials
 * for the MeCabal backend application.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupEmailService() {
  console.log('🏠 MeCabal Email Service Setup');
  console.log('================================\n');

  console.log('This script will help you configure email service credentials.');
  console.log('You can choose between Brevo (recommended) or Gmail SMTP.\n');

  const emailProvider = await question('Choose email provider (brevo/gmail): ').then(answer => answer.toLowerCase().trim());

  let envContent = '';

  if (emailProvider === 'brevo') {
    console.log('\n📧 Setting up Brevo Email Service');
    console.log('1. Go to https://brevo.com and create an account');
    console.log('2. Navigate to Settings > SMTP & API');
    console.log('3. Generate an SMTP API key\n');

    const brevoApiKey = await question('Enter your Brevo API key: ');
    const brevoSmtpUser = await question('Enter your Brevo SMTP user: ');
    const fromEmail = await question('Enter your from email address (e.g., noreply@mecabal.com): ');

    envContent = `# Brevo Email Configuration
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_SENDER=${fromEmail}
EMAIL_HOST_USER=${brevoSmtpUser}
EMAIL_HOST_PASSWORD=${brevoApiKey}
CLIENT_URL=https://mecabal.com
`;

  } else if (emailProvider === 'gmail') {
    console.log('\n📧 Setting up Gmail SMTP');
    console.log('1. Enable 2-factor authentication on your Gmail account');
    console.log('2. Generate an App Password: https://myaccount.google.com/apppasswords');
    console.log('3. Use the App Password (not your regular password)\n');

    const gmailUser = await question('Enter your Gmail address: ');
    const gmailPassword = await question('Enter your Gmail App Password: ');

    envContent = `# Gmail SMTP Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SENDER=${gmailUser}
EMAIL_HOST_USER=${gmailUser}
EMAIL_HOST_PASSWORD=${gmailPassword}
CLIENT_URL=https://mecabal.com
`;

  } else {
    console.log('❌ Invalid provider. Please choose "brevo" or "gmail".');
    process.exit(1);
  }

  // Add other required environment variables
  const otherEnvVars = `
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=MeCabal_user
DATABASE_PASSWORD=MeCabalpassword
DATABASE_NAME=MeCabal_dev

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# API Gateway
API_GATEWAY_PORT=3000
AUTH_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
SOCIAL_SERVICE_URL=http://localhost:3003
MESSAGING_SERVICE_URL=http://localhost:3004
MARKETPLACE_SERVICE_URL=http://localhost:3005
EVENTS_SERVICE_URL=http://localhost:3006
NOTIFICATION_SERVICE_URL=http://localhost:3007

# Security
BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN=http://localhost:3001
LOG_LEVEL=debug
`;

  const fullEnvContent = envContent + otherEnvVars;

  // Write to .env file
  const envPath = path.join(__dirname, '.env');
  fs.writeFileSync(envPath, fullEnvContent);

  console.log('\n✅ Email service configured successfully!');
  console.log(`📁 Environment variables saved to: ${envPath}`);
  console.log('\n🚀 You can now start the backend server:');
  console.log('   npm run start:dev');
  console.log('\n📧 Test email functionality:');
  console.log('   POST /auth/test/email (requires authentication)');

  rl.close();
}

setupEmailService().catch(console.error);
