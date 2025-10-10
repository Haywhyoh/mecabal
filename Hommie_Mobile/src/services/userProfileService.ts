import { apiClient } from './api/apiClient';
import { ENV } from '../config/environment';

// ==================== Types ====================

export interface UserProfile {
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
  preferredLanguage?: string;
  state?: string;
  city?: string;
  estate?: string;
  landmark?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
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
  lastActive?: string;
  isOnline?: boolean;
}

export interface UpdateProfileData {
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

export interface ProfileCompletionResponse {
  completionPercentage: number;
  missingFields: string[];
  nextSteps: string[];
  isComplete: boolean;
}

export interface UserSearchParams {
  query?: string;
  state?: string;
  city?: string;
  estate?: string;
  verifiedOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface UserSearchResponse {
  users: UserProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NearbyUsersParams {
  state: string;
  city?: string;
  estate?: string;
  page?: number;
  limit?: number;
}

export interface DashboardStats {
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

export interface BookmarkRequest {
  itemType: 'post' | 'listing' | 'event';
  itemId: string;
}

export interface BookmarkResponse {
  bookmarkId: string;
  itemType: string;
  itemId: string;
  createdAt: string;
}

export interface BookmarkCheckResponse {
  isBookmarked: boolean;
  bookmarkId?: string;
}

// ==================== User Profile Service ====================

class UserProfileService {
  private baseUrl = `${ENV.API.BASE_URL}/users`;

  // ==================== Profile CRUD ====================

  /**
   * Get current user profile
   * GET /users/me
   */
  async getCurrentUserProfile(): Promise<UserProfile> {
    try {
      const response = await apiClient.get<UserProfile>(`${this.baseUrl}/me`);
      return response;
    } catch (error: any) {
      console.error('Get Current User Profile Error:', error);
      throw this.handleError(error, 'Failed to get user profile');
    }
  }

  /**
   * Get user profile by ID
   * GET /users/:id
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const response = await apiClient.get<UserProfile>(`${this.baseUrl}/${userId}`);
      return response;
    } catch (error: any) {
      console.error('Get User Profile Error:', error);
      throw this.handleError(error, 'Failed to get user profile');
    }
  }

  /**
   * Update current user profile
   * PUT /users/me
   */
  async updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    try {
      const response = await apiClient.put<UserProfile>(`${this.baseUrl}/me`, data);
      return response;
    } catch (error: any) {
      console.error('Update Profile Error:', error);
      throw this.handleError(error, 'Failed to update profile');
    }
  }

  /**
   * Get profile completion percentage
   * GET /users/me/completion
   */
  async getProfileCompletion(): Promise<ProfileCompletionResponse> {
    try {
      const response = await apiClient.get<ProfileCompletionResponse>(`${this.baseUrl}/me/completion`);
      return response;
    } catch (error: any) {
      console.error('Get Profile Completion Error:', error);
      throw this.handleError(error, 'Failed to get profile completion');
    }
  }

  // ==================== Avatar Upload ====================

  /**
   * Upload user avatar
   * POST /users/me/avatar
   */
  async uploadAvatar(imageUri: string): Promise<{ avatarUrl: string; message: string }> {
    try {
      const formData = new FormData();

      // Extract file extension from URI
      const uriParts = imageUri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      formData.append('avatar', {
        uri: imageUri,
        name: `avatar.${fileType}`,
        type: `image/${fileType}`,
      } as any);

      const response = await apiClient.upload<{ avatarUrl: string; message: string }>(
        `${this.baseUrl}/me/avatar`,
        formData
      );
      return response;
    } catch (error: any) {
      console.error('Upload Avatar Error:', error);
      throw this.handleError(error, 'Failed to upload avatar');
    }
  }

  /**
   * Delete user avatar
   * DELETE /users/me/avatar
   */
  async deleteAvatar(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete<{ success: boolean; message: string }>(
        `${this.baseUrl}/me/avatar`
      );
      return response;
    } catch (error: any) {
      console.error('Delete Avatar Error:', error);
      throw this.handleError(error, 'Failed to delete avatar');
    }
  }

  // ==================== Search ====================

  /**
   * Search users with filters
   * GET /users/search
   */
  async searchUsers(params: UserSearchParams): Promise<UserSearchResponse> {
    try {
      const response = await apiClient.get<UserSearchResponse>(`${this.baseUrl}/search`, {
        params: {
          q: params.query,
          state: params.state,
          city: params.city,
          estate: params.estate,
          verified_only: params.verifiedOnly,
          page: params.page || 1,
          limit: params.limit || 20,
        },
      });
      return response;
    } catch (error: any) {
      console.error('Search Users Error:', error);
      throw this.handleError(error, 'Failed to search users');
    }
  }

  /**
   * Get nearby users
   * GET /users/nearby
   */
  async getNearbyUsers(params: NearbyUsersParams): Promise<UserSearchResponse> {
    try {
      const response = await apiClient.get<UserSearchResponse>(`${this.baseUrl}/nearby`, {
        params: {
          state: params.state,
          city: params.city,
          estate: params.estate,
          page: params.page || 1,
          limit: params.limit || 20,
        },
      });
      return response;
    } catch (error: any) {
      console.error('Get Nearby Users Error:', error);
      throw this.handleError(error, 'Failed to get nearby users');
    }
  }

  // ==================== Dashboard ====================

  /**
   * Get dashboard statistics
   * GET /users/dashboard/stats
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await apiClient.get<DashboardStats>(`${this.baseUrl}/dashboard/stats`);
      return response;
    } catch (error: any) {
      console.error('Get Dashboard Stats Error:', error);
      throw this.handleError(error, 'Failed to get dashboard statistics');
    }
  }

  // ==================== Bookmarks ====================

  /**
   * Add bookmark
   * POST /users/dashboard/bookmarks
   */
  async addBookmark(itemType: 'post' | 'listing' | 'event', itemId: string): Promise<BookmarkResponse> {
    try {
      const response = await apiClient.post<BookmarkResponse>(`${this.baseUrl}/dashboard/bookmarks`, {
        itemType,
        itemId,
      });
      return response;
    } catch (error: any) {
      console.error('Add Bookmark Error:', error);
      throw this.handleError(error, 'Failed to add bookmark');
    }
  }

  /**
   * Remove bookmark
   * DELETE /users/dashboard/bookmarks/:itemType/:itemId
   */
  async removeBookmark(itemType: 'post' | 'listing' | 'event', itemId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete<{ success: boolean; message: string }>(
        `${this.baseUrl}/dashboard/bookmarks/${itemType}/${itemId}`
      );
      return response;
    } catch (error: any) {
      console.error('Remove Bookmark Error:', error);
      throw this.handleError(error, 'Failed to remove bookmark');
    }
  }

