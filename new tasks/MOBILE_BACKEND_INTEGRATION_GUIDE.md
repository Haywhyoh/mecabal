# Mobile App to Backend Integration Guide
**MeCabal - User Profile & Verification System**
*Frontend-Backend Integration Tasks*

---

## Table of Contents
1. [Overview](#overview)
2. [Integration Architecture](#integration-architecture)
3. [Phase 1: API Services Setup](#phase-1-api-services-setup)
4. [Phase 2: User Profile Integration](#phase-2-user-profile-integration)
5. [Phase 3: Avatar Upload Integration](#phase-3-avatar-upload-integration)
6. [Phase 4: Dashboard & Statistics](#phase-4-dashboard--statistics)
7. [Phase 5: NIN Verification Integration](#phase-5-nin-verification-integration)
8. [Phase 6: UI/UX Enhancements](#phase-6-uiux-enhancements)
9. [Testing Checklist](#testing-checklist)
10. [Apple HIG Compliance](#apple-hig-compliance)

---

## Overview

### Goals
- Connect React Native mobile app to NestJS backend API
- Integrate user profile management features
- Implement NIN verification flow
- Enable dashboard statistics and bookmarks
- Follow Apple Human Interface Guidelines
- Maintain Nigerian cultural context and design language

### Current State
- ✅ Backend API endpoints implemented (User Profile, Verification, Dashboard)
- ✅ Mobile UI screens designed and working (mock data)
- ❌ API integration layer incomplete
- ❌ Real data flow not connected
- ❌ Avatar upload not integrated with S3/Spaces

### Integration Architecture

```
Mobile App (React Native/Expo)
    ↓
API Service Layer (TypeScript)
    ↓
HTTP/REST (fetch)
    ↓
NestJS Backend (User Service)
    ↓
PostgreSQL + S3/Spaces
```

---

## PHASE 1: API SERVICES SETUP

### TASK 1.1: Create User Profile API Service (Day 1)

**Objective:** Create a dedicated API service for user profile operations

#### 1.1.1: Create User Profile Service File

**File:** `Hommie_Mobile/src/services/userProfile.ts`

```typescript
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
```

**Verification Checklist:**
- [ ] Service file created
- [ ] TypeScript types defined
- [ ] API client helper configured
- [ ] All profile methods implemented
- [ ] Error handling in place
- [ ] Console logging for debugging

---

### TASK 1.2: Create Dashboard API Service (Day 1)

**Objective:** Create API service for dashboard statistics and bookmarks

**File:** `Hommie_Mobile/src/services/userDashboard.ts`

```typescript
// MeCabal User Dashboard API Service
// Handles dashboard stats, bookmarks, and activity tracking

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ApiResponse } from '../types/api';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const API_TIMEOUT = 10000;

export interface DashboardStats {
  bookmarks: {
    count: number;
    items: Array<{
      id: string;
      type: 'post' | 'listing' | 'event';
      itemId: string;
      createdAt: Date;
    }>;
  };
  savedDeals: {
    count: number;
  };
  events: {
    attending: number;
    organized: number;
    joined: number;
  };
  posts: {
    shared: number;
  };
  community: {
    neighborsHelped: number;
    trustScore: number;
  };
  lastUpdated: Date;
}

export interface BookmarkItem {
  id: string;
  userId: string;
  itemType: 'post' | 'listing' | 'event';
  itemId: string;
  createdAt: Date;
}

// API Client Helper
class DashboardApiClient {
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
      };
    } catch (error: any) {
      console.error('Dashboard API Request failed:', error);

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

  static async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' });
  }
}

export class UserDashboardService {
  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    console.log('📊 Fetching dashboard stats...');
    return DashboardApiClient.get<DashboardStats>('/users/dashboard/stats');
  }

  /**
   * Add bookmark
   */
  static async addBookmark(
    itemType: 'post' | 'listing' | 'event',
    itemId: string
  ): Promise<ApiResponse<BookmarkItem>> {
    console.log(`📌 Adding bookmark: ${itemType} - ${itemId}`);
    return DashboardApiClient.post<BookmarkItem>('/users/dashboard/bookmarks', {
      itemType,
      itemId,
    });
  }

  /**
   * Remove bookmark
   */
  static async removeBookmark(
    itemType: 'post' | 'listing' | 'event',
    itemId: string
  ): Promise<ApiResponse<{ message: string }>> {
    console.log(`📌 Removing bookmark: ${itemType} - ${itemId}`);
    return DashboardApiClient.delete<{ message: string }>(
      `/users/dashboard/bookmarks/${itemType}/${itemId}`
    );
  }

  /**
   * Get bookmarks by type
   */
  static async getBookmarksByType(
    itemType: 'post' | 'listing' | 'event',
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<any>> {
    console.log(`📌 Fetching ${itemType} bookmarks...`);
    return DashboardApiClient.get<any>(
      `/users/dashboard/bookmarks/${itemType}?page=${page}&limit=${limit}`
    );
  }

  /**
   * Check if item is bookmarked
   */
  static async isBookmarked(
    itemType: 'post' | 'listing' | 'event',
    itemId: string
  ): Promise<ApiResponse<{ isBookmarked: boolean }>> {
    return DashboardApiClient.get<{ isBookmarked: boolean }>(
      `/users/dashboard/bookmarks/check/${itemType}/${itemId}`
    );
  }

  /**
   * Toggle bookmark (add if not exists, remove if exists)
   */
  static async toggleBookmark(
    itemType: 'post' | 'listing' | 'event',
    itemId: string
  ): Promise<ApiResponse<any>> {
    // Check current status
    const statusResponse = await this.isBookmarked(itemType, itemId);

    if (!statusResponse.success) {
      return statusResponse;
    }

    const isCurrentlyBookmarked = statusResponse.data?.isBookmarked;

    // Toggle
    if (isCurrentlyBookmarked) {
      return this.removeBookmark(itemType, itemId);
    } else {
      return this.addBookmark(itemType, itemId);
    }
  }
}
```

**Verification Checklist:**
- [ ] Dashboard service created
- [ ] Bookmark methods implemented
- [ ] Toggle functionality working
- [ ] Error handling in place

---

### TASK 1.3: Create Avatar Upload Service (Day 1)

**Objective:** Create service for uploading profile pictures

**File:** `Hommie_Mobile/src/services/avatarUpload.ts`

```typescript
// MeCabal Avatar Upload Service
// Handles profile picture uploads to backend S3/Spaces

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import type { ApiResponse } from '../types/api';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface AvatarUploadResponse {
  avatarUrl: string;
}

export class AvatarUploadService {
  /**
   * Request camera permissions
   */
  static async requestCameraPermissions(): Promise<boolean> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Request media library permissions
   */
  static async requestMediaLibraryPermissions(): Promise<boolean> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Pick image from camera
   */
  static async pickImageFromCamera(): Promise<string | null> {
    const hasPermission = await this.requestCameraPermissions();
    if (!hasPermission) {
      throw new Error('Camera permission not granted');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0].uri;
  }

  /**
   * Pick image from library
   */
  static async pickImageFromLibrary(): Promise<string | null> {
    const hasPermission = await this.requestMediaLibraryPermissions();
    if (!hasPermission) {
      throw new Error('Media library permission not granted');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0].uri;
  }

  /**
   * Compress and resize image before upload
   */
  static async processImage(uri: string): Promise<string> {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 400, height: 400 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    return manipResult.uri;
  }

  /**
   * Upload avatar to backend
   */
  static async uploadAvatar(imageUri: string): Promise<ApiResponse<AvatarUploadResponse>> {
    try {
      console.log('📤 Uploading avatar...');

      // Process image first
      const processedUri = await this.processImage(imageUri);

      // Get auth token
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        return {
          success: false,
          error: 'Not authenticated',
        };
      }

      // Create form data
      const formData = new FormData();

      // Get file extension
      const uriParts = processedUri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      formData.append('avatar', {
        uri: processedUri,
        name: `avatar.${fileType}`,
        type: `image/${fileType}`,
      } as any);

      // Upload
      const response = await fetch(`${API_BASE_URL}/users/me/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type - let fetch set it with boundary
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Upload failed with status ${response.status}`,
        }));

        return {
          success: false,
          error: errorData.message || 'Avatar upload failed',
        };
      }

      const data = await response.json();
      console.log('✅ Avatar uploaded successfully:', data.avatarUrl);

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload avatar',
      };
    }
  }

  /**
   * Delete avatar
   */
  static async deleteAvatar(): Promise<ApiResponse<{ message: string }>> {
    try {
      console.log('🗑️ Deleting avatar...');

      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        return {
          success: false,
          error: 'Not authenticated',
        };
      }

      const response = await fetch(`${API_BASE_URL}/users/me/avatar`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Delete failed with status ${response.status}`,
        }));

        return {
          success: false,
          error: errorData.message || 'Avatar deletion failed',
        };
      }

      const data = await response.json();
      console.log('✅ Avatar deleted successfully');

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('Avatar delete error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete avatar',
      };
    }
  }

  /**
   * Show avatar selection dialog
   */
  static async showAvatarPicker(): Promise<string | null> {
    // In a real implementation, show ActionSheet with options:
    // - Take Photo
    // - Choose from Library
    // - Remove Current Photo (if exists)

    // For now, just launch library
    return this.pickImageFromLibrary();
  }
}
```

**Install Required Dependencies:**

```bash
cd Hommie_Mobile
npx expo install expo-image-picker expo-image-manipulator
```

**Verification Checklist:**
- [ ] Avatar upload service created
- [ ] Image picker dependencies installed
- [ ] Image compression working
- [ ] Upload to backend working
- [ ] Permissions handling correct

---

## PHASE 2: USER PROFILE INTEGRATION

### TASK 2.1: Update AuthContext to Use Backend Profile (Day 2)

**Objective:** Integrate real backend profile data into AuthContext

**File:** `Hommie_Mobile/src/contexts/AuthContext.tsx`

**Update the `updateProfile` method:**

```typescript
const updateProfile = async (updates: Partial<NigerianUser>): Promise<boolean> => {
  if (!user) return false;

  try {
    // Use the new UserProfileService instead of old method
    const result = await UserProfileService.updateCurrentUserProfile(updates as any);

    if (result.success && result.data) {
      // Convert backend response to NigerianUser format
      const updatedUser: NigerianUser = {
        ...user,
        ...updates,
        // Map backend response fields to user object
        firstName: result.data.firstName || user.firstName,
        lastName: result.data.lastName || user.lastName,
        profilePictureUrl: result.data.profilePictureUrl || user.profilePictureUrl,
        bio: result.data.bio || user.bio,
        occupation: result.data.occupation || user.occupation,
        // ... map other fields
      };

      setUser(updatedUser);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Profile update error:', error);
    return false;
  }
};
```

**Add import at top:**

```typescript
import { UserProfileService } from '../services/userProfile';
```

**Verification Checklist:**
- [ ] UserProfileService imported
- [ ] updateProfile method updated
- [ ] Profile data correctly mapped
- [ ] User state updated on success

---

### TASK 2.2: Connect ProfileScreen to Backend (Day 2-3)

**Objective:** Replace mock data in ProfileScreen with real backend data

**File:** `Hommie_Mobile/src/screens/ProfileScreen.tsx`

**Add state and data fetching:**

```typescript
import React, { useState, useEffect } from 'react';
import { UserDashboardService, DashboardStats } from '../services/userDashboard';
import { UserProfileService, ProfileCompletionResponse } from '../services/userProfile';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { logout, user, refreshUser } = useAuth();

  // State for dashboard data
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [profileCompletion, setProfileCompletion] = useState<ProfileCompletionResponse | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch dashboard data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoadingStats(true);

      // Fetch dashboard stats
      const statsResponse = await UserDashboardService.getDashboardStats();
      if (statsResponse.success && statsResponse.data) {
        setDashboardStats(statsResponse.data);
      }

      // Fetch profile completion
      const completionResponse = await UserProfileService.getProfileCompletion();
      if (completionResponse.success && completionResponse.data) {
        setProfileCompletion(completionResponse.data);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboardData(),
      refreshUser()
    ]);
    setRefreshing(false);
  };

  // Replace hardcoded values with real data
  const bookmarksCount = dashboardStats?.bookmarks.count || 0;
  const savedDealsCount = dashboardStats?.savedDeals.count || 0;
  const attendingEventsCount = dashboardStats?.events.attending || 0;
  const postsSharedCount = dashboardStats?.posts.shared || 0;
  const neighborsHelpedCount = dashboardStats?.community.neighborsHelped || 0;
  const eventsJoinedCount = dashboardStats?.events.joined || 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - unchanged */}
      <View style={styles.header}>
        {/* ... existing header code ... */}
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#00A651"
          />
        }
      >
        {/* Profile Section - now shows loading state */}
        <View style={styles.profileSection}>
          <UserProfile
            user={user}
            size="large"
            showLocation={true}
            showJoinDate={true}
            showVerificationBadge={true}
            showCameraButton={true}
            onCameraPress={handleAvatarChange}
          />

          <TouchableOpacity
            style={styles.locationContainer}
            onPress={() => navigation.navigate('EstateManager' as never)}
          >
            <MaterialCommunityIcons name="map-marker" size={16} color="#8E8E8E" />
            <Text style={styles.userLocation}>
              {user?.city || 'Unknown'}, {user?.state || 'Unknown'}
            </Text>
            <Text style={styles.estateCount}>• {user?.estate ? '1 estate' : 'No estates'}</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#8E8E8E" style={styles.chevron} />
          </TouchableOpacity>
        </View>

        {/* Dashboard - now with real data */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dashboard</Text>
            <View style={styles.privacyIndicator}>
              <MaterialCommunityIcons name="eye-off" size={14} color="#8E8E8E" />
              <Text style={styles.privacyText}>Only visible to you</Text>
            </View>
          </View>

          {isLoadingStats ? (
            <ActivityIndicator size="large" color="#00A651" />
          ) : (
            <>
              <View style={styles.dashboardGrid}>
                <TouchableOpacity
                  style={styles.dashboardCard}
                  onPress={() => navigation.navigate('Bookmarks' as never, { type: 'post' })}
                >
                  <MaterialCommunityIcons name="bookmark" size={24} color="#0066CC" />
                  <Text style={styles.dashboardTitle}>Bookmarks</Text>
                  <Text style={styles.dashboardCount}>{bookmarksCount} saved posts</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dashboardCard}
                  onPress={() => navigation.navigate('Bookmarks' as never, { type: 'listing' })}
                >
                  <MaterialCommunityIcons name="tag" size={24} color="#FF6B35" />
                  <Text style={styles.dashboardTitle}>Saved Deals</Text>
                  <Text style={styles.dashboardCount}>{savedDealsCount} local offers</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.dashboardCard}
                onPress={() => navigation.navigate('MyEvents' as never)}
              >
                <MaterialCommunityIcons name="calendar" size={24} color="#7B68EE" />
                <Text style={styles.dashboardTitle}>Events</Text>
                <Text style={styles.dashboardCount}>
                  {attendingEventsCount} upcoming events you're attending
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Community Stats - with real data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Community Impact</Text>

          {isLoadingStats ? (
            <ActivityIndicator size="small" color="#00A651" />
          ) : (
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{postsSharedCount}</Text>
                <Text style={styles.statLabel}>Posts Shared</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{neighborsHelpedCount}</Text>
                <Text style={styles.statLabel}>Neighbors Helped</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{eventsJoinedCount}</Text>
                <Text style={styles.statLabel}>Events Joined</Text>
              </View>
            </View>
          )}
        </View>

        {/* Rest of the screen... */}
      </ScrollView>
    </SafeAreaView>
  );
}

