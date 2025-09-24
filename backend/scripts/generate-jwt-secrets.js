#!/usr/bin/env node

const crypto = require('crypto');

console.log('🔐 Generating Secure JWT Secrets...\n');

// Generate secure secrets
const accessSecret = crypto.randomBytes(64).toString('hex');
const refreshSecret = crypto.randomBytes(64).toString('hex');

console.log('Generated JWT Secrets:');
console.log('====================');
console.log(`JWT_SECRET=${accessSecret}`);
console.log(`JWT_REFRESH_SECRET=${refreshSecret}`);
console.log('\n📝 Add these to your .env file:');
console.log('================================');
console.log(`JWT_SECRET=${accessSecret}`);
console.log(`JWT_REFRESH_SECRET=${refreshSecret}`);
console.log('\n⚠️  Security Notes:');
console.log('==================');
console.log('1. Keep these secrets secure and never commit them to version control');
console.log('2. Use different secrets for different environments (dev, staging, prod)');
console.log('3. Rotate these secrets regularly');
console.log('4. Each secret is 128 characters long (64 bytes in hex)');
console.log('\n✅ Secrets generated successfully!');
