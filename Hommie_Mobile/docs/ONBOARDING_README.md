# MeCabal Mobile App - New Onboarding Flow

## Overview
This document describes the new streamlined onboarding flow for the MeCabal mobile app, designed specifically for Nigerian users. The flow now separates new users from existing users and shows welcome content before language selection.

## Flow Structure

### **New User Flow**

#### Step 1: Welcome + Features Preview
- **Screen**: `WelcomeLanguageScreen` (Welcome View)
- **Purpose**: Welcome new users and showcase app features
- **Features**:
  - App logo and branding
  - One-line value proposition: "Local updates, security alerts, and neighbors—right where you live."
  - Feature previews (Connect with Neighbors, Stay Informed, Help Each Other)
  - Primary CTA: "Get Started"
  - Secondary option: "I already have an account"

#### Step 2: Language Selection
- **Screen**: `WelcomeLanguageScreen` (Language View)
- **Purpose**: Allow new users to choose their preferred language
- **Features**:
  - Language selection: English, Hausa, Yoruba, Igbo
  - Back button to return to welcome content
  - Continue button to proceed with selected language

#### Step 3: Phone Number → OTP Verification
- **Screen**: `PhoneVerificationScreen`
- **Purpose**: Verify user's phone number for account creation
- **Features**:
  - Nigerian phone number input (+234 country code)
  - Automatic carrier detection (MTN, Airtel, Glo, 9mobile)
  - OTP via SMS
  - Skip option for users who don't want phone verification
  - Info box about message rates

- **Screen**: `OTPVerificationScreen`
- **Purpose**: Verify the 6-digit OTP code
- **Features**:
  - 6-digit OTP input with auto-focus
  - 30-second countdown timer
  - Resend code option
  - Fallback options:
    - Call-me verification
    - USSD code verification (*123*1#)
  - Success navigation to location setup

#### Step 4: Location Setup (Multi-path)
- **Screen**: `LocationSetupScreen`
- **Purpose**: Allow users to set their location through multiple methods
- **Features**:
  - **Option A**: "Use GPS" (Recommended)
    - Automatic location detection
    - Permission request handling
  - **Option B**: "Pick on Map"
    - Map-based location selection
    - Drag and drop pin functionality
  - **Option C**: "Choose Landmark"
    - Search nearby landmarks (schools, churches, markets, major roads)
    - Distance indicators
    - Manual address input option
    - Estate/compound database integration

### **Existing User Flow**

#### Step 1: Welcome Screen
- **Screen**: `WelcomeScreen`
- **Purpose**: Welcome existing users back to the app
- **Features**:
  - Background image with overlay
  - App branding and tagline
  - Social login options (Google, Apple, Facebook, Email)
  - Language selector (EN (NG))
  - Invitation code option

## Navigation Flow

### New Users
```
WelcomeLanguage (Welcome View) → WelcomeLanguage (Language View) → PhoneVerification → OTPVerification → LocationSetup → Home
```

### Existing Users
```
WelcomeLanguage (Welcome View) → "I already have an account" → Welcome → Social Login/Email → Home
```

## Key Features

### Nigerian Context
- **Language Support**: English, Hausa, Yoruba, Igbo
- **Carrier Detection**: Automatic detection of MTN, Airtel, Glo, 9mobile
- **USSD Fallback**: Carrier-specific USSD codes for verification
- **Local Landmarks**: Nigerian-specific landmarks and locations
- **Currency**: Naira (₦) support
- **Phone Format**: +234 country code support

### User Experience
- **Progressive Disclosure**: Information revealed as needed
- **Skip Options**: Users can skip certain steps
- **Fallback Methods**: Multiple verification options
- **Clear CTAs**: Unambiguous next steps
- **Loading States**: Visual feedback during operations
- **User Separation**: Clear distinction between new and existing users

### Technical Implementation
- **React Native**: Cross-platform mobile development
- **Navigation**: React Navigation with stack navigation
- **State Management**: Local state with React hooks
- **Styling**: Nigerian style guide compliance
- **Accessibility**: Screen reader support and touch targets

## Style Guide Compliance

### Colors
- **Primary Green**: #00A651 (Nigeria's green)
- **Deep Green**: #007A3D (Pressed states)
- **Light Green**: #E8F5E8 (Backgrounds)
- **Mint Green**: #B8E6B8 (Success states)

### Typography
- **System Fonts**: iOS and Android native fonts
- **Hierarchy**: Clear heading and body text distinction
- **Sizes**: 12px to 36px scale following 8px grid

### Spacing
- **8px Grid System**: Consistent spacing throughout
- **Screen Padding**: 16px horizontal, 24px top
- **Component Spacing**: 16px between related elements

## Future Enhancements

### Phase 2
- **Map Integration**: Google Maps or Mapbox integration
- **Address Autocomplete**: Smart address suggestions
- **Estate Database**: Comprehensive Nigerian estate/compound database
- **Multi-language Content**: Localized content for all supported languages

### Phase 3
- **Biometric Authentication**: Fingerprint/Face ID support
- **Social Login**: Google, Facebook, Apple integration
- **Advanced Location**: Indoor mapping and precise location
- **Offline Support**: Offline-first approach for poor connectivity

## Testing Considerations

### User Testing
- **Nigerian Users**: Test with actual Nigerian users
- **Language Testing**: Verify all language options work correctly
- **Carrier Testing**: Test with different Nigerian carriers
- **Location Testing**: Test GPS and landmark selection
- **User Flow Testing**: Test both new and existing user paths

### Technical Testing
- **Cross-platform**: iOS and Android compatibility
- **Network Conditions**: Poor connectivity scenarios
- **Device Compatibility**: Various screen sizes and OS versions
- **Performance**: Loading times and smooth animations

## Implementation Notes

### Current Status
- ✅ Welcome content with features preview
- ✅ Language selection screen
- ✅ Phone verification with carrier detection
- ✅ OTP verification with fallbacks
- ✅ Location setup with multiple options
- ✅ Navigation flow integration
- ✅ Nigerian style guide compliance
- ✅ Separation of new vs existing users

### Next Steps
- 🔄 Map picker functionality
- 🔄 GPS location implementation
- 🔄 Landmark search API integration
- 🔄 Estate database integration
- 🔄 Multi-language content
- 🔄 Testing and refinement

## File Structure
```
src/screens/
├── WelcomeLanguageScreen.tsx      # New users: Welcome + Language
├── WelcomeScreen.tsx              # Existing users: Social login
├── PhoneVerificationScreen.tsx    # Phone input
├── OTPVerificationScreen.tsx      # OTP verification
├── LocationSetupScreen.tsx        # Location setup
└── [legacy screens...]           # Backward compatibility

src/constants/
├── index.ts                       # Main constants
├── onboardingData.ts             # Onboarding-specific data
└── demoData.ts                   # Demo data for testing

App.tsx                           # Main navigation configuration
```

## Support and Maintenance

### Documentation
- Keep this README updated with any flow changes
- Document new features and modifications
- Maintain style guide compliance notes

### Code Quality
- Follow React Native best practices
- Maintain consistent styling and structure
- Regular code reviews and testing
- Performance monitoring and optimization

---

*Last updated: [Current Date]*
*Version: 1.1.0*
*Maintainer: Development Team*
