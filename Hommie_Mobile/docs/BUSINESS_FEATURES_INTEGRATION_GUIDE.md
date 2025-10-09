# Business Features Frontend Integration Guide

## Executive Summary

This document provides a comprehensive, step-by-step guide for integrating the backend business service features into the MeCabal mobile application. The backend has implemented a full-featured business management system including profiles, search, reviews, inquiries, analytics, and license management. This guide breaks down the integration into actionable developer tasks following Apple's Human Interface Guidelines.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [API Integration Setup](#api-integration-setup)
3. [Feature Implementation Breakdown](#feature-implementation-breakdown)
4. [Mock Data Replacement Strategy](#mock-data-replacement-strategy)
5. [Developer Task Breakdown](#developer-task-breakdown)
6. [Testing & Quality Assurance](#testing--quality-assurance)

---

## Architecture Overview

### Backend Service Structure

The backend provides the following microservice endpoints:

**Base URL:** `http://localhost:3000` (API Gateway)

**Business Service Endpoints:**
- **Business Profile:** `/business/*` - CRUD operations for business profiles
- **Business Search:** `/business/search/*` - Advanced search with filters
- **Business Reviews:** `/business/:businessId/reviews/*` - Review management
- **Business Inquiries:** `/business/:businessId/inquiries/*` - Customer inquiries
- **Business Analytics:** `/business/:businessId/analytics/*` - Performance metrics
- **Business Licenses:** `/business/:businessId/licenses/*` - License verification
- **User Inquiries:** `/user/inquiries` - User's sent inquiries

### Authentication

All endpoints require JWT Bearer token authentication:
```typescript
Headers: {
  'Authorization': 'Bearer <JWT_TOKEN>',
  'Content-Type': 'application/json'
}
```

---

## API Integration Setup

### Step 1: Create API Service Layer

Create a centralized API service structure to handle all business-related API calls.

**File Structure:**
```
Hommie_Mobile/
├── src/
│   ├── services/
│   │   ├── api/
│   │   │   ├── apiClient.ts           # Axios instance with auth
│   │   │   ├── businessApi.ts         # Business profile endpoints
│   │   │   ├── businessSearchApi.ts   # Search endpoints
│   │   │   ├── businessReviewApi.ts   # Review endpoints
│   │   │   ├── businessInquiryApi.ts  # Inquiry endpoints
│   │   │   ├── businessAnalyticsApi.ts # Analytics endpoints
│   │   │   └── businessLicenseApi.ts  # License endpoints
│   │   └── types/
│   │       ├── business.types.ts      # TypeScript interfaces
│   │       ├── review.types.ts        # Review interfaces
│   │       ├── inquiry.types.ts       # Inquiry interfaces
│   │       └── api.types.ts           # Common API types
```

### Step 2: Define TypeScript Interfaces

**File:** `src/services/types/business.types.ts`

```typescript
// Enums matching backend
export enum ServiceArea {
  NEIGHBORHOOD = 'neighborhood',
  TWO_KM = '2km',
  FIVE_KM = '5km',
  TEN_KM = '10km',
  CITY_WIDE = 'city-wide',
  STATE_WIDE = 'state-wide',
  NATIONWIDE = 'nationwide',
}

export enum PricingModel {
  FIXED_RATE = 'fixed-rate',
  HOURLY = 'hourly',
  PER_ITEM = 'per-item',
  PROJECT_BASED = 'project-based',
  CUSTOM_QUOTE = 'custom-quote',
}

export enum Availability {
  BUSINESS_HOURS = 'business-hours',
  WEEKDAYS = 'weekdays',
  TWENTY_FOUR_SEVEN = '24/7',
  WEEKENDS = 'weekends',
  CUSTOM = 'custom',
}

export interface BusinessProfile {
  id: string;
  userId: string;
  businessName: string;
  description?: string;
  category: string;
  subcategory?: string;
  serviceArea: ServiceArea;
  pricingModel: PricingModel;
  availability: Availability;
  phoneNumber?: string;
  whatsappNumber?: string;
  businessAddress?: string;
  yearsOfExperience: number;
  paymentMethods?: string[];
  hasInsurance?: boolean;
  isActive: boolean;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBusinessProfileDto {
  businessName: string;
  description?: string;
  category: string;
  subcategory?: string;
  serviceArea: ServiceArea;
  pricingModel: PricingModel;
  availability: Availability;
  phoneNumber?: string;
  whatsappNumber?: string;
  businessAddress?: string;
  yearsOfExperience: number;
  paymentMethods?: string[];
  hasInsurance?: boolean;
}

export interface UpdateBusinessProfileDto {
  businessName?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  serviceArea?: ServiceArea;
  pricingModel?: PricingModel;
  availability?: Availability;
  phoneNumber?: string;
  whatsappNumber?: string;
  businessAddress?: string;
  yearsOfExperience?: number;
  paymentMethods?: string[];
  hasInsurance?: boolean;
}
```

**File:** `src/services/types/review.types.ts`

```typescript
export interface BusinessReview {
  id: string;
  businessId: string;
  userId: string;
  rating: number;
  reviewText?: string;
  serviceQuality?: number;
  professionalism?: number;
  valueForMoney?: number;
  businessResponse?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
}

export interface CreateReviewDto {
  rating: number;
  reviewText?: string;
  serviceQuality?: number;
  professionalism?: number;
  valueForMoney?: number;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  averageServiceQuality: number;
  averageProfessionalism: number;
  averageValueForMoney: number;
}
```

**File:** `src/services/types/inquiry.types.ts`

```typescript
export enum InquiryType {
  BOOKING = 'booking',
  QUESTION = 'question',
  QUOTE = 'quote',
}

export enum InquiryStatus {
  PENDING = 'pending',
  RESPONDED = 'responded',
  CLOSED = 'closed',
}

export enum PreferredContact {
  PHONE = 'phone',
  WHATSAPP = 'whatsapp',
  IN_APP = 'in-app',
}

export interface BusinessInquiry {
  id: string;
  businessId: string;
  userId: string;
  inquiryType: InquiryType;
  message: string;
  phoneNumber?: string;
  preferredContact?: PreferredContact;
  preferredDate?: string;
  status: InquiryStatus;
  response?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  business?: {
    id: string;
    businessName: string;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateInquiryDto {
  inquiryType: InquiryType;
  message: string;
  phoneNumber?: string;
  preferredContact?: PreferredContact;
  preferredDate?: string;
}

export interface InquiryStats {
  total: number;
  pending: number;
  responded: number;
  closed: number;
  averageResponseTime: string;
}
```

### Step 3: Create API Client

**File:** `src/services/api/apiClient.ts`

```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_BASE_URL = Platform.select({
  ios: 'http://localhost:3000',
  android: 'http://10.0.2.2:3000',
  web: 'http://localhost:3000',
  default: 'http://localhost:3000',
});

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle token expiration
          await AsyncStorage.removeItem('authToken');
          // Navigate to login screen (implement navigation logic)
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
```

---

## Feature Implementation Breakdown

### Feature 1: Business Profile Management

#### Backend Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/business/register` | Create new business profile |
| GET | `/business/my-business` | Get current user's business |
| GET | `/business/:id` | Get business by ID |
| PUT | `/business/:id` | Update business profile |
| PUT | `/business/:id/status` | Toggle online/offline status |
| DELETE | `/business/:id` | Delete business profile |

#### API Service Implementation

**File:** `src/services/api/businessApi.ts`

```typescript
import { apiClient } from './apiClient';
import {
  BusinessProfile,
  CreateBusinessProfileDto,
  UpdateBusinessProfileDto,
} from '../types/business.types';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const businessApi = {
  // Register new business
  async registerBusiness(
    data: CreateBusinessProfileDto
  ): Promise<BusinessProfile> {
    const response = await apiClient.post<ApiResponse<BusinessProfile>>(
      '/business/register',
      data
    );
    return response.data;
  },

  // Get current user's business
  async getMyBusiness(): Promise<BusinessProfile | null> {
    try {
      const response = await apiClient.get<ApiResponse<BusinessProfile>>(
        '/business/my-business'
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No business found
      }
      throw error;
    }
  },

  // Get business by ID
  async getBusinessById(id: string): Promise<BusinessProfile> {
    const response = await apiClient.get<ApiResponse<BusinessProfile>>(
      `/business/${id}`
    );
    return response.data;
  },

  // Update business profile
  async updateBusiness(
    id: string,
    data: UpdateBusinessProfileDto
  ): Promise<BusinessProfile> {
    const response = await apiClient.put<ApiResponse<BusinessProfile>>(
      `/business/${id}`,
      data
    );
    return response.data;
  },

  // Update business status (online/offline)
  async updateBusinessStatus(
    id: string,
    isActive: boolean
  ): Promise<BusinessProfile> {
    const response = await apiClient.put<ApiResponse<BusinessProfile>>(
      `/business/${id}/status`,
      { isActive }
    );
    return response.data;
  },

  // Delete business
  async deleteBusiness(id: string): Promise<void> {
    await apiClient.delete(`/business/${id}`);
  },
};
```

#### UI Component Updates

**Component:** `BusinessProfileScreen.tsx`

**Changes Required:**

1. **Replace mock data with API calls**
2. **Add loading states**
3. **Add error handling**
4. **Implement real status toggling**

**Implementation:**

```typescript
// src/screens/BusinessProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import { businessApi } from '../services/api/businessApi';
import { BusinessProfile } from '../services/types/business.types';

export default function BusinessProfileScreen({ navigation }: BusinessProfileScreenProps) {
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Load business profile on mount
  useEffect(() => {
    loadBusinessProfile();
  }, []);

  const loadBusinessProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const business = await businessApi.getMyBusiness();
      setBusinessProfile(business);
    } catch (err: any) {
      setError(err.message || 'Failed to load business profile');
      Alert.alert('Error', 'Failed to load business profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    if (!businessProfile) return;

    Alert.alert(
      businessProfile.isActive ? 'Go Offline?' : 'Go Online?',
      businessProfile.isActive
        ? 'Your business will be hidden from neighbor searches'
        : 'Your business will be visible to neighbors in your service area',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: businessProfile.isActive ? 'Go Offline' : 'Go Online',
          onPress: async () => {
            try {
              setUpdatingStatus(true);
              const updated = await businessApi.updateBusinessStatus(
                businessProfile.id,
                !businessProfile.isActive
              );
              setBusinessProfile(updated);
              Alert.alert(
                'Success',
                `Your business is now ${updated.isActive ? 'online' : 'offline'}`
              );
            } catch (err: any) {
              Alert.alert('Error', 'Failed to update status. Please try again.');
            } finally {
              setUpdatingStatus(false);
            }
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    navigation.navigate('EditBusinessProfile', { business: businessProfile });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Business Profile" navigation={navigation} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00A651" />
          <Text style={styles.loadingText}>Loading business profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!businessProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Business Profile" navigation={navigation} />
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="store-off" size={64} color="#8E8E8E" />
          <Text style={styles.emptyTitle}>No Business Profile</Text>
          <Text style={styles.emptyMessage}>
            You haven't registered a business yet. Create your business profile to start
            connecting with neighbors.
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('BusinessRegistration')}
          >
            <Text style={styles.createButtonText}>Create Business Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Rest of the component remains similar, using businessProfile state
  return (
    <SafeAreaView style={styles.container}>
      {/* Existing UI code, but using real data from businessProfile */}
    </SafeAreaView>
  );
}
```

---

### Feature 2: Business Search & Discovery

#### Backend Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/business/search` | Search with filters & pagination |
| GET | `/business/search/by-service-area` | Search grouped by service area |
| GET | `/business/search/featured` | Get featured businesses |
| GET | `/business/search/trending` | Get trending businesses |

#### Search DTO Parameters

```typescript
export interface SearchBusinessDto {
  query?: string;            // Text search
  category?: string;         // Filter by category
  subcategory?: string;      // Filter by subcategory
  latitude?: number;         // User location
  longitude?: number;        // User location
  radius?: number;           // Search radius in km (0-200)
  state?: string;            // Filter by state
  city?: string;             // Filter by city
  minRating?: number;        // Minimum rating (0-5)
  verifiedOnly?: boolean;    // Only verified businesses
  paymentMethods?: string[]; // Required payment methods
  sortBy?: 'rating' | 'reviewCount' | 'joinedDate' | 'distance' | 'completedJobs';
  sortOrder?: 'ASC' | 'DESC';
  page?: number;             // Page number (default: 1)
  limit?: number;            // Results per page (1-100, default: 20)
}
```

#### API Service Implementation

**File:** `src/services/api/businessSearchApi.ts`

```typescript
import { apiClient } from './apiClient';
import { BusinessProfile } from '../types/business.types';

export interface SearchBusinessDto {
  query?: string;
  category?: string;
  subcategory?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  state?: string;
  city?: string;
  minRating?: number;
  verifiedOnly?: boolean;
  paymentMethods?: string[];
  sortBy?: 'rating' | 'reviewCount' | 'joinedDate' | 'distance' | 'completedJobs';
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

interface SearchResponse {
  success: boolean;
  data: BusinessProfile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ServiceAreaGroup {
  serviceArea: string;
  businesses: BusinessProfile[];
  count: number;
}

export const businessSearchApi = {
  // Main search function
  async searchBusinesses(params: SearchBusinessDto): Promise<SearchResponse> {
    const response = await apiClient.get<SearchResponse>('/business/search', {
      params,
    });
    return response;
  },

  // Search by service area
  async searchByServiceArea(
    latitude: number,
    longitude: number,
    category?: string
  ): Promise<ServiceAreaGroup[]> {
    const response = await apiClient.get<{ success: boolean; data: ServiceAreaGroup[] }>(
      '/business/search/by-service-area',
      {
        params: { latitude, longitude, category },
      }
    );
    return response.data;
  },

  // Get featured businesses
  async getFeatured(limit: number = 10): Promise<BusinessProfile[]> {
    const response = await apiClient.get<{ success: boolean; data: BusinessProfile[] }>(
      '/business/search/featured',
      {
        params: { limit },
      }
    );
    return response.data;
  },

  // Get trending businesses
  async getTrending(limit: number = 10): Promise<BusinessProfile[]> {
    const response = await apiClient.get<{ success: boolean; data: BusinessProfile[] }>(
      '/business/search/trending',
      {
        params: { limit },
      }
    );
    return response.data;
  },
};
```

---

