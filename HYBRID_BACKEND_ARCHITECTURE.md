# MeCabal Hybrid Backend Architecture
*Supabase MVP → NestJS Scale Strategy*

## Executive Summary

MeCabal's hybrid backend architecture combines Supabase's rapid development capabilities with NestJS microservices for scalable, Nigerian-specific features. This approach delivers a production-ready MVP in 4-6 weeks while preserving long-term architectural flexibility.

## Architecture Overview

### Phase 1: Supabase MVP Foundation (4-6 weeks)
```
Mobile App (React Native + Expo)
         ↓
    Supabase Platform
    ├── Authentication Service (Built-in)
    ├── PostgreSQL Database (PostGIS enabled)
    ├── Real-time Subscriptions (WebSocket)
    ├── Storage Service (S3-compatible)
    ├── Edge Functions (TypeScript)
    └── Row Level Security (RLS)
```

### Phase 2: Hybrid Architecture (3-6 months)
```
Mobile App (React Native + Expo)
         ↓
     API Gateway / Load Balancer
    ┌─────────┴─────────┐
Supabase Platform    NestJS Microservices
├── Authentication   ├── Marketplace Service
├── Real-time        ├── Payment Service  
├── Storage          ├── Trust & Safety Service
├── Basic CRUD       ├── Analytics Service
└── Database         ├── Nigerian Integration Service
                     └── AI/ML Service
```

## Phase 1: Supabase MVP Implementation

### Core Services Implementation

#### 1. Authentication & User Management

**Built-in Supabase Auth Features:**
- Phone number verification (+234 Nigerian format)
- Social login (Google, Apple, Facebook)
- JWT token management with automatic refresh
- Email verification and password reset flows

**Custom Authentication Logic:**
```typescript
// Edge Function: Nigerian Phone Verification
export default async function handler(req: Request) {
  const { phone, carrier } = await req.json();
  
  // Detect Nigerian carrier (MTN, Airtel, Glo, 9mobile)
  const carrierInfo = detectNigerianCarrier(phone);
  
  // Use appropriate SMS gateway
  const otpCode = generateOTP();
  await sendSMS(phone, `Your MeCabal verification code: ${otpCode}`, carrierInfo);
  
  // Store in Supabase with expiration
  await supabase
    .from('otp_verifications')
    .insert({
      phone_number: phone,
      otp_code: hashOTP(otpCode),
      carrier: carrierInfo.name,
      expires_at: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    });
    
  return new Response(JSON.stringify({ success: true, carrier: carrierInfo.name }));
}
```

**Row Level Security Policies:**
```sql
-- Users can only see posts from their neighborhoods
CREATE POLICY "estate_posts_policy" ON posts 
FOR SELECT USING (
  neighborhood_id IN (
    SELECT neighborhood_id 
    FROM user_neighborhoods 
    WHERE user_id = auth.uid()
  )
);

-- Users can only message within their verified neighborhoods
CREATE POLICY "neighborhood_messaging_policy" ON messages
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM conversations c
    JOIN conversation_participants cp ON c.id = cp.conversation_id
    WHERE cp.user_id = auth.uid()
    AND c.neighborhood_id IN (
      SELECT neighborhood_id 
      FROM user_neighborhoods 
      WHERE user_id = auth.uid() 
      AND verification_method IS NOT NULL
    )
  )
);
```

#### 2. Database Implementation