// Add handleAvatarChange function
const handleAvatarChange = async () => {
  Alert.alert(
    'Change Profile Photo',
    'Choose an option',
    [
      {
        text: 'Take Photo',
        onPress: async () => {
          try {
            const imageUri = await AvatarUploadService.pickImageFromCamera();
            if (imageUri) {
              await uploadAvatar(imageUri);
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to take photo');
          }
        },
      },
      {
        text: 'Choose from Library',
        onPress: async () => {
          try {
            const imageUri = await AvatarUploadService.pickImageFromLibrary();
            if (imageUri) {
              await uploadAvatar(imageUri);
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to choose photo');
          }
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]
  );
};

const uploadAvatar = async (imageUri: string) => {
  try {
    // Show loading state
    Alert.alert('Uploading...', 'Please wait while we upload your photo');

    const result = await AvatarUploadService.uploadAvatar(imageUri);

    if (result.success && result.data) {
      // Update user context with new avatar URL
      await refreshUser();
      Alert.alert('Success', 'Profile photo updated successfully!');
    } else {
      Alert.alert('Error', result.error || 'Failed to upload photo');
    }
  } catch (error) {
    Alert.alert('Error', 'An unexpected error occurred');
  }
};
```

**Add imports:**

```typescript
import { RefreshControl, ActivityIndicator } from 'react-native';
import { AvatarUploadService } from '../services/avatarUpload';
```

**Verification Checklist:**
- [ ] Dashboard stats loading from backend
- [ ] Profile completion showing real data
- [ ] Pull-to-refresh working
- [ ] Loading states displaying
- [ ] Avatar upload integrated
- [ ] Error handling in place

---

### TASK 2.3: Create Edit Profile Screen (Day 3-4)

**Objective:** Create a screen for users to edit their profile information

**File:** `Hommie_Mobile/src/screens/EditProfileScreen.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { UserProfileService, UpdateProfileRequest } from '../services/userProfile';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, refreshUser } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<UpdateProfileRequest>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    bio: user?.bio || '',
    occupation: user?.occupation || '',
    professionalSkills: user?.professionalSkills || '',
    state: user?.state || '',
    city: user?.city || '',
    estate: user?.estate || '',
    landmark: user?.landmark || '',
  });

  const handleUpdateField = (field: keyof UpdateProfileRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Validate required fields
      if (!formData.firstName || !formData.lastName) {
        Alert.alert('Error', 'First name and last name are required');
        return;
      }

      // Call API
      const result = await UserProfileService.updateCurrentUserProfile(formData);

      if (result.success) {
        // Refresh user data in context
        await refreshUser();

        Alert.alert(
          'Success',
          'Your profile has been updated successfully',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#2C2C2C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#00A651" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.firstName}
                onChangeText={(value) => handleUpdateField('firstName', value)}
                placeholder="Enter your first name"
                placeholderTextColor="#8E8E8E"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Last Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.lastName}
                onChangeText={(value) => handleUpdateField('lastName', value)}
                placeholder="Enter your last name"
                placeholderTextColor="#8E8E8E"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.bio}
                onChangeText={(value) => handleUpdateField('bio', value)}
                placeholder="Tell your neighbors about yourself..."
                placeholderTextColor="#8E8E8E"
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>
                {formData.bio?.length || 0}/500
              </Text>
            </View>
          </View>

          {/* Professional Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Occupation</Text>
              <TextInput
                style={styles.input}
                value={formData.occupation}
                onChangeText={(value) => handleUpdateField('occupation', value)}
                placeholder="e.g., Software Engineer, Teacher"
                placeholderTextColor="#8E8E8E"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Professional Skills</Text>
              <TextInput
                style={styles.input}
                value={formData.professionalSkills}
                onChangeText={(value) => handleUpdateField('professionalSkills', value)}
                placeholder="e.g., Plumbing, Electrical, Catering"
                placeholderTextColor="#8E8E8E"
              />
              <Text style={styles.inputHelp}>
                Comma-separated list of your professional skills
              </Text>
            </View>
          </View>

          {/* Location Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>State</Text>
              <TextInput
                style={styles.input}
                value={formData.state}
                onChangeText={(value) => handleUpdateField('state', value)}
                placeholder="e.g., Lagos"
                placeholderTextColor="#8E8E8E"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>City</Text>
              <TextInput
                style={styles.input}
                value={formData.city}
                onChangeText={(value) => handleUpdateField('city', value)}
                placeholder="e.g., Victoria Island"
                placeholderTextColor="#8E8E8E"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Estate/Compound</Text>
              <TextInput
                style={styles.input}
                value={formData.estate}
                onChangeText={(value) => handleUpdateField('estate', value)}
                placeholder="e.g., Lekki Gardens Estate"
                placeholderTextColor="#8E8E8E"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Landmark</Text>
              <TextInput
                style={styles.input}
                value={formData.landmark}
                onChangeText={(value) => handleUpdateField('landmark', value)}
                placeholder="e.g., Near Shoprite"
                placeholderTextColor="#8E8E8E"
              />
            </View>
          </View>

          {/* Privacy Notice */}
          <View style={styles.privacyNotice}>
            <MaterialCommunityIcons name="information" size={16} color="#0066CC" />
            <Text style={styles.privacyText}>
              Your information is only shared with verified neighbors in your estate. You can control visibility in Privacy Settings.
            </Text>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    padding: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00A651',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2C2C2C',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: '#8E8E8E',
    textAlign: 'right',
    marginTop: 4,
  },
  inputHelp: {
    fontSize: 12,
    color: '#8E8E8E',
    marginTop: 4,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 16,
  },
  privacyText: {
    fontSize: 12,
    color: '#0066CC',
    lineHeight: 18,
    marginLeft: 8,
    flex: 1,
  },
  bottomSpacer: {
    height: 32,
  },
});
```

**Add navigation:**

In `ProfileScreen.tsx`, update the Edit Profile button:

```typescript
<TouchableOpacity
  style={styles.editProfileButton}
  onPress={() => navigation.navigate('EditProfile' as never)}
