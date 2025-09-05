# MeCabal Mobile Services

This directory contains all the service modules for integrating the MeCabal mobile app with the Supabase backend and Nigerian-specific integrations.

## Service Architecture

### Core Services
- **`supabase.ts`** - Main Supabase client configuration and utilities
- **`auth.ts`** - Authentication with Nigerian phone verification
- **`location.ts`** - Location services for estates/compounds verification
- **`payments.ts`** - Nigerian payment processing with Paystack
- **`realtime.ts`** - WebSocket real-time features for community engagement
- **`data.ts`** - CRUD operations for all app entities

### Service Usage

```typescript
// Import services
import { 
  MeCabalAuth, 
  MeCabalLocation, 
  MeCabalPayments, 
  MeCabalRealtime, 
  MeCabalData,
  MeCabalServices 
} from '../services';

// Authentication
const otpResult = await MeCabalAuth.sendOTP('+2348012345678');
const verifyResult = await MeCabalAuth.verifyOTP('+2348012345678', '123456');

// Location verification
const locationResult = await MeCabalLocation.verifyLocation(userId, lat, lng);
const neighborhoods = await MeCabalLocation.findNearbyNeighborhoods(lat, lng);

// Real-time subscriptions
const subscription = MeCabalRealtime.subscribeToNeighborhoodPosts(
  neighborhoodId,
  {
    onNewPost: (post) => console.log('New post:', post),
    onPostUpdate: (post) => console.log('Updated post:', post),
    onPostDelete: (id) => console.log('Deleted post:', id)
  }
);

// Data operations
const posts = await MeCabalData.getNeighborhoodFeed(neighborhoodId);
const createResult = await MeCabalData.createPost(postData);

// Service combinations
const dashboard = await MeCabalServices.getUserDashboard(userId);
const healthCheck = await MeCabalServices.performHealthCheck();
```

## Nigerian Context Features

### Phone Verification
- Supports all Nigerian carriers (MTN, Airtel, Glo, 9mobile)
- Automatic carrier detection from phone number
- Nigerian phone number formatting and validation

### Location Services
- Estate/compound terminology instead of "neighborhood"
- PostGIS-powered geolocation verification
- Nigerian address format support
- State and LGA (Local Government Area) integration

### Payments
- Paystack integration for Nigerian transactions
- Naira currency formatting (₦)
- Local payment methods (cards, bank transfer, USSD, mobile money)
- Transaction fee calculation with Nigerian rates

### Real-time Features
- Community-focused real-time updates
- Safety alert broadcasting with immediate notifications
- Estate-specific messaging and announcements
- Event RSVP updates

## Environment Configuration

Required environment variables in `.env`:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional (for production)
PAYSTACK_PUBLIC_KEY=your-paystack-public-key
GOOGLE_MAPS_API_KEY=your-maps-api-key
```

## Error Handling

All services use consistent error handling:

```typescript
const result = await MeCabalAuth.sendOTP(phone);

if (result.success) {
  // Handle success
  console.log('OTP sent via', result.carrier);
} else {
  // Handle error
  console.error('Failed to send OTP:', result.error);
}
```

## Performance Considerations

- All database operations include performance logging (dev mode)
- Services implement proper caching strategies
- Real-time subscriptions are optimized for mobile data usage
- Bulk operations available for better performance

## Security Features

- Row Level Security (RLS) policies enforce data privacy
- Nigerian phone number validation prevents fraud
- Location verification ensures community integrity
- Payment integration uses secure Nigerian gateways

## Testing

Services can be tested individually:

```typescript
// Test authentication
console.log('Testing authentication...');
const authTest = await MeCabalAuth.sendOTP('+2348012345678');

// Test location services
console.log('Testing location services...');
const locationTest = await MeCabalLocation.findNearbyNeighborhoods(6.5244, 3.3792);

// Test health check
const health = await MeCabalServices.performHealthCheck();
console.log('Health status:', health.overall_status);
```

## Migration from Old Structure

This service architecture replaces the previous monolithic `supabase-client.ts`. Benefits include:

- ✅ **Modular design** - Each service focuses on specific functionality
- ✅ **Better TypeScript support** - Comprehensive type definitions
- ✅ **Improved maintainability** - Easier to update individual services
- ✅ **Nigerian context** - Built-in cultural and business logic
- ✅ **Performance optimization** - Service-specific optimizations
- ✅ **Better testing** - Services can be tested independently