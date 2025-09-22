# MeCabal User Implementation Tasks
*Replace Hardcoded/Mock Data with Real User Implementation*

## 📋 Overview
This document outlines all areas where hardcoded, mock, or placeholder data needs to be replaced with real user implementation for production deployment.

## 🎯 Critical Authentication & Security Tasks



### Task 2: Remove Default Phone Number Fallbacks
**File:** `Hommie_Mobile/src/screens/onBoarding/OTPVerificationScreen.tsx`
**Location:** Line 19
**Issue:** Default fallback phone number `'08012345678'`
**Actions:**
- [ ] Remove default phone number fallback
- [ ] Add proper error handling when phone number is missing
- [ ] Implement phone number validation before OTP screen
- [ ] Add navigation guards to prevent accessing OTP screen without valid phone number

### Task 3: Implement Real User Profile Data
**File:** `Hommie_Mobile/src/constants/demoData.ts`
**Location:** Lines 67-73, 123-148
**Issue:** Demo phone numbers and user profiles for testing
**Actions:**
- [ ] Remove `DEMO_PHONE_NUMBERS` array
- [ ] Remove `DEMO_USER_PROFILES` with fake users (Adebayo, Fatima, Chukwudi)
- [ ] Replace with real user profile API endpoints
- [ ] Implement user profile creation flow
- [ ] Add user avatar upload functionality
- [ ] Implement real user verification system

## 🏘️ Location & Neighborhood Implementation

### Task 4: Replace Mock Location Services
**File:** `Hommie_Mobile/src/services/location.ts`
**Location:** Multiple functions using mock data
**Issue:** Mock neighborhood verification and location matching
**Actions:**
- [ ] Replace `mockNeighborhoods` arrays with real database queries
- [ ] Implement real Google Maps/MapBox integration for location verification
- [ ] Add real neighborhood boundary verification using GIS data
- [ ] Implement proper landmark-based verification system
- [ ] Add Nigerian postal code integration
- [ ] Connect to real estate/compound databases

### Task 5: Remove Demo Location Data
**File:** `Hommie_Mobile/src/constants/demoData.ts`
**Location:** Lines 3-49, 75-121
**Issue:** Hardcoded cities, neighborhoods, and invitation codes
**Actions:**
- [ ] Remove `DEMO_LOCATIONS` with hardcoded Nigerian cities
- [ ] Remove `DEMO_NEIGHBORHOODS` with fake neighborhood data
- [ ] Remove `DEMO_INVITATION_CODES` array
- [ ] Remove `DEMO_ZIP_CODES` array
- [ ] Implement dynamic location fetching from real databases
- [ ] Add real invitation code generation system

## 🎭 UI/UX Mock Data Replacement

### Task 6: Replace Placeholder Event Data
**File:** `Hommie_Mobile/src/data/eventsData.ts`
**Location:** Throughout file
**Issue:** Placeholder.com images and fake event data
**Actions:**
- [ ] Remove all `via.placeholder.com` image URLs
- [ ] Implement real image upload/storage system (AWS S3, Cloudinary)
- [ ] Replace fake event organizers with real user data
- [ ] Implement real event creation and management system
- [ ] Add real attendee tracking
- [ ] Connect to real user profiles for event organizers

### Task 7: Remove Demo Community Content
**File:** `Hommie_Mobile/src/constants/demoData.ts`
**Location:** Lines 150-211
**Issue:** Fake community events and safety alerts
**Actions:**
- [ ] Remove `DEMO_COMMUNITY_EVENTS` array
- [ ] Remove `DEMO_SAFETY_ALERTS` array
- [ ] Implement real event creation and management APIs
- [ ] Add real safety alert reporting system
- [ ] Implement real-time notification system
- [ ] Add moderation system for community content

### Task 8: Replace Mock Connection Service
**File:** `Hommie_Mobile/src/services/connectionService.ts`
**Location:** Lines with mock data generation
**Issue:** Mock mutual connections and neighbor profiles
**Actions:**
- [ ] Remove `generateMockMutualConnections` function
- [ ] Remove `mockProfiles` array with fake neighbor data
- [ ] Implement real neighbor discovery based on verified location
- [ ] Add real mutual connection calculation
- [ ] Implement privacy-respecting neighbor matching
- [ ] Add real user relationship management

## 🧪 Test & Development Infrastructure

### Task 9: Remove Mock Services
**File:** `Hommie_Mobile/src/services/mockOTP.ts`
**Location:** Entire file
**Issue:** Mock OTP service for development
**Actions:**
- [ ] Remove `MockOTPService` class entirely
- [ ] Remove export from `src/services/index.ts`
- [ ] Update environment configuration to disable mock services
- [ ] Ensure no references to mock services in production code

### Task 10: Update Environment Configuration
**File:** `Hommie_Mobile/src/config/environment.ts`
**Location:** Line with `USE_MOCK_SERVICES`
**Issue:** Mock services toggle in environment
**Actions:**
- [ ] Remove `USE_MOCK_SERVICES` environment variable
- [ ] Ensure all environment variables point to production services
- [ ] Add proper environment validation
- [ ] Implement environment-specific configurations
- [ ] Add API endpoint validation

