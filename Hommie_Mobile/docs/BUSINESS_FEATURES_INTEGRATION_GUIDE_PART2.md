# Business Features Integration Guide - Part 2

## Continued from Part 1

---

### Feature 2: Business Search & Discovery (Continued)

#### UI Component Updates

**Component:** `LocalBusinessDirectoryScreen.tsx`

**Changes Required:**

1. **Replace mock businesses array with API search**
2. **Implement pagination**
3. **Add location-based search**
4. **Implement real-time filtering**
5. **Add pull-to-refresh**

**Implementation:**

```typescript
// src/screens/LocalBusinessDirectoryScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { RefreshControl } from 'react-native';
import * as Location from 'expo-location';
import { businessSearchApi, SearchBusinessDto } from '../services/api/businessSearchApi';
import { BusinessProfile } from '../services/types/business.types';

export default function LocalBusinessDirectoryScreen() {
  const navigation = useNavigation();

  // State
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'distance' | 'completedJobs'>('rating');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Location State
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Get user location on mount
  useEffect(() => {
    getUserLocation();
  }, []);

  // Load businesses when filters change
  useEffect(() => {
    loadBusinesses(true);
  }, [searchText, selectedCategory, sortBy, userLocation]);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for nearby businesses');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const loadBusinesses = async (reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setCurrentPage(1);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const searchParams: SearchBusinessDto = {
        page: reset ? 1 : currentPage,
        limit: 20,
        sortBy: sortBy === 'distance' ? 'distance' : sortBy,
        sortOrder: 'DESC',
      };

      // Add search query
      if (searchText.trim()) {
        searchParams.query = searchText.trim();
      }

      // Add category filter
      if (selectedCategory && selectedCategory !== 'all') {
        searchParams.category = selectedCategory;
      }

      // Add location for distance sorting
      if (userLocation) {
        searchParams.latitude = userLocation.latitude;
        searchParams.longitude = userLocation.longitude;
        searchParams.radius = 50; // 50km radius
      }

      const response = await businessSearchApi.searchBusinesses(searchParams);

      if (reset) {
        setBusinesses(response.data);
      } else {
        setBusinesses([...businesses, ...response.data]);
      }

      setTotalPages(response.pagination.totalPages);
      setHasMore(response.pagination.page < response.pagination.totalPages);
      setCurrentPage(response.pagination.page);

    } catch (err: any) {
      setError(err.message || 'Failed to load businesses');
      Alert.alert('Error', 'Failed to load businesses. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadBusinesses(true);
  }, [searchText, selectedCategory, sortBy, userLocation]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      setCurrentPage(currentPage + 1);
      loadBusinesses(false);
    }
  }, [loadingMore, hasMore, currentPage]);

  const handleViewProfile = (business: BusinessProfile) => {
    navigation.navigate('BusinessDetail', { businessId: business.id });
  };

  // Render loading state
  if (loading && businesses.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00A651" />
          <Text style={styles.loadingText}>Finding nearby businesses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Existing header and filters */}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom =
            layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
          if (isCloseToBottom) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {businesses.map(renderBusinessCard)}

        {/* Loading more indicator */}
        {loadingMore && (
          <View style={styles.loadingMoreContainer}>
            <ActivityIndicator size="small" color="#00A651" />
            <Text style={styles.loadingMoreText}>Loading more businesses...</Text>
          </View>
        )}

        {/* No results */}
        {businesses.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="store-search" size={64} color="#8E8E8E" />
            <Text style={styles.emptyTitle}>No Businesses Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchText
                ? `No businesses match "${searchText}". Try a different search term.`
                : 'No businesses available in the selected category.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

### Feature 3: Business Reviews & Ratings

#### Backend Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/business/:businessId/reviews` | Create review |
| GET | `/business/:businessId/reviews` | Get all reviews (paginated) |
| GET | `/business/:businessId/reviews/stats` | Get review statistics |
| PUT | `/business/:businessId/reviews/:reviewId` | Update review |
| POST | `/business/:businessId/reviews/:reviewId/respond` | Business owner responds |
| DELETE | `/business/:businessId/reviews/:reviewId` | Delete review |

