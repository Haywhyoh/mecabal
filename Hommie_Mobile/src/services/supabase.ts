// MeCabal Supabase Client Configuration
// Main Supabase client setup for React Native

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Environment configuration with fallbacks
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client optimized for React Native
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use AsyncStorage for persistent sessions across app restarts
    storage: AsyncStorage,
    // Automatically refresh tokens
    autoRefreshToken: true,
    // Persist session between app launches
    persistSession: true,
    // Don't detect session in URL (not applicable for mobile)
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      // Optimize for mobile data usage
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'X-Client-Info': `mecabal-mobile/${Platform.OS}`,
    },
  },
});

// Supabase configuration constants
export const SUPABASE_CONFIG = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  buckets: {
    userProfiles: 'user-profiles',
    postMedia: 'post-media',
    eventMedia: 'event-media',
    marketplaceMedia: 'marketplace-media',
    userDocuments: 'user-documents',
  },
  edgeFunctions: {
    nigerianPhoneVerify: 'nigerian-phone-verify',
    paystackPayment: 'paystack-payment',
    locationServices: 'location-services',
  },
  realtime: {
    channels: {
      neighborhoodPosts: (neighborhoodId: string) => `neighborhood-posts:${neighborhoodId}`,
      userMessages: (userId: string) => `user-messages:${userId}`,
      safetyAlerts: (neighborhoodId: string) => `safety-alerts:${neighborhoodId}`,
      eventUpdates: (eventId: string) => `event-updates:${eventId}`,
    },
  },
} as const;

// Helper function to get storage bucket URL
export const getStorageUrl = (bucket: string, path: string): string => {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
};

// Helper function to get edge function URL
export const getEdgeFunctionUrl = (functionName: string, path?: string): string => {
  const basePath = `${supabaseUrl}/functions/v1/${functionName}`;
  return path ? `${basePath}/${path}` : basePath;
};

// Connection status monitoring
export const monitorConnection = (onStatusChange?: (status: 'OPEN' | 'CLOSED' | 'CONNECTING') => void) => {
  if (!onStatusChange) return;

  // Monitor auth state changes as a proxy for connection status
  const { data: authListener } = supabase.auth.onAuthStateChange((event: any, session: any) => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      onStatusChange('OPEN');
    } else if (event === 'SIGNED_OUT') {
      onStatusChange('CLOSED');
    }
  });

  return {
    unsubscribe: () => {
      authListener.subscription.unsubscribe();
    },
  };
};

// Error handling helper
export const handleSupabaseError = (error: any): string => {
  if (!error) return 'Unknown error occurred';
  
  // Handle common Supabase error types
  if (error.message) {
    // Network errors
    if (error.message.includes('fetch')) {
      return 'Network connection error. Please check your internet connection.';
    }
    
    // Authentication errors
    if (error.message.includes('JWT') || error.message.includes('token')) {
      return 'Authentication error. Please log in again.';
    }
    
    // Database errors
    if (error.message.includes('violates')) {
      return 'Data validation error. Please check your input.';
    }
    
    // Rate limiting
    if (error.message.includes('rate limit')) {
      return 'Too many requests. Please try again later.';
    }
    
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

// Performance monitoring (optional)
export const logPerformance = (operation: string, startTime: number) => {
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  if (__DEV__) {
    console.log(`[Supabase] ${operation} completed in ${duration}ms`);
    
    // Log slow operations
    if (duration > 2000) {
      console.warn(`[Supabase] Slow operation detected: ${operation} (${duration}ms)`);
    }
  }
};

// Network status helper for mobile
export const checkNetworkConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    return !error;
  } catch {
    return false;
  }
};

// Database health check
export const healthCheck = async (): Promise<{
  database: boolean;
  storage: boolean;
  functions: boolean;
}> => {
  const results = {
    database: false,
    storage: false,
    functions: false,
  };

  // Check database connectivity
  try {
    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    results.database = !error;
  } catch {
    results.database = false;
  }

  // Check storage accessibility
  try {
    const { data, error } = await supabase.storage
      .from(SUPABASE_CONFIG.buckets.userProfiles)
      .list('', { limit: 1 });
    results.storage = !error;
  } catch {
    results.storage = false;
  }

  // Check edge functions (basic connectivity test)
  try {
    // This will likely return an error for invalid input, but indicates the function is reachable
    await supabase.functions.invoke(SUPABASE_CONFIG.edgeFunctions.nigerianPhoneVerify, {
      body: { test: true }
    });
    results.functions = true;
  } catch (error: any) {
    // If we get a structured error response, the function is working
    results.functions = error?.message !== 'Failed to fetch';
  }

  return results;
};

// Export the configured client as default
export default supabase;