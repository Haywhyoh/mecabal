// Environment configuration for MeCabal
// Centralizes all environment variable access

export const ENV = {
  // Backend API Configuration
  API: {
    BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
    TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '10000', 10),
  },
  
  // Google Maps Configuration
  GOOGLE_MAPS: {
    API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  },
  
  // Development/Production flags
  DEV: {
    IS_DEVELOPMENT: __DEV__,
    ENABLE_LOGGING: __DEV__ || process.env.EXPO_PUBLIC_ENABLE_LOGGING === 'true',
    USE_MOCK_SERVICES: process.env.EXPO_PUBLIC_USE_MOCK_SERVICES === 'true',
  },
} as const;

// Validation functions
export const validateEnvironment = (): { valid: boolean; missing: string[] } => {
  const missing: string[] = [];
  
  if (!ENV.API.BASE_URL) missing.push('EXPO_PUBLIC_API_URL');
  if (!ENV.GOOGLE_MAPS.API_KEY) missing.push('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY');
  
  return {
    valid: missing.length === 0,
    missing
  };
};

// Logging helper
export const logEnvironment = (): void => {
  if (!ENV.DEV.ENABLE_LOGGING) return;
  
  console.log('🔧 Environment Configuration:');
  console.log('  - Backend API URL:', ENV.API.BASE_URL ? '✅ Set' : '❌ Missing');
  console.log('  - Google Maps API Key:', ENV.GOOGLE_MAPS.API_KEY ? '✅ Set' : '❌ Missing');
  console.log('  - Development Mode:', ENV.DEV.IS_DEVELOPMENT ? '🔧 ON' : '🚀 OFF');
  
  const validation = validateEnvironment();
  if (!validation.valid) {
    console.error('❌ Missing required environment variables:', validation.missing);
  } else {
    console.log('✅ All required environment variables are set');
  }
};

// Backend API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    PHONE_SEND_OTP: '/auth/phone/send-otp',
    PHONE_VERIFY_OTP: '/auth/phone/verify-otp',
    EMAIL_SEND_OTP: '/auth/email/send-otp',
    EMAIL_VERIFY_OTP: '/auth/email/verify-otp',
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    PROFILE: '/auth/profile',
    VERIFY: '/auth/verify',
  },
} as const;

export default ENV;