>
  <MaterialCommunityIcons name="pencil" size={20} color="#2C2C2C" />
  <Text style={styles.editProfileText}>Edit Profile</Text>
</TouchableOpacity>
```

**Verification Checklist:**
- [ ] Edit profile screen created
- [ ] Form fields populated from user data
- [ ] Save functionality working
- [ ] Validation in place
- [ ] Keyboard handling correct (iOS/Android)
- [ ] Character count for bio
- [ ] Navigation integrated

---

## PHASE 3: AVATAR UPLOAD INTEGRATION

### TASK 3.1: Update UserProfile Component (Day 4)

**Objective:** Add avatar upload capability to UserProfile component

**File:** `Hommie_Mobile/src/components/UserProfile.tsx`

**Update the component to handle avatar changes:**

```typescript
import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { AvatarUploadService } from '../services/avatarUpload';

interface UserProfileProps {
  user: any;
  size?: 'small' | 'medium' | 'large';
  showLocation?: boolean;
  showJoinDate?: boolean;
  showVerificationBadge?: boolean;
  showCameraButton?: boolean;
  onCameraPress?: () => void;
  onAvatarUpdated?: (avatarUrl: string) => void;
}

export function UserProfile({
  user,
  size = 'medium',
  showLocation = false,
  showJoinDate = false,
  showVerificationBadge = false,
  showCameraButton = false,
  onCameraPress,
  onAvatarUpdated,
}: UserProfileProps) {
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const sizes = {
    small: { container: 40, icon: 16, camera: 20 },
    medium: { container: 60, icon: 24, camera: 24 },
    large: { container: 100, icon: 40, camera: 32 },
  };

  const currentSize = sizes[size];

  const handleAvatarPress = async () => {
    if (onCameraPress) {
      onCameraPress();
      return;
    }

    // Default avatar change behavior
    try {
      const imageUri = await AvatarUploadService.showAvatarPicker();
      if (imageUri) {
        setIsUploadingAvatar(true);
        const result = await AvatarUploadService.uploadAvatar(imageUri);

        if (result.success && result.data) {
          onAvatarUpdated?.(result.data.avatarUrl);
          Alert.alert('Success', 'Profile photo updated!');
        } else {
          Alert.alert('Error', result.error || 'Failed to upload photo');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to change avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.avatarContainer, { width: currentSize.container, height: currentSize.container }]}>
        {user?.profilePictureUrl ? (
          <Image
            source={{ uri: user.profilePictureUrl }}
            style={[styles.avatar, { width: currentSize.container, height: currentSize.container }]}
          />
        ) : (
          <View style={[styles.avatarPlaceholder, { width: currentSize.container, height: currentSize.container }]}>
            <MaterialCommunityIcons
              name="account"
              size={currentSize.icon}
              color="#8E8E8E"
            />
          </View>
        )}

        {showVerificationBadge && user?.isVerified && (
          <View style={styles.verificationBadge}>
            <MaterialCommunityIcons name="check-decagram" size={20} color="#00A651" />
          </View>
        )}

        {showCameraButton && (
          <TouchableOpacity
            style={[styles.cameraButton, { width: currentSize.camera, height: currentSize.camera }]}
            onPress={handleAvatarPress}
            disabled={isUploadingAvatar}
          >
            {isUploadingAvatar ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialCommunityIcons name="camera" size={16} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={[styles.name, size === 'large' && styles.nameLarge]}>
          {user?.firstName} {user?.lastName}
        </Text>

        {showLocation && user?.city && user?.state && (
          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker" size={14} color="#8E8E8E" />
            <Text style={styles.location}>
              {user.city}, {user.state}
            </Text>
          </View>
        )}

        {showJoinDate && user?.createdAt && (
          <Text style={styles.joinDate}>
            Member since {new Date(user.createdAt).toLocaleDateString('en-GB', {
              year: 'numeric',
              month: 'long'
            })}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    borderRadius: 999,
    backgroundColor: '#F5F5F5',
  },
  avatarPlaceholder: {
    borderRadius: 999,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verificationBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 2,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#00A651',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  infoContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 4,
  },
  nameLarge: {
    fontSize: 24,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#8E8E8E',
    marginLeft: 4,
  },
  joinDate: {
    fontSize: 12,
    color: '#8E8E8E',
  },
});
```

**Verification Checklist:**
- [ ] Avatar upload integrated into component
- [ ] Loading state shows during upload
- [ ] Upload success updates UI
- [ ] Error handling in place
- [ ] Camera button visual feedback

---

## PHASE 4: DASHBOARD & STATISTICS

### TASK 4.1: Create Bookmarks Screen (Day 5)

**Objective:** Create a screen to view and manage bookmarks

**File:** `Hommie_Mobile/src/screens/BookmarksScreen.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { UserDashboardService, BookmarkItem } from '../services/userDashboard';

type BookmarkType = 'post' | 'listing' | 'event';

export default function BookmarksScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const bookmarkType: BookmarkType = (route.params as any)?.type || 'post';

  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadBookmarks();
  }, [bookmarkType]);

  const loadBookmarks = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (!append) {
        setIsLoading(true);
      }

      const response = await UserDashboardService.getBookmarksByType(
        bookmarkType,
        pageNum,
        20
      );

      if (response.success && response.data) {
        const newBookmarks = response.data.bookmarks;

        if (append) {
          setBookmarks(prev => [...prev, ...newBookmarks]);
        } else {
          setBookmarks(newBookmarks);
        }

        setHasMore(response.data.page < response.data.totalPages);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      Alert.alert('Error', 'Failed to load bookmarks');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadBookmarks(1, false);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      loadBookmarks(page + 1, true);
    }
  };

  const handleRemoveBookmark = async (item: BookmarkItem) => {
    Alert.alert(
      'Remove Bookmark',
      'Are you sure you want to remove this bookmark?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await UserDashboardService.removeBookmark(
              item.itemType,
              item.itemId
            );

            if (result.success) {
              setBookmarks(prev => prev.filter(b => b.id !== item.id));
              Alert.alert('Success', 'Bookmark removed');
            } else {
              Alert.alert('Error', result.error || 'Failed to remove bookmark');
            }
          },
        },
      ]
    );
  };

  const renderBookmarkItem = ({ item }: { item: BookmarkItem }) => (
    <TouchableOpacity
      style={styles.bookmarkCard}
      onPress={() => {
        // Navigate to the actual item (post/listing/event)
        if (item.itemType === 'post') {
          navigation.navigate('PostDetail' as never, { postId: item.itemId } as never);
        } else if (item.itemType === 'listing') {
          navigation.navigate('ListingDetail' as never, { listingId: item.itemId } as never);
        } else if (item.itemType === 'event') {
          navigation.navigate('EventDetail' as never, { eventId: item.itemId } as never);
        }
      }}
    >
      <View style={styles.bookmarkContent}>
        <MaterialCommunityIcons
          name={
            item.itemType === 'post'
              ? 'post'
              : item.itemType === 'listing'
              ? 'tag'
              : 'calendar'
          }
          size={24}
          color="#00A651"
        />
        <View style={styles.bookmarkInfo}>
          <Text style={styles.bookmarkType}>
            {item.itemType.charAt(0).toUpperCase() + item.itemType.slice(1)}
          </Text>
          <Text style={styles.bookmarkDate}>
            Saved {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => handleRemoveBookmark(item)}
        style={styles.removeButton}
      >
        <MaterialCommunityIcons name="close" size={20} color="#E74C3C" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#2C2C2C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {bookmarkType === 'post'
            ? 'Bookmarked Posts'
            : bookmarkType === 'listing'
            ? 'Saved Deals'
            : 'Saved Events'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {isLoading && page === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00A651" />
        </View>
      ) : bookmarks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="bookmark-off" size={64} color="#8E8E8E" />
          <Text style={styles.emptyTitle}>No bookmarks yet</Text>
          <Text style={styles.emptySubtitle}>
            Bookmark posts, deals, and events to find them here
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          renderItem={renderBookmarkItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#00A651"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoading && page > 1 ? (
              <ActivityIndicator size="small" color="#00A651" style={styles.footer} />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C2C2C',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E8E',
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    padding: 16,
  },
  bookmarkCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bookmarkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bookmarkInfo: {
    marginLeft: 12,
    flex: 1,
  },
  bookmarkType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 4,
  },
  bookmarkDate: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  removeButton: {
    padding: 8,
  },
  footer: {
    paddingVertical: 20,
  },
});
```

**Verification Checklist:**
- [ ] Bookmarks screen created
- [ ] Fetches bookmarks from backend
- [ ] Pagination working
- [ ] Pull-to-refresh working
- [ ] Remove bookmark working
- [ ] Empty state displayed
- [ ] Navigation to detail screens

---

## PHASE 5: NIN VERIFICATION INTEGRATION

### TASK 5.1: Create NIN Verification API Service (Day 6)

**Objective:** Create service for NIN verification flow

**File:** `Hommie_Mobile/src/services/ninVerification.ts`

```typescript
// MeCabal NIN Verification Service
// Handles National ID verification with backend

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ApiResponse } from '../types/api';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const API_TIMEOUT = 30000; // 30 seconds for verification

