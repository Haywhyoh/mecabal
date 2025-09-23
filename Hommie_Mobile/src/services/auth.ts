// MeCabal Authentication Service
// Nigerian-specific authentication with phone verification
// Migrated to use custom NestJS backend API

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { 
  NigerianUser, 
  ApiResponse, 
  OTPResponse, 
  VerifyOTPResponse,
  AuthResponse 
} from '../types/supabase';
import type { NigerianCarrier } from '../types/nigerian';

// Backend API configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const API_TIMEOUT = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '10000', 10);

// API client helper
class ApiClient {
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    
    try {
      const token = await AsyncStorage.getItem('auth_token');

      // Debug token retrieval
      if (token) {
        console.log(`🔐 Retrieved token for ${endpoint}:`, token.substring(0, 50) + '...');
      } else {
        // Only log as warning for endpoints that likely need auth
        const publicEndpoints = ['/auth/send-otp', '/auth/complete-email-login', '/auth/refresh', '/auth/verify-otp'];
        const isPublicEndpoint = publicEndpoints.some(pe => endpoint.includes(pe));
        if (!isPublicEndpoint) {
          console.log(`⚠️ No token found for ${endpoint} (may require authentication)`);
        } else {
          console.log(`🔓 Public endpoint ${endpoint} (no token needed)`);
        }
      }

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
      
      console.log(`API Request: ${options.method || 'GET'} ${endpoint} - ${Date.now() - startTime}ms`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`,
        }));

        console.log(`❌ API Error for ${endpoint}:`, {
          status: response.status,
          statusText: response.statusText,
          errorData,
          tokenPresent: !!token
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
      console.error('API Request failed:', error);
      
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

export class MeCabalAuth {
  // Send OTP to Nigerian phone number
  static async sendOTP(
    phoneNumber: string,
    purpose: 'registration' | 'login' | 'password_reset' = 'registration',
    method: 'sms' | 'whatsapp' = 'sms',
    email?: string
  ): Promise<OTPResponse> {
    try {
      // Validate phone number format
      if (!this.isValidNigerianPhone(phoneNumber)) {
        return {
          success: false,
          error: 'Invalid Nigerian phone number. Use format +234XXXXXXXXXX'
        };
      }

      // Call new backend API endpoint
      const result = await ApiClient.post<any>('/auth/phone/send-otp', {
        phone: phoneNumber,
        purpose,
        method,
        ...(email && { email })
      });

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to send SMS OTP'
        };
      }

      const { data } = result;
      
      // Extract carrier info from response for user feedback
      const carrierInfo = data.carrier ? {
        name: data.carrier.name,
        color: data.carrier.color || '#00A651'
      } : undefined;

      return {
        success: true,
        message: data.message || 'SMS OTP sent successfully to your phone',
        expires_at: data.expires_at || new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        carrier: carrierInfo?.name,
        carrier_color: carrierInfo?.color
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send SMS OTP'
      };
    }
  }

  // Verify OTP code
  static async verifyOTP(
    phoneNumber: string, 
    otpCode: string, 
    purpose: 'registration' | 'login' | 'password_reset' = 'registration'
  ): Promise<VerifyOTPResponse> {
    try {
      // Debug logging
      console.log('🔍 Frontend calling phone OTP verification:', {
        phoneNumber,
        otpCode,
        purpose,
        endpoint: '/auth/phone/verify-otp'
      });

      // Call new backend API endpoint
      const result = await ApiClient.post<any>('/auth/phone/verify-otp', {
        phoneNumber: phoneNumber,
        otpCode: otpCode,
        purpose
      });

      // Debug the response
      console.log('📤 Frontend received phone OTP response:', result);

      if (!result.success) {
        return {
          success: false,
          verified: false,
          error: result.error || 'Failed to verify SMS OTP'
        };
      }

      const { data } = result;

      if (!data.verified) {
        return {
          success: false,
          verified: false,
          error: data.message || 'Invalid or expired OTP code'
        };
      }

      // Store authentication tokens if provided (camelCase format only)
      if (data.accessToken) {
        await AsyncStorage.setItem('auth_token', data.accessToken);
        if (data.refreshToken) {
          await AsyncStorage.setItem('refresh_token', data.refreshToken);
        }
        console.log('✅ Tokens stored successfully');

        // Small delay to ensure tokens are fully persisted
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      return {
        success: true,
        verified: true,
        message: data.message || 'Phone number verified successfully',
        carrier: data.carrier,
        user: data.user,
        tokens: data.tokens
      };
    } catch (error: any) {
      return {
        success: false,
        verified: false,
        error: error.message || 'Failed to verify SMS OTP'
      };
    }
  }

  // Create user account after OTP verification
  static async createUser(userData: {
    phone_number?: string;
    email?: string;
    first_name: string;
    last_name: string;
    state_of_origin?: string;
    preferred_language?: string;
    carrier_info?: NigerianCarrier;
  }): Promise<AuthResponse> {
    try {
      // Call new backend API endpoint to create user
      const result = await ApiClient.post<any>('/auth/register-mobile', {
        phone_number: userData.phone_number,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        state_of_origin: userData.state_of_origin,
        preferred_language: userData.preferred_language || 'en',
        carrier_info: userData.carrier_info
      });

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to create user account'
        };
      }

      const { data } = result;
      
      // Store authentication tokens (camelCase format only)
      if (data.accessToken) {
        await AsyncStorage.setItem('auth_token', data.accessToken);
        if (data.refreshToken) {
          await AsyncStorage.setItem('refresh_token', data.refreshToken);
        }
      }

      return {
        success: true,
        user: data.user as NigerianUser,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        message: data.message
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create user account'
      };
    }
  }

  // Login with phone number (triggers OTP)
  static async loginWithPhone(phoneNumber: string): Promise<ApiResponse<any>> {
    try {
      // Send OTP for login (backend will check if user exists)
      const otpResult = await this.sendOTP(phoneNumber, 'login');
      return otpResult;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to initiate phone login'
      };
    }
  }

  // Complete login after OTP verification
  static async completeLogin(phoneNumber: string, otpCode: string): Promise<AuthResponse> {
    try {
      // Verify OTP and complete login in one step
      const result = await ApiClient.post<any>('/auth/phone/verify-otp', {
        phoneNumber: phoneNumber,
        otpCode: otpCode,
        purpose: 'login'
      });

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Login failed'
        };
      }

      const { data } = result;
      
      // Store authentication tokens (camelCase format only)
      if (data.accessToken) {
        await AsyncStorage.setItem('auth_token', data.accessToken);
        if (data.refreshToken) {
          await AsyncStorage.setItem('refresh_token', data.refreshToken);
        }
      }

      return {
        success: true,
        user: data.user as NigerianUser,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        message: data.message
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  }

  // Get current authenticated user
  static async getCurrentUser(): Promise<NigerianUser | null> {
    try {
      const token = await AsyncStorage.getItem('auth_token');

      if (!token) {
        console.log('🔍 No auth token found, user not authenticated');
        return null;
      }

      console.log('🔍 Attempting to get current user with token:', token.substring(0, 50) + '...');

      const result = await ApiClient.get<NigerianUser>('/auth/me');

      if (!result.success) {
        console.log('❌ /auth/me failed:', result.error);

        // Only attempt refresh if the error suggests token expiration
        if (result.error?.includes('401') || result.error?.includes('Unauthorized') || result.error?.includes('expired')) {
          console.log('🔄 Token appears expired, attempting refresh...');

          const refreshResult = await this.refreshToken();
          if (refreshResult) {
            console.log('✅ Token refreshed successfully, retrying /auth/me...');

            // Retry with new token
            const retryResult = await ApiClient.get<NigerianUser>('/auth/me');
            if (retryResult.success) {
              console.log('✅ Successfully retrieved user after token refresh');
              return retryResult.data?.user || retryResult.data!;
            } else {
              console.log('❌ Still failed after token refresh:', retryResult.error);
            }
          } else {
            console.log('❌ Token refresh failed');
          }
        } else {
          console.log('❌ Non-auth error, not attempting refresh:', result.error);
        }

        return null;
      }

      console.log('✅ Successfully retrieved current user');
      return result.data?.user || result.data!;
    } catch (error) {
      console.error('💥 Error getting current user:', error);
      return null;
    }
  }

  // Update user profile
  static async updateProfile(
    userId: string,
    updates: Partial<NigerianUser>
  ): Promise<ApiResponse<NigerianUser>> {
    try {
      const result = await ApiClient.put<NigerianUser>('/auth/profile', updates);

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to update profile'
        };
      }

      return {
        success: true,
        data: result.data!,
        message: result.message
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update profile'
      };
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      
      if (token) {
        // Call backend logout endpoint to invalidate tokens
        await ApiClient.post('/auth/logout', {});
      }
      
      // Clear local storage
      await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);
    } catch (error) {
      console.error('Error signing out:', error);
      // Clear local storage even if API call fails
      await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);
    }
  }

  // Check authentication status
  static async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      
      if (!token) {
        return false;
      }

      // Verify token with backend
      const result = await ApiClient.get('/auth/verify');
      
      if (!result.success) {
        // Try to refresh token
        const refreshResult = await this.refreshToken();
        return refreshResult;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  // Refresh authentication token
  static async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');

      if (!refreshToken) {
        console.log('🔄 No refresh token found, cannot refresh');
        return false;
      }

      console.log('🔄 Attempting token refresh with token:', refreshToken.substring(0, 50) + '...');

      const result = await ApiClient.post<any>('/auth/refresh', {
        refreshToken: refreshToken
      });

      if (!result.success) {
        console.log('❌ Token refresh failed:', result.error);
        // Don't clear tokens immediately - might be temporary network issue
        // Only clear on specific authentication errors
        if (result.error?.includes('Invalid') || result.error?.includes('expired')) {
          console.log('🧹 Clearing invalid/expired tokens');
          await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);
        }
        return false;
      }

      const { data } = result;
      console.log('✅ Token refresh successful, data keys:', Object.keys(data || {}));

      // Handle both camelCase and snake_case token formats
      const accessToken = data.accessToken || data.access_token;
      const newRefreshToken = data.refreshToken || data.refresh_token;

      if (accessToken) {
        await AsyncStorage.setItem('auth_token', accessToken);
        console.log('✅ Stored new access token');

        if (newRefreshToken) {
          await AsyncStorage.setItem('refresh_token', newRefreshToken);
          console.log('✅ Stored new refresh token');
        }
      } else {
        console.error('❌ Unexpected token format in refresh response:', data);
        return false;
      }

      return true;
    } catch (error) {
      console.error('💥 Token refresh failed with error:', error);
      // Don't clear tokens on network errors, only on auth errors
      return false;
    }
  }

  // Get stored authentication token
  static async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Helper: Validate Nigerian phone number
  private static isValidNigerianPhone(phone: string): boolean {
    // Nigerian phone format: +234XXXXXXXXXX (where X are digits)
    const nigerianPhoneRegex = /^\+234[789][01]\d{8}$/;
    return nigerianPhoneRegex.test(phone);
  }

  // Helper: Extract carrier from phone number
  static extractCarrierFromPhone(phone: string): NigerianCarrier['name'] | null {
    const carriers: { [key: string]: NigerianCarrier['name'] } = {
      '0803': 'MTN', '0806': 'MTN', '0703': 'MTN', '0706': 'MTN',
      '0813': 'MTN', '0816': 'MTN', '0810': 'MTN', '0814': 'MTN',
      '0903': 'MTN', '0906': 'MTN',
      
      '0802': 'Airtel', '0808': 'Airtel', '0812': 'Airtel', '0701': 'Airtel',
      '0708': 'Airtel', '0901': 'Airtel', '0902': 'Airtel', '0904': 'Airtel',
      '0907': 'Airtel',
      
      '0805': 'Glo', '0807': 'Glo', '0815': 'Glo', '0811': 'Glo',
      '0905': 'Glo', '0915': 'Glo',
      
      '0809': '9mobile', '0818': '9mobile', '0817': '9mobile',
      '0909': '9mobile', '0908': '9mobile'
    };

    // Remove country code and normalize
    let normalizedPhone = phone.replace(/^\+234/, '');
    if (normalizedPhone.startsWith('234')) {
      normalizedPhone = normalizedPhone.substring(3);
    }
    if (!normalizedPhone.startsWith('0')) {
      normalizedPhone = '0' + normalizedPhone;
    }

    const prefix = normalizedPhone.substring(0, 4);
    return carriers[prefix] || null;
  }

  // Helper: Format Nigerian phone number for display
  static formatNigerianPhone(phone: string): string {
    // Convert +234XXXXXXXXXX to +234 XXX XXX XXXX
    if (phone.length === 14 && phone.startsWith('+234')) {
      return `+234 ${phone.substring(4, 7)} ${phone.substring(7, 10)} ${phone.substring(10)}`;
    }
    return phone;
  }

  // Location Setup - Save user location data to backend
  static async setupLocation(locationData: {
    state?: string;
    city?: string;
    estate?: string;
    location?: string;
    landmark?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    completeRegistration?: boolean;
  }): Promise<ApiResponse<any>> {
    try {
      const result = await ApiClient.post<any>('/auth/location/setup', locationData);

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to save location'
        };
      }

      return {
        success: true,
        data: result.data,
        message: result.message || 'Location saved successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to save location'
      };
    }
  }

  // Email Authentication Methods (Using Supabase Built-in Auth)
  
  // Send OTP to email address using new backend API
  static async sendEmailOTP(
    email: string, 
    purpose: 'registration' | 'login' | 'password_reset' = 'registration'
  ): Promise<OTPResponse> {
    try {
      // Validate email format
      if (!this.isValidEmail(email)) {
        return {
          success: false,
          error: 'Invalid email address format'
        };
      }

      // Call new backend API endpoint
      const result = await ApiClient.post<any>('/auth/email/send-otp', {
        email,
        purpose
      });

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to send OTP email'
        };
      }

      const { data } = result;

      return {
        success: true,
        message: data.message || 'OTP code sent to your email address',
        expires_at: data.expires_at || new Date(Date.now() + 10 * 60 * 1000).toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send OTP email'
      };
    }
  }

  // Verify email OTP code using new backend API
  static async verifyEmailOTP(
    email: string,
    otpCode: string,
    purpose: 'registration' | 'login' | 'password_reset' = 'registration',
    userDetails?: {
      firstName?: string;
      lastName?: string;
      preferredLanguage?: string;
    }
  ): Promise<VerifyOTPResponse> {
    try {
      // Call new backend API endpoint
      const result = await ApiClient.post<any>('/auth/email/verify-otp', {
        email,
        otpCode: otpCode,
        purpose,
        ...userDetails
      });

      if (!result.success) {
        return {
          success: false,
          verified: false,
          error: result.error || 'Failed to verify OTP code'
        };
      }

      const { data } = result;

      // Store authentication tokens if provided (camelCase format only)
      if (data.accessToken) {
        await AsyncStorage.setItem('auth_token', data.accessToken);
        if (data.refreshToken) {
          await AsyncStorage.setItem('refresh_token', data.refreshToken);
        }
        console.log('✅ OTP verification tokens stored successfully');
      }

      return {
        success: true,
        verified: data.verified || false,
        message: data.message || (data.verified ? 'OTP verified successfully' : 'Invalid OTP code')
      };
    } catch (error: any) {
      return {
        success: false,
        verified: false,
        error: error.message || 'Failed to verify OTP code'
      };
    }
  }

  // Create user account after both email and phone verification are complete
  static async createUserAfterVerification(userData: {
    email: string;
    phone_number?: string;
    first_name: string;
    last_name: string;
    state_of_origin?: string;
    preferred_language?: string;
  }): Promise<AuthResponse> {
    try {
      // Use the same createUser method but with email included
      return await this.createUser({
        email: userData.email,
        phone_number: userData.phone_number,
        first_name: userData.first_name,
        last_name: userData.last_name,
        state_of_origin: userData.state_of_origin,
        preferred_language: userData.preferred_language
      });
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create user account'
      };
    }
  }

  // Login with email (triggers OTP)
  static async loginWithEmail(email: string): Promise<ApiResponse<any>> {
    try {
      // Send OTP for login (backend will check if user exists)
      const otpResult = await this.sendEmailOTP(email, 'login');
      return otpResult;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to initiate email login'
      };
    }
  }

  // Complete email login after OTP verification
  static async completeEmailLogin(email: string, otpCode: string): Promise<AuthResponse> {
    try {
      // Verify OTP and complete login in one step
      const result = await ApiClient.post<any>('/auth/complete-email-login', {
        email,
        otpCode
      });

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Email login failed'
        };
      }

      const { data } = result;

      // Store authentication tokens (camelCase format only)
      if (data.accessToken) {
        await AsyncStorage.setItem('auth_token', data.accessToken);
        if (data.refreshToken) {
          await AsyncStorage.setItem('refresh_token', data.refreshToken);
        }
        console.log('✅ Email login tokens stored successfully');
      } else {
        console.log('⚠️ No tokens found in email login response:', Object.keys(data));
      }

      return {
        success: true,
        user: data.user as NigerianUser,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        message: data.message,
        needsProfileCompletion: data.needs_profile_completion || false
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Email login failed'
      };
    }
  }

  // Authenticate with OTP (for both login and registration)
  static async authenticateWithOTP(
    email: string,
    otpCode: string,
    purpose: 'registration' | 'login',
    userMetadata?: {
      first_name?: string;
      last_name?: string;
      phone_number?: string;
      state_of_origin?: string;
      preferred_language?: string;
    }
  ): Promise<AuthResponse> {
    try {
      if (purpose === 'registration' && userMetadata) {
        // Use the new atomic endpoint for registration
        const result = await ApiClient.post<any>('/auth/complete-email-verification', {
          email,
          otpCode,
          first_name: userMetadata.first_name!,
          last_name: userMetadata.last_name!,
          phone_number: userMetadata.phone_number,
          state_of_origin: userMetadata.state_of_origin,
          preferred_language: userMetadata.preferred_language || 'en'
        });

        if (!result.success) {
          return {
            success: false,
            error: result.error || 'Registration failed'
          };
        }

        const { data } = result;

        // Store authentication tokens (camelCase format only)
        if (data.accessToken) {
          await AsyncStorage.setItem('auth_token', data.accessToken);
          if (data.refreshToken) {
            await AsyncStorage.setItem('refresh_token', data.refreshToken);
          }
        }

        return {
          success: true,
          user: data.user as NigerianUser,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          message: data.message || 'Registration completed successfully'
        };
      } else {
        // For login, use the complete login method
        return await this.completeEmailLogin(email, otpCode);
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Authentication failed'
      };
    }
  }

  // Helper: Validate email format
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Clear all stored tokens (useful for debugging and logout)
  static async clearTokens(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);
      console.log('🧹 All authentication tokens cleared');
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  // Get token status for debugging
  static async getTokenStatus(): Promise<{
    hasAccessToken: boolean;
    hasRefreshToken: boolean;
    accessTokenPreview?: string;
    refreshTokenPreview?: string;
  }> {
    try {
      const accessToken = await AsyncStorage.getItem('auth_token');
      const refreshToken = await AsyncStorage.getItem('refresh_token');

      return {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        accessTokenPreview: accessToken ? accessToken.substring(0, 50) + '...' : undefined,
        refreshTokenPreview: refreshToken ? refreshToken.substring(0, 50) + '...' : undefined,
      };
    } catch (error) {
      console.error('Error checking token status:', error);
      return {
        hasAccessToken: false,
        hasRefreshToken: false,
      };
    }
  }

  // Sign out user and clear all tokens
  static async signOut(): Promise<void> {
    try {
      // Try to call logout endpoint if we have a token
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        try {
          await ApiClient.post('/auth/logout', {});
        } catch (error) {
          console.log('Logout endpoint failed (expected if token expired):', error);
        }
      }

      // Always clear local tokens
      await this.clearTokens();
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('Error during sign out:', error);
      // Still clear tokens even if logout failed
      await this.clearTokens();
    }
  }

}