**Supabase-Optimized Schema:**
```sql
-- Enhanced users table with Nigerian context
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(15) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  profile_picture_url TEXT,
  state_of_origin VARCHAR(50), -- Nigerian states
  preferred_language VARCHAR(10) DEFAULT 'en',
  carrier_info JSONB, -- {"name": "MTN", "prefix": "0803", "color": "#FFD700"}
  is_verified BOOLEAN DEFAULT FALSE,
  verification_level INTEGER DEFAULT 0, -- 0: unverified, 1: phone, 2: address, 3: community
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nigerian neighborhoods with PostGIS
CREATE TABLE neighborhoods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  type VARCHAR(20) DEFAULT 'estate', -- 'estate', 'compound', 'district'
  description TEXT,
  state_name VARCHAR(50) NOT NULL,
  lga_name VARCHAR(100) NOT NULL,
  boundary_geom GEOMETRY(POLYGON, 4326), -- PostGIS polygon
  center_point GEOMETRY(POINT, 4326), -- Center coordinates
  radius_meters INTEGER DEFAULT 1000,
  postal_code VARCHAR(10),
  landmarks JSONB, -- {"primary": "Shoprite Mall", "secondary": ["School", "Hospital"]}
  estate_management JSONB, -- Contact info, rules, amenities
  is_verified BOOLEAN DEFAULT FALSE,
  verification_documents JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time optimized posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  neighborhood_id UUID REFERENCES neighborhoods(id) ON DELETE CASCADE,
  title VARCHAR(200),
  content TEXT NOT NULL,
  post_type VARCHAR(20) DEFAULT 'general',
  category VARCHAR(50), -- Nigerian-specific categories
  media_urls JSONB, -- Array of image/video URLs
  location_data JSONB, -- {"address": "", "landmarks": []}
  engagement_score DECIMAL(5,2) DEFAULT 0.0,
  is_pinned BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optimized indexes
CREATE INDEX CONCURRENTLY idx_posts_neighborhood_time 
ON posts(neighborhood_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_neighborhoods_location 
ON neighborhoods USING GIST(center_point);
```

#### 3. Real-time Features

**Community Feed Real-time Subscriptions:**
```typescript
// Client-side real-time subscription
const subscription = supabase
  .channel('estate-feed')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'posts',
    filter: `neighborhood_id=eq.${userEstateId}`
  }, (payload) => {
    // Update feed in real-time
    updateCommunityFeed(payload);
  })
  .subscribe();
```

**Messaging System:**
```typescript
// Real-time messaging
const messageSubscription = supabase
  .channel(`conversation:${conversationId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`
  }, (payload) => {
    displayNewMessage(payload.new);
  })
  .subscribe();
```

**Safety Alerts Broadcasting:**
```typescript
// Neighborhood safety alerts
const safetySubscription = supabase
  .channel(`safety:${neighborhoodId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'safety_alerts',
    filter: `neighborhood_id=eq.${neighborhoodId}`
  }, (payload) => {
    showSafetyAlert(payload.new);
  })
  .subscribe();
