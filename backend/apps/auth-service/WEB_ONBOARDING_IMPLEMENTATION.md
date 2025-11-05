# Web Onboarding Implementation Guide

This document provides a complete guide for implementing the MeCabal onboarding flow in the web application, replicating the mobile app experience.

## Overview

The onboarding flow consists of 6 main steps:
1. **Welcome Screen** - Choose signup method
2. **Email Registration** - Enter name and email
3. **Email Verification** - Enter 6-digit OTP
4. **Phone Verification** - Enter phone number
5. **Phone OTP Verification** - Enter 4-digit OTP
6. **Location Setup** - Select location (GPS or manual)
7. **Complete** - Redirect to main app

## API Endpoints

### 1. Send Email OTP
```typescript
POST /auth/email/send-otp
Body: {
  email: string;
  purpose: 'registration' | 'login' | 'password_reset';
}

Response: {
  success: boolean;
  message?: string;
  error?: string;
  expiresAt?: Date;
  otpCode?: string; // Only in development mode
}
```

### 2. Verify Email OTP (Complete Email Verification)
```typescript
POST /auth/complete-email-verification
Body: {
  email: string;
  otpCode: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  preferred_language?: string;
}

Response: {
  success: boolean;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    phoneVerified: boolean;
    isVerified: boolean;
    verificationLevel: number;
  };
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}
```

### 3. Send Phone OTP
```typescript
POST /auth/phone/send-otp
Body: {
  phone: string; // Format: +234XXXXXXXXXX
  purpose: 'registration' | 'login' | 'password_reset';
  method?: 'sms' | 'whatsapp';
  email?: string; // Required for registration to link user
}

Response: {
  success: boolean;
  message?: string;
  error?: string;
  expiresAt?: Date;
  carrier?: string;
  carrier_color?: string;
  otpCode?: string; // Only in development mode
}
```

### 4. Verify Phone OTP
```typescript
POST /auth/phone/verify-otp
Body: {
  phoneNumber: string; // Format: +234XXXXXXXXXX
  otpCode: string; // 4-digit code
  purpose?: 'registration' | 'login' | 'password_reset';
  deviceInfo?: {
    deviceId?: string;
    deviceType?: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

Response: {
  success: boolean;
  verified: boolean;
  error?: string;
  carrier?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    phoneVerified: boolean;
    isVerified: boolean;
    verificationLevel: number;
  };
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
}
```

### 5. Complete Location Setup
```typescript
POST /auth/location/setup
Headers: {
  Authorization: 'Bearer <accessToken>'
}
Body: {
  state?: string;
  city?: string;
  estate?: string;
  location?: string;
  landmark?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  completeRegistration: true; // Important: must be true
}

Response: {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    phoneVerified: boolean;
    isVerified: boolean; // Should be true after this
    verificationLevel: number;
  };
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}
```

## Implementation Steps

### Step 1: Welcome Screen
- Display welcome message
- Show signup options: Email, Phone, Google
- Navigate to email registration or phone verification

### Step 2: Email Registration
```typescript
// Component: EmailRegistrationForm
const handleSubmit = async (data: { firstName: string; lastName: string; email: string }) => {
  setIsLoading(true);
  try {
    const response = await fetch('/api/auth/email/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        purpose: 'registration',
      }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Store user data in session/localStorage
      sessionStorage.setItem('onboarding_user', JSON.stringify({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      }));
      
      // Navigate to email verification
      router.push('/onboarding/verify-email');
    } else {
      setError(result.error || 'Failed to send verification code');
    }
  } catch (error) {
    setError('Network error. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
```

### Step 3: Email Verification
```typescript
// Component: EmailVerificationForm
const handleVerify = async (otpCode: string) => {
  setIsVerifying(true);
  try {
    const userData = JSON.parse(sessionStorage.getItem('onboarding_user') || '{}');
    
    const response = await fetch('/api/auth/complete-email-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userData.email,
        otpCode,
        first_name: userData.firstName,
        last_name: userData.lastName,
        preferred_language: 'en',
      }),
    });
    
    const result = await response.json();
    
    if (result.success && result.user && result.accessToken) {
      // Store tokens
      localStorage.setItem('accessToken', result.accessToken);
      localStorage.setItem('refreshToken', result.refreshToken);
      
      // Update user data
      sessionStorage.setItem('onboarding_user', JSON.stringify(result.user));
      
      // Navigate to phone verification
      router.push('/onboarding/verify-phone');
    } else {
      setError(result.error || 'Invalid verification code');
    }
  } catch (error) {
    setError('Verification failed. Please try again.');
  } finally {
    setIsVerifying(false);
  }
};
```

### Step 4: Phone Verification
```typescript
// Component: PhoneVerificationForm
const handleSubmit = async (phoneNumber: string, method: 'sms' | 'whatsapp') => {
  setIsLoading(true);
  try {
    const userData = JSON.parse(sessionStorage.getItem('onboarding_user') || '{}');
    
    const response = await fetch('/api/auth/phone/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: phoneNumber, // Format: +234XXXXXXXXXX
        purpose: 'registration',
        method,
        email: userData.email, // Important: link to existing user
      }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Store phone number
      sessionStorage.setItem('onboarding_phone', phoneNumber);
      
      // Navigate to phone OTP verification
      router.push('/onboarding/verify-phone-otp');
    } else {
      setError(result.error || 'Failed to send verification code');
    }
  } catch (error) {
    setError('Network error. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
```

