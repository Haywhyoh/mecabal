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
  
  // DigitalOcean Spaces Configuration
  DO_SPACES: {
    ACCESS_KEY: process.env.EXPO_PUBLIC_DO_SPACES_KEY || '',
    SECRET_KEY: process.env.EXPO_PUBLIC_DO_SPACES_SECRET || '',
    BUCKET: process.env.EXPO_PUBLIC_DO_SPACES_BUCKET || '',
    REGION: process.env.EXPO_PUBLIC_DO_SPACES_REGION || 'nyc3',
    ENDPOINT: process.env.EXPO_PUBLIC_DO_SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com',
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
  POSTS: {
    CREATE: '/posts',
    GET_ALL: '/posts',
    GET_BY_ID: '/posts',
    UPDATE: '/posts',
    DELETE: '/posts',
    PIN: '/posts',
  },
  REACTIONS: {
    ADD: '/reactions/posts',
    REMOVE: '/reactions/posts',
    GET_STATS: '/reactions/posts',
  },
  COMMENTS: {
    CREATE: '/comments/posts',
    GET_ALL: '/comments/posts',
    UPDATE: '/comments',
    DELETE: '/comments',
  },
  CATEGORIES: {
    GET_ALL: '/posts/categories',
    GET_BY_ID: '/posts/categories',
    CREATE: '/posts/categories',
    UPDATE: '/posts/categories',
    DELETE: '/posts/categories',
    STATS: '/posts/categories/stats',
  },
  MODERATION: {
    REPORT: '/moderation/report',
    MODERATE: '/moderation/moderate',
    QUEUE: '/moderation/queue',
    STATS: '/moderation/stats',
  },
  MEDIA: {
    UPLOAD: '/media/upload',
    GET_ALL: '/media',
    GET_BY_ID: '/media',
    DELETE: '/media',
    MY_MEDIA: '/media/my-media',
    STATS: '/media/stats',
  },
  LISTINGS: {
    CREATE: '/listings',
    GET_ALL: '/listings',
    GET_BY_ID: '/listings',
    UPDATE: '/listings',
    DELETE: '/listings',
    SAVE: '/listings',
    UNSAVE: '/listings',
    SAVED: '/listings/saved',
    MY_LISTINGS: '/listings/my-listings',
    MARK_SOLD: '/listings',
    VIEW: '/listings',
    NEARBY: '/listings/nearby',
    SEARCH: '/listings/search',
  },
  CATEGORIES: {
    GET_ALL: '/listing-categories',
    GET_BY_ID: '/listing-categories',
    GET_BY_TYPE: '/listing-categories/type',
  },
  MESSAGING: {
    CONVERSATIONS: '/messaging/conversations',
    MESSAGES: '/messaging/messages',
    TYPING: '/messaging/typing',
    MARK_READ: '/messaging/mark-read',
    EVENT_CONVERSATION: '/messaging/conversations/event',
    BUSINESS_CONVERSATION: '/messaging/conversations/business',
    HEALTH: '/messaging/health',
  },
} as const;

export default ENV;