```

#### 4. Edge Functions (Nigerian Business Logic)

**Payment Integration:**
```typescript
// Edge Function: paystack-payment.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { amount, email, listing_id } = await req.json();
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  // Initialize Paystack transaction
  const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      amount: amount * 100, // Convert to kobo
      currency: 'NGN',
      reference: `mecabal_${listing_id}_${Date.now()}`,
      callback_url: `${Deno.env.get('APP_URL')}/payment-callback`,
      metadata: {
        listing_id,
        platform: 'mecabal'
      }
    })
  });
  
  const paymentData = await paystackResponse.json();
  
  // Store transaction record
  await supabase
    .from('payment_transactions')
    .insert({
      listing_id,
      user_id: email,
      amount,
      currency: 'NGN',
      payment_reference: paymentData.data.reference,
      payment_url: paymentData.data.authorization_url,
      status: 'pending'
    });
    
  return new Response(JSON.stringify(paymentData), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

**Location Services:**
```typescript
// Edge Function: location-verification.ts
export default async function handler(req: Request) {
  const { user_id, latitude, longitude, address } = await req.json();
  
  // Reverse geocoding for Nigerian addresses
  const geocodeResponse = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&country=ng`
  );
  
  const geocodeData = await geocodeResponse.json();
  
  // Find matching neighborhoods using PostGIS
  const { data: matchingNeighborhoods } = await supabase.rpc('find_neighborhoods_by_point', {
    lat: latitude,
    lng: longitude
  });
  
  // Verify user location within estate boundaries
  if (matchingNeighborhoods.length > 0) {
    const neighborhood = matchingNeighborhoods[0];
    
    // Update user location and neighborhood association
    await supabase
      .from('user_neighborhoods')
      .upsert({
        user_id,
        neighborhood_id: neighborhood.id,
        relationship_type: 'resident',
        verification_method: 'gps',
        address_details: geocodeData.features[0].place_name
      });
      
    return new Response(JSON.stringify({
      verified: true,
      neighborhood: neighborhood.name,
      address: geocodeData.features[0].place_name
    }));
  }
  
  return new Response(JSON.stringify({ verified: false }));
}
```

### 5. Storage and Media Handling

**File Upload Configuration:**
```typescript
// Media upload with Nigerian context
const uploadProfilePicture = async (file: File, userId: string) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/profile.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('user-profiles')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    });
    
  if (error) throw error;
  
  // Get public URL
  const { data: publicData } = supabase.storage
    .from('user-profiles')
    .getPublicUrl(fileName);
    
  // Update user profile
  await supabase
    .from('users')
    .update({ profile_picture_url: publicData.publicUrl })
    .eq('id', userId);
    
  return publicData.publicUrl;
};
```

## Phase 1 Development Timeline

### Week 1: Foundation
- [x] Supabase project setup with Nigerian configuration
- [x] Database schema implementation with PostGIS
- [x] Authentication flow with phone verification
- [x] Basic user profiles with Nigerian context
- [x] Estate/neighborhood management system

### Week 2: Core Features
- [x] Social feed with real-time updates
- [x] Event creation and RSVP system
- [x] Basic messaging between neighbors
- [x] Safety alert system with broadcasting
- [x] Mobile app integration testing

### Week 3: Marketplace & Payments
- [x] Marketplace listings with categories
- [x] Paystack integration for Nigerian payments
- [x] Basic search and filtering
- [x] Media upload and management
- [x] Transaction tracking

### Week 4: Polish & Launch
- [x] Nigerian localization (language, currency)
- [x] Performance optimization
- [x] Security audit and penetration testing
- [x] Beta testing with Nigerian users
- [x] Production deployment

## Phase 2: NestJS Migration Strategy

### Migration Approach

**Keep on Supabase (Core Strengths):**
- Authentication service (proven, reliable)
- Real-time subscriptions (excellent performance)
- File storage (CDN-backed)
- Basic CRUD operations

**Migrate to NestJS (Complex Business Logic):**
- Advanced marketplace features
- Complex payment processing
- AI/ML services
- Advanced analytics
- Nigerian-specific integrations

### Hybrid Data Flow
```typescript
// 1. Mobile App → Supabase (direct for simple operations)
await supabase
  .from('posts')
  .insert({ title, content, neighborhood_id });

// 2. Supabase Webhook → NestJS (complex processing)
// Supabase Database Webhook triggers NestJS service
@Post('webhook/new-listing')
async handleNewListing(@Body() payload: any) {
  // Complex marketplace logic
  await this.trustScoringService.calculateTrustScore(payload);
  await this.notificationService.broadcastToNeighbors(payload);
  await this.analyticsService.trackListingCreation(payload);
}

// 3. NestJS → Supabase (update results)
await this.supabaseService.updateListing(listingId, {
  trust_score: calculatedScore,
  visibility_level: determineVisibility()
});
```

### NestJS Microservices Architecture

#### 1. Advanced Marketplace Service
```typescript
@Module({
  providers: [
    MarketplaceService,
    EscrowService,
    TrustScoringService,
    RecommendationEngine,
  ],
})
export class MarketplaceModule {
  
