# MeCabal Onboarding Flow Summary
## Updated Design with Name Collection Screen

**Version:** 1.1 | **Date:** October 11, 2025

---

## What Changed? 🔄

### Critical Update
Added **NameCollectionScreen** to fix a critical gap where phone signup wasn't collecting user names.

### Why This Matters
- **Before:** Email signup collected names, but phone signup didn't ❌
- **After:** ALL signup methods now collect first and last names ✅
- **Impact:** Consistent data collection, personalization, and trust building

---

## Complete Signup Flows

### 🔵 Flow 1: Phone Signup (70% of users)
**6 screens, ~2 minutes**

```
1. WelcomeHero
   └→ Tap "Join A Community"

2. SignUpMethod
   └→ Tap "📱 Continue with Phone"

3. PhoneVerification
   └→ Enter +234 8012345678
   └→ Select SMS or WhatsApp

4. OTPVerification
   └→ Enter 4-digit code
   └→ Auto-verifies on completion

5. NameCollection ⭐ NEW
   └→ Enter "Chigozie"
   └→ Enter "Okafor"
   └→ Optional skip (with warning)

6. LocationSetup
   └→ Choose Auto-detect/Map/Landmark
   └→ Grant GPS permission

✅ COMPLETE → Dashboard
```

### 📧 Flow 2: Email Signup (20% of users)
**7 screens, ~2.5 minutes**

```
1. WelcomeHero
   └→ Tap "Join A Community"

2. SignUpMethod
   └→ Tap "✉ Continue with Email"

3. EmailRegistration
   └→ Enter "Chigozie" (first)
   └→ Enter "Okafor" (last)
   └→ Enter "chigozie@email.com"

4. EmailOTP
   └→ Verify 6-digit email code

5. PhoneVerification
   └→ Enter phone (still required)

6. PhoneOTP
   └→ Verify 4-digit phone code

7. LocationSetup
   └→ Choose location method

✅ COMPLETE → Dashboard

Note: SKIPS NameCollection (already has names)
```

### 🍎 Flow 3: OAuth Signup - Apple/Google (10% of users)
**6 screens, ~1.5 minutes**

```
1. WelcomeHero
   └→ Tap "Join A Community"

2. SignUpMethod
   └→ Tap "Continue with Apple" or "Google"

3. OAuth Flow
   └→ Sign in with Apple/Google
   └→ Auto-gets name + email

4. PhoneVerification
   └→ Enter phone (required for trust)

5. PhoneOTP
   └→ Verify 4-digit code

6. LocationSetup
   └→ Choose location method

✅ COMPLETE → Dashboard

Note: SKIPS NameCollection (OAuth provides name)
```

---

## New Screen Details: NameCollectionScreen

