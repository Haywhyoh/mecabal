# MeCabal Onboarding Redesign Documentation
## Apple Human Interface Guidelines (HIG) Implementation

**Version:** 1.0
**Date:** October 10, 2025
**Status:** Planning & Design Phase

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Design Principles](#design-principles)
4. [Redesign Goals](#redesign-goals)
5. [Screen-by-Screen Breakdown](#screen-by-screen-breakdown)
6. [Implementation Tasks](#implementation-tasks)
7. [Technical Specifications](#technical-specifications)
8. [Testing & Quality Assurance](#testing--quality-assurance)

---

## Executive Summary

This document outlines the complete redesign of MeCabal's onboarding flow to align with Apple's Human Interface Guidelines (HIG). The redesign focuses on creating a seamless, intuitive, and delightful first-time user experience that reduces friction while building trust in the Nigerian community context.

**Key Objectives:**
- Reduce onboarding time by 30-40%
- Increase completion rate from current to 85%+
- Implement Apple HIG design patterns
- Maintain Nigerian cultural context
- Create progressive, non-overwhelming experience

---

## Current State Analysis

### Current Onboarding Flow
1. **WelcomeHeroScreen** → Initial landing with brand introduction
2. **WelcomeScreen** → Sign up/Sign in options with social login
3. **PhoneVerificationScreen** → Nigerian phone number verification
4. **OTPVerificationScreen** → 4-digit OTP entry
5. **LocationSetupScreen** → Location selection (GPS/Map/Landmark)

### Current Strengths
✅ Clear Nigerian context (phone carriers, landmarks)
✅ Multiple verification methods (SMS/WhatsApp)
✅ Progressive disclosure of information
✅ Good use of brand colors

### Current Issues
❌ Too many screens (5 screens is excessive)
❌ Inconsistent visual hierarchy
❌ Heavy overlay on hero screen reduces clarity
❌ Mixed design patterns (some Apple-like, some Android-like)
❌ Insufficient animation and transitions
❌ No clear progress indication
❌ Buttons lack proper affordance states
❌ Spacing inconsistencies
❌ Too much text in some screens

---

## Design Principles

### Apple HIG Core Principles

#### 1. Clarity
- **Text should be legible at every size**
- Icons should be precise and lucid
- Adornments are subtle and appropriate
- Focus on functionality drives the design

#### 2. Deference
- **Content is paramount**
- UI should not compete with content
- Translucency and blur provide context
- Minimal use of bezels, gradients, and drop shadows

#### 3. Depth
- **Visual layers convey hierarchy**
- Touch and discoverability enhance delight
- Transitions provide context and maintain spatial awareness
- Realistic motion communicates

### Nigerian Context Integration
- Use familiar local references (estates, landmarks, carriers)
- Support multiple languages naturally
- Respect data consciousness (optimize images, minimize requests)
- Build trust progressively (explain why data is needed)

---

## Redesign Goals

### User Experience Goals
1. **Fast & Effortless:** Complete onboarding in under 2 minutes
2. **Clear Purpose:** Users understand why each step matters
3. **Delightful:** Smooth animations, haptic feedback, visual polish
4. **Safe:** Users feel secure sharing their information
5. **Inclusive:** Works for all technical skill levels

### Visual Design Goals
1. **Modern iOS Aesthetic:** Large titles, card-based design, SF Symbols
2. **Consistent Spacing:** 8px grid system throughout
3. **Readable Typography:** San Francisco font principles (system font)
4. **Accessible Colors:** WCAG AA contrast ratios minimum
5. **Smooth Animations:** Spring-based physics, meaningful motion

### Technical Goals
1. **60 FPS Performance:** No jank during transitions
2. **Keyboard Handling:** Proper keyboard avoidance
3. **Error Recovery:** Clear, helpful error messages
4. **Offline Support:** Cache what's possible
5. **Analytics Ready:** Track drop-off points

---

## Screen-by-Screen Breakdown

### Screen 1: Welcome Hero (Redesigned)
**File:** `WelcomeHeroScreen.tsx`

#### Current Issues
- Dark overlay at 60% makes text hard to read
- Logo too large (300x300)
- Text shadows feel heavy
- Stats section removed but code remains
- Button contrast issues on dark background

#### Redesign Approach

**Layout:**
```
┌─────────────────────────────┐
│                             │
│      [Animated Logo]        │  ← 120x120, subtle scale animation
│                             │
│     Welcome to your         │  ← SF Pro Display, 48pt, Regular
│      neighborhood           │     No text shadow, use lighter overlay
│                             │
│  Connect with neighbors,    │  ← SF Pro Text, 17pt, Regular
│  stay safe, and build       │     Gray-50 on dark background
│  stronger communities       │
│                             │
│                             │
│  ┌───────────────────────┐ │
│  │ Join A Community      │ │  ← Primary CTA, 50pt height
│  └───────────────────────┘ │     Rounded corners 12pt
│                             │
│  ┌───────────────────────┐ │
│  │ I already have an     │ │  ← Secondary, outlined
│  │     account           │ │
│  └───────────────────────┘ │
│                             │
│  Free • Nigerian-owned •   │  ← Small footer text
│    Community-first          │
└─────────────────────────────┘
```

**Design Specifications:**
- **Overlay:** Reduce to 40% opacity with subtle gradient (dark at bottom)
- **Logo:** Scale down to 120x120 with breathing animation (0.95 → 1.0 scale, 2s)
- **Title Font:** 48pt (down from current), weight 400 (Regular), letter-spacing -0.5
- **Subtitle Font:** 17pt, weight 400, line-height 24pt
- **Remove:** All text shadows, use proper overlay instead
- **Buttons:** 50pt height, 12pt border radius, proper hit targets
- **Animation:** Fade in sequence (logo → title → subtitle → buttons), 0.3s each with 0.1s stagger

**Implementation Tasks:**
- [ ] Task 1.1: Reduce overlay opacity from 0.6 to 0.4
- [ ] Task 1.2: Add gradient overlay (transparent → rgba(0,0,0,0.5))
- [ ] Task 1.3: Scale logo from 300x300 to 120x120
- [ ] Task 1.4: Implement logo breathing animation using Animated API
- [ ] Task 1.5: Update title fontSize from 48 to 48pt with fontWeight '400'
- [ ] Task 1.6: Remove all textShadow properties
- [ ] Task 1.7: Update subtitle fontSize to 17 with lineHeight 24
- [ ] Task 1.8: Increase button height to 50, borderRadius to 12
- [ ] Task 1.9: Add sequential fade-in animation with staggered timing
- [ ] Task 1.10: Add haptic feedback on button press (light impact)

---

### Screen 2: Sign Up/Sign In (Redesigned)
**File:** `WelcomeScreen.tsx`

#### Current Issues
- Mode switching on same screen can be confusing
- Social button design doesn't match iOS patterns
- Overlay too heavy
- No progress indication
- Language selector looks like placeholder

#### Redesign Approach

**Recommendation:** Split into two separate screens or use modal presentation

**Layout (Sign Up Mode):**
```
┌─────────────────────────────┐
│  ✕                          │  ← Close button (top-left)
│                             │
│  Join MeCabal               │  ← Large title, 34pt
│                             │
│  Choose how to sign up      │  ← Subtitle, 17pt regular
│                             │
│  ┌───────────────────────┐ │
│  │  􀉩  Continue with     │ │  ← SF Symbol, 44pt height
│  │      Apple             │ │     Black button with white text
│  └───────────────────────┘ │
│                             │
│  ┌───────────────────────┐ │
│  │  G  Continue with      │ │  ← 44pt height
│  │      Google            │ │     White with border
│  └───────────────────────┘ │
│                             │
│  ┌───────────────────────┐ │
│  │  ✉  Continue with      │ │
│  │      Email             │ │
│  └───────────────────────┘ │
│                             │
│  ┌───────────────────────┐ │
│  │  📱  Continue with     │ │
│  │      Phone             │ │
│  └───────────────────────┘ │
│                             │
│  Already have an account?  │  ← Footer
│       Sign In              │     Tappable text link
│                             │
│       🇳🇬  EN              │  ← Language selector
└─────────────────────────────┘
```

**Design Specifications:**
- **Background:** White, no background image or overlay
- **Top Padding:** 60pt from safe area
- **Title:** SF Pro Display, 34pt, Bold (weight 700)
- **Buttons:**
  - Height: 44pt minimum (Apple touch target)
  - Spacing: 12pt between buttons
  - Border radius: 10pt
  - Icon size: 20x20pt
  - Text: SF Pro Text, 17pt, Semibold (weight 600)
- **Apple Button:** Background #000000, Text #FFFFFF
- **Google Button:** Background #FFFFFF, Border 1pt #E5E5E5, Text #000000
- **Email/Phone Buttons:** Background #F7F7F7, Text #000000
- **Animation:** Buttons slide in from right with 0.05s stagger, spring animation

**Implementation Tasks:**
- [ ] Task 2.1: Remove AuthBackground component, use white background
- [ ] Task 2.2: Update title to 34pt, fontWeight '700'
- [ ] Task 2.3: Redesign SocialButton component to match iOS patterns
- [ ] Task 2.4: Add SF Symbols or equivalent icons (20x20)
- [ ] Task 2.5: Set all button heights to 44pt minimum
- [ ] Task 2.6: Update button border radius to 10pt
- [ ] Task 2.7: Implement button spacing of 12pt
- [ ] Task 2.8: Style Apple button with black background
- [ ] Task 2.9: Add slide-in animation with spring physics
- [ ] Task 2.10: Implement haptic feedback for all button presses
- [ ] Task 2.11: Add proper focus states for accessibility
- [ ] Task 2.12: Update footer link styling (17pt, semibold, primary color)

---

### Screen 3: Phone Verification (Redesigned)
**File:** `PhoneVerificationScreen.tsx`

#### Current Issues
- SMS/WhatsApp selection feels like an afterthought
- Phone input design doesn't match iOS style
- Method selection uses emojis instead of proper icons
- Skip button placement inconsistent
- Detected carrier info placement awkward

#### Redesign Approach

**Layout:**
```
┌─────────────────────────────┐
│  ← Back                     │  ← Navigation bar
│                             │
│  Verify your phone          │  ← Large title, 34pt, bold
│  number                     │
│                             │
│  We'll send a code to keep  │  ← Body text, 17pt
│  your account safe          │
│                             │
│  ┌─────────────────────────┐│
│  │ 🇳🇬  +234               ││  ← Input field, 44pt height
│  │  8012345678             ││     Proper iOS text field style
│  └─────────────────────────┘│
│                             │
│  Detected: MTN              │  ← Subtle info text
│                             │
│  How should we send it?     │  ← Section header, 17pt semibold
│                             │
│  ⦿ Text message (SMS)       │  ← Radio buttons, 44pt height
│  ○ WhatsApp message         │
│                             │
│                             │
│  [Flexible Space]           │
│                             │
│  ┌───────────────────────┐ │
│  │    Send Code          │ │  ← Fixed bottom CTA
│  └───────────────────────┘ │
│                             │
└─────────────────────────────┘
```

**Design Specifications:**
- **Navigation Bar:** Standard iOS with back button
- **Title:** 34pt, Bold, inline initially, becomes nav title on scroll
- **Input Field:**
  - Height: 44pt minimum
  - Border: 1pt solid #E5E5E5
  - Border radius: 10pt
  - Active state: Border 2pt primary color
  - Font: 17pt, Regular
  - Placeholder: Gray 60%
- **Radio Buttons:** Use proper iOS segmented control or custom radio
- **Bottom Button:**
  - Fixed to bottom with safe area insets
  - Height: 50pt
  - Full-width with 16pt side margins
  - Disabled state: 40% opacity

**Implementation Tasks:**
- [ ] Task 3.1: Replace header with iOS navigation bar
- [ ] Task 3.2: Implement large title that collapses on scroll
- [ ] Task 3.3: Redesign phone input to match iOS text field style
- [ ] Task 3.4: Update input height to 44pt with proper padding
- [ ] Task 3.5: Add focus/active border color change animation
- [ ] Task 3.6: Move method selection below phone input
- [ ] Task 3.7: Replace emoji icons with proper radio button UI
- [ ] Task 3.8: Implement radio button selection animation
- [ ] Task 3.9: Move carrier detection to subtle text below input
- [ ] Task 3.10: Fix submit button to bottom with safe area
- [ ] Task 3.11: Add proper disabled state styling (40% opacity)
- [ ] Task 3.12: Implement keyboard dismissal on drag
- [ ] Task 3.13: Add input validation with inline error messages

---

### Screen 4: OTP Verification (Redesigned)
**File:** `OTPVerificationScreen.tsx`

#### Current Issues
- OTP inputs too small (50x60)
- Timer placement could be better
- Manual verify button shouldn't be needed
- No visual feedback during verification
- No error state design

#### Redesign Approach

**Layout:**
```
┌─────────────────────────────┐
│  ← Back                     │  ← Navigation bar
│                             │
│  Enter verification         │  ← Large title, 34pt
│  code                       │
│                             │
│  We sent a code to          │  ← Body text, 17pt
│  +234 801 234 5678          │     Phone number bold
│                             │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐  │  ← OTP boxes, 64x64
│  │ 1 │ │ 2 │ │ 3 │ │ 4 │  │     Auto-focus, auto-advance
│  └───┘ └───┘ └───┘ └───┘  │
│                             │
│  ⟳ Resend code in 0:28     │  ← Timer with icon
│                             │
│  [Loading State]            │  ← Shows when verifying
│  Verifying...               │
│                             │
│                             │
│  Didn't receive it?         │
│  Try WhatsApp • Call me     │  ← Alternative options
│                             │
└─────────────────────────────┘
```

**Design Specifications:**
- **OTP Boxes:**
  - Size: 64x64pt
  - Spacing: 12pt between boxes
  - Border: 2pt solid #E5E5E5
  - Active: Border 2pt primary color
  - Filled: Background light green, border primary
  - Font: 28pt, Medium
  - Border radius: 10pt
- **Auto-verification:** Verify immediately when 4th digit entered
- **Loading State:** Show spinner in place of OTP boxes
- **Timer:** 17pt, Regular, with reload icon
- **Alternative Options:** 15pt, Primary color, tappable

**Implementation Tasks:**
- [ ] Task 4.1: Increase OTP box size from 50x60 to 64x64
- [ ] Task 4.2: Update box spacing to 12pt
- [ ] Task 4.3: Increase font size to 28pt with fontWeight '500'
- [ ] Task 4.4: Update border radius to 10pt
- [ ] Task 4.5: Implement smooth border color transition on focus
- [ ] Task 4.6: Add light green background for filled boxes
- [ ] Task 4.7: Enable auto-verification (already disabled in code)
- [ ] Task 4.8: Add loading spinner during verification
- [ ] Task 4.9: Redesign timer with icon and better styling
- [ ] Task 4.10: Remove manual verify button from bottom
- [ ] Task 4.11: Add alternative options row (WhatsApp, Call)
- [ ] Task 4.12: Implement error shake animation for wrong code
- [ ] Task 4.13: Add haptic feedback on success/error
- [ ] Task 4.14: Update phone number display with proper formatting

---

### Screen 5: Location Setup (Redesigned)
**File:** `LocationSetupScreen.tsx`

#### Current Issues
- Three large cards feel overwhelming
- Icons are emojis instead of proper icons
- Recommended badge too small
- Cards have too much information
- No clear hierarchy

#### Redesign Approach

**Layout:**
```
┌─────────────────────────────┐
│  ← Back                     │  ← Navigation bar
│                             │
│  Where do you live?         │  ← Large title, 34pt
│                             │
│  This helps us connect you  │  ← Body, 17pt, gray
│  with your neighbors        │
│                             │
│  ┌─────────────────────────┐│
│  │ 􀋒  Auto-detect        ✓││  ← Recommended
│  │ Fastest and most        ││     Larger, emphasized
│  │ accurate                ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │ 􀋑  Pick on map          ││  ← Standard size
│  │ Choose exact location   ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │ 􀋘  Nearby landmark      ││
│  │ Find by landmark        ││
│  └─────────────────────────┘│
│                             │
│  [Flexible Space]           │
│                             │
│  ┌───────────────────────┐ │
│  │    Continue           │ │  ← Fixed bottom
│  └───────────────────────┘ │
└─────────────────────────────┘
```

**Design Specifications:**
- **Recommended Card:**
  - Height: 80pt
  - Background: Light green (10% primary)
  - Border: 2pt primary
  - Shadow: Subtle (0 2 4 rgba(0,0,0,0.08))
- **Standard Cards:**
  - Height: 64pt
  - Background: White
  - Border: 1pt #E5E5E5
  - No shadow initially
  - Shadow on press
- **Icons:** SF Symbols, 24x24pt, primary color
- **Animation:** Gentle bounce on selection
- **Spacing:** 12pt between cards

**Implementation Tasks:**
- [ ] Task 5.1: Replace emoji icons with SF Symbol equivalents
- [ ] Task 5.2: Differentiate recommended card (larger, different style)
- [ ] Task 5.3: Reduce card information to title + subtitle only
- [ ] Task 5.4: Update card heights (80pt recommended, 64pt others)
- [ ] Task 5.5: Implement selection animation (scale 0.98 → 1.02 → 1.0)
- [ ] Task 5.6: Update spacing between cards to 12pt
- [ ] Task 5.7: Add proper shadows (subtle on recommended, none on others)
- [ ] Task 5.8: Update border styling (2pt primary on recommended)
- [ ] Task 5.9: Fix continue button to bottom with safe area
- [ ] Task 5.10: Add haptic feedback on card selection
- [ ] Task 5.11: Implement GPS permission modal with native iOS style
- [ ] Task 5.12: Redesign landmark list to use proper list items

---

## Implementation Tasks

### Phase 1: Foundation (Week 1)
**Goal:** Set up design system updates and core components

#### Design System Updates
- [ ] 1.1: Create iOS-specific typography scale (SF Pro equivalents)
- [ ] 1.2: Update button component to support iOS variants
- [ ] 1.3: Create reusable iOS text input component
- [ ] 1.4: Add animation constants (spring configs, durations)
- [ ] 1.5: Update shadow presets to match iOS elevation
- [ ] 1.6: Create haptic feedback utility module
- [ ] 1.7: Add color accessibility tokens (ensure WCAG AA)

#### Core Components
- [ ] 1.8: Build NavigationBar component (iOS-style)
- [ ] 1.9: Build LargeTitle component with collapse behavior
- [ ] 1.10: Build RadioButton/Checkbox components (iOS-style)
- [ ] 1.11: Build LoadingState component with spinner
- [ ] 1.12: Build ErrorState component with retry
- [ ] 1.13: Build ProgressIndicator component (dots/steps)

### Phase 2: Screen Redesigns (Week 2-3)
**Goal:** Implement redesigned screens one by one

#### WelcomeHeroScreen
- [ ] 2.1: Implement all Task 1.1 through 1.10 (listed above)
- [ ] 2.2: Add unit tests for animations
- [ ] 2.3: Test on various screen sizes (iPhone SE to Pro Max)
- [ ] 2.4: Implement dark mode support
- [ ] 2.5: Add accessibility labels and hints

#### WelcomeScreen
- [ ] 2.6: Implement all Task 2.1 through 2.12 (listed above)
- [ ] 2.7: Add loading states for social login
- [ ] 2.8: Implement error handling with inline messages
- [ ] 2.9: Add keyboard dismissal on background tap
- [ ] 2.10: Test with VoiceOver

#### PhoneVerificationScreen
- [ ] 2.11: Implement all Task 3.1 through 3.13 (listed above)
- [ ] 2.12: Add phone number formatting (234 → 0234)
- [ ] 2.13: Implement carrier detection animation
- [ ] 2.14: Add skip confirmation modal
- [ ] 2.15: Test with different Nigerian carriers

#### OTPVerificationScreen
- [ ] 2.16: Implement all Task 4.1 through 4.14 (listed above)
- [ ] 2.17: Add paste from clipboard functionality
- [ ] 2.18: Implement auto-read OTP (iOS 12+)
- [ ] 2.19: Add resend cooldown animation
- [ ] 2.20: Test verification failure flows

#### LocationSetupScreen
- [ ] 2.21: Implement all Task 5.1 through 5.12 (listed above)
- [ ] 2.22: Add GPS permission handling with fallbacks
- [ ] 2.23: Implement map picker component
- [ ] 2.24: Add landmark search functionality
- [ ] 2.25: Test location accuracy edge cases

### Phase 3: Animations & Polish (Week 4)
**Goal:** Add micro-interactions and polish

#### Transitions
- [ ] 3.1: Implement screen-to-screen transitions (slide, modal)
- [ ] 3.2: Add shared element transitions where applicable
- [ ] 3.3: Implement gesture-based navigation (swipe back)
- [ ] 3.4: Add loading → success → next screen flow
- [ ] 3.5: Create error → retry animations

#### Micro-interactions
- [ ] 3.6: Add button press animations (scale down 0.96)
- [ ] 3.7: Add input focus animations (border color, glow)
- [ ] 3.8: Add success checkmark animations
- [ ] 3.9: Add error shake animations
- [ ] 3.10: Add skeleton loading states

#### Haptics
- [ ] 3.11: Add light impact on button press
- [ ] 3.12: Add medium impact on screen transition
- [ ] 3.13: Add success notification feedback
- [ ] 3.14: Add error notification feedback
- [ ] 3.15: Add selection feedback on radio/checkbox

### Phase 4: Testing & Optimization (Week 5)
**Goal:** Ensure quality and performance

#### Functionality Testing
- [ ] 4.1: Test complete onboarding flow (happy path)
- [ ] 4.2: Test all error scenarios
- [ ] 4.3: Test with slow network
- [ ] 4.4: Test with no network
- [ ] 4.5: Test account already exists flow
- [ ] 4.6: Test skip flows

#### Accessibility Testing
- [ ] 4.7: Test with VoiceOver on iOS
- [ ] 4.8: Test with Dynamic Type (largest sizes)
- [ ] 4.9: Test with Reduce Motion enabled
- [ ] 4.10: Test color contrast ratios
- [ ] 4.11: Test keyboard navigation
- [ ] 4.12: Add missing accessibility labels

#### Performance Testing
- [ ] 4.13: Profile with React DevTools
- [ ] 4.14: Measure FPS during animations
- [ ] 4.15: Optimize image loading and caching
- [ ] 4.16: Reduce bundle size (lazy load if needed)
- [ ] 4.17: Test on older devices (iPhone 8, SE)

#### Analytics Implementation
- [ ] 4.18: Track screen views
- [ ] 4.19: Track button taps
- [ ] 4.20: Track completion time
- [ ] 4.21: Track drop-off points
- [ ] 4.22: Track error occurrences

---

## Technical Specifications

### Animation Library
**Recommended:** React Native Reanimated 2/3

```javascript
// Spring animation config (iOS-like)
const springConfig = {
  damping: 15,
  mass: 1,
  stiffness: 150,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

// Timing for fades
const fadeConfig = {
  duration: 300,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1), // ease
};
```

### Haptic Feedback
```javascript
import * as Haptics from 'expo-haptics';

// Light impact (button press)
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Medium impact (screen transition)
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Success notification
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Error notification
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
```

### Typography System
```javascript
// iOS Typography Scale
const typography = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700' },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  title3: { fontSize: 20, lineHeight: 25, fontWeight: '600' },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400' },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400' },
  subheadline: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption1: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  caption2: { fontSize: 11, lineHeight: 13, fontWeight: '400' },
};
```

### Spacing System
```javascript
// iOS-standard spacing (8pt grid)
const spacing = {
  xs: 4,   // 0.5 unit
  sm: 8,   // 1 unit
  md: 16,  // 2 units
  lg: 24,  // 3 units
  xl: 32,  // 4 units
  xxl: 40, // 5 units
  xxxl: 48, // 6 units
};
```

### Button Specifications
```javascript
const buttons = {
  primary: {
    height: 50,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    pressedScale: 0.96,
  },
  secondary: {
    height: 44,
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
    pressedScale: 0.96,
  },
  text: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.41,
  },
};
```

### Input Field Specifications
```javascript
const textInput = {
  height: 44,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: '#E5E5E5',
  paddingHorizontal: 16,
  fontSize: 17,
  fontWeight: '400',
  backgroundColor: '#FFFFFF',

  // Active state
  activeBorderColor: COLORS.primary,
  activeBorderWidth: 2,

  // Error state
  errorBorderColor: COLORS.error,
  errorBorderWidth: 2,
};
```

### Safe Area Handling
```javascript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// In component
const insets = useSafeAreaInsets();

// Apply to bottom button
<View style={{
  paddingBottom: insets.bottom + 16,
  paddingTop: 16,
  paddingHorizontal: 16
}}>
  <Button />
</View>
```

---

## Testing & Quality Assurance

### Test Devices
**Minimum:**
- iPhone SE (2nd gen) - Small screen
- iPhone 13 - Standard screen
- iPhone 15 Pro Max - Large screen
- iPad Mini - Tablet (if supporting)

**OS Versions:**
- iOS 14 (minimum supported)
- iOS 17 (latest)

### Test Scenarios

#### Happy Path
1. User opens app → sees hero screen
2. Taps "Join Community" → sees sign up options
3. Taps "Continue with Phone" → enters number
4. Receives OTP → enters code
5. Selects "Auto-detect" location → grants permission
6. Lands on main app

#### Error Scenarios
1. Invalid phone number format
2. OTP send failure (network error)
3. Invalid OTP code
4. Location permission denied
5. Location not in supported area
6. Account already exists
7. Network timeout during verification

#### Edge Cases
1. User backs out at each step
2. User kills app during onboarding
3. User switches to another app
4. Phone number changes carrier
5. User requests new OTP before timer ends
6. User tries to skip all steps
7. Device in airplane mode

### Acceptance Criteria

#### Performance
- [ ] All screens load in < 500ms
- [ ] Animations run at 60 FPS
- [ ] No memory leaks during flow
- [ ] App size increase < 2MB

#### Accessibility
- [ ] All interactive elements have labels
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Works with VoiceOver
- [ ] Works with Dynamic Type up to xxxLarge
- [ ] Works with Reduce Motion enabled

#### Functionality
- [ ] 100% of users can complete onboarding
- [ ] All error states handled gracefully
- [ ] All validation messages clear
- [ ] Progress always clear to user
- [ ] Can resume if interrupted

#### Business Metrics
- [ ] Onboarding completion rate > 85%
- [ ] Average completion time < 2 minutes
- [ ] Drop-off rate < 5% per screen
- [ ] Support ticket volume < 1% of signups

---

## Design Assets Needed

### Icons
- [ ] Location pin (SF Symbol: `􀋒 location.fill`)
- [ ] Map (SF Symbol: `􀋑 map`)
- [ ] Landmark (SF Symbol: `􀋘 building.2`)
- [ ] Apple logo (SF Symbol: `􀉩 apple.logo`)
- [ ] Phone (SF Symbol: `􀌾 phone.fill`)
- [ ] Email (SF Symbol: `􀍕 envelope.fill`)
- [ ] Checkmark (SF Symbol: `􀆅 checkmark.circle.fill`)
- [ ] Error (SF Symbol: `􀁡 xmark.circle.fill`)
- [ ] Reload (SF Symbol: `􀚁 arrow.clockwise`)

### Images
- [ ] Hero background image (optimized, 2x and 3x)
- [ ] App logo (vector, 120x120pt @2x and @3x)
- [ ] Empty states illustrations
- [ ] Success celebration illustration (optional)

### Lottie Animations (Optional)
- [ ] Location searching animation
- [ ] Success checkmark animation
- [ ] Loading spinner (custom branded)

---

## Appendix

### References
1. [Apple Human Interface Guidelines - Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding)
2. [Apple HIG - Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
3. [Apple HIG - Color](https://developer.apple.com/design/human-interface-guidelines/color)
4. [SF Symbols](https://developer.apple.com/sf-symbols/)
5. [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
6. [Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/)

### Design Inspiration
- Airbnb onboarding
- Instagram sign up flow
- Apple's own apps (Health, Fitness)
- Nextdoor onboarding (competitor)

### Success Metrics Tracking
```javascript
// Analytics events to implement
const events = {
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_SCREEN_VIEW: 'onboarding_screen_view',
  ONBOARDING_BUTTON_TAP: 'onboarding_button_tap',
  ONBOARDING_ERROR: 'onboarding_error',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_ABANDONED: 'onboarding_abandoned',
  ONBOARDING_TIME: 'onboarding_completion_time',
};
```

---

## Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-10 | Initial documentation created | Development Team |

---

## Approval Sign-off

- [ ] **Product Manager:** _________________ Date: _______
- [ ] **Lead Designer:** _________________ Date: _______
- [ ] **Engineering Lead:** _________________ Date: _______
- [ ] **QA Lead:** _________________ Date: _______

---

**End of Document**
