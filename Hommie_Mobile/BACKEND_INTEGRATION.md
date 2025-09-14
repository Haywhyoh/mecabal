# Mobile Backend Integration Guide

This document describes the integration between the MeCabal mobile app and the new NestJS backend API.

## Overview

The mobile app has been migrated from Supabase edge functions to a custom NestJS backend API. The authentication service now uses REST API calls with JWT token management.

## Configuration

### Environment Variables

The following environment variables are required in `.env`:

```env
# New Backend API Configuration
EXPO_PUBLIC_API_URL=https://api.mecabal.com
EXPO_PUBLIC_API_TIMEOUT=10000

# Legacy Supabase Configuration (for backward compatibility during migration)
EXPO_PUBLIC_SUPABASE_URL=https://jjmuogczhcunpehsocly.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Dependencies

The following dependencies are required and already included in `package.json`:

- `@react-native-async-storage/async-storage` - For storing JWT tokens locally
- Other existing dependencies remain unchanged

## Authentication Service Changes

### MeCabalAuth API Methods

The `MeCabalAuth` service has been completely rewritten to use REST API calls instead of Supabase edge functions:

#### Phone Authentication

```typescript
// Send OTP to Nigerian phone number
static async sendOTP(
  phoneNumber: string, 
  purpose: 'registration' | 'login' | 'password_reset' = 'registration',
  method: 'sms' | 'whatsapp' = 'sms'
): Promise<OTPResponse>

// Verify phone OTP
static async verifyOTP(
  phoneNumber: string, 
  otpCode: string, 
  purpose: 'registration' | 'login' | 'password_reset' = 'registration'
): Promise<VerifyOTPResponse>

// Complete phone login
static async completeLogin(phoneNumber: string, otpCode: string): Promise<AuthResponse>
```

#### Email Authentication

```typescript
// Send email OTP
static async sendEmailOTP(
  email: string, 
  purpose: 'registration' | 'login' | 'password_reset' = 'registration'
): Promise<OTPResponse>

// Verify email OTP
static async verifyEmailOTP(
  email: string, 
  otpCode: string, 
  purpose: 'registration' | 'login' | 'password_reset' = 'registration'
): Promise<VerifyOTPResponse>

// Complete email login
static async completeEmailLogin(email: string, otpCode: string): Promise<AuthResponse>
```

#### User Management

```typescript
// Create user account
static async createUser(userData: {
  phone_number?: string;
  email?: string;
  first_name: string;
  last_name: string;
  state_of_origin?: string;
  preferred_language?: string;
  carrier_info?: NigerianCarrier;
}): Promise<AuthResponse>

// Get current user
static async getCurrentUser(): Promise<NigerianUser | null>

// Update user profile
static async updateProfile(updates: Partial<NigerianUser>): Promise<ApiResponse<NigerianUser>>

// Check authentication status
static async isAuthenticated(): Promise<boolean>

// Sign out
static async signOut(): Promise<void>

// Refresh token
static async refreshToken(): Promise<boolean>
```

## Backend API Endpoints

The mobile app now calls the following backend endpoints:

### Authentication Endpoints

- `POST /auth/phone/send-otp` - Send SMS/WhatsApp OTP to Nigerian phone number
- `POST /auth/phone/verify-otp` - Verify phone OTP code
- `POST /auth/email/send-otp` - Send email OTP
- `POST /auth/email/verify-otp` - Verify email OTP code
- `POST /auth/register` - Create new user account
- `POST /auth/login` - Complete login with credentials
- `POST /auth/logout` - Logout and invalidate tokens
- `POST /auth/refresh` - Refresh access token
- `GET /auth/verify` - Verify current token
- `GET /auth/me` - Get current user profile
- `PUT /auth/profile` - Update user profile

### Request/Response Format

All API calls use JSON format with standardized response structure:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
```

## Token Management

### JWT Token Storage

The app now uses JWT tokens stored in AsyncStorage:

- `auth_token` - Access token for API authentication
- `refresh_token` - Refresh token for renewing access

### Automatic Token Refresh

The `ApiClient` class automatically handles token refresh when requests fail with authentication errors.

### Token Security

- Tokens are stored securely using AsyncStorage
- Access tokens have short expiration times
- Refresh tokens are used to obtain new access tokens
- All tokens are cleared on logout

## Migration Notes

### Backward Compatibility

The old Supabase configuration is maintained in the environment file for backward compatibility during the transition period.

### Breaking Changes

1. **Authentication State Management**: No longer uses Supabase auth state listeners
2. **Session Management**: Now uses JWT tokens instead of Supabase sessions
3. **API Responses**: Response format has changed to match new backend structure
4. **Error Handling**: Error responses now follow backend API error format

### Updated Authentication Flow

#### New User Registration

1. User enters phone number or email
2. App calls `sendOTP()` or `sendEmailOTP()`
3. User enters OTP code
4. App calls `verifyOTP()` or `verifyEmailOTP()`
5. If verification succeeds, tokens are stored
6. App calls `createUser()` with user details
7. User is logged in and redirected to main app

#### Existing User Login

1. User enters phone number or email
2. App calls `sendOTP()` or `sendEmailOTP()` with purpose='login'
3. User enters OTP code
4. App calls `completeLogin()` or `completeEmailLogin()`
5. If successful, tokens are stored and user is logged in

## Testing Checklist

### Phone Authentication
- [ ] Send SMS OTP to Nigerian phone numbers
- [ ] Send WhatsApp OTP to Nigerian phone numbers
- [ ] Verify valid OTP codes
- [ ] Handle invalid/expired OTP codes
- [ ] Carrier detection and display

### Email Authentication
- [ ] Send email OTP
- [ ] Verify valid email OTP codes
- [ ] Handle invalid/expired email OTP codes

### User Management
- [ ] Create new user accounts
- [ ] Login existing users
- [ ] Update user profiles
- [ ] Get current user data
- [ ] Logout functionality

### Token Management
- [ ] Store tokens after successful authentication
- [ ] Automatic token refresh on API calls
- [ ] Clear tokens on logout
- [ ] Handle expired refresh tokens

### Error Handling
- [ ] Network connectivity issues
- [ ] API timeout handling
- [ ] Invalid credentials
- [ ] Server errors
- [ ] Rate limiting

## Troubleshooting

### Common Issues

1. **Network Errors**: Check API_URL configuration and network connectivity
2. **Authentication Failures**: Verify JWT tokens are properly stored and sent
3. **OTP Not Received**: Check phone number format and carrier support
4. **Token Refresh Issues**: Clear AsyncStorage and re-authenticate

### Debug Information

Enable debug logging by checking the console for API request logs:
- Request timing information
- Error details with request IDs
- Token refresh operations

## Development Environment

### Local Development

For local development, update the API URL in `.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### Production Environment

For production, use the live API URL:

```env
EXPO_PUBLIC_API_URL=https://api.mecabal.com
```

## Security Considerations

1. **Token Storage**: Uses AsyncStorage for secure local token storage
2. **HTTPS Only**: All API calls use HTTPS in production
3. **Token Expiration**: Short-lived access tokens with refresh mechanism
4. **Input Validation**: Phone numbers and email addresses are validated client-side
5. **Error Messages**: Sensitive information is not exposed in error messages

---

This integration provides a robust, secure authentication system that can scale with the MeCabal platform while maintaining a smooth user experience.