### Purpose
Collect first and last names from users who sign up via phone (or other methods that don't provide names).

### Visual Design
```
┌─────────────────────────────┐
│  ← Back                     │
│                             │
│  What's your name?          │  34pt bold
│                             │
│  This helps your neighbors  │  17pt regular
│  recognize you              │
│                             │
│  First Name                 │  15pt semibold
│  ┌─────────────────────────┐│
│  │ Chigozie                ││  44pt input
│  └─────────────────────────┘│
│                             │
│  Last Name                  │
│  ┌─────────────────────────┐│
│  │ Okafor                  ││
│  └─────────────────────────┘│
│                             │
│  🔒 Your name is only       │  Trust message
│  visible to verified        │
│  neighbors in your estate   │
│                             │
│                             │
│  ┌───────────────────────┐ │
│  │    Continue           │ │  Bottom CTA
│  └───────────────────────┘ │
│                             │
│     Skip for now            │  Optional
└─────────────────────────────┘
```

### Key Features
- **Validation:** 2+ characters, no numbers, allows hyphens/apostrophes
- **Nigerian Names:** Supports complex names (O'Brien, Mary-Jane, Oluwaseun)
- **Trust Building:** Shows privacy message with lock icon
- **Optional Skip:** Can skip but shows warning
- **Auto-capitalize:** First letter of each name
- **iOS Design:** Follows Apple HIG (44pt inputs, 10pt radius, proper spacing)

### When It Shows
- ✅ After OTP for phone signup
- ✅ After OTP for social signup (if name not from OAuth)
- ❌ Skips for email signup (already has names)

---

## Data Collection Comparison

### All Required Information Collected ✅

| Information | Phone | Email | OAuth |
|------------|-------|-------|-------|
| First Name | ✅ NameCollection | ✅ EmailReg | ✅ OAuth |
| Last Name | ✅ NameCollection | ✅ EmailReg | ✅ OAuth |
| Email | ❌ | ✅ EmailReg | ✅ OAuth |
| Phone | ✅ PhoneVerif | ✅ PhoneVerif | ✅ PhoneVerif |
| Location | ✅ LocationSetup | ✅ LocationSetup | ✅ LocationSetup |

### Backend Requirements Met
- ✅ firstName (all methods)
- ✅ lastName (all methods)
- ✅ phoneNumber (all methods, verified)
- ✅ location (all methods)
- ✅ email (email/OAuth only)

---

## Screen Count Comparison

### Old Flow Issues
- Email path: 6+ screens (too many)
- Phone path: Missing name collection ❌
- Inconsistent data gathering

### New Flow (Optimized)
- **Phone:** 6 screens (added name collection)
- **Email:** 7 screens (already had name collection)
- **OAuth:** 6 screens (gets name from provider)
- **Login:** 3 screens (returning users)

---

## Implementation Checklist

### New Components Needed
- [ ] Create `NameCollectionScreen.tsx`
- [ ] Add to navigation stack
- [ ] Implement conditional routing logic
- [ ] Add name validation regex
- [ ] Create trust indicator component
- [ ] Add skip functionality with warning

### Routing Logic
```javascript
// After OTPVerification
if (signupMethod === 'email') {
  // Skip name collection (already have names)
  navigate('LocationSetup', { firstName, lastName, ... });
} else if (signupMethod === 'oauth' && hasNameFromOAuth) {
  // Skip if OAuth provided name
  navigate('LocationSetup', { firstName, lastName, ... });
} else {
  // Show name collection for phone/other methods
  navigate('NameCollection', { phoneNumber, ... });
}
```

### Design System Updates
- [ ] Add name input component to design system
- [ ] Add trust indicator pattern
- [ ] Document Nigerian name patterns
- [ ] Add skip link styling

---

## Developer Tasks

### Priority 1: Core Functionality
1. Create NameCollectionScreen component
2. Add to onboarding navigation
3. Implement validation (2+ chars, no numbers)
4. Add conditional routing (skip for email/OAuth)
5. Pass names to LocationSetup and backend

### Priority 2: UX Polish
6. Add auto-capitalization
7. Implement trust indicator with lock icon
8. Add skip functionality with warning modal
9. Implement keyboard handling
10. Add haptic feedback

### Priority 3: Edge Cases
11. Handle hyphenated names (Mary-Jane)
12. Handle apostrophe names (O'Brien)
13. Handle long names (truncation)
14. Handle special Nigerian names (Oluwaseun, Chiamaka)
15. Test with screen readers

---

## Testing Requirements

### Functional Tests
- [ ] Phone signup collects names correctly
- [ ] Email signup skips name collection
- [ ] OAuth signup skips if name provided
- [ ] Validation rejects invalid names
- [ ] Skip shows warning and allows proceed
- [ ] Names passed to backend correctly

### Edge Case Tests
- [ ] Names with hyphens (Ade-Ola)
- [ ] Names with apostrophes (O'Connor)
- [ ] Very long names (truncation)
- [ ] Single character names (rejected)
- [ ] Names with numbers (rejected)
- [ ] Names with emojis (rejected)

### UI/UX Tests
- [ ] Inputs match iOS HIG (44pt height)
- [ ] Trust indicator displays correctly
- [ ] Skip link appears and functions
- [ ] Keyboard dismisses properly
- [ ] Works on all device sizes

---

## Key Benefits

### User Experience
✅ **Consistency:** All signup methods collect same data
✅ **Personalization:** Can greet users by name
✅ **Trust:** Explains why names needed
✅ **Flexibility:** Can skip if uncomfortable

### Technical
✅ **Complete Data:** All required fields collected
✅ **Clean Flow:** Logical progression
✅ **Maintainable:** Single screen for name collection
✅ **Scalable:** Easy to add more fields if needed

### Business
✅ **Higher Completion:** Clear, simple name entry
✅ **Better Data:** Consistent user profiles
✅ **Community Trust:** Real names build connections
✅ **Compliance:** Privacy message for transparency

---

## Quick Reference

### Screen Order (Phone Signup)
1. WelcomeHero
2. SignUpMethod
3. PhoneVerification
4. OTPVerification
5. **NameCollection** ← NEW
6. LocationSetup

### File Structure
```
src/screens/onBoarding/
├── WelcomeHeroScreen.tsx
├── WelcomeScreen.tsx
├── PhoneVerificationScreen.tsx
├── OTPVerificationScreen.tsx
├── NameCollectionScreen.tsx ← NEW
└── LocationSetupScreen.tsx
```

### Navigation Params
```typescript
// Navigate to NameCollection
navigation.navigate('NameCollection', {
  phoneNumber: string,
  language: string,
  isSignup: boolean,
  userId?: string,
});

// Navigate from NameCollection to LocationSetup
navigation.navigate('LocationSetup', {
  firstName: string,
  lastName: string,
  phoneNumber: string,
  userId: string,
  ...rest
});
```

---

## Summary

### What's New
- Added NameCollectionScreen between OTP and Location
- Collects first and last name for phone/social signups
- Skips for email signup (already has names)
- Includes optional skip with privacy warning

### What's Fixed
- ❌ **Before:** Phone signup missing names
- ✅ **After:** All signups collect complete data

### Impact
- All signup methods now collect: First, Last, Phone, Location
- Consistent user experience across all paths
- Ready for personalization and community features
- Maintains Apple HIG design standards

---

**Full Documentation:** [ONBOARDING_REDESIGN_DOCUMENTATION.md](./ONBOARDING_REDESIGN_DOCUMENTATION.md)

**Version:** 1.1 | **Last Updated:** October 11, 2025
