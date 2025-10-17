# MeCabal Onboarding & Location System Redesign

## Document Overview

This document provides comprehensive guidance for implementing Google OAuth authentication and redesigning the location/neighborhood system for MeCabal. It covers both backend and mobile app implementations with detailed task breakdowns.

**Table of Contents:**
- [Part 1: Google OAuth Implementation](#part-1-google-oauth-implementation)
- [Part 2: Location System Redesign](#part-2-location-system-redesign)
- [Part 3: Implementation Guidelines](#part-3-implementation-guidelines)
- [Part 4: Data Sources and Scripts](#part-4-data-sources-and-scripts)
- [Part 5: User Flow Documentation](#part-5-user-flow-documentation)
- [Part 6: Technical Specifications](#part-6-technical-specifications)

---

# Part 1: Google OAuth Implementation

## Overview

Implement Google Sign-In/Sign-Up across both mobile app and backend to provide seamless authentication for users.

## Backend Tasks

### Task 1.1: Install Dependencies
**Location:** `backend/apps/auth/`

```bash
npm install @nestjs/passport passport-google-oauth20
npm install --save-dev @types/passport-google-oauth20
```

### Task 1.2: Configure Google OAuth Strategy
**Location:** `backend/apps/auth/src/strategies/`

**File to create:** `google.strategy.ts`

**Requirements:**
- Extend PassportStrategy with 'google' identifier
- Configure OAuth2Strategy with clientID, clientSecret, callbackURL
- Extract user profile data (email, firstName, lastName, profilePicture)
- Handle both new user registration and existing user login
- Return user object with JWT tokens

**Environment Variables Needed:**
```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

### Task 1.3: Create Google Auth DTOs
**Location:** `backend/libs/validation/src/dto/auth/`

**Files to create/update:**
- `google-auth.dto.ts` - For handling Google OAuth response
- `social-auth.dto.ts` - Generic social auth response DTO

**Required fields:**
```typescript
{
  email: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  googleId: string;
  isNewUser: boolean;
}
```

### Task 1.4: Update User Entity
**Location:** `backend/libs/database/src/entities/user.entity.ts`

**Changes needed:**
- Add `googleId` field (nullable, unique)
- Add `authProvider` enum field ('local' | 'google' | 'facebook' | 'apple')
- Add `isEmailVerified` boolean field
- Update password field to be nullable (for OAuth users)
- Add composite index on email and authProvider

### Task 1.5: Create Database Migration
**Location:** `backend/apps/auth/src/migrations/`

**Command:**
```bash
npm run migration:generate -- AddGoogleAuthToUser
```

**Migration should:**
- Add googleId column (VARCHAR, nullable, unique)
- Add authProvider column (ENUM, default 'local')
- Add isEmailVerified column (BOOLEAN, default false)
- Modify password column to be nullable
- Create index on (email, authProvider)

### Task 1.6: Update Auth Service
**Location:** `backend/apps/auth/src/auth.service.ts`

**Methods to add/update:**
- `validateGoogleUser(googleProfile)` - Validate and process Google profile
- `findOrCreateGoogleUser(googleData)` - Find existing user or create new one
- `linkGoogleAccount(userId, googleId)` - Link Google to existing account
- Update `generateTokens()` to handle OAuth users

**Business Logic:**
- If email exists with 'local' provider, suggest linking accounts
- If email exists with 'google' provider, proceed with login
- For new users, set `isEmailVerified: true` automatically
- Generate JWT tokens same as local auth

### Task 1.7: Create Auth Controller Endpoints
**Location:** `backend/apps/auth/src/auth.controller.ts`

**Endpoints to add:**
```typescript
@Get('google')
@UseGuards(GoogleAuthGuard)
googleAuth() // Initiates OAuth flow

@Get('google/callback')
@UseGuards(GoogleAuthGuard)
googleAuthCallback(@Req() req) // Handles OAuth callback

@Post('google/mobile')
googleAuthMobile(@Body() dto: GoogleAuthMobileDto) // For mobile token verification
```

### Task 1.8: Create Google Auth Guard
**Location:** `backend/libs/auth/src/guards/`

**File to create:** `google-auth.guard.ts`

**Requirements:**
- Extend AuthGuard('google')
- Handle authentication failures
- Redirect on success/failure for web flow

### Task 1.9: Update API Gateway
**Location:** `backend/apps/gateway/src/`

**Changes needed:**
- Add routes for `/auth/google` and `/auth/google/callback`
- Proxy requests to auth service
- Handle OAuth redirects properly
- Update Swagger documentation

### Task 1.10: Add Mobile Token Verification
**Location:** `backend/apps/auth/src/services/`

**File to create:** `google-token-verifier.service.ts`

**Requirements:**
- Use Google's token verification library
- Verify ID tokens from mobile apps
- Extract user info from verified tokens
- Handle iOS and Android client IDs separately

**Dependencies:**
```bash
npm install google-auth-library
```

---

## Mobile App Tasks

### Task 1.11: Install Google Sign-In Dependencies
**Location:** `Hommie_Mobile/`

```bash
npx expo install @react-native-google-signin/google-signin
npx expo install expo-auth-session expo-crypto
```

### Task 1.12: Configure Google OAuth in App Config
**Location:** `Hommie_Mobile/app.json`

**Add to config:**
```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json"
    },
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "plugins": [
      "@react-native-google-signin/google-signin"
    ]
  }
}
```

### Task 1.13: Create Google Sign-In Service
**Location:** `Hommie_Mobile/src/services/`

**File to create:** `googleAuth.ts`

**Requirements:**
- Configure Google Sign-In with web client ID
- Implement `signInWithGoogle()` method
- Implement `signOutFromGoogle()` method
- Handle platform-specific configurations (iOS/Android)
- Return ID token for backend verification

### Task 1.14: Update Auth Context
**Location:** `Hommie_Mobile/src/contexts/AuthContext.tsx`

**Methods to add:**
- `signInWithGoogle()` - Trigger Google OAuth flow
- `handleGoogleCallback(idToken)` - Send token to backend
- Update `login()` to support OAuth flow
- Add `authProvider` to user state

### Task 1.15: Create Google Sign-In Button Component
**Location:** `Hommie_Mobile/src/components/auth/`

**File to create:** `GoogleSignInButton.tsx`

**Design Requirements (Apple HIG compliant):**
- Use official Google logo and colors
- Minimum touch target: 44x44pt (iOS) / 48x48dp (Android)
- Clear loading state during authentication
- Error handling with user-friendly messages
- Accessibility labels and hints
- Follow Material Design guidelines for Android

**Button states:**
- Default: "Continue with Google"
- Loading: Show spinner with "Signing in..."
- Error: Show error message below button

### Task 1.16: Update Welcome Screen
**Location:** `Hommie_Mobile/src/screens/auth/WelcomeScreen.tsx`

**Changes needed:**
- Add GoogleSignInButton component
- Add visual separator ("OR" divider)
- Maintain existing phone auth button
- Update layout to accommodate both options
- Ensure proper spacing (8dp grid system)

### Task 1.17: Update Login Screen
**Location:** `Hommie_Mobile/src/screens/auth/LoginScreen.tsx`

**Changes needed:**
- Add GoogleSignInButton at top
- Add visual separator
- Keep existing email/password login
- Handle OAuth callback if coming from Google
- Update error handling

### Task 1.18: Create OAuth Callback Handler
**Location:** `Hommie_Mobile/src/screens/auth/`

**File to create:** `OAuthCallbackScreen.tsx`

**Requirements:**
- Handle deep links from OAuth flow
- Extract authorization code/token
- Send to backend for verification
- Show loading state
- Handle errors gracefully
- Redirect to appropriate screen (onboarding or main app)

### Task 1.19: Update Navigation Configuration
**Location:** `Hommie_Mobile/App.tsx` or navigation config

**Changes needed:**
- Add OAuth callback route
- Handle deep linking configuration
- Update authentication flow logic
- Add Google auth state to navigation

### Task 1.20: Add Environment Variables
**Location:** `Hommie_Mobile/.env`

**Variables to add:**
```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id
```

### Task 1.21: Update AsyncStorage Keys
**Location:** `Hommie_Mobile/src/utils/storage.ts` (if exists)

**Changes needed:**
- Add `authProvider` to stored user data
- Add `googleId` to user profile
- Update storage retrieval logic

### Task 1.22: Testing Checklist
**Platform Testing:**
- Test on iOS simulator
- Test on Android emulator
- Test on physical devices (both platforms)
- Test with existing email accounts
- Test with new Google accounts
- Test error scenarios (network issues, cancelled auth)
- Test account linking scenarios

---

# Part 2: Location System Redesign

## Overview

Redesign the location/neighborhood system to follow Nigeria's administrative hierarchy: State → LGA → Ward → Neighborhood, with support for landmarks and estate communities.

## Analysis of Current Implementation

### Current Gaps Identified:

1. **Authentication Flow** (`Hommie_Mobile/src/screens/auth/`)
   - Current: Welcome → Phone Verification → OTP → Location Setup
   - Missing: Google OAuth integration
   - Location setup is too simplistic

2. **Location Components** (`Hommie_Mobile/src/components/`)
   - No hierarchical location selector
   - No ward-level selection
   - No estate/landmark support

3. **Backend Location Entities** (`backend/libs/database/src/entities/`)
   - Need new entities for LGA, Ward, Neighborhood
   - No landmark/estate schema
   - No boundary polygon support

4. **Location Service** (Backend)
   - No API for hierarchical location data
   - No neighborhood recommendation system
   - No geospatial queries

## Backend Tasks

### Task 2.1: Create Location Entities
**Location:** `backend/libs/database/src/entities/location/`

**Files to create:**

**`state.entity.ts`**
```typescript
{
  id: UUID
  name: string
  code: string (e.g., "LA" for Lagos)
  country: string (default: "Nigeria")
  createdAt: Date
  updatedAt: Date
  lgas: LGA[] (OneToMany)
}
```

**`lga.entity.ts`** (Local Government Area)
```typescript
{
  id: UUID
  name: string
  code: string
  stateId: UUID
  state: State (ManyToOne)
  type: enum ('LGA' | 'LCDA')
  createdAt: Date
  updatedAt: Date
  wards: Ward[] (OneToMany)
}
```

**`ward.entity.ts`**
```typescript
{
  id: UUID
  name: string
  code: string
  lgaId: UUID
  lga: LGA (ManyToOne)
  boundaries: Polygon (PostGIS)
  createdAt: Date
  updatedAt: Date
  neighborhoods: Neighborhood[] (OneToMany)
}
```

**`neighborhood.entity.ts`**
```typescript
{
  id: UUID
  name: string
  type: enum ('AREA' | 'ESTATE' | 'COMMUNITY')
  wardId: UUID
  ward: Ward (ManyToOne)
  parentNeighborhoodId: UUID (nullable, for sub-neighborhoods)
  parentNeighborhood: Neighborhood (ManyToOne)
  subNeighborhoods: Neighborhood[] (OneToMany)
  boundaries: Polygon (PostGIS, nullable)
  isGated: boolean
  requiresVerification: boolean
  adminUserId: UUID (nullable, for estate admins)
  createdAt: Date
  updatedAt: Date
  landmarks: Landmark[] (OneToMany)
  users: User[] (OneToMany)
}
```

**`landmark.entity.ts`**
```typescript
{
  id: UUID
  name: string
  type: enum ('MARKET' | 'SCHOOL' | 'HOSPITAL' | 'MOSQUE' | 'CHURCH' | 'PARK' | 'GATE' | 'OTHER')
  neighborhoodId: UUID
  neighborhood: Neighborhood (ManyToOne)
  location: Point (PostGIS)
  address: string (nullable)
  description: string (nullable)
  createdBy: UUID (nullable)
  verificationStatus: enum ('PENDING' | 'VERIFIED' | 'REJECTED')
  createdAt: Date
  updatedAt: Date
}
```

**`user-location.entity.ts`**
```typescript
{
  id: UUID
  userId: UUID
  user: User (ManyToOne)
  stateId: UUID
  state: State (ManyToOne)
  lgaId: UUID
  lga: LGA (ManyToOne)
  wardId: UUID (nullable)
  ward: Ward (ManyToOne)
  neighborhoodId: UUID
  neighborhood: Neighborhood (ManyToOne)
  cityTown: string (nullable)
  address: string (nullable)
  coordinates: Point (PostGIS)
  isPrimary: boolean
  verificationStatus: enum ('UNVERIFIED' | 'PENDING' | 'VERIFIED')
  createdAt: Date
  updatedAt: Date
}
```

### Task 2.2: Create Database Migrations
**Location:** `backend/apps/auth/src/migrations/` or dedicated location service

**Migrations needed:**
1. Create states table
2. Create lgas table with foreign key to states
3. Create wards table with foreign key to lgas and PostGIS geometry
4. Create neighborhoods table with self-referential foreign key and PostGIS geometry
5. Create landmarks table with PostGIS point geometry
6. Create user_locations table with foreign keys and PostGIS point
7. Add indexes on foreign keys and geospatial columns
8. Add full-text search indexes on name columns

**Command:**
```bash
npm run migration:generate -- CreateLocationHierarchy
```

### Task 2.3: Create Location Data Seeder
**Location:** `backend/apps/auth/src/seeders/` or new location service

**File to create:** `location.seeder.ts`

**Requirements:**
- Seed all Nigerian states (36 + FCT)
- Seed Lagos LGAs/LCDAs (source: Facebook link provided)
- Seed sample wards for major LGAs
- Seed neighborhoods from `NotableNeighboorhoods.txt`
- Create relationships between entities
- Handle idempotent seeding (can run multiple times)

**Data sources:**
- Nigerian states: Wikipedia or government data
- Lagos LGAs: https://web.facebook.com/AGEGETV/posts/884774577200357/
- Neighborhoods: `NotableNeighboorhoods.txt`
- Ward data: Electoral commission data or OpenStreetMap

### Task 2.4: Create Google Maps Integration Service
**Location:** `backend/libs/common/src/services/`

**File to create:** `google-maps.service.ts`

**Requirements:**
- Integrate Google Places API
- Integrate Google Geocoding API
- `reverseGeocode(lat, lng)` - Get location from coordinates
- `findNearbyPlaces(lat, lng, type, radius)` - Find landmarks
- `getPlaceDetails(placeId)` - Get detailed place info
- `searchEstates(query, location)` - Search for estates/neighborhoods
- `getAdministrativeArea(lat, lng)` - Extract state/LGA from coordinates
- Rate limiting and caching

**Dependencies:**
```bash
npm install @googlemaps/google-maps-services-js
```

**Environment variables:**
```
GOOGLE_MAPS_API_KEY=your_api_key
```

### Task 2.5: Create Neighborhood Generation Script
**Location:** `backend/scripts/`

**File to create:** `generate-neighborhoods.ts`

**Requirements:**
- Take LGA name or ward name as input
- Use Google Places API to find estates and communities
- Use Google Geocoding to get boundaries (if available)
- Search for landmarks (schools, markets, hospitals, mosques, churches)
- Create neighborhood records with relationships
- Create landmark records
- Generate GeoJSON boundaries (polygon approximations)
- Output results to JSON file
- Optionally insert directly to database

**Usage:**
```bash
npm run script:generate-neighborhoods -- --lga="Alimosho" --output="neighborhoods.json"
```

### Task 2.6: Create Location Service (Microservice)
**Location:** `backend/apps/location/` (new microservice)

**Setup:**
```bash
nest generate app location
```

**Controllers needed:**
- `states.controller.ts` - GET /states
- `lgas.controller.ts` - GET /states/:stateId/lgas
- `wards.controller.ts` - GET /lgas/:lgaId/wards
- `neighborhoods.controller.ts` - CRUD for neighborhoods
- `landmarks.controller.ts` - CRUD for landmarks
- `location-search.controller.ts` - Search and recommendations

### Task 2.7: Implement Location Service Logic
**Location:** `backend/apps/location/src/services/`

**Services to create:**

**`location-hierarchy.service.ts`**
- `getStates()` - List all states
- `getLGAsByState(stateId)` - List LGAs in state
- `getWardsByLGA(lgaId)` - List wards in LGA
- `getNeighborhoodsByWard(wardId)` - List neighborhoods in ward
- `getNeighborhoodHierarchy(neighborhoodId)` - Get full hierarchy

**`neighborhood-recommendation.service.ts`**
- `recommendByCoordinates(lat, lng)` - Recommend based on GPS
- `getNeighborhoodsInRadius(lat, lng, radius)` - Get nearby neighborhoods
- `searchNeighborhoods(query, filters)` - Full-text search
- `getUserNeighborhoodSuggestions(userId)` - Personalized suggestions

**`landmark.service.ts`**
- `createLandmark(dto)` - User-submitted landmarks
- `getNearbyLandmarks(neighborhoodId)` - Get landmarks for neighborhood
- `verifyLandmark(landmarkId)` - Admin verification
- `searchLandmarks(query, type)` - Search functionality

**`estate-management.service.ts`**
- `createEstate(dto)` - Create gated estate/neighborhood
- `verifyEstateResident(userId, estateId)` - Verification flow
- `assignEstateAdmin(estateId, userId)` - Admin assignment
- `getEstateMembers(estateId)` - List verified residents

### Task 2.8: Create Location DTOs
**Location:** `backend/libs/validation/src/dto/location/`

**DTOs to create:**
- `create-neighborhood.dto.ts`
- `update-neighborhood.dto.ts`
- `neighborhood-search.dto.ts`
- `create-landmark.dto.ts`
- `location-coordinates.dto.ts`
- `neighborhood-recommendation.dto.ts`
- `estate-verification.dto.ts`

### Task 2.9: Implement Geospatial Queries
**Location:** `backend/apps/location/src/repositories/`

**Create custom TypeORM repositories:**

**`neighborhood.repository.ts`**
```typescript
- findByBoundary(polygon: Polygon)
- findNearPoint(point: Point, radius: number)
- findIntersecting(polygon: Polygon)
```

**Use PostGIS functions:**
- ST_Contains
- ST_Distance
- ST_DWithin
- ST_Intersects

### Task 2.10: Add Location Endpoints to API Gateway
**Location:** `backend/apps/gateway/src/`

**Routes to add:**
```
GET    /location/states
GET    /location/states/:stateId/lgas
GET    /location/lgas/:lgaId/wards
GET    /location/wards/:wardId/neighborhoods
GET    /location/neighborhoods/:id
POST   /location/neighborhoods
GET    /location/neighborhoods/search
GET    /location/neighborhoods/recommend
POST   /location/landmarks
GET    /location/landmarks/nearby/:neighborhoodId
```

### Task 2.11: Update User Entity and Service
**Location:** `backend/libs/database/src/entities/user.entity.ts`

**Changes:**
- Add relationship to UserLocation entity
- Remove old location fields (if any)
- Add `primaryLocationId` field

**Update user service:**
- Add methods to set/update user location
- Add location verification workflow
- Integrate with location microservice

### Task 2.12: Create Location Verification System
**Location:** `backend/apps/location/src/verification/`

**Requirements:**
- Photo verification (user at location with landmark)
- Estate admin verification for gated communities
- Address document verification
- SMS verification with location check
- Manual admin review workflow

---

## Mobile App Tasks

### Task 2.13: Create Location Data Models
**Location:** `Hommie_Mobile/src/types/`

**File to create:** `location.types.ts`

**Interfaces:**
```typescript
interface State {
  id: string;
  name: string;
  code: string;
}

interface LGA {
  id: string;
  name: string;
  code: string;
  stateId: string;
  type: 'LGA' | 'LCDA';
}

interface Ward {
  id: string;
  name: string;
  code: string;
  lgaId: string;
}

interface Neighborhood {
  id: string;
  name: string;
  type: 'AREA' | 'ESTATE' | 'COMMUNITY';
  wardId: string;
  isGated: boolean;
  requiresVerification: boolean;
  subNeighborhoods?: Neighborhood[];
}

interface Landmark {
  id: string;
  name: string;
  type: string;
  neighborhoodId: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

interface UserLocation {
  stateId: string;
  lgaId: string;
  wardId?: string;
  neighborhoodId: string;
  cityTown?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}
```

### Task 2.14: Create Location API Service
**Location:** `Hommie_Mobile/src/services/api/`

**File to create:** `locationApi.ts`

**Methods:**
```typescript
- getStates(): Promise<State[]>
- getLGAsByState(stateId: string): Promise<LGA[]>
- getWardsByLGA(lgaId: string): Promise<Ward[]>
- getNeighborhoodsByWard(wardId: string): Promise<Neighborhood[]>
- recommendNeighborhoods(lat: number, lng: number): Promise<Neighborhood[]>
- searchNeighborhoods(query: string): Promise<Neighborhood[]>
- getNearbyLandmarks(neighborhoodId: string): Promise<Landmark[]>
- reverseGeocode(lat: number, lng: number): Promise<LocationInfo>
```

### Task 2.15: Create Location Context
**Location:** `Hommie_Mobile/src/contexts/`

**File to create:** `LocationContext.tsx`

**State to manage:**
```typescript
{
  selectedState: State | null;
  selectedLGA: LGA | null;
  selectedWard: Ward | null;
  selectedNeighborhood: Neighborhood | null;
  currentCoordinates: {lat: number, lng: number} | null;
  recommendedNeighborhoods: Neighborhood[];
  isLoadingLocation: boolean;
}
```

**Methods:**
```typescript
- setSelectedState(state: State)
- setSelectedLGA(lga: LGA)
- setSelectedWard(ward: Ward)
- setSelectedNeighborhood(neighborhood: Neighborhood)
- getCurrentLocation()
- getRecommendations()
- saveUserLocation()
```

### Task 2.16: Create Hierarchical Location Selector Component
**Location:** `Hommie_Mobile/src/components/location/`

**File to create:** `HierarchicalLocationSelector.tsx`

**Design Requirements (Apple HIG + Material Design):**
- Multi-step form with progress indicator
- Step 1: State selection (searchable dropdown)
- Step 2: LGA selection (searchable dropdown with type badges)
- Step 3: City/Town input (text field with autocomplete)
- Step 4: Ward selection (optional, based on GPS)
- Step 5: Neighborhood selection (list with recommendations)
- Each step shows breadcrumb of selections
- Back navigation between steps
- Save progress locally (AsyncStorage)
- Smooth animations between steps
- Loading states for API calls
- Error handling with retry option

**Accessibility:**
- VoiceOver/TalkBack support
- Minimum touch targets (44pt iOS / 48dp Android)
- Clear labels and hints
- Focus management

### Task 2.17: Create GPS Location Picker Component
**Location:** `Hommie_Mobile/src/components/location/`

**File to create:** `GPSLocationPicker.tsx`

**Requirements:**
- Request location permissions
- Show map with user's current location
- Display recommended neighborhoods based on GPS
- Allow map dragging to adjust location
- Show nearest landmarks as markers
- "Use My Location" button
- Manual address input fallback
- Loading state while fetching recommendations
- Permission denied fallback UI

**Dependencies:**
```bash
npx expo install expo-location react-native-maps
```

### Task 2.18: Create Neighborhood Card Component
**Location:** `Hommie_Mobile/src/components/location/`

**File to create:** `NeighborhoodCard.tsx`

**Design:**
- Display neighborhood name and type badge
- Show distance from user (if GPS available)
- Display 2-3 nearby landmarks
- Show member count (if available)
- Gated estate indicator (lock icon)
- Selectable with checkmark
- Subtle shadow and border
- Haptic feedback on selection (iOS)

### Task 2.19: Create Estate Search Component
**Location:** `Hommie_Mobile/src/components/location/`

**File to create:** `EstateSearchInput.tsx`

**Requirements:**
- Search input with debouncing
- Live search results dropdown
- Show estate type (gated/open)
- "Not listed?" option to add new estate
- Recently searched estates
- Clear search button
- Loading spinner during search

### Task 2.20: Redesign Location Setup Screen
**Location:** `Hommie_Mobile/src/screens/onboarding/`

**File to update:** `LocationSetupScreen.tsx` or create new

**New Flow:**
1. Welcome message explaining location importance
2. Two options: "Use GPS" or "Select Manually"
3. If GPS: Show GPSLocationPicker with recommendations
4. If Manual: Show HierarchicalLocationSelector
5. After selection: Show confirmation screen with map
6. Optional: Add city/town if not auto-detected
7. Save and continue to next onboarding step

**Design notes:**
- Follow 8dp grid system
- Use MeCabal green (#00A651) for CTAs
- Clear visual hierarchy
- Progress indicator at top
- Skip option (with warning)

### Task 2.21: Create Neighborhood Recommendation Screen
**Location:** `Hommie_Mobile/src/screens/onboarding/`

**File to create:** `NeighborhoodRecommendationScreen.tsx`

**Layout:**
- Map showing user location and neighborhood boundaries
- List of recommended neighborhoods below map
- Filter options (distance, type, gated/open)
- "Search for different area" button
- Continue button (disabled until selection)
- Info sheet explaining verification for gated estates

### Task 2.22: Create Estate Verification Screen
**Location:** `Hommie_Mobile/src/screens/onboarding/`

**File to create:** `EstateVerificationScreen.tsx`

**For gated estates requiring verification:**
- Explain verification process
- Options:
  1. Upload proof of residence (document photo)
  2. Request verification from estate admin
  3. Take photo at estate with landmark
- Show estimated verification time
- Allow continuing without verification (limited access)
- Skip option with explanation

### Task 2.23: Update Onboarding Flow
**Location:** `Hommie_Mobile/App.tsx` or navigation config

**New onboarding sequence:**
1. WelcomeScreen (with Google OAuth)
2. PhoneVerificationScreen (if not using Google)
3. OTPScreen (if using phone auth)
4. LocationSetupScreen (new design)
5. NeighborhoodRecommendationScreen (new)
6. EstateVerificationScreen (if applicable)
7. ProfileSetupScreen (existing)
8. Main App

### Task 2.24: Update User Profile with Location
**Location:** `Hommie_Mobile/src/contexts/AuthContext.tsx`

**Add to user object:**
```typescript
{
  location: {
    state: State;
    lga: LGA;
    ward?: Ward;
    neighborhood: Neighborhood;
    cityTown?: string;
    coordinates: {lat: number, lng: number};
    verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED';
  }
}
```

### Task 2.25: Create Location Management Screen
**Location:** `Hommie_Mobile/src/screens/profile/`

**File to create:** `LocationManagementScreen.tsx`

**Features:**
- Display current location hierarchy
- Edit location button
- Add secondary locations
- Location verification status
- Switch primary location
- View neighborhood map
- Nearby landmarks list

### Task 2.26: Add Location to User Registration
**Location:** Update registration flow in mobile app

**Changes:**
- After Google/Phone auth, collect location
- Make location required for registration
- Store location data with user profile
- Sync with backend

### Task 2.27: Create Neighborhood Discovery Screen
**Location:** `Hommie_Mobile/src/screens/explore/`

**File to create:** `NeighborhoodDiscoveryScreen.tsx`

**Features:**
- Browse neighborhoods in user's LGA
- View neighborhood details
- See community activity
- Join additional neighborhoods (for nearby areas)
- Discover landmarks
- View neighborhood boundaries on map

### Task 2.28: Implement Offline Support
**Location:** Throughout mobile app

**Requirements:**
- Cache location hierarchy data (states, LGAs) in AsyncStorage
- Store user's location locally
- Allow viewing saved location offline
- Sync location changes when online
- Handle connectivity errors gracefully

### Task 2.29: Add Location Permissions Handling
**Location:** `Hommie_Mobile/src/utils/`

**File to create:** `permissions.ts`

**Methods:**
```typescript
- requestLocationPermission()
- checkLocationPermission()
- handlePermissionDenied()
- openSettings()
```

**Platform-specific handling:**
- iOS: Request "When In Use" permission
- Android: Request FINE_LOCATION permission
- Handle "Don't Ask Again" scenario
- Provide fallback to manual location entry

### Task 2.30: Create Location Testing Suite
**Location:** `Hommie_Mobile/src/__tests__/location/`

**Test files:**
- `locationApi.test.ts` - API integration tests
- `LocationContext.test.tsx` - Context logic tests
- `HierarchicalLocationSelector.test.tsx` - Component tests
- `GPSLocationPicker.test.tsx` - GPS functionality tests

**Test scenarios:**
- Successful location selection flow
- GPS permission denied handling
- API error handling
- Offline mode behavior
- Location caching

---

# Part 3: Implementation Guidelines

## Development Phases

### Phase 1: Backend Foundation (Week 1-2)
1. Create all location entities and migrations
2. Set up PostGIS and geospatial capabilities
3. Seed states, LGAs, and sample data
4. Create location microservice structure
5. Implement Google Maps integration
6. Build neighborhood generation script

### Phase 2: Backend APIs (Week 2-3)
1. Implement location hierarchy endpoints
2. Build neighborhood recommendation logic
3. Create landmark management APIs
4. Implement estate verification system
5. Add geospatial search functionality
6. Update API gateway routing

### Phase 3: Google OAuth (Week 3)
1. Backend Google OAuth strategy
2. Mobile Google Sign-In integration
3. Update authentication flows
4. Test across platforms

### Phase 4: Mobile Location UI (Week 4-5)
1. Create location components
2. Build hierarchical location selector
3. Implement GPS picker
4. Design neighborhood cards
5. Create recommendation screen

### Phase 5: Integration (Week 5-6)
1. Connect mobile app to location APIs
2. Implement onboarding flow
3. Add location management features
4. Test end-to-end flows
5. Handle edge cases

### Phase 6: Testing & Polish (Week 6-7)
1. Comprehensive testing (unit, integration, E2E)
2. Performance optimization
3. Accessibility improvements
4. UI/UX refinements
5. Documentation

## Design System Guidelines

### Colors (from MeCabal Design System)
- Primary: `#00A651` (MeCabal Green)
- Secondary: `#2E7D32`
- Background: `#FFFFFF`
- Surface: `#F5F5F5`
- Text Primary: `#212121`
- Text Secondary: `#757575`
- Error: `#D32F2F`
- Success: `#388E3C`

### Typography
- Header: SF Pro Display (iOS) / Roboto (Android)
- Body: SF Pro Text (iOS) / Roboto (Android)
- Sizes: 12, 14, 16, 18, 20, 24, 32, 40

### Spacing (8dp grid)
- xs: 4dp
- sm: 8dp
- md: 16dp
- lg: 24dp
- xl: 32dp
- xxl: 48dp

### Components
- Follow Apple HIG for iOS-style components
- Ensure Material Design compliance for Android
- Maintain consistent touch targets (44pt/48dp minimum)
- Use platform-specific navigation patterns

## API Design Principles

### RESTful Conventions
```
GET    /resource          - List resources
GET    /resource/:id      - Get single resource
POST   /resource          - Create resource
PUT    /resource/:id      - Update resource
DELETE /resource/:id      - Delete resource
```

### Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "timestamp": "2025-10-17T12:00:00Z"
}
```

### Error Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": []
  },
  "timestamp": "2025-10-17T12:00:00Z"
}
```

## Security Considerations

### Authentication
- JWT tokens with 15min access, 7day refresh
- Secure token storage (SecureStore on mobile)
- HTTPS only for API calls
- CORS properly configured

### Location Privacy
- User consent for GPS usage
- Option to use approximate location
- Hide exact coordinates from other users
- Estate verification for gated communities

### Data Validation
- Validate all user inputs
- Sanitize geospatial data
- Prevent SQL injection (use parameterized queries)
- Rate limiting on location APIs

## Performance Optimization

### Backend
- Index all foreign keys
- Spatial indexes on geometry columns
- Cache location hierarchy data (Redis)
- Paginate large result sets
- Optimize geospatial queries

### Mobile
- Cache location data locally
- Lazy load neighborhoods
- Debounce search inputs
- Optimize map rendering
- Compress images

## Testing Strategy

### Backend Testing
- Unit tests for services (Jest)
- Integration tests for APIs (Supertest)
- E2E tests for full flows
- Geospatial query tests
- Load testing for recommendations

### Mobile Testing
- Unit tests for utilities (Jest)
- Component tests (React Native Testing Library)
- Integration tests for API calls
- E2E tests (Detox)
- Manual testing on devices

## Documentation Requirements

### Code Documentation
- JSDoc comments for all public methods
- README for each major component
- API endpoint documentation (Swagger)
- Database schema documentation

### User Documentation
- In-app help text
- Tooltips for complex features
- FAQ section
- Video tutorials for onboarding

---

# Part 4: Data Sources and Scripts

## Required Data Sources

### 1. Nigerian States
**Source:** Official government data or Wikipedia
**Format:** CSV or JSON
**Fields:** name, code, capital, population

### 2. Lagos LGAs/LCDAs
**Source:** https://web.facebook.com/AGEGETV/posts/884774577200357/
**Manual extraction needed**
**Fields:** name, type (LGA/LCDA), parent LGA (for LCDAs)

### 3. Electoral Wards
**Source:** INEC (Independent National Electoral Commission)
**Alternative:** OpenStreetMap data
**Fields:** name, code, LGA, boundary coordinates

### 4. Notable Neighborhoods
**Source:** `NotableNeighboorhoods.txt` (provided)
**Parse structure:**
- Lekki neighborhoods: Lines 2-13
- Agege traditional communities: Lines 16-24
- Agege residential communities: Lines 26-31
- Agege estates: Lines 33-36

### 5. Landmarks
**Source:** Google Places API
**Types:** markets, schools, hospitals, mosques, churches, parks
**Fetch:** Using neighborhood generation script

## Neighborhood Generation Script Details

**Script:** `backend/scripts/generate-neighborhoods.ts`

### Algorithm:
1. Accept input: LGA name or coordinates
2. Query Google Places API for estates/communities
3. For each result:
   - Get place details
   - Extract name, type, coordinates
   - Search for nearby landmarks (500m radius)
   - Approximate boundary (circle or convex hull)
4. Create neighborhood records
5. Create landmark records
6. Generate GeoJSON output
7. Optionally insert to database

### Usage Examples:
```bash
# Generate neighborhoods for Alimosho LGA
npm run script:generate-neighborhoods -- --lga="Alimosho" --state="Lagos"

# Generate for specific area with coordinates
npm run script:generate-neighborhoods -- --lat=6.5244 --lng=3.3792 --radius=5000

# Generate and insert to database
npm run script:generate-neighborhoods -- --lga="Lekki" --insert

# Output to JSON file
npm run script:generate-neighborhoods -- --ward="Ikeja GRA" --output="ikeja-neighborhoods.json"
```

### Rate Limiting:
- Google Places API: 1000 requests/day (free tier)
- Implement delays between requests
- Cache results to avoid repeat queries
- Use batch processing for large areas

## Data Seeding Strategy

### 1. Seed States (One-time)
```bash
npm run seed:states
```
Seeds all 36 Nigerian states + FCT

### 2. Seed Lagos LGAs (One-time)
```bash
npm run seed:lagos-lgas
```
Seeds all Lagos LGAs and LCDAs

### 3. Seed Notable Neighborhoods (One-time)
```bash
npm run seed:neighborhoods -- --file="NotableNeighboorhoods.txt"
```
Parses file and creates neighborhood records

### 4. Generate Additional Neighborhoods (Ongoing)
```bash
npm run generate:neighborhoods -- --lga="Surulere" --state="Lagos"
```
Uses Google API to discover more neighborhoods

### 5. Seed Sample Landmarks (Development)
```bash
npm run seed:landmarks:sample
```
Creates sample landmarks for testing

---

# Part 5: User Flow Documentation

## New User Onboarding Flow

### Scenario 1: Google Sign-In with GPS

1. **Welcome Screen**
   - User sees "Continue with Google" button
   - Taps Google button
   - OAuth flow redirects to Google
   - User selects Google account
   - Returns to app with auth token

2. **Profile Creation** (if new user)
   - App shows "Let's set up your profile"
   - Pre-filled: name, email, profile picture from Google
   - User can edit or continue

3. **Location Setup - GPS Flow**
   - Screen: "Help us find your neighborhood"
   - Two options: "Use My Location" | "Enter Manually"
   - User taps "Use My Location"
   - Permission request appears
   - User grants location permission

4. **Getting Recommendations**
   - Loading screen: "Finding neighborhoods near you..."
   - Backend processes:
     - Reverse geocode coordinates
     - Extract state, LGA, ward
     - Query neighborhoods within 2km radius
     - Rank by distance and popularity

5. **Neighborhood Selection**
   - Map view shows user location (blue dot)
   - Neighborhood boundaries overlaid (polygons)
   - List below map shows recommended neighborhoods
   - Each card shows:
     - Neighborhood name
     - Distance (e.g., "450m away")
     - Landmarks (e.g., "Near Abesan Market")
     - Member count (e.g., "234 members")
     - Gated indicator (if applicable)
   - User scrolls and taps "Abesan Estate Phase 1"

6. **Neighborhood Confirmation**
   - Modal shows selected neighborhood details
   - Map zooms to neighborhood boundary
   - Shows: State → LGA → Ward → Neighborhood hierarchy
   - Option to add city/town (text field)
   - User types "Ipaja"
   - Taps "Confirm Location"

7. **Estate Verification** (if gated estate)
   - Screen: "Abesan Estate requires verification"
   - Three options:
     1. "Upload proof of residence"
     2. "Contact estate admin"
     3. "Take photo at estate gate"
   - User selects "Upload proof of residence"
   - Opens camera/gallery
   - Uploads utility bill photo
   - Status: "Pending verification (usually 24-48 hours)"

8. **Complete Setup**
   - Success screen: "You're all set!"
   - Shows neighborhood name and verification status
   - Taps "Explore MeCabal"
   - Enters main app (Home feed)

### Scenario 2: Phone Auth with Manual Location

1. **Welcome Screen**
   - User taps "Continue with Phone Number"
   - Enters Nigerian phone number (+234...)
   - Receives OTP via SMS
   - Enters OTP code
   - Creates profile (name, username, photo)

2. **Location Setup - Manual Flow**
   - Screen: "Where do you live?"
   - User taps "Enter Manually"
   - Step indicator shows: 1 of 4

3. **Step 1: Select State**
   - Dropdown with search: "Select your state"
   - User types "Lag"
   - Sees "Lagos" at top
   - Taps "Lagos"
   - Breadcrumb shows: Lagos

4. **Step 2: Select LGA**
   - Dropdown: "Select your local government"
   - Shows all Lagos LGAs alphabetically
   - User scrolls to "Alimosho"
   - Taps "Alimosho" (with LCDA badge)
   - Breadcrumb: Lagos → Alimosho

5. **Step 3: Enter City/Town**
   - Text field: "Enter your city or town"
   - User types "Ipaja"
   - Auto-suggestions appear (if available)
   - User selects or continues typing
   - Breadcrumb: Lagos → Alimosho → Ipaja

6. **Step 4: Select Ward** (Optional)
   - If GPS available, shows nearest wards
   - Otherwise, shows list of wards in Alimosho
   - User can skip this step
   - User selects "Ipaja Ward 02"
   - Breadcrumb: Lagos → Alimosho → Ipaja → Ward 02

7. **Select Neighborhood**
   - List of neighborhoods in selected ward
   - User sees:
     - Abesan Estate Phase 1
     - Abesan Estate Phase 2
     - Abesan Extension
     - Command Area
   - User taps "Abesan Estate Phase 1"

8. **Confirmation & Verification**
   - (Same as GPS flow from step 6)

### Scenario 3: Existing User - Estate Search

1. **Welcome Screen**
   - Returning user taps "Log In"
   - Uses Google Sign-In
   - Authenticated immediately
   - Goes to Home feed

2. **Later: Changing Location**
   - User opens Profile → Settings
   - Taps "Manage Locations"
   - Sees current location
   - Taps "Add Secondary Location"

3. **Estate Search Flow**
   - Screen: "Find your estate"
   - Search bar at top
   - User types "Maple Wood"
   - Live results appear:
     - Maple Wood Estate, Agege (Lagos)
     - Maplewood Gardens, Ajao Estate (Lagos)
   - User selects first result

4. **Estate Details**
   - Shows estate information
   - Indicates "Gated Community - Verification Required"
   - Shows estate admin contact
   - User taps "Request to Join"

5. **Verification Request**
   - Form: "Tell the admin about yourself"
   - Fields:
     - House number/address in estate
     - Move-in date
     - Contact phone
     - Optional message
   - User fills and submits
   - Notification sent to estate admin

6. **Admin Approval**
   - Admin receives notification
   - Reviews request in MeCabal admin panel
   - Approves request
   - User receives notification: "Approved!"
   - User now has access to Maple Wood Estate community

---

## Edge Cases & Error Handling

### GPS Scenarios

**Permission Denied:**
- Show explanation: "We need location to recommend neighborhoods"
- Offer "Enter Manually" button
- Option to "Open Settings" to enable

**Location Unavailable:**
- Show loading for max 10 seconds
- If fails: "Unable to get location"
- Fallback to manual entry
- Option to retry

**Low Accuracy:**
- If accuracy > 500m, show warning
- "Location is not precise. Results may be inaccurate."
- Option to enter manually
- Allow proceeding anyway

### Network Scenarios

**Offline During Selection:**
- Cache states and major LGAs locally
- Show message: "Limited data available offline"
- Allow basic selection
- Sync when online

**API Timeout:**
- Show retry button
- "Taking longer than expected. Try again?"
- After 3 retries, offer manual entry

**Server Error:**
- Friendly error message
- "Something went wrong. Please try again."
- Option to contact support
- Log error for debugging

### Data Scenarios

**No Neighborhoods Found:**
- Show message: "No neighborhoods found for this area"
- Offer to add new neighborhood
- Form to submit area details
- Admin review process

**Multiple Neighborhoods at Same Location:**
- Show all options
- Explain differences (estate vs general area)
- Allow selecting multiple if applicable

**Boundary Overlap:**
- Backend handles priority (estates > areas > wards)
- Show primary neighborhood
- Option to join multiple if relevant

---

# Part 6: Technical Specifications

## Database Schema Details

### Indexes

```sql
-- States
CREATE INDEX idx_states_code ON states(code);
CREATE INDEX idx_states_name_fulltext ON states USING gin(to_tsvector('english', name));

-- LGAs
CREATE INDEX idx_lgas_state_id ON lgas(state_id);
CREATE INDEX idx_lgas_type ON lgas(type);
CREATE INDEX idx_lgas_name_fulltext ON lgas USING gin(to_tsvector('english', name));

-- Wards
CREATE INDEX idx_wards_lga_id ON wards(lga_id);
CREATE INDEX idx_wards_boundaries_gist ON wards USING gist(boundaries);

-- Neighborhoods
CREATE INDEX idx_neighborhoods_ward_id ON neighborhoods(ward_id);
CREATE INDEX idx_neighborhoods_parent_id ON neighborhoods(parent_neighborhood_id);
CREATE INDEX idx_neighborhoods_type ON neighborhoods(type);
CREATE INDEX idx_neighborhoods_is_gated ON neighborhoods(is_gated);
CREATE INDEX idx_neighborhoods_boundaries_gist ON neighborhoods USING gist(boundaries);
CREATE INDEX idx_neighborhoods_name_fulltext ON neighborhoods USING gin(to_tsvector('english', name));

-- Landmarks
CREATE INDEX idx_landmarks_neighborhood_id ON landmarks(neighborhood_id);
CREATE INDEX idx_landmarks_type ON landmarks(type);
CREATE INDEX idx_landmarks_location_gist ON landmarks USING gist(location);
CREATE INDEX idx_landmarks_verification_status ON landmarks(verification_status);

-- User Locations
CREATE INDEX idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX idx_user_locations_state_id ON user_locations(state_id);
CREATE INDEX idx_user_locations_lga_id ON user_locations(lga_id);
CREATE INDEX idx_user_locations_ward_id ON user_locations(ward_id);
CREATE INDEX idx_user_locations_neighborhood_id ON user_locations(neighborhood_id);
CREATE INDEX idx_user_locations_coordinates_gist ON user_locations USING gist(coordinates);
CREATE INDEX idx_user_locations_is_primary ON user_locations(is_primary);
```

### Constraints

```sql
-- Ensure at least one primary location per user
CREATE UNIQUE INDEX idx_user_primary_location ON user_locations(user_id) WHERE is_primary = true;

-- Prevent circular parent-child in neighborhoods
ALTER TABLE neighborhoods ADD CONSTRAINT chk_no_self_reference CHECK (id != parent_neighborhood_id);

-- Ensure coordinates are within Nigeria bounds (approximately)
ALTER TABLE user_locations ADD CONSTRAINT chk_nigeria_bounds CHECK (
  ST_Y(coordinates) BETWEEN 4.0 AND 14.0 AND
  ST_X(coordinates) BETWEEN 2.5 AND 15.0
);
```

## API Endpoint Specifications

### Location Hierarchy Endpoints

**GET /location/states**
```typescript
Response: {
  success: true,
  data: State[],
  count: number
}
```

**GET /location/states/:stateId/lgas**
```typescript
Query params: {
  type?: 'LGA' | 'LCDA'  // Filter by type
}

Response: {
  success: true,
  data: LGA[],
  count: number
}
```

**GET /location/lgas/:lgaId/wards**
```typescript
Response: {
  success: true,
  data: Ward[],
  count: number
}
```

**GET /location/wards/:wardId/neighborhoods**
```typescript
Query params: {
  type?: 'AREA' | 'ESTATE' | 'COMMUNITY',
  isGated?: boolean,
  includeSubNeighborhoods?: boolean
}

Response: {
  success: true,
  data: Neighborhood[],
  count: number
}
```

### Recommendation Endpoints

**POST /location/neighborhoods/recommend**
```typescript
Request body: {
  latitude: number,
  longitude: number,
  radius?: number,  // meters, default 2000
  limit?: number    // default 10
}

Response: {
  success: true,
  data: {
    detectedLocation: {
      state: State,
      lga: LGA,
      ward: Ward
    },
    recommendations: Array<{
      neighborhood: Neighborhood,
      distance: number,  // meters
      landmarks: Landmark[],
      memberCount: number
    }>
  }
}
```

**GET /location/neighborhoods/search**
```typescript
Query params: {
  q: string,           // search query
  stateId?: string,
  lgaId?: string,
  type?: string,
  isGated?: boolean,
  limit?: number,      // default 20
  offset?: number      // default 0
}

Response: {
  success: true,
  data: Neighborhood[],
  count: number,
  total: number
}
```

### Landmark Endpoints

**GET /location/landmarks/nearby/:neighborhoodId**
```typescript
Query params: {
  type?: string,  // Filter by landmark type
  limit?: number
}

Response: {
  success: true,
  data: Landmark[]
}
```

**POST /location/landmarks**
```typescript
Request body: {
  name: string,
  type: LandmarkType,
  neighborhoodId: string,
  latitude: number,
  longitude: number,
  description?: string
}

Response: {
  success: true,
  data: Landmark,
  message: "Landmark submitted for verification"
}
```

### Estate Management Endpoints

**POST /location/estates/:estateId/join**
```typescript
Request body: {
  address: string,
  moveInDate: Date,
  phone: string,
  message?: string
}

Response: {
  success: true,
  message: "Verification request sent to estate admin",
  data: {
    requestId: string,
    status: "PENDING"
  }
}
```

**POST /location/estates/:estateId/verify**
```typescript
// Admin only
Request body: {
  userId: string,
  approved: boolean,
  reason?: string
}

Response: {
  success: true,
  message: "User verification updated"
}
```

## Mobile App Screen Specifications

### Screen: HierarchicalLocationSelector

**Component Tree:**
```
HierarchicalLocationSelector
├── ProgressIndicator (steps 1-5)
├── Breadcrumb (shows selections)
├── StepContent (dynamic based on current step)
│   ├── Step 1: StateSelector
│   │   └── SearchableDropdown
│   ├── Step 2: LGASelector
│   │   └── SearchableDropdown
│   ├── Step 3: CityTownInput
│   │   └── AutocompleteTextInput
│   ├── Step 4: WardSelector
│   │   └── List with radio buttons
│   └── Step 5: NeighborhoodSelector
│       └── List of NeighborhoodCards
├── NavigationButtons
│   ├── BackButton
│   └── NextButton (or SkipButton)
└── ErrorAlert (when visible)
```

**State Management:**
```typescript
{
  currentStep: number,          // 1-5
  selectedState: State | null,
  selectedLGA: LGA | null,
  cityTown: string,
  selectedWard: Ward | null,
  selectedNeighborhood: Neighborhood | null,
  isLoading: boolean,
  error: string | null,
  canGoBack: boolean,
  canGoNext: boolean
}
```

**Animations:**
- Slide transition between steps (300ms)
- Fade in/out for content (200ms)
- Progress bar fill animation (400ms)
- Button press scale (150ms)

**Styling:**
```typescript
{
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#00A651',
  },
  breadcrumb: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#F5F5F5',
  },
  stepContent: {
    flex: 1,
    padding: 16,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  }
}
```

### Screen: GPSLocationPicker

**Component Tree:**
```
GPSLocationPicker
├── MapView
│   ├── UserLocationMarker (blue dot)
│   ├── NeighborhoodPolygons (overlays)
│   └── LandmarkMarkers
├── TopBar
│   ├── SearchBar (for manual search)
│   └── CenterButton (recenter on user)
├── BottomSheet (draggable)
│   ├── LocationInfo (detected state/LGA/ward)
│   ├── RecommendationsList
│   │   └── NeighborhoodCard[] (scrollable)
│   └── ActionButtons
│       ├── UseThisLocationButton
│       └── EnterManuallyButton
└── PermissionPrompt (when needed)
```

**Props:**
```typescript
interface GPSLocationPickerProps {
  onLocationSelected: (location: UserLocation) => void;
  onManualEntry: () => void;
  initialLocation?: {lat: number, lng: number};
}
```

**Behavior:**
- On mount: Request location permission
- If granted: Get current location and show on map
- Fetch recommendations based on location
- Allow dragging map to adjust location
- Auto-update recommendations when map settles (debounced)
- Tap neighborhood card to select and zoom to boundary

### Screen: NeighborhoodRecommendationScreen

**Layout:**
```
[ Map View (40% height)        ]
[ showing user location         ]
[ and neighborhood boundaries   ]
└────────────────────────────────┘
┌────────────────────────────────┐
│ Filter Bar                     │
│ [All] [Gated] [Open] [Nearby] │
├────────────────────────────────┤
│ Recommendations (60% height)   │
│                                │
│ ┌──────────────────────────┐  │
│ │ Neighborhood Card 1       │  │
│ │ 450m • 234 members        │  │
│ └──────────────────────────┘  │
│                                │
│ ┌──────────────────────────┐  │
│ │ Neighborhood Card 2       │  │
│ │ 620m • 156 members        │  │
│ └──────────────────────────┘  │
│                                │
│ [Search Different Area]        │
└────────────────────────────────┘
┌────────────────────────────────┐
│ [Continue] button (sticky)     │
└────────────────────────────────┘
```

**Interactions:**
- Tap neighborhood card → select (checkmark appears)
- Tap map polygon → select that neighborhood
- Tap filter → update list
- Pull to refresh → re-fetch recommendations
- Swipe card left → "Not interested" (hide)

---

## Summary of Deliverables

### Backend Deliverables:
1. ✅ Location entities (State, LGA, Ward, Neighborhood, Landmark, UserLocation)
2. ✅ Database migrations with PostGIS support
3. ✅ Location seeding script
4. ✅ Neighborhood generation script (Google Maps integration)
5. ✅ Location microservice with CRUD APIs
6. ✅ Neighborhood recommendation engine
7. ✅ Landmark management APIs
8. ✅ Estate verification system
9. ✅ Google OAuth strategy and endpoints
10. ✅ Updated User entity with Google auth support
11. ✅ API Gateway route updates
12. ✅ Swagger documentation

### Mobile App Deliverables:
1. ✅ Google Sign-In integration
2. ✅ Location data models and types
3. ✅ Location API service layer
4. ✅ Location Context for state management
5. ✅ HierarchicalLocationSelector component
6. ✅ GPSLocationPicker component
7. ✅ NeighborhoodCard component
8. ✅ EstateSearchInput component
9. ✅ NeighborhoodRecommendationScreen
10. ✅ EstateVerificationScreen
11. ✅ Updated onboarding flow
12. ✅ Location management screen
13. ✅ Offline support with caching
14. ✅ Permission handling utilities
15. ✅ Comprehensive testing suite

### Documentation Deliverables:
1. ✅ This implementation guide
2. ✅ API endpoint specifications
3. ✅ Database schema documentation
4. ✅ User flow documentation
5. ✅ Component specifications
6. ✅ Testing guidelines
7. ✅ Security considerations
8. ✅ Performance optimization guide

---

## Next Steps for Developers

1. **Review this document thoroughly**
2. **Set up development environment** (ensure PostGIS, Google Maps API keys)
3. **Start with Phase 1** (Backend Foundation)
4. **Follow sequential phases** (don't skip steps)
5. **Test incrementally** (don't wait until the end)
6. **Document as you go** (update API docs, add code comments)
7. **Communicate blockers** (especially with Google API quotas)
8. **Review with team** before moving to next phase

---

**Document Version:** 1.0
**Last Updated:** October 17, 2025
**Authors:** MeCabal Development Team

**End of Document**
