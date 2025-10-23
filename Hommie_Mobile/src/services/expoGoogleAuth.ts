// Expo Google Authentication Service
// Uses Expo Auth Session for Google Sign-In (compatible with Expo Go)

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { 
  NigerianUser, 
  ApiResponse, 
  AuthResponse 
} from '../types/supabase';

// Complete the auth session in the browser
WebBrowser.maybeCompleteAuthSession();

// Backend API configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const API_TIMEOUT = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '10000', 10);

// Google OAuth configuration
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '123456789-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '123456789-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '123456789-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com';

// API client helper for Google auth endpoints
class ExpoGoogleApiClient {
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const url = `${API_BASE_URL}${endpoint}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const responseTime = Date.now() - startTime;
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return {
        success: true,
        data,
        message: 'Request successful',
        responseTime,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      if (error.name === 'AbortError') {
        return {
          success: false,
          data: null as T,
          message: 'Request timeout',
          responseTime,
        };
      }
      
      return {
        success: false,
        data: null as T,
        message: error.message || 'Network error',
        responseTime,
      };
    }
  }

  // Google OAuth token exchange
  static async exchangeGoogleToken(googleToken: string): Promise<ApiResponse<AuthResponse>> {
    return this.makeRequest<AuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ token: googleToken }),
    });
  }

  // Refresh Google token
  static async refreshGoogleToken(refreshToken: string): Promise<ApiResponse<AuthResponse>> {
    return this.makeRequest<AuthResponse>('/auth/google/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  // Revoke Google token
  static async revokeGoogleToken(accessToken: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('/auth/google/revoke', {
      method: 'POST',
      body: JSON.stringify({ accessToken }),
    });
  }
}

// Expo Google Auth Service
class ExpoGoogleAuthService {
  private static instance: ExpoGoogleAuthService;
  private authRequest: AuthSession.AuthRequest | null = null;

  private constructor() {}

  static getInstance(): ExpoGoogleAuthService {
    if (!ExpoGoogleAuthService.instance) {
      ExpoGoogleAuthService.instance = new ExpoGoogleAuthService();
    }
    return ExpoGoogleAuthService.instance;
  }

  // Configure Google OAuth
  private configureGoogleAuth(): AuthSession.AuthRequestConfig {
    const redirectUri = AuthSession.makeRedirectUri({
      useProxy: true,
    });

    return {
      clientId: Platform.OS === 'ios' ? GOOGLE_IOS_CLIENT_ID : GOOGLE_ANDROID_CLIENT_ID,
      scopes: [
        'openid',
        'profile',
        'email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      extraParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    };
  }

  // Initialize Google Auth
  async initialize(): Promise<void> {
    try {
      const config = this.configureGoogleAuth();
      this.authRequest = new AuthSession.AuthRequest(config);
      
      console.log('Expo Google Auth initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Expo Google Auth:', error);
      throw new Error('Failed to initialize Google authentication');
    }
  }

  // Sign in with Google
  async signIn(): Promise<ApiResponse<AuthResponse>> {
    try {
      if (!this.authRequest) {
        await this.initialize();
      }

      if (!this.authRequest) {
        throw new Error('Google Auth not initialized');
      }

      // Start the authentication flow
      const result = await this.authRequest.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      });

      if (result.type === 'success') {
        // Exchange the authorization code for tokens
        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId: this.authRequest.clientId!,
            code: result.params.code,
            redirectUri: this.authRequest.redirectUri!,
            extraParams: {
              code_verifier: this.authRequest.codeChallenge,
            },
          },
          {
            tokenEndpoint: 'https://oauth2.googleapis.com/token',
          }
        );

        // Send the access token to your backend
        const backendResponse = await ExpoGoogleApiClient.exchangeGoogleToken(tokenResponse.accessToken);

        if (backendResponse.success && backendResponse.data) {
          // Store tokens
          await this.storeTokens(backendResponse.data);
          
          return {
            success: true,
            data: backendResponse.data,
            message: 'Google sign-in successful',
          };
        } else {
          return {
            success: false,
            data: null as AuthResponse,
            message: backendResponse.message || 'Failed to authenticate with backend',
          };
        }
      } else if (result.type === 'cancel') {
        return {
          success: false,
          data: null as AuthResponse,
          message: 'Google sign-in cancelled by user',
        };
      } else {
        return {
          success: false,
          data: null as AuthResponse,
          message: 'Google sign-in failed',
        };
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      return {
        success: false,
        data: null as AuthResponse,
        message: error.message || 'Google sign-in failed',
      };
    }
  }

  // Sign out from Google
  async signOut(): Promise<ApiResponse<void>> {
    try {
      const accessToken = await AsyncStorage.getItem('google_access_token');
      
      if (accessToken) {
        // Revoke token on backend
        await ExpoGoogleApiClient.revokeGoogleToken(accessToken);
      }

      // Clear stored tokens
      await this.clearTokens();

      return {
        success: true,
        data: undefined,
        message: 'Google sign-out successful',
      };
    } catch (error: any) {
      console.error('Google sign-out error:', error);
      return {
        success: false,
        data: undefined,
        message: error.message || 'Google sign-out failed',
      };
    }
  }

  // Check if user is signed in
  async isSignedIn(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const googleToken = await AsyncStorage.getItem('google_access_token');
      return !!(token && googleToken);
    } catch (error) {
      console.error('Error checking sign-in status:', error);
      return false;
    }
  }

  // Get current user info
  async getCurrentUser(): Promise<NigerianUser | null> {
    try {
      const userJson = await AsyncStorage.getItem('current_user');
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Store authentication tokens
  private async storeTokens(authResponse: AuthResponse): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        ['auth_token', authResponse.accessToken],
        ['refresh_token', authResponse.refreshToken || ''],
        ['google_access_token', authResponse.googleAccessToken || ''],
        ['current_user', JSON.stringify(authResponse.user)],
        ['token_expiry', authResponse.expiresAt?.toString() || ''],
      ]);
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  // Clear authentication tokens
  private async clearTokens(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        'auth_token',
        'refresh_token',
        'google_access_token',
        'current_user',
        'token_expiry',
      ]);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  // Refresh authentication token
  async refreshToken(): Promise<ApiResponse<AuthResponse>> {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        return {
          success: false,
          data: null as AuthResponse,
          message: 'No refresh token available',
        };
      }

      const response = await ExpoGoogleApiClient.refreshGoogleToken(refreshToken);
      
      if (response.success && response.data) {
        await this.storeTokens(response.data);
      }

      return response;
    } catch (error: any) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        data: null as AuthResponse,
        message: error.message || 'Token refresh failed',
      };
    }
  }

  // Check if token is expired
  async isTokenExpired(): Promise<boolean> {
    try {
      const expiryString = await AsyncStorage.getItem('token_expiry');
      
      if (!expiryString) {
        return true;
      }

      const expiry = new Date(expiryString);
      const now = new Date();
      
      // Consider token expired if it expires within the next 5 minutes
      return expiry.getTime() - now.getTime() < 5 * 60 * 1000;
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true;
    }
  }

  // Get stored access token
  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  // Get stored Google access token
  async getGoogleAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('google_access_token');
    } catch (error) {
      console.error('Error getting Google access token:', error);
      return null;
    }
  }
}

// Export singleton instance
export const expoGoogleAuth = ExpoGoogleAuthService.getInstance();
export default expoGoogleAuth;









