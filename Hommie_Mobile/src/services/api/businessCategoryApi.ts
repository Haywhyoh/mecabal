import { apiClient } from './apiClient';
import { ApiResponse } from '../types/api.types';

export interface BusinessCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  subcategories: string[];
  serviceCount?: number;
  createdAt: string;
}

/**
 * Business Category API Service
 * Handles business category operations
 */
export const businessCategoryApi = {
  /**
   * Get all business categories
   * GET /categories
   */
  async getAllCategories(includeCounts: boolean = false): Promise<BusinessCategory[]> {
    const params = includeCounts ? { includeCounts: true } : {};
    const response = await apiClient.get<ApiResponse<BusinessCategory[]>>(
      '/categories',
      { params }
    );
    return response.data;
  },

  /**
   * Get category by ID
   * GET /categories/:id
   */
  async getCategoryById(id: string): Promise<BusinessCategory> {
    const response = await apiClient.get<ApiResponse<BusinessCategory>>(
      `/categories/${id}`
    );
    return response.data;
  },

  /**
   * Get subcategories for a category
   * GET /categories/:id/subcategories
   */
  async getSubcategories(id: string): Promise<string[]> {
    const response = await apiClient.get<ApiResponse<string[]>>(
      `/categories/${id}/subcategories`
    );
    return response.data;
  },
};

export default businessCategoryApi;