  @Post('listings/:id/escrow')
  async createEscrow(@Param('id') listingId: string) {
    // Complex escrow logic for Nigerian marketplace
    return this.escrowService.initializeEscrow(listingId);
  }
  
  @Get('recommendations/:userId')
  async getRecommendations(@Param('userId') userId: string) {
    // AI-powered recommendations based on location, preferences
    return this.recommendationEngine.generateRecommendations(userId);
  }
}
```

#### 2. Nigerian Integration Service
```typescript
@Module({
  providers: [
    PaystackService,
    FlutterwaveService,
    NINVerificationService,
    CarrierDetectionService,
    NigerianComplianceService,
  ],
})
export class NigerianIntegrationModule {
  
  @Post('verify-nin')
  async verifyNIN(@Body() { nin, userId }: { nin: string; userId: string }) {
    // Integrate with Nigerian Identity Management Commission
    const verification = await this.ninService.verify(nin);
    
    if (verification.valid) {
      await this.updateUserVerification(userId, 'nin_verified');
    }
    
    return verification;
  }
  
  @Post('payment/multi-gateway')
  async processPayment(@Body() paymentData: PaymentDto) {
    // Smart routing between Paystack and Flutterwave
    const gateway = await this.selectOptimalGateway(paymentData);
    return this.processWithGateway(gateway, paymentData);
  }
}
```

#### 3. Trust & Safety Service
```typescript
@Module({
  providers: [
    AIContentModerationService,
    CommunityReportingService,
    TrustScoringService,
    SafetyAlertService,
  ],
})
export class TrustSafetyModule {
  
  @Post('moderate/content')
  async moderateContent(@Body() contentData: any) {
    // AI-powered content moderation with Nigerian context
    const aiResult = await this.aiService.moderateContent(contentData.text);
    const communityScore = await this.communityService.getCommunityFeedback(contentData.id);
    
    return this.combineScores(aiResult, communityScore);
  }
  
  @Post('trust-score/calculate')
  async calculateTrustScore(@Body() { userId }: { userId: string }) {
    // Comprehensive trust scoring
    const factors = await Promise.all([
      this.getVerificationScore(userId),
      this.getCommunityRating(userId),
      this.getTransactionHistory(userId),
      this.getNeighborhoodEndorsements(userId),
    ]);
    
    return this.aggregateTrustScore(factors);
  }
}
```

### Data Synchronization Strategy

```typescript
// Event-driven synchronization
@Injectable()
export class DataSyncService {
  
  @OnEvent('supabase.listing.created')
  async handleListingCreated(payload: ListingCreatedEvent) {
    // Process in NestJS, sync back to Supabase
    const processedData = await this.processListing(payload);
    
    await this.supabaseService.updateListing(payload.id, {
      processing_status: 'completed',
      trust_score: processedData.trustScore,
      visibility_level: processedData.visibility,
    });
  }
  
  @Cron('0 */6 * * *') // Every 6 hours
  async syncAnalytics() {
    // Aggregate analytics and sync to Supabase
    const analytics = await this.generateAnalytics();
    await this.supabaseService.bulkUpdateAnalytics(analytics);
  }
}
```

## Deployment Strategy

### Phase 1: Supabase Deployment
```yaml
# Supabase Configuration
database:
  extensions:
    - postgis
    - pg_cron
  policies:
    - rls_enabled: true
  functions:
    - nigerian_phone_verification
    - paystack_integration
    - location_services

storage:
  buckets:
    - user-profiles (public read)
    - marketplace-media (public read)
    - documents (private)

edge_functions:
  - payment-processing
  - content-moderation
  - location-verification