export interface NINVerificationRequest {
  ninNumber: string;
}

export interface NINVerificationResponse {
  verified: boolean;
  ninNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  stateOfOrigin: string;
  phoneNumber?: string;
  photo?: string;
}

export interface VerificationStatusResponse {
  status: 'pending' | 'verified' | 'failed' | 'rejected';
  ninNumber?: string;
  verifiedAt?: Date;
  failureReason?: string;
  trustScoreBoost?: number;
}

export interface TrustScoreResponse {
  trustScore: number;
  phoneVerified: boolean;
  identityVerified: boolean;
  addressVerified: boolean;
  verificationLevel: 'unverified' | 'phone' | 'identity' | 'full';
  verificationBadge?: string;
}

class NINVerificationApiClient {
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
      };
    } catch (error: any) {
      console.error('NIN Verification API Request failed:', error);

      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout. Verification may take longer. Please try again.',
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
}

export class NINVerificationService {
  /**
   * Validate NIN format (11 digits)
   */
  static validateNIN(nin: string): boolean {
    const cleanedNIN = nin.replace(/\s+/g, '');
    return /^\d{11}$/.test(cleanedNIN);
  }

  /**
   * Format NIN for display (XXXX XXX XXXX)
   */
  static formatNIN(nin: string): string {
    const cleaned = nin.replace(/\s+/g, '');
    if (cleaned.length <= 4) return cleaned;
    if (cleaned.length <= 7) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 11)}`;
  }

  /**
   * Initiate NIN verification
   */
  static async verifyNIN(
    ninNumber: string
  ): Promise<ApiResponse<NINVerificationResponse>> {
    console.log('📝 Initiating NIN verification...');

    if (!this.validateNIN(ninNumber)) {
      return {
        success: false,
        error: 'Invalid NIN format. Must be 11 digits.',
      };
    }

    const cleanedNIN = ninNumber.replace(/\s+/g, '');

    return NINVerificationApiClient.post<NINVerificationResponse>(
      '/verification/nin/verify',
      { ninNumber: cleanedNIN }
    );
  }

  /**
   * Get verification status
   */
  static async getVerificationStatus(): Promise<
    ApiResponse<VerificationStatusResponse>
  > {
    console.log('📊 Fetching verification status...');
    return NINVerificationApiClient.get<VerificationStatusResponse>(
      '/verification/nin/status'
    );
  }

  /**
   * Get user trust score
   */
  static async getTrustScore(): Promise<ApiResponse<TrustScoreResponse>> {
    console.log('🏆 Fetching trust score...');
    return NINVerificationApiClient.get<TrustScoreResponse>(
      '/verification/trust-score'
    );
  }

  /**
   * Upload verification document
   */
  static async uploadDocument(
    documentType: 'nin_card' | 'drivers_license' | 'voters_card' | 'passport',
    documentUri: string
  ): Promise<ApiResponse<{ documentUrl: string }>> {
    try {
      console.log('📤 Uploading verification document...');

      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        return {
          success: false,
          error: 'Not authenticated',
        };
      }

      const formData = new FormData();

      const uriParts = documentUri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      formData.append('document', {
        uri: documentUri,
        name: `${documentType}.${fileType}`,
        type: `image/${fileType}`,
      } as any);

      formData.append('documentType', documentType);

      const response = await fetch(`${API_BASE_URL}/verification/documents/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Upload failed with status ${response.status}`,
        }));

        return {
          success: false,
          error: errorData.message || 'Document upload failed',
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('Document upload error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload document',
      };
    }
  }

  /**
   * Skip verification (mark as skipped)
   */
  static async skipVerification(): Promise<ApiResponse<{ message: string }>> {
    console.log('⏭️ Skipping verification...');
    return NINVerificationApiClient.post<{ message: string }>(
      '/verification/nin/skip',
      {}
    );
  }
}
```

