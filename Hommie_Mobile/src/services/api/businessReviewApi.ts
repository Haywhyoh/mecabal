import { apiClient } from './apiClient';
import {
  BusinessReview,
  CreateReviewDto,
  RespondToReviewDto,
  ReviewQueryDto,
  ReviewStats,
  ReviewListResponse,
} from '../types/review.types';
import { ApiResponse } from '../types/api.types';

/**
 * Business Review API Service
 * Handles review creation, retrieval, and management
 */
export const businessReviewApi = {
  /**
   * Create a review for a business
   * POST /business/:businessId/reviews
   */
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

  /**
   * Get all reviews for a business with pagination
   * GET /business/:businessId/reviews
   */
  async getReviews(
    businessId: string,
    query: ReviewQueryDto = {}
  ): Promise<ReviewListResponse> {
    const response = await apiClient.get<any>(
      `/business/${businessId}/reviews`,
      { params: query }
    );
    
    // Handle both 'meta' and 'pagination' response structures
    if (response.meta && !response.pagination) {
      return {
        success: response.success ?? true,
        data: response.data || [],
        pagination: {
          page: response.meta.page || 1,
          limit: response.meta.limit || 20,
          total: response.meta.total || 0,
          totalPages: response.meta.totalPages || 1,
        },
      };
    }
    
    // If already in correct format, return as-is
    return response;
  },

  /**
   * Get review statistics for a business
   * GET /business/:businessId/reviews/stats
   */
  async getReviewStats(businessId: string): Promise<ReviewStats> {
    const response = await apiClient.get<ApiResponse<ReviewStats>>(
      `/business/${businessId}/reviews/stats`
    );
    return response.data;
  },

  /**
   * Update a review
   * PUT /business/:businessId/reviews/:reviewId
   */
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

  /**
   * Business owner responds to a review
   * POST /business/:businessId/reviews/:reviewId/respond
   */
  async respondToReview(
    businessId: string,
    reviewId: string,
    responseText: string
  ): Promise<BusinessReview> {
    const response = await apiClient.post<ApiResponse<BusinessReview>>(
      `/business/${businessId}/reviews/${reviewId}/respond`,
      { response: responseText }
    );
    return response.data;
  },

  /**
   * Delete a review
   * DELETE /business/:businessId/reviews/:reviewId
   */
  async deleteReview(businessId: string, reviewId: string): Promise<void> {
    await apiClient.delete(`/business/${businessId}/reviews/${reviewId}`);
  },
};

export default businessReviewApi;
