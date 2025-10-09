import { apiClient } from './apiClient';
import {
  BusinessInquiry,
  CreateInquiryDto,
  RespondToInquiryDto,
  UpdateInquiryStatusDto,
  InquiryStats,
  InquiryStatus,
} from '../types/inquiry.types';
import { ApiResponse } from '../types/api.types';

/**
 * Business Inquiry API Service
 * Handles inquiry creation, responses, and management
 */
export const businessInquiryApi = {
  /**
   * Send an inquiry to a business
   * POST /business/:businessId/inquiries
   */
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

  /**
   * Get all inquiries for a business (business owner only)
   * GET /business/:businessId/inquiries
   */
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

  /**
   * Get inquiry statistics for a business
   * GET /business/:businessId/inquiries/stats
   */
  async getInquiryStats(businessId: string): Promise<InquiryStats> {
    const response = await apiClient.get<ApiResponse<InquiryStats>>(
      `/business/${businessId}/inquiries/stats`
    );
    return response.data;
  },

  /**
   * Business owner responds to an inquiry
   * POST /business/:businessId/inquiries/:inquiryId/respond
   */
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

  /**
   * Update inquiry status
   * PUT /business/:businessId/inquiries/:inquiryId/status
   */
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

  /**
   * Get user's sent inquiries
   * GET /user/inquiries
   */
  async getMyInquiries(): Promise<BusinessInquiry[]> {
    const response = await apiClient.get<ApiResponse<BusinessInquiry[]>>(
      '/user/inquiries'
    );
    return response.data;
  },
};

export default businessInquiryApi;
