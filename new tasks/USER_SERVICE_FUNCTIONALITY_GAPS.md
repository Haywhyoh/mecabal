# User Service Functionality Gaps Analysis
**MeCabal User Profile & Related Features**
*Date: 2025-10-09*
*Prepared for: Development Team*

---

## Executive Summary

This document identifies critical functionality gaps between the mobile app UI/features and the backend implementation for user profiles and related services. The mobile app demonstrates a rich, feature-complete user experience with extensive verification, gamification, cultural profiling, and business account features. However, the backend implementation is severely underdeveloped, with the User Service containing only a placeholder "Hello World" controller and no actual user management endpoints.

### Critical Finding
**The User Service is essentially non-functional.** While the Auth Service handles basic authentication and stores user data in the database, there is NO dedicated user management service to handle profile operations, verification workflows, gamification, badges, leaderboards, or business accounts.

---

## 1. USER PROFILE MANAGEMENT

### Frontend Features (Mobile App)
Located in: `Hommie_Mobile/src/screens/ProfileScreen.tsx`

**Implemented UI Features:**
- Profile display with avatar, name, location
- Verification badge display
- Edit profile functionality
- Photo upload capability (camera button)
- Location display with estate count
- Dashboard showing:
  - Bookmarks (12 saved posts)
  - Saved Deals (3 local offers)
  - Events (5 upcoming events)
- Community impact statistics:
  - Posts Shared: 23
  - Neighbors Helped: 47
  - Events Joined: 8
- Quick actions menu (Account Settings, Privacy & Safety, Notifications, Help & Support)
- Business page creation option
- Sign out functionality

### Backend Implementation
Located in: `backend/apps/user-service/src/user-service.controller.ts`

**Current State:**
```typescript
@Controller()
export class UserServiceController {
  constructor(private readonly userServiceService: UserServiceService) {}

  @Get()
  getHello(): string {
    return this.userServiceService.getHello();
  }
}
```

**CRITICAL GAPS:**
1. ❌ **NO user profile retrieval endpoints** (GET /users/:id, GET /users/me)
2. ❌ **NO profile update endpoints** (PUT/PATCH /users/:id/profile)
3. ❌ **NO avatar/photo upload endpoints**
4. ❌ **NO profile statistics aggregation**
5. ❌ **NO bookmarks management**
6. ❌ **NO saved deals/offers tracking**
7. ❌ **NO user activity tracking** (posts, helps, events)
8. ❌ **NO estate/neighborhood association management**
9. ❌ **NO profile completion percentage calculation**
10. ❌ **NO user search or discovery endpoints**

### Database Entity Analysis
Located in: `backend/libs/database/src/entities/user.entity.ts`

**Available Fields:**
✅ Basic info (firstName, lastName, email, phoneNumber, profilePictureUrl)
✅ Verification flags (phoneVerified, identityVerified, addressVerified)
✅ Trust score field (trustScore: number)
✅ Cultural fields (culturalBackground, nativeLanguages)
✅ Professional fields (occupation, professionalSkills)
✅ Location fields (state, city, estate, location, landmark, address)
✅ Verification badge field (verificationBadge: string)

**Missing Relationship Tracking:**
❌ No bookmarks relation
❌ No saved deals/offers relation
❌ No community stats aggregation
❌ No activity points/contributions tracking
❌ No achievements/badges relation
❌ No leaderboard ranking data

---

## 2. VERIFICATION SYSTEM

### Frontend Features
Located in: `Hommie_Mobile/src/screens/NINVerificationScreen.tsx`

**Comprehensive NIN Verification Flow:**
- 3-step verification process:
  1. NIN Input Screen (11-digit validation)
  2. Data Preview/Confirmation Screen
  3. Success Screen with unlocked benefits
- Mock NIN verification API integration
- Data display: Full Name, DOB, Gender, State of Origin
- Privacy notices and information modals
- Verification benefits display:
  - Verified Resident badge
  - Enhanced profile trust
  - Local business features
  - Community decision participation
- Skip functionality with warnings

**UserVerificationBadge Component:**
Located in: `Hommie_Mobile/src/components/UserVerificationBadge.tsx`

