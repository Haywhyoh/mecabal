# Google OAuth Environment Variables Setup

This document outlines the environment variables required for Google OAuth integration in the MeCabal mobile app.

## Required Environment Variables

Create a `.env` file in the `Hommie_Mobile` directory with the following variables:

```bash
# Google OAuth Configuration
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id_here
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id_here
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id_here

# Google OAuth Redirect URI
EXPO_PUBLIC_GOOGLE_REDIRECT_URI=mecabal://oauth/callback

# Google OAuth Client Secret (for server-side operations)
EXPO_PUBLIC_GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_API_TIMEOUT=10000

# Supabase Configuration (if using)
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google Maps API Key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Project Configuration
EXPO_PROJECT_ID=your_expo_project_id_here

# Email Service Configuration
EXPO_RESEND_API_KEY=your_resend_api_key_here
RESEND_API_KEY=your_resend_api_key_here

# Database Configuration
DATABASE_PASSWORD=your_database_password_here

# Message Central Configuration
MESSAGE_CENTRAL_AUTH_TOKEN=your_message_central_auth_token_here
MESSAGE_CENTRAL_CUSTOMER_ID=your_message_central_customer_id_here
```

## Google OAuth Setup Instructions

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google OAuth2 API
4. Go to "Credentials" in the API & Services section
5. Create OAuth 2.0 Client IDs for:
   - **Web application** (for `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`)
   - **iOS** (for `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`)
   - **Android** (for `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`)

### 2. Client ID Configuration

#### Web Client ID
- **Application type**: Web application
- **Authorized redirect URIs**: 
  - `http://localhost:3000/auth/google/callback` (for development)
  - `https://yourdomain.com/auth/google/callback` (for production)

#### iOS Client ID
- **Application type**: iOS
- **Bundle ID**: `com.mecabal.mobile` (or your app's bundle ID)
- **App Store ID**: (optional, for production)

#### Android Client ID
- **Application type**: Android
- **Package name**: `com.mecabal.mobile` (or your app's package name)
- **SHA-1 certificate fingerprint**: (required for production)

### 3. Deep Link Configuration

The app is configured to handle OAuth callbacks via deep links:
- **Deep link scheme**: `mecabal://oauth/callback`
- **Redirect URI**: `mecabal://oauth/callback`

### 4. Environment Variables Usage

The environment variables are used in the following files:

- `src/services/googleAuth.ts` - Google OAuth service configuration
- `src/contexts/AuthContext.tsx` - Authentication context
- `src/screens/auth/OAuthCallbackScreen.tsx` - OAuth callback handler

### 5. Testing

To test the Google OAuth integration:

1. Set up the environment variables in your `.env` file
2. Run the app: `npx expo start`
3. Test the Google Sign-In flow on both iOS and Android
4. Verify that the OAuth callback is handled correctly

### 6. Production Considerations

For production deployment:

1. Update the redirect URIs in Google Cloud Console
2. Use production client IDs and secrets
3. Ensure deep link handling is properly configured
4. Test on actual devices, not just simulators

## Troubleshooting

### Common Issues

1. **"Invalid client ID" error**
   - Verify the client IDs are correct in your `.env` file
   - Ensure the client IDs match those in Google Cloud Console

2. **"Redirect URI mismatch" error**
   - Check that the redirect URI in Google Cloud Console matches `mecabal://oauth/callback`
   - Verify the deep link configuration in `app.json`

3. **"OAuth callback not working"**
   - Ensure the OAuth callback screen is properly registered in navigation
   - Check that deep link handling is configured correctly

4. **"Google Sign-In not available"**
   - Verify Google Play Services is installed (Android)
   - Check that the Google Services configuration files are present

### Debug Mode

To enable debug logging for Google OAuth:

```typescript
// In your app configuration
console.log('Google OAuth Config:', {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
});
```

## Security Notes

- Never commit your `.env` file to version control
- Use different client IDs for development and production
- Regularly rotate your client secrets
- Monitor OAuth usage in Google Cloud Console
- Implement proper error handling and logging
