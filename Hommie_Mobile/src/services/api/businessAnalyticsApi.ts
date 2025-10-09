import { apiClient } from './apiClient';
import {
  AnalyticsOverview,
  DailyStat,
  Activity,
  ApiResponse,
} from '../types/api.types';

/**
 * Business Analytics API Service
 * Handles analytics data retrieval and activity tracking
 */
export const businessAnalyticsApi = {
  /**
   * Get analytics overview for a business
   * GET /business/:businessId/analytics
   */
  async getAnalytics(
    businessId: string,
    period: '7d' | '30d' | '90d' | 'all' = '30d'
  ): Promise<AnalyticsOverview> {
    const response = await apiClient.get<ApiResponse<AnalyticsOverview>>(
      `/business/${businessId}/analytics`,
      { params: { period } }
    );
    return response.data;
  },

  /**
   * Get daily statistics for a business
   * GET /business/:businessId/analytics/daily
   */
  async getDailyStats(
    businessId: string,
    days: number = 30
  ): Promise<DailyStat[]> {
    const response = await apiClient.get<ApiResponse<DailyStat[]>>(
      `/business/${businessId}/analytics/daily`,
      { params: { days } }
    );
    return response.data;
  },

  /**
   * Get recent activity log for a business
   * GET /business/:businessId/activity
   */
  async getRecentActivity(
    businessId: string,
    limit: number = 50
  ): Promise<Activity[]> {
    const response = await apiClient.get<ApiResponse<Activity[]>>(
      `/business/${businessId}/activity`,
      { params: { limit } }
    );
    return response.data;
  },

  /**
   * Log a profile view
   * POST /business/:businessId/activity/view
   * Call this when a user views a business profile
   */
  async logProfileView(businessId: string): Promise<void> {
    await apiClient.post(`/business/${businessId}/activity/view`);
  },

  /**
   * Log a contact button click
   * POST /business/:businessId/activity/contact-click
   * Call this when a user clicks a contact button
   */
  async logContactClick(businessId: string): Promise<void> {
    await apiClient.post(`/business/${businessId}/activity/contact-click`);
  },
};

export default businessAnalyticsApi;
