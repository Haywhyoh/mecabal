// MeCabal User Profile API Service
// Handles all user profile operations with backend

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ApiResponse } from '../types/api';
import type { NigerianUser } from '../types/supabase';

// Backend API configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const API_TIMEOUT = 10000;

// User Profile Response Types
export interface UserProfileResponse {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  dateOfBirth?: Date;
  gender?: string;
  isVerified: boolean;
  phoneVerified: boolean;
  identityVerified: boolean;
  addressVerified: boolean;
  trustScore: number;
  verificationLevel?: string;
  verificationBadge?: string;
  bio?: string;
  occupation?: string;
  professionalSkills?: string;
  culturalBackground?: string;
  nativeLanguages?: string;
  preferredLanguage: string;
  state?: string;
  city?: string;
  estate?: string;
  locationString: string;
  landmark?: string;
  address?: string;
  isActive: boolean;
  memberSince?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  joinDate: string;
  profileCompleteness: number;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  bio?: string;
  occupation?: string;
  professionalSkills?: string;
  culturalBackground?: string;
  nativeLanguages?: string;
  preferredLanguage?: string;
  state?: string;
  city?: string;
  estate?: string;
  landmark?: string;
  address?: string;
}

export interface ProfileCompletionResponse {
  percentage: number;
  missingFields: string[];
}

// API Client Helper
class UserProfileApiClient {
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`,
        }));

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
      console.error('User Profile API Request failed:', error);

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

  static async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'GET' });
  }

  static async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
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

export class UserProfileService {
  /**
   * Get current user profile
   */
  static async getCurrentUserProfile(): Promise<ApiResponse<UserProfileResponse>> {
    console.log('📱 Fetching current user profile...');
    return UserProfileApiClient.get<UserProfileResponse>('/users/me');
  }

  /**
   * Get user profile by ID
   */
  static async getUserProfile(userId: string): Promise<ApiResponse<UserProfileResponse>> {
    console.log(`📱 Fetching user profile for ${userId}...`);
    return UserProfileApiClient.get<UserProfileResponse>(`/users/${userId}`);
  }

  /**
   * Update current user profile
   */
  static async updateCurrentUserProfile(
    updates: UpdateProfileRequest
  ): Promise<ApiResponse<UserProfileResponse>> {
    console.log('📱 Updating user profile...', updates);
    return UserProfileApiClient.put<UserProfileResponse>('/users/me', updates);
  }

  /**
   * Get profile completion status
   */
  static async getProfileCompletion(): Promise<ApiResponse<ProfileCompletionResponse>> {
    console.log('📱 Fetching profile completion...');
    return UserProfileApiClient.get<ProfileCompletionResponse>('/users/me/completion');
  }

  /**
   * Deactivate account
   */
  static async deactivateAccount(): Promise<ApiResponse<{ message: string }>> {
    console.log('📱 Deactivating account...');
    return UserProfileApiClient.delete<{ message: string }>('/users/me');
  }

  /**
   * Search users
   */
  static async searchUsers(params: {
    query?: string;
    state?: string;
    city?: string;
    estate?: string;
    culturalBackground?: string;
    occupation?: string;
    verificationLevel?: string;
    verifiedOnly?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<ApiResponse<any>> {
    const queryString = new URLSearchParams(params as any).toString();
    console.log('📱 Searching users...', params);
    return UserProfileApiClient.get<any>(`/users/search?${queryString}`);
  }

  /**
   * Get nearby users (same location)
   */
  static async getNearbyUsers(params: {
    state: string;
    city?: string;
    estate?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> {
    const queryString = new URLSearchParams(params as any).toString();
    console.log('📱 Fetching nearby users...', params);
    return UserProfileApiClient.get<any>(`/users/nearby?${queryString}`);
  }

  /**
   * Get verified users
   */
  static async getVerifiedUsers(params: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> {
    const queryString = new URLSearchParams(params as any).toString();
    console.log('📱 Fetching verified users...');
    return UserProfileApiClient.get<any>(`/users/verified?${queryString}`);
  }
}