Features:
- Multi-level verification system:
  - unverified
  - phone (Phone Verified)
  - identity (Identity Verified)
  - full (Verified Estate Resident)
- Trust score calculation (0-100%)
- Community endorsements display
- Events organized counter
- Verification badge types:
  - Estate Manager
  - Community Leader
  - Religious Leader
  - Tech Professional
  - Sports Coordinator
  - Cultural Leader
  - Business Owner
  - Parent
  - Verified Resident

### Backend Implementation

**Auth Service:**
Location: `backend/apps/auth-service/src/auth/auth.controller.ts`

✅ Basic verification endpoints exist:
- POST /auth/phone/verify/initiate (Not Implemented - throws error)
- POST /auth/phone/verify/confirm (Not Implemented - throws error)
- POST /auth/phone/verify/resend (Not Implemented - throws error)
- POST /auth/phone/send-otp (Implemented)
- POST /auth/phone/verify-otp (Implemented)

**Database Support:**
✅ User entity has verification flags:
- phoneVerified: boolean
- identityVerified: boolean
- addressVerified: boolean
- verificationBadge: string

**CRITICAL GAPS:**
1. ❌ **NO NIN verification endpoints** (upload, verify, store NIN data)
2. ❌ **NO NIN data storage table/entity** (NIN number, personal data from NIMC)
3. ❌ **NO integration with NIMC or third-party NIN verification service**
4. ❌ **NO identity document upload/storage service**
5. ❌ **NO address verification workflow** (proof of address, manual review)
6. ❌ **NO trust score calculation algorithm implementation**
7. ❌ **NO community endorsements system**
8. ❌ **NO verification badge management**
9. ❌ **NO verification level progression tracking**
10. ❌ **NO verification history/audit trail**
11. ❌ **NO badge achievement notification system**
12. ❌ **NO verification benefits unlock logic**

### Recommendations:
1. Create new `VerificationService` with:
   - NIN verification endpoints
   - Document upload management
   - Trust score calculation
   - Verification level management
2. Add `nin_verification` table with encrypted NIN storage
3. Add `identity_documents` table for document storage
4. Add `verification_audit` table for tracking verification attempts
5. Integrate with third-party NIN verification API (e.g., Youverify, Dojah, or direct NIMC integration)
6. Implement trust score algorithm based on:
   - Verification completeness (phone, identity, address)
   - Community endorsements
   - Activity level
   - Account age
   - Positive interactions

---

## 3. GAMIFICATION & LEADERBOARD SYSTEM

### Frontend Features
Located in: `Hommie_Mobile/src/constants/gamificationData.ts`

**Comprehensive Achievement System:**
- 13 defined achievements with categories:
  - Community (New Neighbor, Breaking the Ice, Community Champion)
  - Safety (Safety First, Neighborhood Watch, Security Guardian)
  - Events (Event Enthusiast, Event Organizer, Social Butterfly)
  - Business (Local Business, Trusted Service)
  - Leadership (Estate Leader, Community Legend)

**Badge System:**
Located in: `Hommie_Mobile/src/components/BadgeSystemComponent.tsx`

- 8 badge types:
  - Verified Neighbor (phone + address verified)
  - NIN Verified (National ID verified)
  - Estate Committee (leadership role)
  - Security Coordinator (safety role)
  - Top Contributor (top 10% activity)
  - Helpful Neighbor (4.5+ rating)
  - Verified Business (business owner)
  - Safety Champion (10+ safety reports)

**Contribution Activities:**
- 8 activity types with point values:
  - Create Post (10 pts)
  - Helpful Comment (5 pts × 1.2)
  - Organize Event (25 pts × 1.5)
  - Attend Event (8 pts)
  - Safety Report (20 pts × 1.8)
  - Business Review (8 pts × 1.1)
  - Help Neighbor (15 pts × 1.3)
  - Community Project (30 pts × 2.0)

**Contribution Levels:**
- 6 progression levels (New Neighbor → Community Legend)
- Point thresholds: 0, 100, 250, 500, 1000, 2000
- Level-specific benefits and unlocks

