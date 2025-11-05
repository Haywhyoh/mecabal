# MeCabal Onboarding Flow Analysis

## Mobile App Onboarding Flow

### 1. Welcome Screen
- User chooses signup method: Email, Phone, Google, or Apple
- Navigation: `WelcomeScreen` → `EmailRegistrationScreen` or `PhoneVerificationScreen`

### 2. Email Registration Flow
**Screen:** `EmailRegistrationScreen`
- User enters: First Name, Last Name, Email
- Calls: `POST /auth/email/send-otp` with `purpose: 'registration'`
- Navigates to: `EmailVerificationScreen`

**Backend:** `EmailOtpService.sendEmailOTP()`
- Generates 6-digit OTP
- Stores in `OtpVerification` table
- Sends email (or returns OTP in dev mode)

### 3. Email Verification
**Screen:** `EmailVerificationScreen`
- User enters 6-digit OTP
- Calls: `POST /auth/complete-email-verification` or `POST /auth/verify-otp`
- On success: Creates/updates user account
- Navigates to: `PhoneVerificationScreen`

**Backend:** `AuthService.authenticateWithOTP()` → `handleOTPRegistration()`
- Verifies OTP code
- Creates user if doesn't exist OR updates existing user
- Sets `isVerified: false` (email verified but not fully registered)
- Returns user object with tokens
- **User State:** Email verified, Phone NOT verified, Location NOT set

### 4. Phone Verification
**Screen:** `PhoneVerificationScreen`
- User enters phone number (Nigerian format)
- Selects method: SMS or WhatsApp
- Calls: `POST /auth/phone/send-otp` with `purpose: 'registration'`
- Navigates to: `OTPVerificationScreen`

**Backend:** `PhoneOtpService.sendPhoneOTP()`
- Finds user by email (from previous step) or phone number
- Updates user with phone number if not set
- Detects Nigerian carrier
- Generates 4-digit OTP
- Sends via SMS/WhatsApp
- Stores in `OtpVerification` table

### 5. Phone OTP Verification
**Screen:** `OTPVerificationScreen`
- User enters 4-digit OTP
- Calls: `POST /auth/phone/verify-otp` with `purpose: 'registration'`
- On success: Marks phone as verified
- Navigates to: `LocationSetupScreenNew`

**Backend:** `PhoneOtpService.verifyPhoneOTP()` + `AuthController.verifyPhoneOTP()`
- Verifies OTP code
- Sets `phoneVerified: true`
- Sets `isVerified: true` (this may be premature - should wait for location)
- Returns user object with tokens
- **User State:** Email verified, Phone verified, Location NOT set

### 6. Location Setup
**Screen:** `LocationSetupScreenNew`
- User selects location via GPS or manual selection
- Saves: State, LGA, Ward, Neighborhood
- Calls: `POST /auth/location/setup` with `completeRegistration: true`
- Navigates to: `NeighborhoodRecommendationScreen` or Main App

**Backend:** `AuthService.completeRegistrationWithLocation()`
- Updates user location (via UserLocation service)
- Sets `addressVerified: true`
- Sets `isVerified: true` (final verification)
- Sets `memberSince` date
- Generates tokens
- **User State:** Fully verified and registered

## Current Implementation Issues

### Issue 1: Premature Verification
- Phone verification sets `isVerified: true` before location setup
- Should remain `isVerified: false` until location is set
- Location setup should be the final step

### Issue 2: User State Tracking
- Need better tracking of onboarding progress
- Should track: email_verified, phone_verified, location_set
- Current `isVerified` flag is too binary

### Issue 3: Partial Registration Handling
- `registerUserMobile` handles partial registrations well
- But `handleOTPRegistration` doesn't properly link email verification to phone verification
- Need to ensure user record is properly updated across steps

### Issue 4: Error Handling
- Missing error messages for edge cases
- Need better validation of phone numbers during registration
- Should prevent duplicate phone numbers across different users

## Recommended Improvements

1. **Add Onboarding Step Tracking**
   - Track: `onboardingStep: 'email_verification' | 'phone_verification' | 'location_setup' | 'completed'`
   - Update at each step completion

2. **Fix Verification States**
   - Email verification: `isVerified: false` (correct)
   - Phone verification: `phoneVerified: true`, `isVerified: false` (wait for location)
   - Location setup: `isVerified: true`, `addressVerified: true` (final step)

3. **Improve User Linking**
   - Ensure phone verification finds user by email if phone not set
   - Handle case where user exists from email verification

4. **Better Error Messages**
   - "Please complete email verification first"
   - "Phone number already registered to another account"
   - "Location setup required to complete registration"

## Web Implementation Requirements

The web version should replicate this exact flow:

1. **Welcome/Login Screen** - Choose signup method
2. **Email Registration** - Enter name and email
3. **Email Verification** - Enter 6-digit OTP
4. **Phone Verification** - Enter phone number
5. **Phone OTP Verification** - Enter 4-digit OTP
6. **Location Setup** - Select location (GPS or manual)
7. **Complete** - Redirect to main app

Each step should:
- Call the corresponding backend endpoint
- Handle errors gracefully
- Show appropriate loading states
- Navigate to next step on success
- Store user state/tokens for authentication

