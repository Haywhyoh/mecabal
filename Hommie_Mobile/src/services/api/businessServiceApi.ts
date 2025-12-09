import { apiClient } from './apiClient';
import {
  BusinessService,
  CreateBusinessServiceDto,
  UpdateBusinessServiceDto,
  BusinessProfile,
} from '../types/business.types';
import { ApiResponse } from '../types/api.types';
import { businessSearchApi } from './businessSearchApi';

/**
 * Business Service API
 * Handles all business service CRUD operations
 */
export const businessServiceApi = {
  /**
   * Get all services for a business
   * GET /business-services/business/:businessId
   */
  async getBusinessServices(businessId: string): Promise<BusinessService[]> {
    const response = await apiClient.get<ApiResponse<BusinessService[]>>(
      `/business-services/business/${businessId}`
    );
    return response.data;
  },

  /**
   * Get business service by ID
   * GET /business-services/:id
   */
  async getBusinessServiceById(id: string): Promise<BusinessService> {
    const response = await apiClient.get<ApiResponse<BusinessService>>(
      `/business-services/${id}`
    );
    return response.data;
  },

  /**
   * Create a new service for a business
   * POST /business-services/:businessId
   */
  async createBusinessService(
    businessId: string,
    data: CreateBusinessServiceDto
  ): Promise<BusinessService> {
    const response = await apiClient.post<ApiResponse<BusinessService>>(
      `/business-services/${businessId}`,
      data
    );
    return response.data;
  },

  /**
   * Update a business service
   * PUT /business-services/:id
   */
  async updateBusinessService(
    id: string,
    data: UpdateBusinessServiceDto
  ): Promise<BusinessService> {
    const response = await apiClient.put<ApiResponse<BusinessService>>(
      `/business-services/${id}`,
      data
    );
    return response.data;
  },

  /**
   * Toggle service active status
   * PUT /business-services/:id/toggle-active
   */
  async toggleServiceActive(id: string): Promise<BusinessService> {
    const response = await apiClient.put<ApiResponse<BusinessService>>(
      `/business-services/${id}/toggle-active`
    );
    return response.data;
  },

  /**
   * Delete a business service
   * DELETE /business-services/:id
   */
  async deleteBusinessService(id: string): Promise<void> {
    await apiClient.delete(`/business-services/${id}`);
  },

  /**
   * Get services by category
   * Uses business search by category, then fetches services for those businesses
   */
  async getServicesByCategory(
    category: string,
    latitude?: number,
    longitude?: number
  ): Promise<Array<BusinessService & { business: BusinessProfile }>> {
    try {
      // Search businesses by category
      const searchParams: any = {
        category,
        verifiedOnly: true,
        limit: 50,
      };

      if (latitude && longitude) {
        searchParams.latitude = latitude;
        searchParams.longitude = longitude;
      }

      const businessesResponse = await businessSearchApi.searchBusinesses(searchParams);
      const businesses = businessesResponse.data || [];

      // Fetch services for each business
      const servicesWithBusinesses: Array<BusinessService & { business: BusinessProfile }> = [];

      for (const business of businesses) {
        try {
          const services = await this.getBusinessServices(business.id);
          for (const service of services) {
            if (service.isActive) {
              servicesWithBusinesses.push({
                ...service,
                business,
              });
            }
          }
        } catch (error) {
          console.error(`Failed to fetch services for business ${business.id}:`, error);
        }
      }

      return servicesWithBusinesses;
    } catch (error) {
      console.error('Error fetching services by category:', error);
      throw error;
    }
  },

  /**
   * Get services by neighborhood
   * Uses business search by location, then fetches services for those businesses
   */
  async getServicesByNeighborhood(
    neighborhoodId: string,
    category?: string
  ): Promise<Array<BusinessService & { business: BusinessProfile }>> {
    try {
      // Note: This would ideally use a neighborhood-specific endpoint
      // For now, we'll use business search with location filters
      const searchParams: any = {
        verifiedOnly: true,
        limit: 50,
      };

      if (category) {
        searchParams.category = category;
      }

      const businessesResponse = await businessSearchApi.searchBusinesses(searchParams);
      const businesses = businessesResponse.data || [];

      // Fetch services for each business
      const servicesWithBusinesses: Array<BusinessService & { business: BusinessProfile }> = [];

      for (const business of businesses) {
        try {
          const services = await this.getBusinessServices(business.id);
          for (const service of services) {
            if (service.isActive) {
              servicesWithBusinesses.push({
                ...service,
                business,
              });
            }
          }
        } catch (error) {
          console.error(`Failed to fetch services for business ${business.id}:`, error);
        }
      }

      return servicesWithBusinesses;
    } catch (error) {
      console.error('Error fetching services by neighborhood:', error);
      throw error;
    }
  },
};

export default businessServiceApi;