#### API Service Implementation

**File:** `src/services/api/businessReviewApi.ts`

```typescript
import { apiClient } from './apiClient';
import { BusinessReview, CreateReviewDto, ReviewStats } from '../types/review.types';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface ReviewListResponse {
  success: boolean;
  data: BusinessReview[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ReviewQueryDto {
  page?: number;
  limit?: number;
  rating?: number; // Filter by specific rating
}

export const businessReviewApi = {
  // Create a review
  async createReview(
    businessId: string,
    data: CreateReviewDto
  ): Promise<BusinessReview> {
    const response = await apiClient.post<ApiResponse<BusinessReview>>(
      `/business/${businessId}/reviews`,
      data
    );
    return response.data;
  },

  // Get reviews for a business
  async getReviews(
    businessId: string,
    query: ReviewQueryDto = {}
  ): Promise<ReviewListResponse> {
    const response = await apiClient.get<ReviewListResponse>(
      `/business/${businessId}/reviews`,
      { params: query }
    );
    return response;
  },

  // Get review statistics
  async getReviewStats(businessId: string): Promise<ReviewStats> {
    const response = await apiClient.get<ApiResponse<ReviewStats>>(
      `/business/${businessId}/reviews/stats`
    );
    return response.data;
  },

  // Update a review
  async updateReview(
    businessId: string,
    reviewId: string,
    data: CreateReviewDto
  ): Promise<BusinessReview> {
    const response = await apiClient.put<ApiResponse<BusinessReview>>(
      `/business/${businessId}/reviews/${reviewId}`,
      data
    );
    return response.data;
  },

  // Business owner responds to review
  async respondToReview(
    businessId: string,
    reviewId: string,
    response: string
  ): Promise<BusinessReview> {
    const result = await apiClient.post<ApiResponse<BusinessReview>>(
      `/business/${businessId}/reviews/${reviewId}/respond`,
      { response }
    );
    return result.data;
  },

  // Delete a review
  async deleteReview(businessId: string, reviewId: string): Promise<void> {
    await apiClient.delete(`/business/${businessId}/reviews/${reviewId}`);
  },
};
```

#### New Screen: Business Reviews Screen

