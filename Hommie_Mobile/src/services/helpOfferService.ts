import { apiClient } from './api/apiClient';
import { API_ENDPOINTS } from '../config/environment';

// Types matching backend DTOs
export interface HelpOfferUser {
  id: string;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string;
  isVerified: boolean;
  trustScore: number;
}

export interface HelpOfferPost {
  id: string;
  content: string;
  postType: string;
  helpCategory?: string;
}

export interface HelpOffer {
  id: string;
  postId: string;
  userId: string;
  message: string;
  contactMethod: 'phone' | 'message' | 'meet';
  availability?: string;
  estimatedTime?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: HelpOfferUser;
  post?: HelpOfferPost;
}

export interface CreateHelpOfferRequest {
  postId: string;
  message: string;
  contactMethod: 'phone' | 'message' | 'meet';
  availability?: string;
  estimatedTime?: string;
}

class HelpOfferService {
  /**
   * Create a new help offer
   */
  async createOffer(
    request: CreateHelpOfferRequest,
  ): Promise<HelpOffer> {
    try {
      const response = await apiClient.post<HelpOffer>(
        API_ENDPOINTS.HELP_OFFERS.CREATE,
        request,
      );
      return response;
    } catch (error: any) {
      console.error('Error creating help offer:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to create help offer',
      );
    }
  }

  /**
   * Get all help offers for a specific post
   */
  async getOffersByPost(postId: string): Promise<HelpOffer[]> {
    try {
      const response = await apiClient.get<HelpOffer[]>(
        `${API_ENDPOINTS.HELP_OFFERS.GET_BY_POST}/${postId}`,
      );
      return response;
    } catch (error: any) {
      console.error('Error fetching help offers:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to fetch help offers',
      );
    }
  }

  /**
   * Get current user's help offers
   */
  async getMyOffers(): Promise<HelpOffer[]> {
    try {
      const response = await apiClient.get<HelpOffer[]>(
        API_ENDPOINTS.HELP_OFFERS.GET_MY_OFFERS,
      );
      return response;
    } catch (error: any) {
      console.error('Error fetching my help offers:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to fetch my help offers',
      );
    }
  }

  /**
   * Get a specific help offer by ID
   */
  async getOfferById(offerId: string): Promise<HelpOffer> {
    try {
      const response = await apiClient.get<HelpOffer>(
        `${API_ENDPOINTS.HELP_OFFERS.GET_BY_ID}/${offerId}`,
      );
      return response;
    } catch (error: any) {
      console.error('Error fetching help offer:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to fetch help offer',
      );
    }
  }

  /**
   * Get current user's help offer for a specific post
   */
  async getMyOfferForPost(postId: string): Promise<HelpOffer | null> {
    try {
      const response = await apiClient.get<HelpOffer | null>(
        `${API_ENDPOINTS.HELP_OFFERS.GET_BY_POST}/${postId}/my-offer`,
      );
      return response;
    } catch (error: any) {
      // If 404, user hasn't applied - return null
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching my offer for post:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to fetch my offer',
      );
    }
  }

  /**
   * Accept a help offer (post owner only)
   */
  async acceptOffer(offerId: string): Promise<HelpOffer> {
    try {
      const response = await apiClient.post<HelpOffer>(
        `${API_ENDPOINTS.HELP_OFFERS.ACCEPT}/${offerId}/accept`,
      );
      return response;
    } catch (error: any) {
      console.error('Error accepting help offer:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to accept help offer',
      );
    }
  }

  /**
   * Reject a help offer (post owner only)
   */
  async rejectOffer(offerId: string): Promise<HelpOffer> {
    try {
      const response = await apiClient.post<HelpOffer>(
        `${API_ENDPOINTS.HELP_OFFERS.REJECT}/${offerId}/reject`,
      );
      return response;
    } catch (error: any) {
      console.error('Error rejecting help offer:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to reject help offer',
      );
    }
  }

  /**
   * Cancel own help offer
   */
  async cancelOffer(offerId: string): Promise<HelpOffer> {
    try {
      const response = await apiClient.delete<HelpOffer>(
        `${API_ENDPOINTS.HELP_OFFERS.CANCEL}/${offerId}`,
      );
      return response;
    } catch (error: any) {
      console.error('Error cancelling help offer:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to cancel help offer',
      );
    }
  }
}

// Export singleton instance
export const helpOfferService = new HelpOfferService();

// Export class for testing
export default HelpOfferService;

