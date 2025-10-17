// MeCabal OAuth Callback Handler Screen
// Handles deep links from OAuth flow and processes authorization codes/tokens
// Shows loading state and handles errors gracefully

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
  Linking,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { MeCabalGoogleAuth } from '../../services/googleAuth';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

interface OAuthCallbackScreenProps {
  navigation: any;
  route: any;
}

export default function OAuthCallbackScreen({ navigation, route }: OAuthCallbackScreenProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [progress, setProgress] = useState<string>('Processing authentication...');
  
  const { handleGoogleCallback } = useAuth();

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      setProgress('Extracting authorization code...');
      
      // Get the deep link URL from route params or navigation state
      const deepLinkUrl = route.params?.url || route.params?.code;
      
      if (!deepLinkUrl) {
        throw new Error('No authorization code or URL provided');
      }

      console.log('🔗 OAuth callback received:', deepLinkUrl);

      // Parse the URL to extract parameters
      const url = new URL(deepLinkUrl);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');
      const errorDescription = url.searchParams.get('error_description');

      // Handle OAuth errors
      if (error) {
        throw new Error(errorDescription || error || 'OAuth authorization failed');
      }

      if (!code) {
        throw new Error('No authorization code found in callback URL');
      }

      setProgress('Verifying authorization code...');

      // Handle different OAuth providers based on the URL or state
      if (deepLinkUrl.includes('google') || state?.includes('google')) {
        await handleGoogleOAuthCallback(code);
      } else if (deepLinkUrl.includes('facebook') || state?.includes('facebook')) {
        await handleFacebookOAuthCallback(code);
      } else if (deepLinkUrl.includes('apple') || state?.includes('apple')) {
        await handleAppleOAuthCallback(code);
      } else {
        // Default to Google if no provider is specified
        await handleGoogleOAuthCallback(code);
      }

    } catch (error: any) {
      console.error('❌ OAuth callback error:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Authentication failed. Please try again.');
    }
  };

  const handleGoogleOAuthCallback = async (code: string) => {
    try {
      setProgress('Exchanging code for Google access token...');
      
      // Exchange authorization code for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
          client_secret: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET || '',
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI || '',
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange authorization code for access token');
      }

      const tokenData = await tokenResponse.json();
      const { access_token, id_token } = tokenData;

      if (!id_token) {
        throw new Error('No ID token received from Google');
      }

      setProgress('Verifying Google ID token...');

      // Use our Google auth service to handle the ID token
      const success = await handleGoogleCallback(id_token);

      if (success) {
        setStatus('success');
        setProgress('Authentication successful! Redirecting...');
        
        // Navigate to main app after a short delay
        setTimeout(() => {
          navigation.navigate('MainApp');
        }, 1500);
      } else {
        throw new Error('Failed to verify Google ID token');
      }

    } catch (error: any) {
      console.error('❌ Google OAuth callback error:', error);
      throw error;
    }
  };

  const handleFacebookOAuthCallback = async (code: string) => {
    try {
      setProgress('Processing Facebook authentication...');
      
      // TODO: Implement Facebook OAuth callback handling
      // This would involve exchanging the code for an access token
      // and then using Facebook's API to get user information
      
      throw new Error('Facebook OAuth not yet implemented');
    } catch (error: any) {
      console.error('❌ Facebook OAuth callback error:', error);
      throw error;
    }
  };

  const handleAppleOAuthCallback = async (code: string) => {
    try {
      setProgress('Processing Apple authentication...');
      
      // TODO: Implement Apple OAuth callback handling
      // This would involve exchanging the code for an access token
      // and then using Apple's API to get user information
      
      throw new Error('Apple OAuth not yet implemented');
    } catch (error: any) {
      console.error('❌ Apple OAuth callback error:', error);
      throw error;
    }
  };

  const handleRetry = () => {
    setStatus('loading');
    setErrorMessage('');
    setProgress('Retrying authentication...');
    handleOAuthCallback();
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const renderLoadingState = () => (
    <View style={styles.content}>
      <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      <Text style={styles.progressText}>{progress}</Text>
      <Text style={styles.instructionText}>
        Please wait while we complete your authentication...
      </Text>
    </View>
  );

  const renderSuccessState = () => (
    <View style={styles.content}>
      <View style={styles.successIcon}>
        <Text style={styles.successIconText}>✓</Text>
      </View>
      <Text style={styles.successTitle}>Authentication Successful!</Text>
      <Text style={styles.successMessage}>
        You have been successfully signed in. Redirecting to the app...
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.content}>
      <View style={styles.errorIcon}>
        <Text style={styles.errorIconText}>✗</Text>
      </View>
      <Text style={styles.errorTitle}>Authentication Failed</Text>
      <Text style={styles.errorMessage}>{errorMessage}</Text>
      
      <View style={styles.buttonContainer}>
        <Text style={styles.retryButton} onPress={handleRetry}>
          Try Again
        </Text>
        <Text style={styles.backButton} onPress={handleGoBack}>
          Go Back
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {status === 'loading' && renderLoadingState()}
      {status === 'success' && renderSuccessState()}
      {status === 'error' && renderErrorState()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  loader: {
    marginBottom: SPACING.lg,
  },
  progressText: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  instructionText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeights.relaxed,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.success || '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  successIconText: {
    fontSize: 40,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  successMessage: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeights.relaxed,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.error || '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  errorIconText: {
    fontSize: 40,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  errorTitle: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  errorMessage: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeights.relaxed,
    marginBottom: SPACING.xl,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 300,
  },
  retryButton: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    flex: 1,
    marginRight: SPACING.sm,
  },
  backButton: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    flex: 1,
    marginLeft: SPACING.sm,
  },
});

export default OAuthCallbackScreen;