**File:** `src/screens/BusinessReviewsScreen.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { businessReviewApi } from '../services/api/businessReviewApi';
import { BusinessReview, ReviewStats } from '../services/types/review.types';

interface Props {
  route: {
    params: {
      businessId: string;
      businessName: string;
    };
  };
  navigation: any;
}

export default function BusinessReviewsScreen({ route, navigation }: Props) {
  const { businessId, businessName } = route.params;

  const [reviews, setReviews] = useState<BusinessReview[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | undefined>();

  useEffect(() => {
    loadReviews();
    loadStats();
  }, []);

  const loadReviews = async (reset: boolean = false) => {
    try {
      const response = await businessReviewApi.getReviews(businessId, {
        page: reset ? 1 : currentPage,
        limit: 20,
        rating: selectedRating,
      });

      if (reset) {
        setReviews(response.data);
      } else {
        setReviews([...reviews, ...response.data]);
      }

      setHasMore(response.pagination.page < response.pagination.totalPages);
      setCurrentPage(response.pagination.page);
    } catch (error) {
      Alert.alert('Error', 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await businessReviewApi.getReviewStats(businessId);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const renderRatingBreakdown = () => {
    if (!stats) return null;

    return (
      <View style={styles.ratingBreakdown}>
        <Text style={styles.sectionTitle}>Rating Breakdown</Text>
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = stats.ratingBreakdown[rating as keyof typeof stats.ratingBreakdown];
          const percentage = stats.totalReviews > 0
            ? (count / stats.totalReviews) * 100
            : 0;

          return (
            <TouchableOpacity
              key={rating}
              style={styles.ratingRow}
              onPress={() => {
                setSelectedRating(selectedRating === rating ? undefined : rating);
                loadReviews(true);
              }}
            >
              <Text style={styles.ratingLabel}>{rating} ★</Text>
              <View style={styles.ratingBar}>
                <View
                  style={[
                    styles.ratingBarFill,
                    { width: `${percentage}%` }
                  ]}
                />
              </View>
              <Text style={styles.ratingCount}>{count}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderReviewCard = (review: BusinessReview) => {
    return (
      <View key={review.id} style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewerInfo}>
            <Text style={styles.reviewerName}>
              {review.user?.firstName} {review.user?.lastName}
            </Text>
            <Text style={styles.reviewDate}>
              {new Date(review.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.ratingStars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <MaterialCommunityIcons
                key={star}
                name={star <= review.rating ? 'star' : 'star-outline'}
                size={16}
                color="#FFC107"
              />
            ))}
          </View>
        </View>

        {review.reviewText && (
          <Text style={styles.reviewText}>{review.reviewText}</Text>
        )}

        {/* Detailed ratings */}
        {(review.serviceQuality || review.professionalism || review.valueForMoney) && (
          <View style={styles.detailedRatings}>
            {review.serviceQuality && (
              <View style={styles.detailRating}>
                <Text style={styles.detailLabel}>Service Quality</Text>
                <Text style={styles.detailValue}>{review.serviceQuality}/5</Text>
              </View>
            )}
            {review.professionalism && (
              <View style={styles.detailRating}>
                <Text style={styles.detailLabel}>Professionalism</Text>
                <Text style={styles.detailValue}>{review.professionalism}/5</Text>
              </View>
            )}
            {review.valueForMoney && (
              <View style={styles.detailRating}>
                <Text style={styles.detailLabel}>Value</Text>
                <Text style={styles.detailValue}>{review.valueForMoney}/5</Text>
              </View>
            )}
          </View>
        )}

        {/* Business response */}
        {review.businessResponse && (
          <View style={styles.businessResponse}>
            <Text style={styles.responseLabel}>Business Response:</Text>
            <Text style={styles.responseText}>{review.businessResponse}</Text>
            <Text style={styles.responseDate}>
              {new Date(review.respondedAt!).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={`Reviews - ${businessName}`} navigation={navigation} />

      <ScrollView style={styles.scrollView}>
        {/* Stats Summary */}
        {stats && (
          <View style={styles.statsCard}>
            <View style={styles.overallRating}>
              <Text style={styles.ratingNumber}>{stats.averageRating.toFixed(1)}</Text>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <MaterialCommunityIcons
                    key={star}
                    name={star <= Math.round(stats.averageRating) ? 'star' : 'star-outline'}
                    size={24}
                    color="#FFC107"
                  />
                ))}
              </View>
              <Text style={styles.totalReviews}>
                Based on {stats.totalReviews} reviews
              </Text>
            </View>
          </View>
        )}

        {/* Rating Breakdown */}
        {renderRatingBreakdown()}

        {/* Reviews List */}
        <View style={styles.reviewsList}>
          <Text style={styles.sectionTitle}>
            {selectedRating ? `${selectedRating} Star Reviews` : 'All Reviews'}
          </Text>
          {loading ? (
            <ActivityIndicator size="large" color="#00A651" />
          ) : (
            reviews.map(renderReviewCard)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

### Feature 4: Business Inquiries

#### Backend Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/business/:businessId/inquiries` | Send inquiry to business |
| GET | `/business/:businessId/inquiries` | Get business inquiries (owner) |
| GET | `/business/:businessId/inquiries/stats` | Get inquiry statistics |
| POST | `/business/:businessId/inquiries/:inquiryId/respond` | Respond to inquiry |
| PUT | `/business/:businessId/inquiries/:inquiryId/status` | Update inquiry status |
| GET | `/user/inquiries` | Get user's sent inquiries |

#### API Service Implementation

**File:** `src/services/api/businessInquiryApi.ts`