**Verification Checklist:**
- [ ] NIN verification service created
- [ ] Validation logic working
- [ ] NIN formatting correct
- [ ] API integration complete
- [ ] Document upload working
- [ ] Error handling in place

---

### TASK 5.2: Update NINVerificationScreen with Backend Integration (Day 6-7)

**Objective:** Connect NIN verification screen to backend API

**File:** `Hommie_Mobile/src/screens/NINVerificationScreen.tsx`

**Replace the mock verification with real API calls:**

```typescript
import { NINVerificationService, NINVerificationResponse } from '../services/ninVerification';
import { useAuth } from '../contexts/AuthContext';

export default function NINVerificationScreen() {
  const navigation = useNavigation();
  const { refreshUser } = useAuth();

  const [nin, setNin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'input' | 'preview' | 'success'>('input');
  const [ninData, setNinData] = useState<NINVerificationResponse | null>(null);

  const validateNIN = (ninNumber: string) => {
    return NINVerificationService.validateNIN(ninNumber);
  };

  const formatNIN = (ninNumber: string) => {
    return NINVerificationService.formatNIN(ninNumber);
  };

  const handleNINChange = (text: string) => {
    const cleanText = text.replace(/[^\d]/g, '');
    if (cleanText.length <= 11) {
      setNin(cleanText);
    }
  };

  const handleVerifyNIN = async () => {
    if (!validateNIN(nin)) {
      Alert.alert('Invalid NIN', 'Please enter a valid 11-digit National Identification Number');
      return;
    }

    setIsLoading(true);

    try {
      // Call real backend API
      const result = await NINVerificationService.verifyNIN(nin);

      if (result.success && result.data) {
        // Verification successful - show preview
        setNinData(result.data);
        setVerificationStep('preview');
      } else {
        // Verification failed
        Alert.alert(
          'Verification Failed',
          result.error || 'Unable to verify NIN. Please check your number and try again.'
        );
      }
    } catch (error) {
      console.error('NIN verification error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmVerification = async () => {
    try {
      // Refresh user data to get updated verification status
      await refreshUser();

      // Show success screen
      setVerificationStep('success');

      // Optionally show alert
      Alert.alert(
        'NIN Verified Successfully',
        'Your National ID has been verified and linked to your profile. This helps build trust in the community.'
      );
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const handleSkipVerification = () => {
    Alert.alert(
      'Skip NIN Verification?',
      'You can verify your NIN later in your profile settings. Some community features may be limited without verification.',
      [
        {
          text: 'Continue Without NIN',
          style: 'destructive',
          onPress: async () => {
            // Mark as skipped in backend
            await NINVerificationService.skipVerification();
            navigation.goBack();
          }
        },
        { text: 'Verify Now', style: 'cancel' }
      ]
    );
  };

  const handleContinue = () => {
    // Navigate back to profile or home
    navigation.goBack();
  };

  // ... rest of the component (InfoModal, rendering logic) stays the same
  // Just update the buttons to use the new handlers

  return (
    <SafeAreaView style={styles.container}>
      {/* ... existing UI code ... */}

      {verificationStep === 'input' && (
        <>
          {/* Verify Button - now calls real API */}
          <TouchableOpacity
            style={[
              styles.verifyButton,
              validateNIN(nin) ? styles.verifyButtonActive : styles.verifyButtonDisabled
            ]}
            onPress={handleVerifyNIN}
            disabled={!validateNIN(nin) || isLoading}
          >
            {isLoading ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.verifyButtonText}>Verifying...</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="shield-check" size={20} color="#FFFFFF" />
                <Text style={styles.verifyButtonText}>Verify NIN</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Skip Option */}
          <TouchableOpacity style={styles.skipButton} onPress={handleSkipVerification}>
            <Text style={styles.skipButtonText}>Skip for Now</Text>
          </TouchableOpacity>
        </>
      )}

      {verificationStep === 'preview' && ninData && (
        <>
          {/* Data Preview - shows real data from backend */}
          <View style={styles.dataCard}>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Full Name</Text>
              <Text style={styles.dataValue}>{ninData.firstName} {ninData.lastName}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Date of Birth</Text>
              <Text style={styles.dataValue}>{ninData.dateOfBirth}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Gender</Text>
              <Text style={styles.dataValue}>{ninData.gender}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>State of Origin</Text>
              <Text style={styles.dataValue}>{ninData.stateOfOrigin}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>NIN</Text>
              <Text style={styles.dataValue}>{formatNIN(ninData.ninNumber)}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmVerification}>
            <Text style={styles.confirmButtonText}>Confirm and Verify</Text>
          </TouchableOpacity>
        </>
      )}

      {verificationStep === 'success' && (
        <>
          {/* Success UI */}
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Continue to Profile</Text>
          </TouchableOpacity>
        </>
      )}

      <InfoModal />
    </SafeAreaView>
  );
}
```