**Leaderboard Categories:**
- Overall Contribution
- Safety Champions
- Event Leaders
- Helpful Neighbors
- Business Leaders

**Nigerian Community Titles:**
- Odogwu, Oga/Madam, Chief, Alhaji/Alhaja, Baba/Mama, Elder, Captain, Ambassador

### Backend Implementation

**Current State:**
❌ **COMPLETELY MISSING** - No tables, entities, controllers, or services

**CRITICAL GAPS:**
1. ❌ **NO achievements table/entity**
2. ❌ **NO user_achievements relation table**
3. ❌ **NO badges table/entity**
4. ❌ **NO user_badges relation table**
5. ❌ **NO points/activity tracking system**
6. ❌ **NO contribution_activities table**
7. ❌ **NO user_activities history table**
8. ❌ **NO leaderboard calculation endpoints**
9. ❌ **NO level progression logic**
10. ❌ **NO achievement unlock notifications**
11. ❌ **NO points calculation service**
12. ❌ **NO badge claiming workflow**
13. ❌ **NO leaderboard refresh/ranking algorithm**
14. ❌ **NO time-based leaderboards** (daily, weekly, monthly)
15. ❌ **NO community title assignment logic**

### Recommendations:
1. Create `GamificationService` with endpoints:
   - GET /gamification/achievements (list all achievements)
   - GET /gamification/achievements/user/:userId (user's achievements)
   - POST /gamification/achievements/:id/unlock (unlock achievement)
   - GET /gamification/badges (list all badges)
   - GET /gamification/badges/user/:userId (user's badges)
   - POST /gamification/badges/:id/claim (claim badge)
   - GET /gamification/leaderboard/:category (get leaderboard)
   - GET /gamification/user/:userId/level (get user level & points)
   - POST /gamification/activities/track (track user activity)

2. Create database tables:
   ```sql
   -- achievements table
   CREATE TABLE achievements (
     id UUID PRIMARY KEY,
     name VARCHAR(255),
     description TEXT,
     icon VARCHAR(100),
     color VARCHAR(50),
     category VARCHAR(50),
     points INT,
     rarity VARCHAR(20),
     requirements JSONB,
     created_at TIMESTAMP
   );

   -- user_achievements table
   CREATE TABLE user_achievements (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     achievement_id UUID REFERENCES achievements(id),
     unlocked_at TIMESTAMP,
     progress INT DEFAULT 0,
     UNIQUE(user_id, achievement_id)
   );

   -- badges table
   CREATE TABLE badges (
     id UUID PRIMARY KEY,
     name VARCHAR(255),
     description TEXT,
     icon VARCHAR(100),
     color VARCHAR(50),
     type VARCHAR(50),
     requirements TEXT,
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMP
   );

   -- user_badges table
   CREATE TABLE user_badges (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     badge_id UUID REFERENCES badges(id),
     earned_at TIMESTAMP,
     UNIQUE(user_id, badge_id)
   );

   -- user_activity_log table
   CREATE TABLE user_activity_log (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     activity_type VARCHAR(50),
     points_earned INT,
     multiplier DECIMAL(3,2),
     metadata JSONB,
     created_at TIMESTAMP,
     INDEX(user_id, created_at)
   );

   -- user_points table
   CREATE TABLE user_points (
     user_id UUID PRIMARY KEY REFERENCES users(id),
     total_points INT DEFAULT 0,
     level INT DEFAULT 1,
     level_name VARCHAR(100),
     rank INT,
     last_activity_at TIMESTAMP,
     updated_at TIMESTAMP
   );

   -- leaderboard_snapshots table
   CREATE TABLE leaderboard_snapshots (
     id UUID PRIMARY KEY,
     category VARCHAR(50),
     period VARCHAR(20), -- 'daily', 'weekly', 'monthly', 'all-time'
     snapshot_date DATE,
     rankings JSONB,
     created_at TIMESTAMP,
     INDEX(category, period, snapshot_date)
   );
   ```

3. Implement point calculation algorithms:
   - Track all user activities (posts, comments, events, helps)
   - Apply multipliers based on activity type
   - Calculate daily/weekly/monthly totals
   - Update user level based on total points

4. Implement leaderboard ranking:
   - Real-time ranking updates
   - Category-specific rankings
   - Time-period rankings (daily, weekly, monthly, all-time)
   - Neighborhood-specific leaderboards
   - State-level leaderboards

5. Create notification system for:
   - Achievement unlocks
   - Badge claims
   - Level ups
   - Leaderboard position changes

---

## 4. CULTURAL PROFILE SYSTEM

### Frontend Features
Located in: `Hommie_Mobile/src/screens/CulturalProfileScreen.tsx`

**Comprehensive Nigerian Cultural Features:**
- State of Origin selection (36 states + FCT)
- Multiple language selection with native greetings:
  - Hausa: "Sannu"
  - Yoruba: "Ẹ káàsán"
  - Igbo: "Nnọọ"
  - English and others
- Cultural Background selection:
  - Yoruba, Igbo, Hausa, Fulani, Ijaw, Kanuri, Ibibio, Tiv, etc.
- Professional title selection (categorized):
  - Tech & Engineering
  - Healthcare
  - Education
  - Business & Finance
  - Creative Arts
  - Trades & Services
  - Government & Public Service
- Privacy controls (show/hide each field on profile)
- Verification badge display
- Profile preview functionality

### Backend Implementation

**Database Support:**
✅ User entity has fields:
- culturalBackground: string
- nativeLanguages: string
- occupation: string
- professionalSkills: string
- state: string

**CRITICAL GAPS:**
1. ❌ **NO cultural profile endpoints** (GET/PUT /users/:id/cultural-profile)
2. ❌ **NO Nigerian states reference data API**
3. ❌ **NO languages reference data API**
4. ❌ **NO cultural backgrounds reference data API**
5. ❌ **NO professional titles reference data API**
6. ❌ **NO privacy settings management for cultural fields**
7. ❌ **NO cultural matching/recommendation algorithm**
8. ❌ **NO language-based neighbor discovery**
9. ❌ **NO cultural event recommendations**
10. ❌ **NO state-based community grouping**

### Recommendations:
1. Create reference data tables:
   ```sql
   -- nigerian_states table
   CREATE TABLE nigerian_states (
     id VARCHAR(50) PRIMARY KEY,
     name VARCHAR(100),
     region VARCHAR(50), -- North, South, East, West
     capital VARCHAR(100),
     lgas JSONB, -- Local Government Areas
     created_at TIMESTAMP
   );

   -- languages table
   CREATE TABLE languages (
     id VARCHAR(50) PRIMARY KEY,
     name VARCHAR(100),
     native_name VARCHAR(100),
     greeting VARCHAR(100),
     description TEXT,
     speakers_count INT,
     created_at TIMESTAMP
   );

   -- cultural_backgrounds table
   CREATE TABLE cultural_backgrounds (
     id VARCHAR(50) PRIMARY KEY,
     name VARCHAR(100),
     region VARCHAR(50),
     description TEXT,
     traditions JSONB,
     created_at TIMESTAMP
   );

   -- professional_categories table
   CREATE TABLE professional_categories (
     id UUID PRIMARY KEY,
     category VARCHAR(100),
     titles JSONB, -- Array of title strings
     created_at TIMESTAMP
   );

   -- user_privacy_settings table
   CREATE TABLE user_privacy_settings (
     user_id UUID PRIMARY KEY REFERENCES users(id),
     show_state_on_profile BOOLEAN DEFAULT true,
     show_languages_on_profile BOOLEAN DEFAULT true,
     show_culture_on_profile BOOLEAN DEFAULT false,
     show_profession_on_profile BOOLEAN DEFAULT true,
     show_location_on_profile BOOLEAN DEFAULT true,
     updated_at TIMESTAMP
   );
   ```

2. Create endpoints:
   - GET /reference/states (Nigerian states)
   - GET /reference/languages (Nigerian languages)
   - GET /reference/cultures (Cultural backgrounds)
   - GET /reference/professions (Professional titles by category)
   - GET /users/:id/cultural-profile
   - PUT /users/:id/cultural-profile
   - PUT /users/:id/privacy-settings

3. Implement cultural matching features:
   - Language-based neighbor discovery
   - State of origin communities
   - Cultural event recommendations
   - Professional networking by category

---

## 5. BUSINESS ACCOUNT SYSTEM

### Frontend Features
Located in: `Hommie_Mobile/src/screens/BusinessProfileScreen.tsx` & `BusinessRegistrationScreen.tsx`

**Business Profile Features:**
- Complete business profile display:
  - Business name, category, subcategory
  - Cover photo and profile image
  - Years of experience
  - Service area (neighborhood, 2km, 5km, 10km, city-wide, state-wide, nationwide)
  - Pricing model (fixed rate, hourly, per item, project-based, custom quote)
  - Availability schedule (business hours, weekdays, 24/7, weekends, custom)
  - Payment methods (cash, bank transfer, card, mobile money, Opay/Kuda, crypto)
  - Rating and review count
  - Completed jobs counter
  - Response time metric
  - Repeat customers percentage
- Verification levels:
  - Basic (phone + address)
  - Enhanced (+ business docs)
  - Premium (+ physical verification)
- Professional licenses display (CAC, TIN, NAFDAC, FIRS, SCUML, etc.)
- Business insurance indicator
- Status toggle (online/offline)
- Management actions (services, reviews, settings)
- Recent activity feed

**Business Registration Flow:**
- 4-step registration process:
  1. Business Information (name, description, category, experience)
  2. Service Details (area, pricing, availability, payment methods)
  3. Contact & Verification (phone, WhatsApp, address, licenses, insurance)
  4. Review & Submit
- 20+ business categories with subcategories
- Service area options (7 levels)
- 5 pricing models
- 4 availability schedules
- 8 payment methods
- Nigerian business licenses (8 categories, 30+ license types)

**Business Categories:**
- Household Services (15 subcategories)
- Professional Services (15 subcategories)
- Health & Wellness (12 subcategories)
- Education & Tutoring (10 subcategories)
- Food & Catering (8 subcategories)
- And 15+ more categories

### Backend Implementation

**Current State:**
❌ **COMPLETELY MISSING** - No business-related tables, entities, controllers, or services

**CRITICAL GAPS:**
1. ❌ **NO business profiles table/entity**
2. ❌ **NO business registration endpoints**
3. ❌ **NO business verification workflow**
4. ❌ **NO business categories reference data**
5. ❌ **NO business services management**
6. ❌ **NO business reviews/ratings system**
7. ❌ **NO business booking/inquiry system**
8. ❌ **NO business search/discovery endpoints**
9. ❌ **NO business analytics/metrics tracking**
10. ❌ **NO business license verification**
11. ❌ **NO business status management (online/offline)**
12. ❌ **NO business activity logging**
13. ❌ **NO business subscription/payment tiers**
14. ❌ **NO business promotion features**
15. ❌ **NO service area geographic filtering**

### Recommendations:
1. Create new `BusinessService` microservice with endpoints:
   - POST /business/register
   - GET /business/:id
   - PUT /business/:id/profile
   - PUT /business/:id/status (online/offline)
   - GET /business/:id/reviews
   - POST /business/:id/reviews
   - GET /business/:id/services
   - POST /business/:id/services
   - GET /business/search (with filters)
   - GET /business/categories
   - POST /business/:id/verify (admin endpoint)
   - GET /business/:id/analytics
   - POST /business/:id/inquiry (customer inquiries)

2. Create database tables:
   ```sql
   -- business_profiles table
   CREATE TABLE business_profiles (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     business_name VARCHAR(255),
     description TEXT,
     category VARCHAR(100),
     subcategory VARCHAR(100),
     service_area VARCHAR(50),
     pricing_model VARCHAR(50),
     availability VARCHAR(50),
     phone_number VARCHAR(20),
     whatsapp_number VARCHAR(20),
     business_address TEXT,
     years_of_experience INT,
     is_verified BOOLEAN DEFAULT false,
     verification_level VARCHAR(20), -- 'basic', 'enhanced', 'premium'
     profile_image_url VARCHAR(500),
     cover_image_url VARCHAR(500),
     rating DECIMAL(3,2) DEFAULT 0,
     review_count INT DEFAULT 0,
     completed_jobs INT DEFAULT 0,
     response_time VARCHAR(50),
     has_insurance BOOLEAN DEFAULT false,
     is_active BOOLEAN DEFAULT true,
     joined_date TIMESTAMP,
     created_at TIMESTAMP,
     updated_at TIMESTAMP,
     INDEX(user_id),
     INDEX(category, service_area, is_active)
   );

   -- business_categories table
   CREATE TABLE business_categories (
     id VARCHAR(100) PRIMARY KEY,
     name VARCHAR(255),
     description TEXT,
     icon VARCHAR(100),
     color VARCHAR(50),
     subcategories JSONB,
     created_at TIMESTAMP
   );

   -- business_licenses table
   CREATE TABLE business_licenses (
     id UUID PRIMARY KEY,
     business_id UUID REFERENCES business_profiles(id),
     license_type VARCHAR(100),
     license_number VARCHAR(100),
     issuing_authority VARCHAR(255),
     issue_date DATE,
     expiry_date DATE,
     document_url VARCHAR(500),
     is_verified BOOLEAN DEFAULT false,
     created_at TIMESTAMP
   );

   -- business_services table
   CREATE TABLE business_services (
     id UUID PRIMARY KEY,
     business_id UUID REFERENCES business_profiles(id),
     service_name VARCHAR(255),
     description TEXT,
     price_min DECIMAL(10,2),
     price_max DECIMAL(10,2),
     duration VARCHAR(50),
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMP
   );

   -- business_reviews table
   CREATE TABLE business_reviews (
     id UUID PRIMARY KEY,
     business_id UUID REFERENCES business_profiles(id),
     user_id UUID REFERENCES users(id),
     rating INT CHECK (rating >= 1 AND rating <= 5),
     review_text TEXT,
     service_quality INT,
     professionalism INT,
     value_for_money INT,
     response TEXT, -- Business owner response
     responded_at TIMESTAMP,
     created_at TIMESTAMP,
     INDEX(business_id, created_at)
   );

   -- business_inquiries table
   CREATE TABLE business_inquiries (
     id UUID PRIMARY KEY,
     business_id UUID REFERENCES business_profiles(id),
     user_id UUID REFERENCES users(id),
     inquiry_type VARCHAR(50), -- 'booking', 'question', 'quote'
     message TEXT,
     phone_number VARCHAR(20),
     preferred_contact VARCHAR(20),
     preferred_date TIMESTAMP,
     status VARCHAR(20), -- 'pending', 'responded', 'closed'
     response TEXT,
     responded_at TIMESTAMP,
     created_at TIMESTAMP,
     INDEX(business_id, status)
   );

   -- business_payment_methods table
   CREATE TABLE business_payment_methods (
     business_id UUID REFERENCES business_profiles(id),
     method VARCHAR(50),
     details JSONB,
     is_active BOOLEAN DEFAULT true,
     PRIMARY KEY(business_id, method)
   );

   -- business_activity_log table
   CREATE TABLE business_activity_log (
     id UUID PRIMARY KEY,
     business_id UUID REFERENCES business_profiles(id),
     activity_type VARCHAR(50), -- 'job_completed', 'review_received', 'inquiry_received'
     metadata JSONB,
     created_at TIMESTAMP,
     INDEX(business_id, created_at)
   );
   ```

3. Implement business verification workflow:
   - Basic verification (phone + address)
   - Document verification (CAC, TIN, licenses)
   - Physical verification (site visit by admin)
   - Verification level badges

4. Implement business search with filters:
   - Category/subcategory filtering
   - Service area geographic filtering (using PostGIS)
   - Rating filtering
   - Pricing range filtering
   - Availability filtering
   - Verification level filtering

5. Implement business analytics:
   - Profile views
   - Inquiry conversion rate
   - Response time metrics
   - Review sentiment analysis
   - Revenue tracking

---

## 6. USER DASHBOARD & STATISTICS

### Frontend Features
Located in: `Hommie_Mobile/src/screens/ProfileScreen.tsx`

**Dashboard Statistics:**
- Bookmarks: 12 saved posts
- Saved Deals: 3 local offers
- Events: 5 upcoming events attending
- Community Impact:
  - 23 Posts Shared
  - 47 Neighbors Helped
  - 8 Events Joined

### Backend Implementation

**CRITICAL GAPS:**
1. ❌ **NO bookmarks system** (save/unsave posts/listings)
2. ❌ **NO saved deals/offers tracking**
3. ❌ **NO user activity aggregation**
4. ❌ **NO dashboard statistics endpoint**
5. ❌ **NO "neighbors helped" tracking mechanism**
6. ❌ **NO community impact calculation**

### Recommendations:
1. Create tables:
   ```sql
   -- user_bookmarks table
   CREATE TABLE user_bookmarks (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     item_type VARCHAR(50), -- 'post', 'listing', 'event'
     item_id UUID,
     created_at TIMESTAMP,
     UNIQUE(user_id, item_type, item_id),
     INDEX(user_id, item_type)
   );

   -- user_saved_deals table
   CREATE TABLE user_saved_deals (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     deal_id UUID,
     created_at TIMESTAMP,
     UNIQUE(user_id, deal_id)
   );

   -- user_dashboard_stats table (cached/materialized view)
   CREATE TABLE user_dashboard_stats (
     user_id UUID PRIMARY KEY REFERENCES users(id),
     bookmarks_count INT DEFAULT 0,
     saved_deals_count INT DEFAULT 0,
     attending_events_count INT DEFAULT 0,
     posts_shared_count INT DEFAULT 0,
     neighbors_helped_count INT DEFAULT 0,
     events_joined_count INT DEFAULT 0,
     last_calculated_at TIMESTAMP,
     updated_at TIMESTAMP
   );
   ```

2. Create endpoints:
   - GET /users/:id/dashboard (get all dashboard stats)
   - POST /users/:id/bookmarks (add bookmark)
   - DELETE /users/:id/bookmarks/:itemId (remove bookmark)
   - GET /users/:id/bookmarks (list bookmarks)
   - POST /users/:id/saved-deals/:dealId (save deal)
   - DELETE /users/:id/saved-deals/:dealId (unsave deal)
   - GET /users/:id/saved-deals (list saved deals)

3. Implement "neighbors helped" tracking:
   - Track helpful comment votes
   - Track direct help requests fulfilled
   - Track positive interactions
   - Track referrals/recommendations

---

## 7. COMPREHENSIVE RECOMMENDATIONS

### Immediate Priorities (Sprint 1-2):

1. **Build User Service Controller** (CRITICAL)
   - Implement basic CRUD endpoints for user profiles
   - Implement profile update endpoints
   - Implement avatar upload functionality
   - Implement user search/discovery

2. **Verification Service Foundation** (CRITICAL)
   - Create verification workflow endpoints
   - Implement phone verification (already partially done in Auth Service)
   - Add trust score calculation
   - Create verification badge system

3. **Dashboard & Statistics** (HIGH)
   - Implement bookmarks system
   - Implement activity tracking
   - Create dashboard statistics endpoint

### Medium-Term Goals (Sprint 3-5):

4. **Gamification System** (HIGH)
   - Create achievements and badges tables
   - Implement points tracking
   - Create leaderboard system
   - Implement level progression

5. **Cultural Profile System** (MEDIUM)
   - Create reference data tables and endpoints
   - Implement cultural profile management
   - Add privacy settings
   - Implement cultural matching features

6. **NIN Verification** (MEDIUM)
   - Create NIN verification tables
   - Integrate with NIN verification service
   - Implement document storage
   - Create verification audit trail

### Long-Term Goals (Sprint 6+):

7. **Business Account System** (MEDIUM-HIGH)
   - Create business profiles microservice
   - Implement business registration workflow
   - Create business verification system
   - Implement business search and discovery
   - Add reviews and ratings system

8. **Advanced Features** (LOW-MEDIUM)
   - Implement recommendation algorithms
   - Add advanced analytics
   - Create notification system for achievements/badges
   - Implement subscription/payment tiers for businesses

### Technical Architecture Recommendations:

1. **Microservices Structure:**
   ```
   backend/
   ├── apps/
   │   ├── user-service/          # User profile management (BUILD THIS FIRST)
   │   ├── verification-service/   # Verification workflows (NEW)
   │   ├── gamification-service/   # Achievements, badges, leaderboards (NEW)
   │   ├── business-service/       # Business accounts (NEW)
   │   └── ...existing services...
   ```

2. **Database Schema Priority:**
   - Phase 1: User profile tables, bookmarks, dashboard stats
   - Phase 2: Achievements, badges, points tracking
   - Phase 3: Cultural profile reference data, privacy settings
   - Phase 4: Business profiles, reviews, services
   - Phase 5: NIN verification, document storage

3. **API Design Guidelines:**
   - Follow RESTful conventions
   - Use consistent error handling
   - Implement proper pagination
   - Add comprehensive Swagger documentation
   - Implement rate limiting for sensitive endpoints
   - Use DTOs for all request/response payloads

4. **Security Considerations:**
   - Encrypt NIN data at rest
   - Implement role-based access control for verification
   - Add audit logging for sensitive operations
   - Implement file size/type validation for uploads
   - Add GDPR-compliant data deletion endpoints

5. **Performance Optimization:**
   - Cache dashboard statistics
   - Use materialized views for leaderboards
   - Implement background jobs for heavy calculations
   - Add database indexes for frequently queried fields
   - Use Redis for real-time leaderboard updates

---

## 8. EFFORT ESTIMATION

### Sprint Breakdown:

**Sprint 1 (User Service Foundation):**
- User CRUD endpoints: 5 days
- Profile updates & avatar upload: 3 days
- Basic search: 2 days
- **Total: 10 days**

**Sprint 2 (Dashboard & Bookmarks):**
- Bookmarks system: 3 days
- Activity tracking: 4 days
- Dashboard statistics: 3 days
- **Total: 10 days**

**Sprint 3 (Verification Foundation):**
- Trust score calculation: 3 days
- Verification badge system: 4 days
- Verification workflows: 3 days
- **Total: 10 days**

**Sprint 4-5 (Gamification):**
- Achievements system: 5 days
- Badges system: 4 days
- Points tracking: 4 days
- Leaderboard system: 7 days
- **Total: 20 days**

**Sprint 6 (Cultural Profile):**
- Reference data setup: 3 days
- Cultural profile endpoints: 4 days
- Privacy settings: 2 days
- Cultural matching: 1 day
- **Total: 10 days**

**Sprint 7-8 (NIN Verification):**
- NIN verification tables: 2 days
- Document storage: 3 days
- Third-party integration: 5 days
- Verification workflows: 5 days
- Audit trail: 2 days
- **Total: 17 days**

**Sprint 9-12 (Business System):**
- Business profiles: 8 days
- Registration workflow: 5 days
- Search & discovery: 5 days
- Reviews system: 6 days
- Business verification: 4 days
- Analytics: 3 days
- Inquiry system: 4 days
- **Total: 35 days**

**GRAND TOTAL: ~122 developer days (approximately 6 months for 1 developer or 3 months for 2 developers)**

---

## 9. CONCLUSION

The mobile app presents an impressive, feature-complete user experience with sophisticated verification, gamification, cultural integration, and business account features. However, the backend is critically underdeveloped, with the User Service existing only as a "Hello World" placeholder.

**Critical Actions Required:**
1. Immediately build out the User Service controller with basic CRUD operations
2. Prioritize verification system implementation (trust score, badges, NIN verification)
3. Implement gamification system to unlock user engagement features
4. Build business account system to enable the local commerce use case
5. Add cultural profile management to leverage Nigerian-specific features

Without these backend implementations, the mobile app cannot function beyond basic authentication. The frontend team has done exceptional work creating comprehensive UI/UX, but these features are currently non-functional demo screens with mock data.

**Recommendation:** Treat this as a critical technical debt requiring immediate attention. The User Service should be the #1 priority, followed by verification and gamification systems.
