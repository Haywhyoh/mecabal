// MeCabal Google Authentication Service
// Handles Google Sign-In integration for mobile apps
// Supports both iOS and Android platforms
// COMMENTED OUT FOR EXPO GO - Requires custom build

// import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type {
  NigerianUser,
  ApiResponse,
  AuthResponse
} from '../types/supabase';

// Backend API configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const API_TIMEOUT = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '10000', 10);

// Google OAuth configuration
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '123456789-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com';

// API client helper for Google auth endpoints
class GoogleApiClient {
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    
    try {
      const token = await AsyncStorage.getItem('auth_token');

      const config: RequestInit = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      console.log(`Google API Request: ${options.method || 'GET'} ${endpoint} - ${Date.now() - startTime}ms`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`,
        }));

        console.log(`❌ Google API Error for ${endpoint}:`, {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });

        return {
          success: false,
          error: errorData.message || `Request failed with status ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
        message: data.message,
      };
    } catch (error: any) {
      console.error('Google API Request failed:', error);
      
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout. Please check your internet connection.',
        };
      }
      
      return {
        success: false,
        error: error.message || 'Network error. Please try again.',
      };
    }
  }

  static async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'GET' });
  }

  static async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' });
  }
}

export class MeCabalGoogleAuth {
  private static isConfigured = false;

  // Configure Google Sign-In with platform-specific settings
  static async configure(): Promise<void> {
    console.log('⚠️ Google Sign-In is disabled for Expo Go');
    return;

    /* if (this.isConfigured) {
      return;
    }

    try {
      console.log('🔧 Configuring Google Sign-In...');

      await GoogleSignin.configure({
        // Use web client ID for both platforms
        webClientId: GOOGLE_WEB_CLIENT_ID,

        // Platform-specific configurations
        ...(Platform.OS === 'ios' && {
          iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        }),

        // Android configuration
        ...(Platform.OS === 'android' && {
          // Android client ID will be read from google-services.json
        }),

        // OAuth scopes
        scopes: ['email', 'profile'],

        // Offline access for refresh tokens
        offlineAccess: true,

        // Hosted domain (optional - for G Suite accounts)
        hostedDomain: '', // Leave empty for all Google accounts

        // Force code for refresh token
        forceCodeForRefreshToken: true,

        // Account name (optional)
        accountName: '',

        // Google One Tap (web only)
        googleSignIn: {
          scopes: ['email', 'profile'],
        },
      });

      this.isConfigured = true;
      console.log('✅ Google Sign-In configured successfully');
    } catch (error) {
      console.error('❌ Failed to configure Google Sign-In:', error);
      throw new Error('Failed to configure Google Sign-In. Please check your configuration.');
    } */
  }

  // Sign in with Google
  static async signInWithGoogle(): Promise<AuthResponse> {
    console.log('⚠️ Google Sign-In is disabled for Expo Go');
    return {
      success: false,
      error: 'Google Sign-In requires a custom build and is not available in Expo Go',
    };

    /* try {
      // Ensure Google Sign-In is configured
      await this.configure();

      console.log('🔐 Starting Google Sign-In flow...');

      // Check if device supports Google Play Services (Android)
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();

      console.log('✅ Google Sign-In successful:', {
        id: userInfo.user.id,
        email: userInfo.user.email,
        name: userInfo.user.name,
      });

      // Extract ID token for backend verification
      const idToken = userInfo.idToken;
      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      // Send ID token to backend for verification and user creation/login
      const authResult = await this.handleGoogleCallback(idToken);

      return authResult;
    } catch (error: any) {
      console.error('❌ Google Sign-In failed:', error);

      // Handle specific Google Sign-In errors
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return {
          success: false,
          error: 'Sign-in was cancelled by user',
        };
      } else if (error.code === statusCodes.IN_PROGRESS) {
        return {
          success: false,
          error: 'Sign-in is already in progress',
        };
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return {
          success: false,
          error: 'Google Play Services not available. Please update Google Play Services.',
        };
      } else if (error.code === statusCodes.SIGN_IN_REQUIRED) {
        return {
          success: false,
          error: 'Sign-in required. Please try again.',
        };
      }

      return {
        success: false,
        error: error.message || 'Google Sign-In failed. Please try again.',
      };
    } */
  }

  // Handle Google callback with ID token
  static async handleGoogleCallback(idToken: string): Promise<AuthResponse> {
    try {
      console.log('🔄 Sending Google ID token to backend for verification...');

      // Send ID token to backend for verification
      const result = await GoogleApiClient.post<any>('/auth/google/mobile', {
        idToken: idToken,
      });

      if (!result.success) {
        console.log('❌ Backend Google auth failed:', result.error);
        return {
          success: false,
          error: result.error || 'Google authentication failed',
        };
      }

      const { data } = result;
      console.log('✅ Backend Google auth successful:', {
        userId: data.user?.id,
        email: data.user?.email,
        isNewUser: data.isNewUser,
      });

      // Store authentication tokens
      if (data.accessToken) {
        await AsyncStorage.setItem('auth_token', data.accessToken);
        if (data.refreshToken) {
          await AsyncStorage.setItem('refresh_token', data.refreshToken);
        }
        console.log('✅ Google auth tokens stored successfully');
      }

      return {
        success: true,
        user: data.user as NigerianUser,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        message: data.message || 'Google authentication successful',
        isNewUser: data.isNewUser || false,
      };
    } catch (error: any) {
      console.error('❌ Google callback handling failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to process Google authentication',
      };
    }
  }