```

### Phase 2: Hybrid Deployment
```yaml
# Docker Compose for NestJS Services
version: '3.8'
services:
  api-gateway:
    image: mecabal/api-gateway
    ports: ["3000:3000"]
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
  
  marketplace-service:
    image: mecabal/marketplace-service
    ports: ["3001:3000"]
    depends_on: [redis, rabbitmq]
  
  nigerian-integration:
    image: mecabal/nigerian-integration
    ports: ["3002:3000"]
    environment:
      - PAYSTACK_SECRET=${PAYSTACK_SECRET}
      - FLUTTERWAVE_SECRET=${FLUTTERWAVE_SECRET}
  
  trust-safety:
    image: mecabal/trust-safety
    ports: ["3003:3000"]
    
  redis:
    image: redis:alpine
    
  rabbitmq:
    image: rabbitmq:management-alpine
```

## Performance & Scalability

### Phase 1 Performance Targets
- **Response Time**: <200ms for 95th percentile
- **Real-time Latency**: <100ms for message delivery
- **Database Queries**: <50ms average
- **File Upload**: <5s for 5MB images
- **Concurrent Users**: 10K simultaneous users

### Phase 2 Scaling Strategy
- **Horizontal Scaling**: Auto-scaling NestJS services
- **Database**: Read replicas for analytics
- **Caching**: Redis for frequently accessed data
- **CDN**: Global distribution for Nigerian users
- **Message Queue**: RabbitMQ for background processing

## Cost Analysis

### Phase 1: Supabase Costs
```yaml
Monthly Costs:
  - Supabase Pro: $25
  - Database Compute: $10-50 (scales with usage)
  - Storage: $5-20 (based on media uploads)
  - Edge Functions: $5-15 (execution time)
  - Data Transfer: $5-10 (Nigerian traffic)
  
Total Phase 1: $50-120/month
```

### Phase 2: Hybrid Costs
```yaml
Monthly Costs:
  - Supabase Pro: $50-100 (scaled usage)
  - Server Infrastructure: $200-500 (NestJS services)
  - Redis Cache: $50-100
  - Message Queue: $30-50
  - Monitoring: $50-100
  
Total Phase 2: $380-750/month
```

## Risk Assessment & Mitigation

### Technical Risks
1. **Supabase Vendor Lock-in**
   - *Mitigation*: Keep complex business logic in Edge Functions and NestJS
   - *Backup Plan*: Database is standard PostgreSQL, easily portable

2. **Data Migration Complexity**
   - *Mitigation*: Gradual migration with dual-write strategy
   - *Testing*: Extensive staging environment testing

3. **Real-time Performance**
   - *Mitigation*: Optimize Supabase real-time subscriptions
   - *Fallback*: Traditional HTTP polling if needed

### Business Risks
1. **Development Timeline Delays**
   - *Mitigation*: Supabase reduces MVP development by 60%
   - *Buffer*: Built-in timeline buffers for each phase

2. **Nigerian Market Competition**
   - *Mitigation*: Faster time-to-market with Supabase
   - *Advantage*: 2-3 month head start over traditional approaches

## Success Metrics

### Phase 1 KPIs (6 weeks)
- **User Registration**: 1,000+ users
- **Daily Active Users**: 100+ per estate
- **Posts Created**: 500+ weekly
- **Marketplace Listings**: 50+ weekly
- **Message Exchange**: 1,000+ daily

### Phase 2 KPIs (6 months)
- **Transaction Volume**: ₦1M+ monthly GMV
- **Trust Score Accuracy**: 95%+ user satisfaction
- **Payment Success Rate**: 99%+ transaction success
- **AI Moderation**: 90%+ accurate content filtering
- **Response Time**: <100ms 95th percentile

## Conclusion

This hybrid architecture provides MeCabal with:

1. **Rapid Time-to-Market**: 4-6 week MVP vs 4-6 month traditional development
2. **Cost Efficiency**: 70% lower initial development costs
3. **Nigerian Optimization**: Custom Edge Functions for local business logic
4. **Scalability**: Clear migration path to full microservices
5. **Risk Management**: Reduced vendor lock-in with gradual migration strategy

The approach balances speed, cost, and long-term flexibility while maintaining focus on Nigerian market requirements and cultural context.