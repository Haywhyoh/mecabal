# MeCabal Mobile App Integration Guide
*Connecting React Native App to Supabase Backend*

## Overview

This guide explains how to integrate the MeCabal mobile app with the Supabase backend using the new modular service architecture.

## Prerequisites

1. **Supabase Project** - Set up according to `../supabase-integration/documentation/supabase-setup.md`
2. **Environment Variables** - Configure Supabase credentials
3. **Dependencies** - Install required packages

## Quick Start

### 1. Install Dependencies

```bash
cd Hommie_Mobile
npm install @supabase/supabase-js @react-native-async-storage/async-storage
```

### 2. Configure Environment

Create or update `.env` in `Hommie_Mobile/`:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: Additional services
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-key
EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=your-paystack-public-key
```

### 3. Import Services in Your App

```typescript
// App.tsx or main entry point
import { MeCabalServices } from './src/services';

export default function App() {
  // Initialize services when app starts
  useEffect(() => {
    const initializeApp = async () => {
      const health = await MeCabalServices.performHealthCheck();
      console.log('Backend health:', health.overall_status);
    };
    
    initializeApp();
  }, []);

  return (
    // Your app components
  );
}
```

## Service Integration Examples

### Authentication Integration

```typescript
// screens/PhoneVerificationScreen.tsx
import React, { useState } from 'react';
import { MeCabalAuth } from '../services';

export default function PhoneVerificationScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    setLoading(true);
    
    const result = await MeCabalAuth.sendOTP(phone, 'registration');
    
    if (result.success) {
      // Show success message with carrier info
      Alert.alert(
        'OTP Sent',
        `Verification code sent via ${result.carrier}`,
        [{ text: 'OK', onPress: () => navigateToOTPScreen() }]
      );
    } else {
      // Show error
      Alert.alert('Error', result.error);
    }
    
    setLoading(false);
  };

  return (
    // Your UI components
  );
}
```

### Location Services Integration

```typescript
// screens/LocationSetupScreen.tsx
import React, { useEffect, useState } from 'react';
import { MeCabalLocation } from '../services';

export default function LocationSetupScreen({ userId }: { userId: string }) {
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loading, setLoading] = useState(false);

  const getCurrentLocationAndFind = async () => {
    setLoading(true);
    
    // Get device location (implement based on your location library)
    const location = await getCurrentDeviceLocation();
    
    if (location) {
      // Find nearby neighborhoods
      const nearbyNeighborhoods = await MeCabalLocation.findNearbyNeighborhoods(
        location.latitude,
        location.longitude,
        5 // 5km radius
      );
      
      setNeighborhoods(nearbyNeighborhoods);
    }
    
    setLoading(false);
  };

  const joinNeighborhood = async (neighborhoodId: string) => {
    const result = await MeCabalLocation.joinNeighborhood(
      userId,
      neighborhoodId,
      'resident'
    );
    
    if (result.success) {
      Alert.alert('Success', 'Joined neighborhood successfully');
      // Navigate to main app
    } else {
      Alert.alert('Error', result.error);
    }
  };

  return (
    // Your neighborhood selection UI
  );
}
```

### Real-time Features Integration

```typescript
// screens/CommunityFeedScreen.tsx
import React, { useEffect, useState } from 'react';
import { MeCabalRealtime, MeCabalData } from '../services';

export default function CommunityFeedScreen({ neighborhoodId }: { neighborhoodId: string }) {
  const [posts, setPosts] = useState([]);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    // Load initial posts
    loadPosts();
    
    // Subscribe to real-time updates
    const realtimeSubscription = MeCabalRealtime.subscribeToNeighborhoodPosts(
      neighborhoodId,
      {
        onNewPost: (newPost) => {
          setPosts(current => [newPost, ...current]);
        },
        onPostUpdate: (updatedPost) => {
          setPosts(current => 
            current.map(post => 
              post.id === updatedPost.id ? updatedPost : post
            )
          );
        },
        onPostDelete: (postId) => {
          setPosts(current => 
            current.filter(post => post.id !== postId)
          );
        }
      }
    );
    
    setSubscription(realtimeSubscription);
    
    // Cleanup on unmount
    return () => {
      realtimeSubscription?.unsubscribe();
    };
  }, [neighborhoodId]);

  const loadPosts = async () => {
    const result = await MeCabalData.getNeighborhoodFeed(neighborhoodId);
    setPosts(result.data);
  };

  return (
    // Your feed UI with posts
  );
}
```

### Payment Integration

```typescript
// screens/PaymentScreen.tsx
import React from 'react';
import { MeCabalPayments } from '../services';

export default function PaymentScreen({ 
  listingId, 
  amount, 
  userEmail, 
  userId 
}: {
  listingId: string;
  amount: number;
  userEmail: string;
  userId: string;
}) {
  const handlePayment = async () => {
    // Initialize payment
    const paymentResult = await MeCabalPayments.initializePayment({
      amount,
      email: userEmail,
      listing_id: listingId,
      user_id: userId,
      transaction_type: 'purchase'
    });

    if (paymentResult.success) {
      // Open payment URL in WebView or browser
      Linking.openURL(paymentResult.authorization_url);
    } else {
      Alert.alert('Payment Error', paymentResult.error);
    }
  };

  const handlePaymentCallback = async (reference: string) => {
    // Verify payment after user returns
    const verifyResult = await MeCabalPayments.verifyPayment(reference);
    
    if (verifyResult.success && verifyResult.data?.status === 'successful') {
      Alert.alert('Success', 'Payment completed successfully');
      // Navigate to success screen
    } else {
      Alert.alert('Payment Failed', 'Transaction was not successful');
    }
  };

  return (
    // Your payment UI
  );
}
```

## App-wide Service Setup

### 1. Create Services Context

```typescript
// contexts/ServicesContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { MeCabalServices, MeCabalAuth } from '../services';