**Verification Checklist:**
- [ ] NIN verification screen updated
- [ ] Real API integration working
- [ ] Loading states correct
- [ ] Error handling in place
- [ ] Success flow working
- [ ] Skip functionality working
- [ ] User data refreshed after verification

---

## PHASE 6: UI/UX ENHANCEMENTS

### TASK 6.1: Add Loading States Following Apple HIG (Day 7)

**Objective:** Implement proper loading states across all screens per Apple Human Interface Guidelines

#### Key Apple HIG Principles for Loading States:

1. **Activity Indicators**
   - Use native iOS activity indicator (spinner)
   - Show during network requests
   - Center in content area

2. **Skeleton Screens**
   - Show placeholder content during initial load
   - Matches expected content layout
   - Subtle animation

3. **Pull-to-Refresh**
   - Native iOS pull-to-refresh control
   - Tint color matches brand (#00A651)
   - Smooth, responsive animation

4. **Progress Feedback**
   - Clear indication of progress
   - Disable actions during loading
   - Visual feedback on buttons

**Create Reusable Loading Component:**

**File:** `Hommie_Mobile/src/components/LoadingState.tsx`

```typescript
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
}

export function LoadingState({
  message,
  size = 'large',
  color = '#00A651',
}: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  message: {
    marginTop: 16,
    fontSize: 14,
    color: '#8E8E8E',
    textAlign: 'center',
  },
});
```

**Create Skeleton Placeholder Component:**

**File:** `Hommie_Mobile/src/components/SkeletonPlaceholder.tsx`

```typescript
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface SkeletonPlaceholderProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}

export function SkeletonPlaceholder({
  width,
  height,
  borderRadius = 8,
  style,
}: SkeletonPlaceholderProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E0E0E0',
  },
});
```

**Usage in ProfileScreen:**

```typescript
import { LoadingState } from '../components/LoadingState';
import { SkeletonPlaceholder } from '../components/SkeletonPlaceholder';

// In ProfileScreen:
{isLoadingStats ? (
  <View style={styles.section}>
    <SkeletonPlaceholder width="40%" height={24} style={{ marginBottom: 16 }} />
    <View style={styles.dashboardGrid}>
      <SkeletonPlaceholder width="48%" height={100} />
      <SkeletonPlaceholder width="48%" height={100} />
    </View>
    <SkeletonPlaceholder width="100%" height={100} style={{ marginTop: 12 }} />
  </View>
) : (
  // Actual content
)}
```

**Verification Checklist:**
- [ ] Loading states implemented
- [ ] Skeleton placeholders created
- [ ] Pull-to-refresh working
- [ ] Button disabled states correct
- [ ] Smooth animations

---

### TASK 6.2: Add Error States Following Apple HIG (Day 7)

**Objective:** Implement user-friendly error states

**Create Error Component:**

**File:** `Hommie_Mobile/src/components/ErrorState.tsx`

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryText = 'Try Again',
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#E74C3C" />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.retryButtonText}>{retryText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C2C2C',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#8E8E8E',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#00A651',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
```

**Verification Checklist:**
- [ ] Error states implemented
- [ ] Retry functionality working
- [ ] User-friendly error messages
- [ ] Consistent error handling

---

### TASK 6.3: Add Success Feedback Following Apple HIG (Day 8)

**Objective:** Provide clear feedback on successful actions

**Install React Native Toast Message:**

```bash
cd Hommie_Mobile
npm install react-native-toast-message
```

**Configure Toast Messages:**

**File:** `Hommie_Mobile/App.tsx`

Add at the end of the component tree:

```typescript
import Toast from 'react-native-toast-message';

// At the end of App component, after all other components:
<Toast />
```

**Create Toast Helper:**

**File:** `Hommie_Mobile/src/utils/toast.ts`

```typescript
import Toast from 'react-native-toast-message';

export const showSuccessToast = (message: string, title: string = 'Success') => {
  Toast.show({
    type: 'success',
    text1: title,
    text2: message,
    visibilityTime: 3000,
    topOffset: 60,
  });
};

export const showErrorToast = (message: string, title: string = 'Error') => {
  Toast.show({
    type: 'error',
    text1: title,
    text2: message,
    visibilityTime: 4000,
    topOffset: 60,
  });
};

export const showInfoToast = (message: string, title: string = 'Info') => {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    visibilityTime: 3000,
    topOffset: 60,
  });
};
```

**Usage Example:**

```typescript
import { showSuccessToast, showErrorToast } from '../utils/toast';

