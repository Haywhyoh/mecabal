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

