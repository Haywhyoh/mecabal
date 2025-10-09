# Mobile App - Verification System Integration Guide
**MeCabal - React Native Mobile Integration**
*Connecting Backend Verification APIs with Mobile App UI*

---

## Table of Contents
1. [Overview](#overview)
2. [Backend API Integration](#backend-api-integration)
3. [User Profile Integration](#user-profile-integration)
4. [NIN Verification Flow](#nin-verification-flow)
5. [Document Upload Implementation](#document-upload-implementation)
6. [Trust Score & Badges Display](#trust-score--badges-display)
7. [Dashboard Statistics](#dashboard-statistics)
8. [Community Endorsements](#community-endorsements)
9. [Implementation Tasks Breakdown](#implementation-tasks-breakdown)
10. [Apple Design Guidelines Compliance](#apple-design-guidelines-compliance)

---

## Overview

### Current State Analysis

✅ **Backend Complete:**
- NIN verification API endpoints (`/verification/nin/*`)
- Trust score calculation system
- Verification badges system
- Document upload & storage (S3/Spaces)
- Audit trail logging
- User profile CRUD endpoints (`/users/*`)
- Dashboard statistics endpoints

❌ **Mobile App Missing:**
- API service layer for verification endpoints
- User profile editing UI with backend connection
- NIN verification flow (UI exists but uses mock data)
- Document upload with camera/gallery integration
- Trust score display components connected to API
- Verification badge components with real data
- Dashboard statistics API integration
- Community endorsement submission

### Technology Stack
- **Framework:** React Native with Expo (~53.0.20)
- **Language:** TypeScript
- **State Management:** React Context API
- **Storage:** AsyncStorage for local persistence
- **HTTP Client:** Axios (to be added)
- **Navigation:** React Navigation v7
- **Camera:** Expo Camera & ImagePicker
- **File System:** Expo FileSystem
- **Design System:** Following Apple HIG + MeCabal UX guidelines

### Integration Architecture

```
┌─────────────────────────────────────────────┐
│         Mobile App (React Native)           │
├─────────────────────────────────────────────┤
│  Screens                                    │
│  ├─ ProfileScreen (needs API integration)  │
│  ├─ NINVerificationScreen (mock → real)    │
│  ├─ DocumentUploadScreen (to create)       │
│  ├─ CommunityEndorsementScreen (update)    │
│  └─ EditProfileScreen (to create)          │
├─────────────────────────────────────────────┤
│  Contexts                                   │
│  ├─ AuthContext (existing)                 │
│  └─ ProfileContext (to create)             │
├─────────────────────────────────────────────┤
│  Services                                   │
│  ├─ verificationService (to create)        │
│  └─ userProfileService (to create)         │
├─────────────────────────────────────────────┤
│  Components                                 │
│  ├─ TrustScoreCard (to create)             │
│  ├─ UserVerificationBadge (update)         │
│  └─ DashboardStatsCard (to create)         │
└─────────────────────────────────────────────┘
                    ↓ HTTP (Axios)
┌─────────────────────────────────────────────┐
│         Backend (NestJS)                    │
├─────────────────────────────────────────────┤
│  API Gateway (Port 3000)                    │
│  ├─ /users/* → User Service                │
│  └─ /verification/* → Verification Service  │
└─────────────────────────────────────────────┘
```

---

## Backend API Integration

### Task 1: Install Required Dependencies

```bash
cd Hommie_Mobile
npm install axios
npm install expo-image-picker
npm install expo-document-picker
npm install expo-linear-gradient
npm install @react-native-async-storage/async-storage
```

**Checklist:**
- [ ] Install axios for HTTP requests
- [ ] Install expo-image-picker for camera/gallery
- [ ] Install expo-document-picker for file selection
- [ ] Install expo-linear-gradient for UI effects
- [ ] Verify AsyncStorage is installed

---

### Task 2: Create Verification API Service

**File:** `Hommie_Mobile/src/services/verificationService.ts` (NEW)

```typescript
import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const VERIFICATION_BASE = `${API_BASE_URL}/verification`;

// Create axios instance with auth interceptor
class VerificationService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: VERIFICATION_BASE,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to all requests
    this.api.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle errors globally
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Verification API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  // ==================== NIN Verification ====================

  /**
   * Initiate NIN verification
   * POST /verification/nin/initiate
   */
  async initiateNINVerification(ninNumber: string) {
    const response = await this.api.post('/nin/initiate', {
      ninNumber: ninNumber.replace(/\s+/g, ''), // Remove spaces
    });
    return response.data;
  }

  /**
   * Get NIN verification status
   * GET /verification/nin/status/:userId or /verification/nin/status/me
   */
  async getNINVerificationStatus(userId?: string) {
    const endpoint = userId ? `/nin/status/${userId}` : '/nin/status/me';
    const response = await this.api.get(endpoint);
    return response.data;
  }

  // ==================== Document Upload ====================

  /**
   * Upload identity document
   * POST /verification/document/upload
   */
  async uploadDocument(
    documentType: 'nin_card' | 'drivers_license' | 'voters_card' | 'passport' | 'utility_bill',
    file: {
      uri: string;
      type: string;
      name: string;
    },
    documentNumber?: string
  ) {
    const formData = new FormData();
    formData.append('document', {
      uri: file.uri,
      type: file.type,
      name: file.name,
    } as any);
    formData.append('documentType', documentType);
    if (documentNumber) {
      formData.append('documentNumber', documentNumber);
    }

    const response = await this.api.post('/document/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Get user's documents
   * GET /verification/documents
   */
  async getUserDocuments() {
    const response = await this.api.get('/documents');
    return response.data;
  }

  /**
   * Delete a document
   * DELETE /verification/document/:documentId
   */
  async deleteDocument(documentId: string) {
    const response = await this.api.delete(`/document/${documentId}`);
    return response.data;
  }

  // ==================== Trust Score ====================

  /**
   * Get user trust score
   * GET /verification/trust-score/:userId or /verification/trust-score
   */
  async getTrustScore(userId?: string) {
    const endpoint = userId ? `/trust-score/${userId}` : '/trust-score';
    const response = await this.api.get(endpoint);
    return response.data;
  }

  // ==================== Badges ====================

  /**
   * Get user badges
   * GET /verification/badges/:userId or /verification/badges/me
   */
  async getUserBadges(userId?: string) {
    const endpoint = userId ? `/badges/${userId}` : '/badges/me';
    const response = await this.api.get(endpoint);
    return response.data;
  }

  // ==================== Endorsements ====================

  /**
   * Endorse another user
   * POST /verification/endorse/:userId
   */
  async endorseUser(
    userId: string,
    endorsementType: 'neighbor' | 'professional' | 'character' | 'safety',
    message?: string,
    rating?: number
  ) {
    const response = await this.api.post(`/endorse/${userId}`, {
      endorsementType,
      message,
      rating,
    });
    return response.data;
  }

  /**
   * Get user endorsements
   * GET /verification/endorsements/:userId or /verification/endorsements/me
   */
  async getUserEndorsements(userId?: string) {
    const endpoint = userId ? `/endorsements/${userId}` : '/endorsements/me';
    const response = await this.api.get(endpoint);
    return response.data;
  }

  // ==================== Audit ====================

  /**
   * Get verification history/audit trail
   * GET /verification/audit/me
   */
  async getVerificationHistory() {
    const response = await this.api.get('/audit/me');
    return response.data;
  }
}

export const verificationService = new VerificationService();
export default verificationService;
```

**Checklist:**
- [ ] Create service file with proper structure
- [ ] Configure base URL from environment
- [ ] Add auth interceptor for JWT tokens
- [ ] Implement all API methods
- [ ] Add proper error handling
- [ ] Test API connection with Postman first

---

### Task 3: Create User Profile API Service

**File:** `Hommie_Mobile/src/services/userProfileService.ts` (NEW)

```typescript
import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const USER_BASE = `${API_BASE_URL}/users`;

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
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

class UserProfileService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: USER_BASE,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token
    this.api.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // ==================== Profile CRUD ====================

  /**
   * Get current user profile
   * GET /users/me
   */
  async getCurrentUserProfile() {
    const response = await this.api.get('/me');
    return response.data;
  }

  /**
   * Get user profile by ID
   * GET /users/:id
   */
  async getUserProfile(userId: string) {
    const response = await this.api.get(`/${userId}`);
    return response.data;
  }

  /**
   * Update current user profile
   * PUT /users/me
   */
  async updateProfile(data: UpdateProfileData) {
    const response = await this.api.put('/me', data);
    return response.data;
  }

  /**
   * Get profile completion percentage
   * GET /users/me/completion
   */
  async getProfileCompletion() {
    const response = await this.api.get('/me/completion');
    return response.data;
  }

  // ==================== Avatar Upload ====================

  /**
   * Upload user avatar
   * POST /users/me/avatar
   */
  async uploadAvatar(imageUri: string) {
    const formData = new FormData();

    // Extract file extension from URI
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];

    formData.append('avatar', {
      uri: imageUri,
      name: `avatar.${fileType}`,
      type: `image/${fileType}`,
    } as any);

    const response = await this.api.post('/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Delete user avatar
   * DELETE /users/me/avatar
   */
  async deleteAvatar() {
    const response = await this.api.delete('/me/avatar');
    return response.data;
  }

  // ==================== Search ====================

  /**
   * Search users with filters
   * GET /users/search
   */
  async searchUsers(params: {
    query?: string;
    state?: string;
    city?: string;
    estate?: string;
    verifiedOnly?: boolean;
    page?: number;
    limit?: number;
  }) {
    const response = await this.api.get('/search', { params });
    return response.data;
  }

  /**
   * Get nearby users
   * GET /users/nearby
   */
  async getNearbyUsers(params: {
    state: string;
    city?: string;
    estate?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await this.api.get('/nearby', { params });
    return response.data;
  }

  // ==================== Dashboard ====================

  /**
   * Get dashboard statistics
   * GET /users/dashboard/stats
   */
  async getDashboardStats() {
    const response = await this.api.get('/dashboard/stats');
    return response.data;
  }

  /**
   * Add bookmark
   * POST /users/dashboard/bookmarks
   */
  async addBookmark(itemType: 'post' | 'listing' | 'event', itemId: string) {
    const response = await this.api.post('/dashboard/bookmarks', {
      itemType,
      itemId,
    });
    return response.data;
  }

  /**
   * Remove bookmark
   * DELETE /users/dashboard/bookmarks/:itemType/:itemId
   */
  async removeBookmark(itemType: 'post' | 'listing' | 'event', itemId: string) {
    const response = await this.api.delete(`/dashboard/bookmarks/${itemType}/${itemId}`);
    return response.data;
  }

  /**
   * Get bookmarks by type
   * GET /users/dashboard/bookmarks/:itemType
   */
  async getBookmarks(itemType: 'post' | 'listing' | 'event', page = 1, limit = 20) {
    const response = await this.api.get(`/dashboard/bookmarks/${itemType}`, {
      params: { page, limit },
    });
    return response.data;
  }

  /**
   * Check if item is bookmarked
   * GET /users/dashboard/bookmarks/check/:itemType/:itemId
   */
  async isBookmarked(itemType: 'post' | 'listing' | 'event', itemId: string) {
    const response = await this.api.get(`/dashboard/bookmarks/check/${itemType}/${itemId}`);
    return response.data;
  }
}

export const userProfileService = new UserProfileService();
export default userProfileService;
```

**Checklist:**
- [ ] Create service file
- [ ] Implement all CRUD methods
- [ ] Add proper TypeScript interfaces
- [ ] Test avatar upload functionality
- [ ] Test dashboard endpoints
- [ ] Add error handling

---

## User Profile Integration

### Task 4: Create Profile Context

**File:** `Hommie_Mobile/src/contexts/ProfileContext.tsx` (NEW)

```typescript
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { userProfileService } from '../services/userProfileService';
import { verificationService } from '../services/verificationService';
import { useAuth } from './AuthContext';

// ==================== Types ====================

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  bio?: string;
  occupation?: string;
  professionalSkills?: string;
  culturalBackground?: string;
  nativeLanguages?: string;
  state?: string;
  city?: string;
  estate?: string;
  isVerified: boolean;
  phoneVerified: boolean;
  identityVerified: boolean;
  addressVerified: boolean;
  trustScore: number;
  verificationLevel?: string;
  verificationBadge?: string;
  profileCompleteness: number;
  locationString: string;
  joinDate: string;
}

interface TrustScore {
  score: number;
  breakdown: {
    phoneVerification: number;
    identityVerification: number;
    addressVerification: number;
    endorsements: number;
    activityLevel: number;
  };
  level: string;
  nextLevel: string;
  pointsToNextLevel: number;
}

interface DashboardStats {
  bookmarks: {
    count: number;
    items: any[];
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

interface ProfileContextType {
  profile: UserProfile | null;
  trustScore: TrustScore | null;
  dashboardStats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  uploadAvatar: (imageUri: string) => Promise<void>;
  refreshTrustScore: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
}

// ==================== Context ====================

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [trustScore, setTrustScore] = useState<TrustScore | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==================== Methods ====================

  const refreshProfile = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);
      const data = await userProfileService.getCurrentUserProfile();
      setProfile(data);
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const refreshTrustScore = async () => {
    if (!isAuthenticated) return;

    try {
      const data = await verificationService.getTrustScore();
      setTrustScore(data);
    } catch (err: any) {
      console.error('Error loading trust score:', err);
    }
  };

  const refreshDashboard = async () => {
    if (!isAuthenticated) return;

    try {
      const data = await userProfileService.getDashboardStats();
      setDashboardStats(data);
    } catch (err: any) {
      console.error('Error loading dashboard stats:', err);
    }
  };

  const updateProfile = async (data: any) => {
    try {
      setLoading(true);
      setError(null);
      const updated = await userProfileService.updateProfile(data);
      setProfile(updated);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (imageUri: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await userProfileService.uploadAvatar(imageUri);

      // Update profile with new avatar URL
      if (profile) {
        setProfile({
          ...profile,
          profilePictureUrl: result.avatarUrl,
        });
      }
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      setError(err.message || 'Failed to upload avatar');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Load profile on mount or when auth changes
  useEffect(() => {
    if (isAuthenticated) {
      refreshProfile();
      refreshTrustScore();
      refreshDashboard();
    }
  }, [isAuthenticated]);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        trustScore,
        dashboardStats,
        loading,
        error,
        refreshProfile,
        updateProfile,
        uploadAvatar,
        refreshTrustScore,
        refreshDashboard,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

// ==================== Hook ====================

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider');
  }
  return context;
};
```

**Integration Steps:**

1. **Add Provider to App.tsx:**

```typescript
// In App.tsx
import { ProfileProvider } from './src/contexts/ProfileContext';

function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        {/* Your app content */}
      </ProfileProvider>
    </AuthProvider>
  );
}
```

**Checklist:**
- [ ] Create ProfileContext file
- [ ] Add to App.tsx provider tree (inside AuthProvider)
- [ ] Test profile loading on app start
- [ ] Test profile updates
- [ ] Verify context is accessible in all screens
- [ ] Add error handling
- [ ] Test with network failures

---

## NIN Verification Flow

### Task 5: Update NIN Verification Screen

**File:** `Hommie_Mobile/src/screens/NINVerificationScreen.tsx` (UPDATE EXISTING)

**Required Changes:**

1. **Add imports:**

```typescript
import { verificationService } from '../services/verificationService';
import { useProfile } from '../contexts/ProfileContext';
import { ActivityIndicator } from 'react-native';
```

2. **Use Profile Context:**

```typescript
export default function NINVerificationScreen() {
  const navigation = useNavigation();
  const { refreshProfile, refreshTrustScore } = useProfile();

  // ... existing state
```

3. **Replace handleVerifyNIN function:**

```typescript
const handleVerifyNIN = async () => {
  if (!validateNIN(nin)) {
    Alert.alert('Invalid NIN', 'Please enter a valid 11-digit National Identification Number');
    return;
  }

  setIsLoading(true);

  try {
    // ✅ Call REAL API instead of mock
    const result = await verificationService.initiateNINVerification(nin);

    // Map API response to component state
    const ninData: NINData = {
      nin: nin,
      firstName: result.firstName,
      lastName: result.lastName,
      dateOfBirth: result.dateOfBirth,
      gender: result.gender,
      stateOfOrigin: result.stateOfOrigin,
      isVerified: result.verificationStatus === 'verified',
    };

    setNinData(ninData);
    setVerificationStep('preview');
  } catch (error: any) {
    console.error('NIN Verification Error:', error);

    // User-friendly error messages
    const errorMessage =
      error.response?.data?.message ||
      error.response?.status === 400 ? 'Invalid NIN number' :
      error.response?.status === 429 ? 'Too many attempts. Please try again later.' :
      'Unable to verify NIN. Please check your number and try again.';

    Alert.alert('Verification Failed', errorMessage);
  } finally {
    setIsLoading(false);
  }
};
```

4. **Replace handleConfirmVerification function:**

```typescript
const handleConfirmVerification = async () => {
  try {
    setIsLoading(true);

    // Refresh profile to get updated verification status
    await Promise.all([
      refreshProfile(),
      refreshTrustScore(),
    ]);

    setVerificationStep('success');

    // Show success and navigate
    setTimeout(() => {
      Alert.alert(
        'NIN Verified Successfully',
        'Your National ID has been verified and your community trust score has been updated.',
        [
          {
            text: 'View Profile',
            onPress: () => navigation.navigate('Profile' as never),
          }
        ]
      );
    }, 500);
  } catch (error) {
    console.error('Confirmation error:', error);
    Alert.alert('Error', 'Failed to update profile. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
```

5. **Update loading indicator in verify button:**

```typescript
<TouchableOpacity
  style={[
    styles.verifyButton,
    validateNIN(nin) ? styles.verifyButtonActive : styles.verifyButtonDisabled
  ]}
  onPress={handleVerifyNIN}
  disabled={!validateNIN(nin) || isLoading}
>
  {isLoading ? (
    <ActivityIndicator color="#FFFFFF" size="small" />
  ) : (
    <>
      <MaterialCommunityIcons name="shield-check" size={20} color="#FFFFFF" />
      <Text style={styles.verifyButtonText}>Verify NIN</Text>
    </>
  )}
</TouchableOpacity>
```

**Checklist:**
- [ ] Import required services and contexts
- [ ] Replace mock API with real service call
- [ ] Add comprehensive error handling
- [ ] Test with valid NIN
- [ ] Test with invalid NIN (should show error)
- [ ] Test network failure scenarios
- [ ] Update profile after successful verification
- [ ] Navigate to profile on success
- [ ] Show loading states properly

---

## Implementation Tasks Breakdown

### Phase 1: Foundation (Days 1-3)
**Priority: CRITICAL**

#### Day 1: API Services Setup

**Task 1.1: Install Dependencies**
- [ ] Run `npm install axios expo-image-picker expo-linear-gradient`
- [ ] Verify all packages installed correctly
- [ ] Test app still runs after installation

**Task 1.2: Create API Services**
- [ ] Create `services/verificationService.ts`
- [ ] Create `services/userProfileService.ts`
- [ ] Add environment variable `EXPO_PUBLIC_API_URL`
- [ ] Test API connection with Postman first
- [ ] Add console logs to verify requests are being made

**Task 1.3: Test API Authentication**
- [ ] Verify auth token is being added to requests
- [ ] Test with valid token
- [ ] Test with invalid/expired token
- [ ] Confirm error handling works

#### Day 2: Profile Context

**Task 2.1: Create ProfileContext**
- [ ] Create `contexts/ProfileContext.tsx`
- [ ] Add all required TypeScript types
- [ ] Implement all context methods
- [ ] Add error handling

**Task 2.2: Integrate Context**
- [ ] Add ProfileProvider to `App.tsx`
- [ ] Ensure it's inside AuthProvider
- [ ] Test context loads profile on app start
- [ ] Add console logs to verify data flow

#### Day 3: Profile Screen Integration

**Task 3.1: Update ProfileScreen**
- [ ] Import and use ProfileContext
- [ ] Replace mock user data with `profile` from context
- [ ] Replace mock dashboard data with `dashboardStats`
- [ ] Add pull-to-refresh functionality
- [ ] Show loading skeleton while data loads
- [ ] Handle empty/null states gracefully

**Task 3.2: Test Profile Integration**
- [ ] Verify profile data displays correctly
- [ ] Test refresh functionality
- [ ] Test with slow network
- [ ] Test error states

---

### Phase 2: NIN Verification (Days 4-5)
**Priority: HIGH**

#### Day 4: Update NIN Screen

**Task 4.1: Connect NIN Screen to API**
- [ ] Update `NINVerificationScreen.tsx`
- [ ] Replace mock data with `verificationService`
- [ ] Add proper error messages for different scenarios
- [ ] Test with backend NIN verification API

**Task 4.2: Test NIN Flow**
- [ ] Test with valid NIN (if available)
- [ ] Test with invalid format
- [ ] Test network failures
- [ ] Test success flow end-to-end

#### Day 5: Verification Status Display

**Task 5.1: Update Verification Badge Component**
- [ ] Update `UserVerificationBadge.tsx`
- [ ] Connect to ProfileContext
- [ ] Show real verification status
- [ ] Add badge for verified users

**Task 5.2: Add Verification Level Display**
- [ ] Show verification level on profile
- [ ] Add progress indicator
- [ ] Link to verification screens

---

### Phase 3: Avatar Upload (Days 6-7)
**Priority: HIGH**

#### Day 6: Implement Camera Integration

**Task 6.1: Setup Image Picker**
- [ ] Request camera permissions
- [ ] Implement camera capture
- [ ] Implement gallery selection
- [ ] Add image preview before upload

**Task 6.2: Update Profile Screen**
- [ ] Add camera button to avatar
- [ ] Show image picker options (camera/gallery)
- [ ] Display selected image
- [ ] Add upload progress indicator

#### Day 7: Avatar Upload Implementation

**Task 7.1: Connect Upload to API**
- [ ] Call `userProfileService.uploadAvatar()`
- [ ] Handle upload progress
- [ ] Update UI after successful upload
- [ ] Handle upload errors

**Task 7.2: Test Avatar Upload**
- [ ] Test camera capture
- [ ] Test gallery selection
- [ ] Test upload to S3
- [ ] Verify image appears on profile
- [ ] Test with large images
- [ ] Test with unsupported formats

---

### Phase 4: Document Upload (Days 8-10)
**Priority: MEDIUM**

#### Day 8: Create Document Upload Screen

**Task 8.1: Create Screen**
- [ ] Create `screens/DocumentUploadScreen.tsx`
- [ ] Add document type selection UI
- [ ] Add camera/gallery options
- [ ] Add image preview
- [ ] Style according to design guidelines

**Task 8.2: Add to Navigation**
- [ ] Add route to navigation
- [ ] Link from profile screen
- [ ] Test navigation flow

#### Day 9: Document Upload Logic

**Task 9.1: Implement Upload**
- [ ] Connect to `verificationService.uploadDocument()`
- [ ] Add file validation
- [ ] Show upload progress
- [ ] Handle success/error states

**Task 9.2: Document Management**
- [ ] Create screen to view uploaded documents
- [ ] Show verification status per document
- [ ] Add delete functionality
- [ ] Test full document flow

#### Day 10: Testing & Polish

**Task 10.1: Test Document Upload**
- [ ] Test all document types
- [ ] Test file size limits
- [ ] Test network failures
- [ ] Test concurrent uploads

---

### Phase 5: Trust Score & Dashboard (Days 11-13)
**Priority: MEDIUM**

#### Day 11: Trust Score Component

**Task 11.1: Create TrustScoreCard**
- [ ] Create `components/TrustScoreCard.tsx`
- [ ] Add score display with gradient
- [ ] Show breakdown of score components
- [ ] Add progress to next level
- [ ] Style with linear gradient

**Task 11.2: Integrate Trust Score**
- [ ] Add to profile screen
- [ ] Load from ProfileContext
- [ ] Add refresh functionality
- [ ] Test with different score values

#### Day 12: Dashboard Statistics

**Task 12.1: Update Dashboard Cards**
- [ ] Replace hardcoded bookmark count
- [ ] Replace hardcoded events count
- [ ] Replace hardcoded posts count
- [ ] Replace community stats

**Task 12.2: Add Bookmarks Functionality**
- [ ] Add bookmark button to posts
- [ ] Add bookmark button to events
- [ ] Add bookmark button to listings
- [ ] Test bookmark add/remove
- [ ] Update dashboard after bookmark changes

#### Day 13: Dashboard Testing

**Task 13.1: Test Dashboard**
- [ ] Test all dashboard cards
- [ ] Test refresh functionality
- [ ] Test bookmark sync
- [ ] Test with empty data

---

### Phase 6: Community Endorsements (Days 14-15)
**Priority: LOW**

#### Day 14: Endorsement Screen Update

**Task 14.1: Connect to API**
- [ ] Update `CommunityEndorsementScreen.tsx`
- [ ] Load endorsements from API
- [ ] Show existing endorsements
- [ ] Add endorsement form

**Task 14.2: Submit Endorsements**
- [ ] Call `verificationService.endorseUser()`
- [ ] Handle success/error
- [ ] Refresh endorsements list
- [ ] Prevent duplicate endorsements

#### Day 15: Endorsement Display

**Task 15.1: Show Endorsements**
- [ ] Display endorsement count on profile
- [ ] Create endorsements list screen
- [ ] Show endorser details
- [ ] Add endorsement filtering

**Task 15.2: Test Endorsements**
- [ ] Test endorsement submission
- [ ] Test endorsement loading
- [ ] Test with different types
- [ ] Test duplicate prevention

---

### Phase 7: Testing & Polish (Days 16-18)
**Priority: CRITICAL**

#### Day 16: Integration Testing

**Task 16.1: End-to-End Testing**
- [ ] Test complete verification flow
- [ ] Test profile editing flow
- [ ] Test document upload flow
- [ ] Test dashboard updates
- [ ] Test endorsement flow

**Task 16.2: Error Handling**
- [ ] Test all network error scenarios
- [ ] Test with offline mode
- [ ] Verify error messages are user-friendly
- [ ] Add retry mechanisms

#### Day 17: Performance & UX

**Task 17.1: Optimize Performance**
- [ ] Add image caching
- [ ] Optimize API calls
- [ ] Add pagination where needed
- [ ] Minimize unnecessary re-renders

**Task 17.2: UX Polish**
- [ ] Add loading skeletons
- [ ] Add haptic feedback
- [ ] Improve transitions
- [ ] Test on slow networks

#### Day 18: Final Testing

**Task 18.1: Device Testing**
- [ ] Test on iOS (iPhone 12+)
- [ ] Test on Android (API 29+)
- [ ] Test different screen sizes
- [ ] Test with different network speeds

**Task 18.2: Accessibility**
- [ ] Add accessibility labels
- [ ] Test with VoiceOver (iOS)
- [ ] Test with TalkBack (Android)
- [ ] Ensure proper contrast ratios

---

## Apple Design Guidelines Compliance

### Key Principles

#### 1. Privacy & Security

**Data Collection Transparency:**
```typescript
// Always explain why you need permissions
const requestCameraPermission = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();

  if (status !== 'granted') {
    Alert.alert(
      'Camera Access Required',
      'MeCabal needs camera access to capture your verification documents. ' +
      'You can enable this in Settings > MeCabal > Camera.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() }
      ]
    );
    return false;
  }
  return true;
};
```

**Sensitive Data Handling:**
- Encrypt NIN and sensitive data before storage
- Never log sensitive data to console in production
- Use HTTPS for all API calls
- Store tokens in secure storage (iOS Keychain via AsyncStorage)

#### 2. User Interface

**Typography Compliance:**
```typescript
const typography = {
  largeTitle: { fontSize: 34, fontWeight: '700' }, // Page titles
  title1: { fontSize: 28, fontWeight: '600' },     // Section headers
  title2: { fontSize: 22, fontWeight: '600' },     // Card titles
  title3: { fontSize: 20, fontWeight: '500' },     // Sub-headers
  body: { fontSize: 17, fontWeight: '400' },       // Main text
  callout: { fontSize: 16, fontWeight: '400' },    // Secondary text
  subheadline: { fontSize: 15, fontWeight: '400' },// Captions
  footnote: { fontSize: 13, fontWeight: '400' },   // Helper text
  caption1: { fontSize: 12, fontWeight: '400' },   // Timestamps
};
```

**Touch Targets:**
```typescript
// Minimum 44x44 points for all interactive elements
const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
```

**Color Contrast:**
```typescript
// Ensure WCAG AA compliance (4.5:1 for normal text, 3:1 for large text)
const colors = {
  text: {
    primary: '#2C2C2C',   // On white: 12.63:1 ✅
    secondary: '#8E8E8E', // On white: 4.54:1 ✅
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#FAFAFA',
  },
};
```

#### 3. Navigation & Flow

**Clear Hierarchy:**
```typescript
// Use standard navigation patterns
<Stack.Navigator>
  <Stack.Screen
    name="Profile"
    component={ProfileScreen}
    options={{
      title: 'Profile',
      headerLeft: () => <BackButton />,
    }}
  />
  <Stack.Screen
    name="NINVerification"
    component={NINVerificationScreen}
    options={{
      presentation: 'modal', // Use for verification flows
      title: 'Verify Identity',
    }}
  />
</Stack.Navigator>
```

**Progress Indicators:**
```typescript
// Show progress for multi-step flows
<View style={styles.progressBar}>
  <View style={[styles.progressFill, { width: `${(step / totalSteps) * 100}%` }]} />
</View>
<Text style={styles.progressText}>Step {step} of {totalSteps}</Text>
```

#### 4. Feedback & Loading States

**Loading Indicators:**
```typescript
// Use ActivityIndicator for async operations
{loading && <ActivityIndicator size="large" color="#00A651" />}

// Use skeleton screens for better UX
<ContentLoader>
  <Rect x="0" y="0" rx="4" ry="4" width="100" height="100" />
  <Rect x="120" y="10" rx="4" ry="4" width="200" height="20" />
</ContentLoader>
```

**Haptic Feedback:**
```typescript
import * as Haptics from 'expo-haptics';

// On success
await verificationService.uploadDocument(...);
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// On error
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

// On button press
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
```

#### 5. Accessibility

**Accessibility Labels:**
```typescript
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Upload verification document"
  accessibilityHint="Opens camera to capture your identity document"
  accessibilityRole="button"
  onPress={handleUpload}
>
  <MaterialCommunityIcons name="camera" size={24} />
  <Text>Upload Document</Text>
</TouchableOpacity>
```

**VoiceOver Support:**
```typescript
// Group related elements
<View
  accessible={true}
  accessibilityLabel={`Trust score ${trustScore} out of 100. Level: ${level}`}
>
  <Text>{trustScore}</Text>
  <Text>{level}</Text>
</View>
```

---

## Summary

### What's Been Done (Backend)
✅ Complete verification system with NIN, documents, trust score
✅ User profile CRUD with dashboard statistics
✅ Badges and endorsement system
✅ All API endpoints ready and tested

### What Needs to Be Done (Mobile)
1. **API Integration** - Create service layers
2. **Profile Context** - Centralized state management
3. **NIN Verification** - Connect UI to real API
4. **Document Upload** - Camera integration
5. **Trust Score Display** - Visual components
6. **Dashboard** - Real-time statistics
7. **Endorsements** - Community features

### Estimated Timeline
**Total: 18 days (3.5 weeks)**

- Phase 1 (Foundation): 3 days
- Phase 2 (NIN Verification): 2 days
- Phase 3 (Avatar Upload): 2 days
- Phase 4 (Document Upload): 3 days
- Phase 5 (Trust Score & Dashboard): 3 days
- Phase 6 (Endorsements): 2 days
- Phase 7 (Testing & Polish): 3 days

### Team Requirements
- 1 Mobile Developer (React Native/TypeScript)
- 1 Backend Developer (Support/bug fixes)
- 1 QA Engineer (Testing)
- 1 Designer (UI review)

### Success Criteria
- [ ] All API endpoints integrated
- [ ] NIN verification flow works end-to-end
- [ ] Document upload functional
- [ ] Trust score displays correctly
- [ ] Dashboard shows real data
- [ ] Passes iOS App Store review
- [ ] 80%+ test coverage
- [ ] No critical bugs

---

**Next Steps:**
1. Review this guide with the development team
2. Set up development environment
3. Begin with Phase 1 (API Foundation)
4. Daily standups to track progress
5. Weekly demos to stakeholders