  // Sign out from Google
  static async signOutFromGoogle(): Promise<void> {
    console.log('⚠️ Google Sign-Out is disabled for Expo Go');
    // Clear local tokens
    await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);

    /* try {
      console.log('🚪 Signing out from Google...');

      // Sign out from Google
      await GoogleSignin.signOut();

      // Clear local tokens
      await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);

      console.log('✅ Google Sign-Out successful');
    } catch (error) {
      console.error('❌ Google Sign-Out failed:', error);
      // Still clear local tokens even if Google sign-out fails
      await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);
    } */
  }

  // Check if user is signed in to Google
  static async isSignedIn(): Promise<boolean> {
    console.log('⚠️ Google sign-in check is disabled for Expo Go');
    return false;

    /* try {
      await this.configure();
      const isSignedIn = await GoogleSignin.isSignedIn();
      return isSignedIn;
    } catch (error) {
      console.error('Error checking Google sign-in status:', error);
      return false;
    } */
  }

  // Get current Google user info
  static async getCurrentGoogleUser(): Promise<any | null> {
    console.log('⚠️ Get current Google user is disabled for Expo Go');
    return null;

    /* try {
      await this.configure();
      const userInfo = await GoogleSignin.getCurrentUser();
      return userInfo;
    } catch (error) {
      console.error('Error getting current Google user:', error);
      return null;
    } */
  }

  // Link Google account to existing user
  static async linkGoogleAccount(): Promise<AuthResponse> {
    console.log('⚠️ Google account linking is disabled for Expo Go');
    return {
      success: false,
      error: 'Google account linking requires a custom build and is not available in Expo Go',
    };

    /* try {
      // Ensure Google Sign-In is configured
      await this.configure();

      console.log('🔗 Starting Google account linking...');

      // Check if device supports Google Play Services (Android)
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();

      if (!userInfo.idToken) {
        throw new Error('No ID token received from Google');
      }

      // Send ID token to backend for account linking
      const result = await GoogleApiClient.post<any>('/auth/google/link', {
        idToken: userInfo.idToken,
      });

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to link Google account',
        };
      }

      const { data } = result;
      console.log('✅ Google account linked successfully');

      return {
        success: true,
        user: data.user as NigerianUser,
        message: data.message || 'Google account linked successfully',
      };
    } catch (error: any) {
      console.error('❌ Google account linking failed:', error);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return {
          success: false,
          error: 'Account linking was cancelled by user',
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to link Google account',
      };
    } */
  }

  // Unlink Google account from user
  static async unlinkGoogleAccount(): Promise<AuthResponse> {
    try {
      console.log('🔓 Unlinking Google account...');

      const result = await GoogleApiClient.post<any>('/auth/google/unlink', {});

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to unlink Google account',
        };
      }

      const { data } = result;
      console.log('✅ Google account unlinked successfully');

      return {
        success: true,
        user: data.user as NigerianUser,
        message: data.message || 'Google account unlinked successfully',
      };
    } catch (error: any) {
      console.error('❌ Google account unlinking failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to unlink Google account',
      };
    }
  }

  // Revoke Google access (sign out and revoke tokens)
  static async revokeGoogleAccess(): Promise<void> {
    console.log('⚠️ Google access revocation is disabled for Expo Go');
    // Clear local tokens
    await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);

    /* try {
      console.log('🔄 Revoking Google access...');

      // Revoke access and sign out
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();

      // Clear local tokens
      await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);

      console.log('✅ Google access revoked successfully');
    } catch (error) {
      console.error('❌ Google access revocation failed:', error);
      // Still clear local tokens
      await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);
    } */
  }

  // Get Google Sign-In status for debugging
  static async getGoogleSignInStatus(): Promise<{
    isConfigured: boolean;
    isSignedIn: boolean;
    hasPlayServices: boolean;
    currentUser: any | null;
  }> {
    console.log('⚠️ Google Sign-In status is disabled for Expo Go');
    return {
      isConfigured: false,
      isSignedIn: false,
      hasPlayServices: false,
      currentUser: null,
    };

    /* try {
      const isConfigured = this.isConfigured;
      const isSignedIn = await this.isSignedIn();
      const hasPlayServices = await GoogleSignin.hasPlayServices();
      const currentUser = await this.getCurrentGoogleUser();

      return {
        isConfigured,
        isSignedIn,
        hasPlayServices,
        currentUser,
      };
    } catch (error) {
      console.error('Error getting Google Sign-In status:', error);
      return {
        isConfigured: false,
        isSignedIn: false,
        hasPlayServices: false,
        currentUser: null,
      };
    } */
  }

  // Helper: Check if Google Sign-In is available on this device
  static async isGoogleSignInAvailable(): Promise<boolean> {
    console.log('⚠️ Google Sign-In availability check is disabled for Expo Go');
    return false;

    /* try {
      await this.configure();
      const hasPlayServices = await GoogleSignin.hasPlayServices();
      return hasPlayServices;
    } catch (error) {
      console.error('Google Sign-In not available:', error);
      return false;
    } */
  }
}

export default MeCabalGoogleAuth;
