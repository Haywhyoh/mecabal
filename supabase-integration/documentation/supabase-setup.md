# MeCabal Supabase Setup Guide
*Phase 1 Implementation - Nigerian Community Platform*

## Overview

This guide walks you through setting up Supabase for the MeCabal MVP, including database schema, authentication, real-time features, edge functions, and Nigerian-specific integrations.

## Prerequisites

- [Supabase Account](https://supabase.com) (Free tier sufficient for MVP)
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed locally
- Node.js 18+ for Edge Functions development
- Nigerian SMS service API keys (for production)
- Paystack account and API keys (for payments)
- Mapbox account (for geocoding)

## Phase 1: Project Setup

### 1. Create Supabase Project

```bash
# Using Supabase CLI
supabase projects create mecabal --org-id your-org-id

# Or create via dashboard at https://supabase.com/dashboard
```

**Project Settings:**
- Project Name: `MeCabal`
- Region: `West Africa (Lagos)` or `Europe (London)` for low latency to Nigeria
- Pricing Plan: `Free` (sufficient for MVP, upgrade later)

### 2. Initialize Local Development

```bash
# Clone project and setup Supabase locally
cd mecabal/supabase-integration
supabase init
supabase start

# Link to your project
supabase link --project-ref your-project-ref
```

### 3. Configure Environment Variables

Create `.env.local` file:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Nigerian SMS Service (choose one)
NIGERIAN_SMS_API_KEY=your-sms-api-key
NIGERIAN_SMS_PROVIDER=bulk-sms-nigeria # or smart-sms, twilio

# Payment Integration
PAYSTACK_PUBLIC_KEY=pk_test_your-paystack-public-key
PAYSTACK_SECRET_KEY=sk_test_your-paystack-secret-key
PAYSTACK_WEBHOOK_SECRET=your-webhook-secret

# Geocoding Service
MAPBOX_ACCESS_TOKEN=your-mapbox-token

# App Configuration
APP_URL=https://mecabal.app
```

## Phase 2: Database Setup

### 1. Apply Database Schema

```bash
# Apply the schema from database/schema.sql
supabase db reset
supabase db push
```

### 2. Verify Tables and RLS Policies

```bash
# Check tables are created
supabase db diff

# Test RLS policies work correctly
supabase test db
```

### 3. Enable Required Extensions

Extensions are automatically enabled in the schema, but verify:

```sql
-- Check extensions are enabled
SELECT * FROM pg_extension WHERE extname IN ('uuid-ossp', 'postgis', 'pg_cron');
```

### 4. Insert Nigerian States and LGAs

```sql
-- Insert Nigerian states
INSERT INTO public.states (name, code) VALUES 
('Abia', 'AB'), ('Adamawa', 'AD'), ('Akwa Ibom', 'AK'), ('Anambra', 'AN'),
('Bauchi', 'BA'), ('Bayelsa', 'BY'), ('Benue', 'BE'), ('Borno', 'BO'),
('Cross River', 'CR'), ('Delta', 'DE'), ('Ebonyi', 'EB'), ('Edo', 'ED'),
('Ekiti', 'EK'), ('Enugu', 'EN'), ('Gombe', 'GO'), ('Imo', 'IM'),
('Jigawa', 'JI'), ('Kaduna', 'KD'), ('Kano', 'KN'), ('Katsina', 'KT'),
('Kebbi', 'KE'), ('Kogi', 'KO'), ('Kwara', 'KW'), ('Lagos', 'LA'),
('Nasarawa', 'NA'), ('Niger', 'NI'), ('Ogun', 'OG'), ('Ondo', 'ON'),
('Osun', 'OS'), ('Oyo', 'OY'), ('Plateau', 'PL'), ('Rivers', 'RI'),
('Sokoto', 'SO'), ('Taraba', 'TA'), ('Yobe', 'YO'), ('Zamfara', 'ZA'),
('FCT', 'FC');

-- Insert major Lagos LGAs (add more states as needed)
INSERT INTO public.local_government_areas (state_id, name) VALUES
((SELECT id FROM states WHERE code = 'LA'), 'Ikeja'),
((SELECT id FROM states WHERE code = 'LA'), 'Lagos Island'),
((SELECT id FROM states WHERE code = 'LA'), 'Lagos Mainland'),
((SELECT id FROM states WHERE code = 'LA'), 'Surulere'),
((SELECT id FROM states WHERE code = 'LA'), 'Yaba'),
((SELECT id FROM states WHERE code = 'LA'), 'Victoria Island'),
((SELECT id FROM states WHERE code = 'LA'), 'Ikoyi'),
((SELECT id FROM states WHERE code = 'LA'), 'Lekki'),
((SELECT id FROM states WHERE code = 'LA'), 'Ajah'),
((SELECT id FROM states WHERE code = 'LA'), 'Alimosho');
```

## Phase 3: Authentication Setup

### 1. Configure Auth Settings

In Supabase Dashboard → Authentication → Settings:

**Site URL:** `https://mecabal.app` (your app URL)

**Redirect URLs:** 
```
https://mecabal.app/auth/callback
exp://your-expo-app/auth/callback
```

**SMTP Settings (Email):** Configure for password resets

**Phone Auth:** 
- Provider: `Twilio` (or custom SMS service via Edge Functions)
- Test phone numbers for development

### 2. Enable Social Providers (Optional)

**Google OAuth:**
- Client ID: Your Google OAuth client ID
- Client Secret: Your Google OAuth client secret

**Apple OAuth:**
- Service ID: Your Apple Service ID
- Key ID: Your Apple Key ID
- Private Key: Your Apple private key

## Phase 4: Edge Functions Deployment

### 1. Deploy Nigerian Phone Verification Function

```bash
# Deploy Nigerian phone verification
supabase functions deploy nigerian-phone-verify --project-ref your-project-ref

# Set secrets for SMS service
supabase secrets set NIGERIAN_SMS_API_KEY=your-api-key
```

**Function URL:** `https://your-project-ref.supabase.co/functions/v1/nigerian-phone-verify`

**Test the function:**
```bash
curl -X POST 'https://your-project-ref.supabase.co/functions/v1/nigerian-phone-verify' \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+2348012345678", "purpose": "registration"}'
```

### 2. Deploy Paystack Payment Function

```bash
# Deploy payment function
supabase functions deploy paystack-payment --project-ref your-project-ref

# Set Paystack secrets
supabase secrets set PAYSTACK_SECRET_KEY=sk_test_your-secret-key
supabase secrets set PAYSTACK_WEBHOOK_SECRET=your-webhook-secret
```

**Function URLs:**
- Initialize: `https://your-project-ref.supabase.co/functions/v1/paystack-payment/initialize`
- Verify: `https://your-project-ref.supabase.co/functions/v1/paystack-payment/verify`
- Webhook: `https://your-project-ref.supabase.co/functions/v1/paystack-payment/webhook`

### 3. Deploy Location Services Function

```bash
# Deploy location services
supabase functions deploy location-services --project-ref your-project-ref

# Set Mapbox secret
supabase secrets set MAPBOX_ACCESS_TOKEN=your-mapbox-token
```

**Function URLs:**
- Verify Location: `https://your-project-ref.supabase.co/functions/v1/location-services/verify-location`
- Find Neighborhoods: `https://your-project-ref.supabase.co/functions/v1/location-services/find-neighborhoods`

## Phase 5: Storage Configuration

### 1. Create Storage Buckets

```sql
-- Create public buckets for user content
INSERT INTO storage.buckets (id, name, public) VALUES 
('user-profiles', 'user-profiles', true),
('post-media', 'post-media', true),
('event-media', 'event-media', true),
('marketplace-media', 'marketplace-media', true);

-- Create private bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES 
('user-documents', 'user-documents', false);
```

### 2. Set Storage Policies

```sql
-- Users can upload their own profile pictures
CREATE POLICY "Users can upload own profile picture" 
ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'user-profiles' AND 
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- Users can view public profile pictures
CREATE POLICY "Anyone can view profile pictures" 
ON storage.objects FOR SELECT USING (bucket_id = 'user-profiles');

-- Users can upload media for their posts
CREATE POLICY "Users can upload post media" 
ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'post-media' AND 
  auth.uid() IS NOT NULL
);

-- Anyone can view post media
CREATE POLICY "Anyone can view post media" 
ON storage.objects FOR SELECT USING (bucket_id = 'post-media');
```

## Phase 6: Real-time Configuration

### 1. Enable Real-time for Tables

```sql
-- Enable real-time for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.safety_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_rsvps;
```

### 2. Configure Real-time Settings

In Supabase Dashboard → Settings → API:

**Real-time Settings:**
- Max concurrent connections: `200` (increase as needed)
- Max events per second: `10` (optimize for mobile)
- Enable presence: `true`

## Phase 7: Nigerian SMS Integration

### 1. Choose SMS Provider

**Recommended Nigerian SMS Services:**

**Option 1: Bulk SMS Nigeria**
```javascript
const smsConfig = {
  baseUrl: 'https://api.bulksmsnigeria.com/v2',
  username: 'your-username',
  password: 'your-password',
  sender: 'MeCabal'
};
```

**Option 2: Smart SMS Solutions**
```javascript
const smsConfig = {
  baseUrl: 'https://smartsmssolutions.com/api',
  token: 'your-api-token',
  sender: 'MeCabal'
};
```

**Option 3: Twilio (International)**
```javascript
const twilioConfig = {
  accountSid: 'your-account-sid',
  authToken: 'your-auth-token',
  messagingServiceSid: 'your-messaging-service-sid'
};
```

### 2. Update Edge Function Configuration

Edit `edge-functions/nigerian-phone-verify/index.ts` to use your chosen provider:

```typescript
// Update sendSMSViaNigerian function with your provider's API
async function sendSMSViaNigerian(phone: string, message: string, carrier: NigerianCarrier) {
  const response = await fetch('YOUR_SMS_PROVIDER_URL', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('YOUR_SMS_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: phone,
      message,
      sender_id: 'MeCabal',
      carrier_hint: carrier.name
    })
  });
  
  return response.ok;
}
```

## Phase 8: Paystack Integration

### 1. Setup Paystack Account

1. Create account at [paystack.com](https://paystack.com)
2. Complete business verification
3. Get API keys from Settings → API Keys & Webhooks

### 2. Configure Webhook Endpoint

In Paystack Dashboard → Settings → Webhooks:

**Webhook URL:** `https://your-project-ref.supabase.co/functions/v1/paystack-payment/webhook`

**Events to Subscribe:**
- `charge.success`
- `charge.failed`
- `transfer.success`
- `transfer.failed`

### 3. Test Payment Integration

```javascript
// Test payment initialization
const testPayment = await MeCabalPayments.initializePayment({
  amount: 1000, // ₦10.00
  email: 'test@example.com',
  user_id: 'test-user-id',
  transaction_type: 'test'
});

console.log('Payment URL:', testPayment.authorization_url);
```

## Phase 9: Mobile App Integration

### 1. Install Dependencies

```bash
cd Hommie_Mobile
npm install @supabase/supabase-js @react-native-async-storage/async-storage
```

### 2. Configure Supabase Client

Copy the `supabase-client.ts` file to your mobile app:

```bash
cp ../supabase-integration/mobile-integration/supabase-client.ts ./src/services/supabase.ts
```

### 3. Update Environment Variables

In `Hommie_Mobile/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Initialize in App

```typescript
// App.tsx or main entry point
import { MeCabalAuth, MeCabalRealtime } from './src/services/supabase';

// Example authentication flow
const handlePhoneVerification = async (phone: string) => {
  const result = await MeCabalAuth.sendOTP(phone);
  if (result.success) {
    console.log(`OTP sent via ${result.carrier}`);
  }
};

const handleOTPVerification = async (phone: string, otp: string) => {
  const result = await MeCabalAuth.verifyOTP(phone, otp);
  if (result.verified) {
    // Proceed to create user account
  }
};
```

## Phase 10: Testing and Validation

### 1. Database Testing

```sql
-- Test user creation
INSERT INTO public.users (phone_number, first_name, last_name, state_of_origin) 
VALUES ('+2348012345678', 'Test', 'User', 'Lagos');

-- Test neighborhood association
INSERT INTO public.neighborhoods (name, type, state_name, lga_name, center_point) 
VALUES ('Victoria Island Estate', 'estate', 'Lagos', 'Lagos Island', ST_GeomFromText('POINT(3.4273 6.4281)', 4326));

-- Test location verification
SELECT * FROM find_neighborhoods_by_point(6.4281, 3.4273);
```

### 2. Edge Functions Testing

```bash
# Test phone verification
curl -X POST 'https://your-project-ref.supabase.co/functions/v1/nigerian-phone-verify' \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+2348012345678"}'

# Test location services
curl -X POST 'https://your-project-ref.supabase.co/functions/v1/location-services/find-neighborhoods' \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"latitude": 6.4281, "longitude": 3.4273}'
```

### 3. Real-time Testing

```javascript
// Test real-time subscriptions
const subscription = MeCabalRealtime.subscribeToNeighborhoodPosts(
  'neighborhood-id',
  (newPost) => console.log('New post:', newPost),
  (updatedPost) => console.log('Updated post:', updatedPost),
  (deletedPostId) => console.log('Deleted post:', deletedPostId)
);
```

## Phase 11: Performance Optimization

### 1. Database Optimization

```sql
-- Add additional indexes for common queries
CREATE INDEX CONCURRENTLY idx_posts_user_neighborhood ON public.posts(user_id, neighborhood_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_events_date_status ON public.events(start_datetime, is_cancelled) WHERE is_cancelled = false;
CREATE INDEX CONCURRENTLY idx_marketplace_price_status ON public.marketplace_listings(price, availability_status) WHERE availability_status = 'available';
```

### 2. Caching Strategy

```javascript
// Implement caching in mobile app
import AsyncStorage from '@react-native-async-storage/async-storage';

const cacheNeighborhoodData = async (neighborhoodId: string, data: any) => {
  await AsyncStorage.setItem(`neighborhood_${neighborhoodId}`, JSON.stringify(data));
};

const getCachedNeighborhoodData = async (neighborhoodId: string) => {
  const cached = await AsyncStorage.getItem(`neighborhood_${neighborhoodId}`);
  return cached ? JSON.parse(cached) : null;
};
```

## Phase 12: Security Checklist

### 1. Row Level Security Verification

```sql
-- Test RLS policies as different users
SET request.jwt.claim.sub TO 'user-id-1';
SELECT * FROM public.posts; -- Should only return posts from user's neighborhoods

SET request.jwt.claim.sub TO 'user-id-2';  
SELECT * FROM public.posts; -- Should return different posts
```

### 2. API Key Security

- ✅ Use environment variables for all secrets
- ✅ Rotate API keys regularly
- ✅ Use Supabase service role key only in Edge Functions
- ✅ Implement rate limiting for Edge Functions
- ✅ Validate all inputs in Edge Functions

### 3. Data Privacy

- ✅ Enable RLS on all tables
- ✅ Test policies thoroughly
- ✅ Implement data retention policies
- ✅ Regular security audits

## Phase 13: Monitoring and Analytics

### 1. Supabase Dashboard Monitoring

Monitor in Dashboard → Reports:
- Database usage and performance
- API usage and rate limits
- Authentication metrics
- Real-time connections
- Edge Function executions

### 2. Custom Analytics

```sql
-- Create analytics tracking table
CREATE TABLE public.app_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES public.users(id),
  neighborhood_id UUID REFERENCES public.neighborhoods(id),
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track key metrics
INSERT INTO public.app_analytics (event_type, user_id, neighborhood_id, event_data) 
VALUES ('post_created', $1, $2, $3);
```

## Phase 14: Backup and Recovery

### 1. Automated Backups

Supabase Pro includes automated backups. For additional security:

```bash
# Manual database backup
supabase db dump --project-ref your-project-ref --file backup-$(date +%Y%m%d).sql

# Restore from backup
supabase db reset --project-ref your-project-ref
```

### 2. Disaster Recovery Plan

1. **Database**: Automatic daily backups with 7-day retention
2. **Storage**: Files replicated across multiple regions
3. **Edge Functions**: Code stored in Git, easily redeployable
4. **Configuration**: Document all settings and environment variables

## Troubleshooting

### Common Issues

**1. Edge Function Timeout**
```bash
# Increase timeout in function config
supabase functions deploy function-name --timeout 60000
```

**2. RLS Policy Blocking Queries**
```sql
-- Debug RLS policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';
```

**3. Real-time Not Working**
```javascript
// Check connection status
const subscription = supabase.channel('test').subscribe((status) => {
  console.log('Realtime status:', status);
});
```

**4. Nigerian Phone Number Validation**
```regex
// Valid Nigerian phone formats
/^\+234[789][01]\d{8}$/  // +234 + carrier code + 8 digits
```

## Production Deployment

### 1. Upgrade Supabase Plan

- Upgrade to Pro plan for production features
- Enable custom domain if needed
- Configure production environment variables

### 2. Final Checklist

- [ ] All environment variables configured
- [ ] RLS policies tested and verified
- [ ] Edge Functions deployed and tested
- [ ] Storage buckets and policies configured
- [ ] Real-time subscriptions working
- [ ] Payment integration tested
- [ ] SMS service integrated and tested
- [ ] Mobile app connected and functional
- [ ] Monitoring and analytics set up
- [ ] Backup strategy implemented

## Support and Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Nigerian SMS Providers](https://bulksmsnigeria.com)
- [Paystack Documentation](https://paystack.com/docs)
- [PostGIS Documentation](https://postgis.net/documentation/)

## Next Steps

After completing Phase 1 setup, you'll be ready to:
1. Launch MeCabal MVP with Nigerian communities
2. Gather user feedback and usage analytics
3. Plan Phase 2 migration to hybrid architecture
4. Scale infrastructure based on actual usage patterns

The Supabase foundation provides a robust, scalable platform that can grow with your Nigerian community platform while maintaining excellent performance and developer experience.