```typescript
import { apiClient } from './apiClient';
import {
  BusinessInquiry,
  CreateInquiryDto,
  InquiryStats,
  InquiryStatus,
} from '../types/inquiry.types';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const businessInquiryApi = {
  // Send inquiry to a business
  async createInquiry(
    businessId: string,
    data: CreateInquiryDto
  ): Promise<BusinessInquiry> {
    const response = await apiClient.post<ApiResponse<BusinessInquiry>>(
      `/business/${businessId}/inquiries`,
      data
    );
    return response.data;
  },

  // Get all inquiries for a business (business owner only)
  async getBusinessInquiries(
    businessId: string,
    status?: InquiryStatus
  ): Promise<BusinessInquiry[]> {
    const response = await apiClient.get<ApiResponse<BusinessInquiry[]>>(
      `/business/${businessId}/inquiries`,
      { params: { status } }
    );
    return response.data;
  },

  // Get inquiry statistics
  async getInquiryStats(businessId: string): Promise<InquiryStats> {
    const response = await apiClient.get<ApiResponse<InquiryStats>>(
      `/business/${businessId}/inquiries/stats`
    );
    return response.data;
  },

  // Respond to an inquiry
  async respondToInquiry(
    businessId: string,
    inquiryId: string,
    responseText: string
  ): Promise<BusinessInquiry> {
    const response = await apiClient.post<ApiResponse<BusinessInquiry>>(
      `/business/${businessId}/inquiries/${inquiryId}/respond`,
      { response: responseText }
    );
    return response.data;
  },

  // Update inquiry status
  async updateInquiryStatus(
    businessId: string,
    inquiryId: string,
    status: InquiryStatus
  ): Promise<BusinessInquiry> {
    const response = await apiClient.put<ApiResponse<BusinessInquiry>>(
      `/business/${businessId}/inquiries/${inquiryId}/status`,
      { status }
    );
    return response.data;
  },

  // Get user's sent inquiries
  async getMyInquiries(): Promise<BusinessInquiry[]> {
    const response = await apiClient.get<ApiResponse<BusinessInquiry[]>>(
      '/user/inquiries'
    );
    return response.data;
  },
};
```

---

### Feature 5: Business Analytics

#### Backend Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/business/:businessId/analytics` | Get analytics overview |
| GET | `/business/:businessId/analytics/daily` | Get daily statistics |
| GET | `/business/:businessId/activity` | Get recent activity log |
| POST | `/business/:businessId/activity/view` | Log profile view |
| POST | `/business/:businessId/activity/contact-click` | Log contact click |

#### API Service Implementation

**File:** `src/services/api/businessAnalyticsApi.ts`

```typescript
import { apiClient } from './apiClient';

interface AnalyticsOverview {
  totalViews: number;
  totalContactClicks: number;
  totalInquiries: number;
  totalBookings: number;
  viewsThisPeriod: number;
  contactsThisPeriod: number;
  conversionRate: number;
  popularDays: string[];
  peakHours: number[];
}

interface DailyStat {
  date: string;
  views: number;
  contacts: number;
  inquiries: number;
  bookings: number;
}

interface Activity {
  id: string;
  businessId: string;
  activityType: string;
  metadata?: any;
  createdAt: string;
}

export const businessAnalyticsApi = {
  // Get analytics overview
  async getAnalytics(
    businessId: string,
    period: '7d' | '30d' | '90d' | 'all' = '30d'
  ): Promise<AnalyticsOverview> {
    const response = await apiClient.get<{ success: boolean; data: AnalyticsOverview }>(
      `/business/${businessId}/analytics`,
      { params: { period } }
    );
    return response.data;
  },

  // Get daily statistics
  async getDailyStats(
    businessId: string,
    days: number = 30
  ): Promise<DailyStat[]> {
    const response = await apiClient.get<{ success: boolean; data: DailyStat[] }>(
      `/business/${businessId}/analytics/daily`,
      { params: { days } }
    );
    return response.data;
  },

  // Get recent activity
  async getRecentActivity(
    businessId: string,
    limit: number = 50
  ): Promise<Activity[]> {
    const response = await apiClient.get<{ success: boolean; data: Activity[] }>(
      `/business/${businessId}/activity`,
      { params: { limit } }
    );
    return response.data;
  },

  // Log profile view (called when viewing business profile)
  async logProfileView(businessId: string): Promise<void> {
    await apiClient.post(`/business/${businessId}/activity/view`);
  },

  // Log contact click (called when user clicks contact button)
  async logContactClick(businessId: string): Promise<void> {
    await apiClient.post(`/business/${businessId}/activity/contact-click`);
  },
};
```

---