### Step 5: Phone OTP Verification
```typescript
// Component: PhoneOTPVerificationForm
const handleVerify = async (otpCode: string) => {
  setIsVerifying(true);
  try {
    const phoneNumber = sessionStorage.getItem('onboarding_phone');
    const accessToken = localStorage.getItem('accessToken');
    
    const response = await fetch('/api/auth/phone/verify-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: JSON.stringify({
        phoneNumber,
        otpCode,
        purpose: 'registration',
        deviceInfo: {
          deviceType: 'web',
          userAgent: navigator.userAgent,
        },
      }),
    });
    
    const result = await response.json();
    
    if (result.success && result.verified) {
      // Update tokens if new ones provided
      if (result.tokens) {
        localStorage.setItem('accessToken', result.tokens.accessToken);
        localStorage.setItem('refreshToken', result.tokens.refreshToken);
      }
      
      // Navigate to location setup
      router.push('/onboarding/location');
    } else {
      setError(result.error || 'Invalid verification code');
    }
  } catch (error) {
    setError('Verification failed. Please try again.');
  } finally {
    setIsVerifying(false);
  }
};
```

### Step 6: Location Setup
```typescript
// Component: LocationSetupForm
const handleSubmit = async (locationData: {
  state: string;
  city: string;
  estate?: string;
  latitude?: number;
  longitude?: number;
}) => {
  setIsLoading(true);
  try {
    const accessToken = localStorage.getItem('accessToken');
    const userData = JSON.parse(sessionStorage.getItem('onboarding_user') || '{}');
    
    const response = await fetch('/api/auth/location/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        ...locationData,
        completeRegistration: true, // Important!
      }),
    });
    
    const result = await response.json();
    
    if (result.success && result.user) {
      // Update tokens if new ones provided
      if (result.accessToken) {
        localStorage.setItem('accessToken', result.accessToken);
        localStorage.setItem('refreshToken', result.refreshToken);
      }
      
      // Clear onboarding data
      sessionStorage.removeItem('onboarding_user');
      sessionStorage.removeItem('onboarding_phone');
      
      // Store user in app state/context
      setUser(result.user);
      
      // Navigate to main app
      router.push('/dashboard');
    } else {
      setError(result.error || 'Failed to complete registration');
    }
  } catch (error) {
    setError('Network error. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
```

## User State Tracking

### Verification States
- **Email Verification**: User created, `isVerified: false`, `phoneVerified: false`
- **Phone Verification**: `phoneVerified: true`, `isVerified: false` (still waiting for location)
- **Location Setup**: `isVerified: true`, `addressVerified: true`, `phoneVerified: true`

### Storage Strategy
- **Session Storage**: Temporary onboarding data (user details, phone number)
- **Local Storage**: Authentication tokens (accessToken, refreshToken)
- **App State/Context**: Current user object after completion

## Error Handling

### Common Errors
1. **Email already exists**: Show "Account exists. Try logging in instead."
2. **Phone already registered**: Show "Phone number already registered to another account."
3. **Invalid OTP**: Show "Invalid or expired code. Please request a new one."
4. **OTP expired**: Show "Code expired. Please request a new code."
5. **Network error**: Show "Connection error. Please check your internet and try again."

### Rate Limiting
- Email OTP: 3 requests per minute
- Phone OTP: 3 requests per minute
- OTP Verification: 10 attempts per 5 minutes

## UI/UX Recommendations

1. **Progress Indicator**: Show progress bar (e.g., "Step 2 of 6")
2. **Auto-focus**: Auto-focus next OTP input field
3. **Auto-submit**: Auto-submit when all OTP digits are entered
4. **Resend Timer**: Show countdown timer for resend option
5. **Loading States**: Show loading indicators during API calls
6. **Error Display**: Display errors prominently but non-intrusively
7. **Back Navigation**: Allow users to go back to previous steps
8. **Skip Options**: Allow skipping phone verification (with warning) but not location

## Testing Checklist

- [ ] Email registration with valid email
- [ ] Email registration with duplicate email
- [ ] Email OTP verification with valid code
- [ ] Email OTP verification with invalid code
- [ ] Email OTP verification with expired code
- [ ] Phone number entry with valid Nigerian format
- [ ] Phone number entry with invalid format
- [ ] Phone OTP sending via SMS
- [ ] Phone OTP sending via WhatsApp
- [ ] Phone OTP verification with valid code
- [ ] Phone OTP verification with invalid code
- [ ] Location setup with GPS
- [ ] Location setup with manual selection
- [ ] Complete registration flow end-to-end
- [ ] Token refresh after each step
- [ ] Error handling for network failures
- [ ] Rate limiting behavior

## Security Considerations

1. **Token Storage**: Store tokens securely (httpOnly cookies preferred over localStorage)
2. **HTTPS**: Always use HTTPS in production
3. **Input Validation**: Validate all inputs on client and server
4. **Rate Limiting**: Implement client-side rate limiting to prevent abuse
5. **CSRF Protection**: Implement CSRF tokens for state-changing operations
6. **XSS Prevention**: Sanitize all user inputs before display

## Next Steps

1. Create React/Vue components for each step
2. Implement routing with protected routes
3. Set up authentication context/state management
4. Implement error boundaries
5. Add analytics tracking
6. Create loading and error UI components
7. Test on multiple browsers and devices
8. Add accessibility features (ARIA labels, keyboard navigation)