// After successful profile update:
showSuccessToast('Your profile has been updated successfully');

// After error:
showErrorToast('Failed to update profile. Please try again.');
```

**Verification Checklist:**
- [ ] Toast messages working
- [ ] Success feedback clear
- [ ] Error messages user-friendly
- [ ] Consistent feedback across app

---

## Testing Checklist

### Unit Testing
- [ ] UserProfileService methods tested
- [ ] UserDashboardService methods tested
- [ ] AvatarUploadService methods tested
- [ ] NINVerificationService methods tested
- [ ] API error handling tested

### Integration Testing
- [ ] Profile fetch and update flow
- [ ] Avatar upload flow
- [ ] Dashboard stats loading
- [ ] Bookmark add/remove
- [ ] NIN verification flow

### UI Testing
- [ ] Loading states display correctly
- [ ] Error states show appropriate messages
- [ ] Success feedback appears
- [ ] Pull-to-refresh works on all screens
- [ ] Skeleton placeholders match content

### End-to-End Testing
- [ ] Complete user profile update flow
- [ ] Complete NIN verification flow
- [ ] Dashboard data refresh
- [ ] Avatar change from camera/library
- [ ] Bookmark management

### Apple HIG Compliance
- [ ] Native iOS components used
- [ ] Loading indicators follow guidelines
- [ ] Error states are informative
- [ ] Success feedback is clear
- [ ] Smooth animations
- [ ] Consistent navigation patterns
- [ ] Proper keyboard handling
- [ ] Accessibility labels (future)

---

## Apple HIG Compliance

### Key Guidelines Followed

#### 1. **Loading States**
- ✅ Use native `ActivityIndicator`
- ✅ Center in content area
- ✅ Show during all network requests
- ✅ Disable user interaction during loading

#### 2. **Pull-to-Refresh**
- ✅ Use `RefreshControl` component
- ✅ Brand color tint (#00A651)
- ✅ Smooth animation
- ✅ Intuitive gesture

#### 3. **Buttons**
- ✅ Clear active/disabled states
- ✅ Appropriate size (44pt minimum touch target)
- ✅ Visual feedback on press
- ✅ Descriptive labels

#### 4. **Navigation**
- ✅ Standard navigation bar
- ✅ Back button in top-left
- ✅ Clear page titles
- ✅ Consistent hierarchy

#### 5. **Forms**
- ✅ Clear field labels
- ✅ Placeholder text
- ✅ Character counts for limited fields
- ✅ Keyboard optimization
- ✅ Validation feedback

#### 6. **Typography**
- ✅ iOS system fonts
- ✅ Clear hierarchy (H1-H4, body, caption)
- ✅ Readable font sizes (minimum 12pt)
- ✅ Appropriate line height

#### 7. **Color**
- ✅ Brand colors consistent
- ✅ Sufficient contrast ratios
- ✅ Semantic color usage (green=success, red=error)
- ✅ Nigerian cultural context maintained

#### 8. **Feedback**
- ✅ Immediate response to user actions
- ✅ Clear success messages
- ✅ Informative error messages
- ✅ Progress indicators for long operations

---

## Deployment Readiness

### Pre-Deployment Checklist
- [ ] All API services tested
- [ ] Error handling complete
- [ ] Loading states implemented
- [ ] Success feedback working
- [ ] Navigation flows tested
- [ ] Backend endpoints verified
- [ ] Environment variables configured
- [ ] API URLs correct for production
- [ ] Image upload tested with real S3/Spaces
- [ ] NIN verification tested with test credentials

### Performance Checklist
- [ ] Images optimized before upload
- [ ] API calls batched where possible
- [ ] Caching implemented for profile data
- [ ] Pagination working for large lists
- [ ] Network timeouts configured
- [ ] Retry logic in place

### Security Checklist
- [ ] Auth tokens stored securely (AsyncStorage)
- [ ] Sensitive data not logged
- [ ] API calls use HTTPS
- [ ] File uploads validated
- [ ] User input sanitized

---

## Next Steps

After completing this integration:

1. **Gap 2 Implementation**: Implement remaining verification features (address verification, document uploads, trust score display)

2. **Gamification Integration**: Connect mobile app to gamification backend (achievements, badges, leaderboards)

3. **Cultural Profile Integration**: Connect cultural profile screens to backend

4. **Business Profile Integration**: Connect business registration and management

5. **Real-time Features**: Implement WebSocket connections for live updates

---

**Total Implementation Time:** 8 developer days

**API Endpoints Integrated:** 15+

**New Screens Created:** 2 (EditProfile, Bookmarks)

**Services Created:** 4 (UserProfile, UserDashboard, AvatarUpload, NINVerification)

---

*Integration guide complete! Ready for mobile development team.*
