# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MeCabal Mobile is a Nigerian community-focused mobile app ("NextDoor for Nigeria") built with React Native and Expo. The app connects neighbors within Nigerian estates/compounds, focusing on safety, local connections, and community building.

## Development Commands

### Running the App
- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run on web browser

### Code Quality
- No specific test commands are configured yet
- ESLint and Prettier are available for code formatting
- TypeScript is used throughout the codebase

## Architecture Overview

### Core App Structure
The app uses a dual navigation system:
1. **Authentication Stack**: Handles onboarding and login flows
2. **Tab Navigator**: Main app interface with 5 tabs (Home, Feed, Events, Marketplace, Profile)

### Authentication Flow
The app follows a modern onboarding experience with two primary flows:

**New Users** (Primary Flow):
`WelcomeLanguageScreen` → `PhoneVerificationScreen` → `OTPVerificationScreen` → `LocationSetupScreen` → Main App

**Existing Users**:
`WelcomeScreen` → `LoginScreen` → Main App

**Legacy Flow** (Backward compatibility):
`OnboardingScreen` → `LocationSelectionScreen` → `InvitationCodeScreen` → Main App

### Authentication State Management
- Simple useState-based authentication in App.tsx
- `isAuthenticated` state controls navigation between auth and main app
- Authentication success callbacks (`handleLoginSuccess`, `handleSocialLoginSuccess`) manage state transitions

### Navigation Architecture
- React Navigation v7 with Stack and Tab navigators
- Tab Navigator contains main app screens (Home, Feed, Events, Marketplace, Profile)
- Stack Navigator handles authentication flow
- Deep integration between authentication state and navigation

### Design System & Styling

The app follows a comprehensive design system defined in `ux.md`:

#### Color System (Community-Focused)
- **Primary**: `#00A651` (MeCabal Green) - Main brand color for trust
- **Neutral Foundation**: Pure White, Warm Off-White, Soft Gray, Friendly Gray, Rich Charcoal
- **Accent Colors**: Lagos Orange, Trust Blue, Safety Red, Warm Gold
- **Nigerian Cultural Context**: Estate/compound terminology, local references

#### Typography Scale
```javascript
fontSizes: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30, '4xl': 36 }
```

#### Spacing System (8px Grid)
```javascript
spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48, '3xl': 64 }
```

#### Component Specifications
- **Hero Cards**: 20px border radius, specific shadow configuration
- **Community-Focused CTAs**: 16px border radius, specific padding
- **Cards**: 12px border radius, standardized shadows
- **Buttons**: Primary (filled), Secondary (outlined), Ghost (transparent)

### Key Technical Considerations

#### Nigerian Context Integration
- Phone number verification with Nigerian carrier detection (MTN, Airtel, Glo, 9mobile)
- Location services using "Estate" and "Compound" terminology
- Multi-language support (English, Hausa, Yoruba, Igbo)
- Nigerian phone number formatting (+234 country code)

#### Onboarding UX Philosophy
- **Story-Driven Approach**: Show real community benefits, not just features
- **Progressive Trust Building**: Build confidence step by step
- **Cultural Relevance**: Use familiar Nigerian contexts and language
- **Quick Wins Early**: Show immediate value before asking for commitment

#### Screen-Specific Patterns

**Onboarding Screens** follow specific design patterns:
- Hero sections with community statistics
- Feature cards with real Nigerian neighborhood examples
- Trust indicators and safety messaging
- Progressive disclosure of information

**Form Screens** (Phone/OTP Verification):
- Progress indicators showing completion status
- Nigerian-specific validation (phone numbers, carriers)
- Trust-building messaging explaining why verification is needed
- Fallback options for accessibility

### Constants Architecture

The app uses a centralized constants system in `src/constants/`:

#### Core Constants (`src/constants/index.ts`)
- **Colors**: Complete design system color palette
- **Typography**: Font sizes, weights, line heights
- **Spacing**: 8px grid system spacing scale
- **Shadows**: Standardized shadow configurations
- **Border Radius**: Consistent radius values
- **API Configuration**: Base URLs, timeouts, retry attempts
- **Validation Rules**: Phone numbers, passwords, OTP validation
- **Nigerian Context**: States, categories, cultural elements

#### Onboarding Data (`src/constants/onboardingData.ts`)
- Language configurations with native names and greetings
- Nigerian carrier information with prefix codes and colors
- Sample locations, neighborhoods, and success stories
- Onboarding flow content and copy

### State Management Approach
- Currently uses React hooks and local state
- No global state management system implemented yet
- Authentication state managed in root App component
- Navigation state handled by React Navigation

### File Organization Patterns

```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components (main app sections)
├── navigation/         # Navigation configuration (currently in App.tsx)
├── constants/          # Design system and app constants
├── services/           # API and external services (placeholder)
├── hooks/              # Custom React hooks (placeholder)
├── types/              # TypeScript type definitions
└── utils/              # Helper functions
```

### Environment Variables
The app expects these environment variables:
- `EXPO_PUBLIC_API_URL` - Backend API base URL
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` - For location services
- `EXPO_PUBLIC_SMS_SERVICE_API_KEY` - For phone verification

### Known Technical Debt
- Tab bar icons are placeholder implementations
- Some dependencies show deprecation warnings
- Vector icons package needs migration to new model
- ESLint version needs updating
- Test infrastructure not yet implemented

### Important Development Patterns

#### When Adding New Screens:
1. Follow the design system colors and typography from `src/constants/index.ts`
2. Use the component specifications from `ux.md`
3. Implement Nigerian cultural context (estate terminology, local references)
4. Include trust indicators and community-focused messaging
5. Add proper navigation integration in App.tsx

#### When Modifying Authentication Flow:
1. Consider impact on both new user and existing user flows
2. Update authentication state management in App.tsx
3. Ensure proper navigation transitions between auth and main app
4. Maintain backward compatibility with legacy screens

#### When Working with Forms:
1. Use Nigerian phone number validation patterns
2. Include carrier detection for phone numbers
3. Implement proper accessibility with clear error messages
4. Add progress indicators for multi-step flows

### Development Phase
The project is currently in Phase 1 (Foundation), with basic project setup, navigation structure, and screen components implemented. Authentication system and core features are still in development.
- you must follow the style guide in @ux.md