## 🔒 Security & Testing Cleanup

### Task 11: Remove Test Endpoints
**File:** `backend/apps/auth-service/src/auth/auth.controller.ts`
**Location:** Lines with test methods
**Issue:** Admin and email test endpoints in production code
**Actions:**
- [ ] Remove `adminTest` endpoint
- [ ] Remove `testEmail` endpoint
- [ ] Remove any other test-only endpoints
- [ ] Ensure no test credentials in production code
- [ ] Add proper admin authentication for any admin endpoints
- [ ] Implement proper API documentation

### Task 12: Clean Test Files and Mock Data
**File:** `backend/apps/auth-service/src/services/email-otp.service.spec.ts`
**Location:** Throughout test file
**Issue:** Test data that might be referenced in production
**Actions:**
- [ ] Ensure test files don't affect production build
- [ ] Remove any hardcoded test emails (`test@example.com`)
- [ ] Remove mock user data (John Doe, etc.)
- [ ] Verify test isolation from production data
- [ ] Add proper test data factories

## 🚀 Production Readiness Tasks

### Task 13: Implement Real Image Assets
**File:** `Hommie_Mobile/src/constants/onboardingData.ts`
**Location:** Line with placeholder icon
**Issue:** Using app icon as placeholder for onboarding images
**Actions:**
- [ ] Design and implement real onboarding images
- [ ] Create proper welcome screen graphics
- [ ] Add localized images for different Nigerian regions
- [ ] Implement proper image optimization
- [ ] Add accessibility descriptions for images

### Task 14: Add Real Sample User Data
**File:** `Hommie_Mobile/src/constants/onboardingData.ts`
**Location:** `SAMPLE_USER` object
**Issue:** Generic sample user for onboarding
**Actions:**
- [ ] Replace with culturally appropriate Nigerian example user
- [ ] Add multiple diverse example users for different regions
- [ ] Implement proper privacy-compliant example data
- [ ] Add real testimonials from beta users
- [ ] Implement dynamic example content based on user location

## 📊 Priority Matrix

### 🚨 Critical (Must Complete Before Production)
1. **Task 1:** Remove Hardcoded OTP (Security Risk)
2. **Task 2:** Remove Default Phone Numbers (Security Risk)
3. **Task 9:** Remove Mock Services (Functionality Break)
4. **Task 11:** Remove Test Endpoints (Security Risk)

### ⚠️ High Priority (Complete Before Beta Launch)
5. **Task 3:** Real User Profiles
6. **Task 4:** Real Location Services
7. **Task 6:** Real Event Data
8. **Task 8:** Real Connection Service

### 📋 Medium Priority (Complete Before Public Launch)
9. **Task 5:** Remove Demo Location Data
10. **Task 7:** Real Community Content
11. **Task 10:** Environment Configuration
12. **Task 13:** Real Image Assets

### 🔄 Low Priority (Ongoing Improvement)
13. **Task 12:** Test File Cleanup
14. **Task 14:** Sample User Data Enhancement

## 🛠️ Implementation Guidelines

### For Each Task:
1. **Create Feature Branch:** `git checkout -b feature/remove-[task-name]`
2. **Backup Existing Code:** Comment out existing code before deletion
3. **Implement Real Solution:** Add production-ready implementation
4. **Add Tests:** Ensure new implementation has proper test coverage
5. **Update Documentation:** Update any relevant documentation
6. **Security Review:** Ensure no security vulnerabilities introduced
7. **Performance Test:** Verify performance impact
8. **Create Pull Request:** Submit for code review

### Quality Checklist for Each Task:
- [ ] No hardcoded values remain
- [ ] Proper error handling implemented
- [ ] Security best practices followed
- [ ] Performance optimized
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Accessibility considered
- [ ] Nigerian cultural context maintained

## 🔍 Verification Commands

### Search for Remaining Issues:
```bash
# Find hardcoded test data
grep -r "test@example.com\|john\|doe\|08012345\|2398\|placeholder" --include="*.ts" --include="*.tsx"

# Find mock/demo references
grep -r "mock\|demo\|placeholder\|hardcoded\|TODO\|FIXME" --include="*.ts" --include="*.tsx"

# Find via.placeholder.com URLs
grep -r "via.placeholder.com" --include="*.ts" --include="*.tsx"
```

### Final Production Check:
- [ ] No console.log statements in production code
- [ ] No test endpoints accessible
- [ ] All environment variables properly configured
- [ ] All mock services disabled
- [ ] Real SMS/email services configured
- [ ] Database properly seeded with real data
- [ ] Image storage properly configured
- [ ] Real location services integrated

---

**Next Steps:** Start with Critical priority tasks (1, 2, 9, 11) to ensure basic security and functionality, then proceed systematically through High and Medium priority tasks.