# Google OAuth Setup for MeCabal Mobile App

This guide explains how to set up Google OAuth authentication for the MeCabal mobile app.

## Prerequisites

1. Google Cloud Console account
2. Firebase project
3. Expo development environment

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google Sign-In API
4. Create OAuth 2.0 credentials

## Step 2: Configure OAuth 2.0 Credentials

### For Android:
1. Go to [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials)
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. Select "Android" as application type
4. Enter package name: `com.yourcompany.mecabal`
5. Get your SHA-1 certificate fingerprint:
   ```bash
   # For development
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   
   # For production (replace with your keystore)
   keytool -list -v -keystore your-release-key.keystore -alias your-key-alias
   ```
6. Enter the SHA-1 fingerprint
7. Download the `google-services.json` file
8. Replace the placeholder file in `Hommie_Mobile/google-services.json`

### For iOS:
1. Create OAuth 2.0 Client ID for iOS
2. Enter bundle ID: `com.yourcompany.mecabal`
3. Download the `GoogleService-Info.plist` file
4. Replace the placeholder file in `Hommie_Mobile/GoogleService-Info.plist`

### For Web (Backend):
1. Create OAuth 2.0 Client ID for Web application
2. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (development)
   - `https://yourdomain.com/auth/google/callback` (production)
3. Note down the Client ID and Client Secret for backend configuration

## Step 3: Configure Environment Variables

Add the following environment variables to your backend `.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_web_client_id
GOOGLE_CLIENT_SECRET=your_web_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Mobile App Client IDs (for token verification)
GOOGLE_IOS_CLIENT_ID=your_ios_client_id
GOOGLE_ANDROID_CLIENT_ID=your_android_client_id

# Frontend URL for OAuth redirects
FRONTEND_URL=http://localhost:3000
```

## Step 4: Install Dependencies

The following dependencies are already configured in the mobile app:

```bash
# Already installed in package.json
@react-native-google-signin/google-signin
expo-auth-session
expo-crypto
```

## Step 5: Update App Configuration

The `app.json` file is already configured with:
- Google Services file references
- Google Sign-In plugin
- Platform-specific configurations

## Step 6: Test Configuration

1. Start the backend server
2. Start the mobile app
3. Test Google Sign-In flow
4. Verify tokens are properly exchanged

## Troubleshooting

### Common Issues:

1. **"Invalid client" error**: Check that client IDs match between Google Console and app configuration
2. **"Redirect URI mismatch"**: Ensure redirect URIs are correctly configured in Google Console
3. **"Package name mismatch"**: Verify package name in Google Console matches app configuration
4. **"SHA-1 fingerprint mismatch"**: Ensure correct SHA-1 fingerprint is registered

### Debug Steps:

1. Check Google Console for any error messages
2. Verify environment variables are correctly set
3. Test with different client IDs (web vs mobile)
4. Check network requests in browser/device logs

## Security Notes

1. Never commit real Google Services files to version control
2. Use different client IDs for development and production
3. Regularly rotate client secrets
4. Monitor OAuth usage in Google Console
5. Implement proper error handling for OAuth failures

## File Structure

```
Hommie_Mobile/
├── app.json                          # App configuration with Google OAuth
├── google-services.json              # Android Google Services config
├── GoogleService-Info.plist          # iOS Google Services config
├── GOOGLE_OAUTH_SETUP.md            # This setup guide
└── src/
    └── services/
        └── googleAuth.ts            # Google Auth service (to be created)
```

## Next Steps

After completing this setup:
1. Implement Google Sign-In service in the mobile app
2. Create Google Sign-In button component
3. Update authentication context
4. Test end-to-end OAuth flow