  /**
   * Get bookmarks by type
   * GET /users/dashboard/bookmarks/:itemType
   */
  async getBookmarks(itemType: 'post' | 'listing' | 'event', page = 1, limit = 20): Promise<{
    bookmarks: BookmarkResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const response = await apiClient.get<{
        bookmarks: BookmarkResponse[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`${this.baseUrl}/dashboard/bookmarks/${itemType}`, {
        params: { page, limit },
      });
      return response;
    } catch (error: any) {
      console.error('Get Bookmarks Error:', error);
      throw this.handleError(error, 'Failed to get bookmarks');
    }
  }

  /**
   * Check if item is bookmarked
   * GET /users/dashboard/bookmarks/check/:itemType/:itemId
   */
  async isBookmarked(itemType: 'post' | 'listing' | 'event', itemId: string): Promise<BookmarkCheckResponse> {
    try {
      const response = await apiClient.get<BookmarkCheckResponse>(
        `${this.baseUrl}/dashboard/bookmarks/check/${itemType}/${itemId}`
      );
      return response;
    } catch (error: any) {
      console.error('Check Bookmark Error:', error);
      throw this.handleError(error, 'Failed to check bookmark status');
    }
  }

  // ==================== Helper Methods ====================

  /**
   * Handle API errors with user-friendly messages
   */
  private handleError(error: any, defaultMessage: string): Error {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.error;

      switch (status) {
        case 400:
          return new Error(message || 'Invalid request. Please check your input.');
        case 401:
          return new Error('Authentication required. Please log in again.');
        case 403:
          return new Error('You do not have permission to perform this action.');
        case 404:
          return new Error('The requested resource was not found.');
        case 409:
          return new Error(message || 'This action conflicts with existing data.');
        case 422:
          return new Error(message || 'Invalid data provided. Please check your input.');
        case 429:
          return new Error('Too many requests. Please try again later.');
        case 500:
          return new Error('Server error. Please try again later.');
        default:
          return new Error(message || defaultMessage);
      }
    } else if (error.request) {
      // Network error
      return new Error('Network error. Please check your internet connection.');
    } else {
      // Other error
      return new Error(error.message || defaultMessage);
    }
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format (Nigerian)
   */
  static validatePhoneNumber(phone: string): boolean {
    // Remove spaces and check if it's a valid Nigerian phone number
    const cleanPhone = phone.replace(/\s+/g, '');
    return /^(\+234|234|0)?[789][01]\d{8}$/.test(cleanPhone);
  }

  /**
   * Format phone number for display
   */
  static formatPhoneNumber(phone: string): string {
    const cleanPhone = phone.replace(/\s+/g, '');
    if (cleanPhone.startsWith('+234')) {
      return cleanPhone.replace(/(\+234)(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
    } else if (cleanPhone.startsWith('234')) {
      return cleanPhone.replace(/(234)(\d{3})(\d{3})(\d{4})/, '+234 $2 $3 $4');
    } else if (cleanPhone.startsWith('0')) {
      return cleanPhone.replace(/(0)(\d{3})(\d{3})(\d{4})/, '+234 $2 $3 $4');
    }
    return phone;
  }

  /**
   * Calculate profile completeness
   */
  static calculateProfileCompleteness(profile: Partial<UserProfile>): number {
    const requiredFields = [
      'firstName', 'lastName', 'email', 'phoneNumber', 'bio', 'occupation',
      'state', 'city', 'profilePictureUrl'
    ];
    
    const filledFields = requiredFields.filter(field => {
      const value = profile[field as keyof UserProfile];
      return value && value.toString().trim().length > 0;
    });
    
    return Math.round((filledFields.length / requiredFields.length) * 100);
  }
}

// Export singleton instance
export const userProfileService = new UserProfileService();
export default userProfileService;
