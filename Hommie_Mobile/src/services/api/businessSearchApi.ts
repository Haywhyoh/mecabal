import { apiClient } from './apiClient';
import {
  BusinessProfile,
  SearchBusinessDto,
  SearchResponse,
  ServiceAreaGroup,
} from '../types/business.types';
import { ApiResponse } from '../types/api.types';

/**
 * Business Search API Service
 * Handles business search, filtering, and discovery
 */
export const businessSearchApi = {
  /**
   * Search businesses with filters and pagination
   * GET /business/search
   */
  async searchBusinesses(params: SearchBusinessDto): Promise<SearchResponse> {
    const response = await apiClient.get<SearchResponse>('/business/search', {
      params,
    });
    return response;
  },

  /**
   * Search businesses grouped by service area from user location
   * GET /business/search/by-service-area
   */
  async searchByServiceArea(
    latitude: number,
    longitude: number,
    category?: string
  ): Promise<ServiceAreaGroup[]> {
    const response = await apiClient.get<ApiResponse<ServiceAreaGroup[]>>(
      '/business/search/by-service-area',
      {
        params: { latitude, longitude, category },
      }
    );
    return response.data;
  },

  /**
   * Get featured businesses
   * GET /business/search/featured
   */
  async getFeatured(limit: number = 10): Promise<BusinessProfile[]> {
    const response = await apiClient.get<ApiResponse<BusinessProfile[]>>(
      '/business/search/featured',
      {
        params: { limit },
      }
    );
    return response.data;
  },

  /**
   * Get trending businesses
   * GET /business/search/trending
   */
  async getTrending(limit: number = 10): Promise<BusinessProfile[]> {
    const response = await apiClient.get<ApiResponse<BusinessProfile[]>>(
      '/business/search/trending',
      {
        params: { limit },
      }
    );
    return response.data;
  },
};

export default businessSearchApi;