interface ServicesContextType {
  user: any | null;
  neighborhoods: any[];
  isLoading: boolean;
  refreshUserData: () => Promise<void>;
}

const ServicesContext = createContext<ServicesContextType | undefined>(undefined);

export function ServicesProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeServices();
    
    // Listen to auth changes
    const { data: authListener } = MeCabalAuth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        refreshUserData();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setNeighborhoods([]);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const initializeServices = async () => {
    setIsLoading(true);
    const sessionData = await MeCabalServices.initializeSession();
    
    if (sessionData) {
      setUser(sessionData.user);
      setNeighborhoods(sessionData.neighborhoods);
    }
    
    setIsLoading(false);
  };

  const refreshUserData = async () => {
    const user = await MeCabalAuth.getCurrentUser();
    if (user) {
      setUser(user);
      const userNeighborhoods = await MeCabalLocation.getUserNeighborhoods(user.id);
      setNeighborhoods(userNeighborhoods);
    }
  };

  return (
    <ServicesContext.Provider value={{
      user,
      neighborhoods,
      isLoading,
      refreshUserData
    }}>
      {children}
    </ServicesContext.Provider>
  );
}

export function useServices() {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error('useServices must be used within ServicesProvider');
  }
  return context;
}
```

### 2. Wrap App with Services Provider

```typescript
// App.tsx
import { ServicesProvider } from './src/contexts/ServicesContext';

export default function App() {
  return (
    <ServicesProvider>
      {/* Your app navigation and components */}
    </ServicesProvider>
  );
}
```

## Error Handling Best Practices

### Global Error Handler

```typescript
// utils/errorHandler.ts
import { Alert } from 'react-native';

export const handleServiceError = (error: string, context: string = '') => {
  if (__DEV__) {
    console.error(`[${context}] Service Error:`, error);
  }

  // Show user-friendly messages
  if (error.includes('network') || error.includes('fetch')) {
    Alert.alert(
      'Connection Error',
      'Please check your internet connection and try again.'
    );
  } else if (error.includes('authentication') || error.includes('token')) {
    Alert.alert(
      'Session Expired',
      'Please log in again.',
      [{ text: 'OK', onPress: () => navigateToLogin() }]
    );
  } else {
    Alert.alert('Error', error);
  }
};

// Usage in components
const result = await MeCabalAuth.sendOTP(phone);
if (!result.success) {
  handleServiceError(result.error, 'PhoneVerification');
}
```

## Performance Optimization

### 1. Service Caching

```typescript
// utils/serviceCache.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export class ServiceCache {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await AsyncStorage.getItem(`service_cache_${key}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  static async set(key: string, data: any, ttl: number = 300000): Promise<void> {
    try {
      const cacheData = {
        data,
        expires: Date.now() + ttl
      };
      await AsyncStorage.setItem(`service_cache_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }
}
```

### 2. Optimized Data Loading

```typescript
// hooks/useOptimizedFeed.ts
import { useState, useEffect } from 'react';
import { MeCabalData } from '../services';

export function useOptimizedFeed(neighborhoodId: string) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    const result = await MeCabalData.getNeighborhoodFeed(neighborhoodId, {
      page,
      limit: 20
    });

    setPosts(current => [...current, ...result.data]);
    setHasMore(result.has_more);
    setPage(current => current + 1);
    setLoading(false);
  };

  useEffect(() => {
    loadMore();
  }, [neighborhoodId]);

  return { posts, loading, hasMore, loadMore };
}
```

## Testing Integration

### Service Testing

```typescript
// __tests__/services.test.ts
import { MeCabalServices } from '../src/services';

describe('MeCabal Services Integration', () => {
  test('health check returns status', async () => {
    const health = await MeCabalServices.performHealthCheck();
    expect(health).toHaveProperty('overall_status');
    expect(['healthy', 'degraded', 'unhealthy']).toContain(health.overall_status);
  });

  test('authentication with invalid phone fails gracefully', async () => {
    const result = await MeCabalAuth.sendOTP('invalid-phone');
    expect(result.success).toBe(false);
    expect(result.error).toContain('phone number');
  });
});
```

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   ```bash
   # Ensure .env file is in the correct location
   ls -la Hommie_Mobile/.env
   
   # Restart Expo development server
   npm start --clear
   ```

2. **Supabase Connection Errors**
   ```typescript
   // Check connection
   const health = await MeCabalServices.performHealthCheck();
   console.log('Health check:', health);
   ```

3. **Real-time Subscriptions Not Working**
   ```typescript
   // Debug subscriptions
   console.log('Active subscriptions:', MeCabalRealtime.getActiveSubscriptionsCount());
   
   // Cleanup and recreate
   MeCabalRealtime.cleanupAllSubscriptions();
   ```

### Debug Mode

```typescript
// Enable debug logging
if (__DEV__) {
  // Log all service calls
  console.log = (...args) => {
    if (args[0]?.includes?.('[MeCabal]')) {
      // Your debug logging
    }
  };
}
```

## Next Steps

1. **Implement Authentication Flow** - Start with phone verification
2. **Add Location Setup** - Integrate neighborhood selection
3. **Build Community Features** - Posts, events, marketplace
4. **Add Real-time Updates** - Live feed and messaging
5. **Integrate Payments** - Paystack for marketplace transactions

The modular service architecture makes it easy to implement features incrementally while maintaining Nigerian cultural context and optimal performance.