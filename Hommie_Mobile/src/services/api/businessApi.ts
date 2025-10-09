import { apiClient } from './apiClient';
import {
  BusinessProfile,
  CreateBusinessProfileDto,
  UpdateBusinessProfileDto,
} from '../types/business.types';
import { ApiResponse } from '../types/api.types';

/**
 * Business Profile API Service
 * Handles all business profile CRUD operations
 */
export const businessApi = {
  /**
   * Register a new business profile
   * POST /business/register
   */
  async registerBusiness(
    data: CreateBusinessProfileDto
  ): Promise<BusinessProfile> {
    const response = await apiClient.post<ApiResponse<BusinessProfile>>(
      '/business/register',
      data
    );
    return response.data;
  },

  /**
   * Get current user's business profile
   * GET /business/my-business
   * Returns null if user has no business profile
   */
  async getMyBusiness(): Promise<BusinessProfile | null> {
    try {
      const response = await apiClient.get<ApiResponse<BusinessProfile>>(
        '/business/my-business'
      );
      return response.data;
    } catch (error: any) {
      // Return null if 404 (no business found)
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Get business profile by ID
   * GET /business/:id
   */
  async getBusinessById(id: string): Promise<BusinessProfile> {
    const response = await apiClient.get<ApiResponse<BusinessProfile>>(
      `/business/${id}`
    );
    return response.data;
  },

  /**
   * Update business profile
   * PUT /business/:id
   */
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

  /**
   * Update business online/offline status
   * PUT /business/:id/status
   */
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

  /**
   * Delete business profile
   * DELETE /business/:id
   */
  async deleteBusiness(id: string): Promise<void> {
    await apiClient.delete(`/business/${id}`);
  },
};

export default businessApi;
