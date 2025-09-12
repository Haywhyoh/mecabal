// Environment configuration for MeCabal
// Centralizes all environment variable access

export const ENV = {
  // Supabase Configuration
  SUPABASE: {
    URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '', // Only for server-side operations
  },
  
  // Email Service Configuration
  RESEND: {
    API_KEY: process.env.EXPO_RESEND_API_KEY || process.env.RESEND_API_KEY || '',
  },
  
  // Google Maps Configuration
  GOOGLE_MAPS: {
    API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  },
  
  // SMS Service Configuration (Future)
  SMS: {
    API_KEY: process.env.EXPO_PUBLIC_SMS_SERVICE_API_KEY || '',
  },
  
  // Development/Production flags
  DEV: {
    IS_DEVELOPMENT: __DEV__,
    ENABLE_LOGGING: __DEV__ || process.env.EXPO_PUBLIC_ENABLE_LOGGING === 'true',
    USE_MOCK_SERVICES: process.env.EXPO_PUBLIC_USE_MOCK_SERVICES === 'true',
  },
  
  // API Endpoints
  API: {
    BASE_URL: process.env.EXPO_PUBLIC_API_URL || '',
    TIMEOUT: 30000, // 30 seconds
  },
} as const;

// Validation functions
export const validateEnvironment = (): { valid: boolean; missing: string[] } => {
  const missing: string[] = [];
  
  if (!ENV.SUPABASE.URL) missing.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!ENV.SUPABASE.ANON_KEY) missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  if (!ENV.GOOGLE_MAPS.API_KEY) missing.push('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY');
  
  // Resend API key is optional for now (will show warning)
  if (!ENV.RESEND.API_KEY && ENV.DEV.ENABLE_LOGGING) {
    console.warn('⚠️ RESEND_API_KEY not set - email OTP will not work');
  }
  
  return {
    valid: missing.length === 0,
    missing
  };
};

// Logging helper
export const logEnvironment = (): void => {
  if (!ENV.DEV.ENABLE_LOGGING) return;
  
  console.log('🔧 Environment Configuration:');
  console.log('  - Supabase URL:', ENV.SUPABASE.URL ? '✅ Set' : '❌ Missing');
  console.log('  - Supabase Anon Key:', ENV.SUPABASE.ANON_KEY ? '✅ Set' : '❌ Missing');
  console.log('  - Google Maps API Key:', ENV.GOOGLE_MAPS.API_KEY ? '✅ Set' : '❌ Missing');
  console.log('  - Resend API Key:', ENV.RESEND.API_KEY ? '✅ Set' : '⚠️ Missing (email OTP disabled)');
  console.log('  - Development Mode:', ENV.DEV.IS_DEVELOPMENT ? '🔧 ON' : '🚀 OFF');
  
  const validation = validateEnvironment();
  if (!validation.valid) {
    console.error('❌ Missing required environment variables:', validation.missing);
  } else {
    console.log('✅ All required environment variables are set');
  }
};

// Edge function URLs (computed from Supabase URL)
export const getEdgeFunctionUrl = (functionName: string): string => {
  if (!ENV.SUPABASE.URL) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL not configured');
  }
  
  // Extract project ref from Supabase URL
  const urlParts = ENV.SUPABASE.URL.split('.');
  if (urlParts.length < 2) {
    throw new Error('Invalid Supabase URL format');
  }
  
  const projectRef = urlParts[0].replace('https://', '');
  return `https://${projectRef}.supabase.co/functions/v1/${functionName}`;
};

// Common edge functions
export const EDGE_FUNCTIONS = {
  EMAIL_OTP_VERIFY: 'email-otp-verify',
  AUTH_WITH_OTP: 'auth-with-otp',
  LOCATION_SERVICES: 'location-services',
  NIGERIAN_PHONE_VERIFY: 'nigerian-phone-verify',
  PAYSTACK_PAYMENT: 'paystack-payment',
} as const;

export default ENV;