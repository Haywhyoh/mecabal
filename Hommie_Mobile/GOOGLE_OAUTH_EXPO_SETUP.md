# Google OAuth Setup for Expo Go

This guide helps you set up Google OAuth to work with Expo Go using Expo Auth Session.

## Issues Fixed

1. **RNGoogleSignin Module Not Found**: This error occurs because Expo Go doesn't support native modules like `@react-native-google-signin/google-signin`
2. **New Architecture Warning**: Enabled New Architecture to match Expo Go

## Solutions Implemented

### 1. Development Build (Recommended)
- Installed `expo-dev-client`
- Updated `app.json` with `expo-dev-client` plugin
- Enabled New Architecture (`newArchEnabled: true`)
- Created development build with `npx expo prebuild`

### 2. Expo Auth Session Alternative
- Created `expoGoogleAuth.ts` service that works with Expo Go
- Uses `expo-auth-session` instead of native Google Sign-In
- Compatible with both iOS and Android

## Environment Variables Required

Add these to your `.env` file:

```env
# Google OAuth Configuration
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_google_web_client_id_here
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_google_android_client_id_here
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_google_ios_client_id_here
```

## How to Use

### Option 1: Use Development Build
1. Run `npx expo run:android` or `npx expo run:ios`
2. This creates a development build that supports native modules
3. Use your existing `googleAuth.ts` service

### Option 2: Use Expo Auth Session
1. Replace imports in your auth components:
   ```typescript
   // Instead of:
   import { googleAuth } from '../services/googleAuth';
   
   // Use:
   import { expoGoogleAuth } from '../services/expoGoogleAuth';
   ```

2. Update method calls:
   ```typescript
   // Instead of:
   const result = await googleAuth.signIn();
   
   // Use:
   const result = await expoGoogleAuth.signIn();
   ```

## Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - **Web client**: For Expo Auth Session
   - **Android client**: For Android development build
   - **iOS client**: For iOS development build

## Testing

### With Development Build
- Install the development build on your device
- Run `npx expo start --dev-client`
- Google Sign-In will work with native modules

### With Expo Go
- Use the `expoGoogleAuth` service
- Google Sign-In will work through web browser
- User experience is slightly different but functional

## Troubleshooting

### RNGoogleSignin Error
- **Cause**: Running in Expo Go with native modules
- **Solution**: Use development build or expoGoogleAuth service

### New Architecture Warning
- **Cause**: Mismatch between Expo Go and project settings
- **Solution**: Set `newArchEnabled: true` in app.json

### Token Exchange Errors
- **Cause**: Incorrect Google OAuth configuration
- **Solution**: Verify client IDs in Google Cloud Console

## Next Steps

1. Choose your preferred solution (development build or expoGoogleAuth)
2. Update your environment variables
3. Test Google Sign-In functionality
4. Update your auth components to use the chosen service

The development build approach is recommended for production apps, while the expoGoogleAuth approach is better for quick testing in Expo Go.


