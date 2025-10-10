import { apiClient } from './api/apiClient';
import { ENV } from '../config/environment';

// ==================== Types ====================

export interface NINVerificationRequest {
  ninNumber: string;
}

export interface NINVerificationResponse {
  verificationId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  stateOfOrigin: string;
  verificationStatus: 'pending' | 'verified' | 'failed';
  message?: string;
}

export interface DocumentUploadRequest {
  documentType: 'nin_card' | 'drivers_license' | 'voters_card' | 'passport' | 'utility_bill';
  file: {
    uri: string;
    type: string;
    name: string;
  };
  documentNumber?: string;
}

export interface DocumentUploadResponse {
  documentId: string;
  documentType: string;
  documentUrl: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  uploadedAt: string;
}

export interface TrustScoreResponse {
  score: number;
  breakdown: {
    phoneVerification: number;
    identityVerification: number;
    addressVerification: number;
    endorsements: number;
    activityLevel: number;
  };
  level: string;
  nextLevel: string;
  pointsToNextLevel: number;
  lastUpdated: string;
}

export interface BadgeResponse {
  badgeId: string;
  badgeType: string;
  badgeName: string;
  description: string;
  iconUrl?: string;
  earnedAt: string;
  isActive: boolean;
}

export interface EndorsementRequest {
  endorsementType: 'neighbor' | 'professional' | 'character' | 'safety';
  message?: string;
  rating?: number;
}

export interface EndorsementResponse {
  endorsementId: string;
  endorserId: string;
  endorserName: string;
  endorserAvatar?: string;
  endorsementType: string;
  message?: string;
  rating?: number;
  createdAt: string;
}

export interface VerificationHistoryItem {
  id: string;
  action: string;
  status: 'success' | 'failed' | 'pending';
  details: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// ==================== Verification Service ====================

class VerificationService {
  private baseUrl = `${ENV.API.BASE_URL}/verification`;

  // ==================== NIN Verification ====================

  /**
   * Initiate NIN verification
   * POST /verification/nin/initiate
   */
  async initiateNINVerification(ninNumber: string): Promise<NINVerificationResponse> {
    try {
      const response = await apiClient.post<NINVerificationResponse>(
        `${this.baseUrl}/nin/initiate`,
        {
          ninNumber: ninNumber.replace(/\s+/g, ''), // Remove spaces
        }
      );
      return response;
    } catch (error: any) {
      console.error('NIN Verification Error:', error);
      throw this.handleError(error, 'Failed to initiate NIN verification');
    }
  }

  /**
   * Get NIN verification status
   * GET /verification/nin/status/:userId or /verification/nin/status/me
   */
  async getNINVerificationStatus(userId?: string): Promise<NINVerificationResponse> {
    try {
      const endpoint = userId ? `${this.baseUrl}/nin/status/${userId}` : `${this.baseUrl}/nin/status/me`;
      const response = await apiClient.get<NINVerificationResponse>(endpoint);
      return response;
    } catch (error: any) {
      console.error('Get NIN Status Error:', error);
      throw this.handleError(error, 'Failed to get NIN verification status');
    }
  }

  // ==================== Document Upload ====================

  /**
   * Upload identity document
   * POST /verification/document/upload
   */
  async uploadDocument(
    documentType: 'nin_card' | 'drivers_license' | 'voters_card' | 'passport' | 'utility_bill',
    file: {
      uri: string;
      type: string;
      name: string;
    },
    documentNumber?: string
  ): Promise<DocumentUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('document', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      } as any);
      formData.append('documentType', documentType);
      if (documentNumber) {
        formData.append('documentNumber', documentNumber);
      }

      const response = await apiClient.upload<DocumentUploadResponse>(
        `${this.baseUrl}/document/upload`,
        formData
      );
      return response;
    } catch (error: any) {
      console.error('Document Upload Error:', error);
      throw this.handleError(error, 'Failed to upload document');
    }
  }

  /**
   * Get user's documents
   * GET /verification/documents
   */
  async getUserDocuments(): Promise<DocumentUploadResponse[]> {
    try {
      const response = await apiClient.get<DocumentUploadResponse[]>(`${this.baseUrl}/documents`);
      return response;
    } catch (error: any) {
      console.error('Get Documents Error:', error);
      throw this.handleError(error, 'Failed to get user documents');
    }
  }

  /**
   * Delete a document
   * DELETE /verification/document/:documentId
   */
  async deleteDocument(documentId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete<{ success: boolean; message: string }>(
        `${this.baseUrl}/document/${documentId}`
      );
      return response;
    } catch (error: any) {
      console.error('Delete Document Error:', error);
      throw this.handleError(error, 'Failed to delete document');
    }
  }

  // ==================== Trust Score ====================

  /**
   * Get user trust score
   * GET /verification/trust-score/:userId or /verification/trust-score
   */
  async getTrustScore(userId?: string): Promise<TrustScoreResponse> {
    try {
      const endpoint = userId ? `${this.baseUrl}/trust-score/${userId}` : `${this.baseUrl}/trust-score`;
      const response = await apiClient.get<TrustScoreResponse>(endpoint);
      return response;
    } catch (error: any) {
      console.error('Get Trust Score Error:', error);
      throw this.handleError(error, 'Failed to get trust score');
    }
  }

  // ==================== Badges ====================

  /**
   * Get user badges
   * GET /verification/badges/:userId or /verification/badges/me
   */
  async getUserBadges(userId?: string): Promise<BadgeResponse[]> {
    try {
      const endpoint = userId ? `${this.baseUrl}/badges/${userId}` : `${this.baseUrl}/badges/me`;
      const response = await apiClient.get<BadgeResponse[]>(endpoint);
      return response;
    } catch (error: any) {
      console.error('Get Badges Error:', error);
      throw this.handleError(error, 'Failed to get user badges');
    }
  }

  // ==================== Endorsements ====================

  /**
   * Endorse another user
   * POST /verification/endorse/:userId
   */
  async endorseUser(
    userId: string,
    endorsementType: 'neighbor' | 'professional' | 'character' | 'safety',
    message?: string,
    rating?: number
  ): Promise<EndorsementResponse> {
    try {
      const response = await apiClient.post<EndorsementResponse>(
        `${this.baseUrl}/endorse/${userId}`,
        {
          endorsementType,
          message,
          rating,
        }
      );
      return response;
    } catch (error: any) {
      console.error('Endorse User Error:', error);
      throw this.handleError(error, 'Failed to endorse user');
    }
  }

  /**
   * Get user endorsements
   * GET /verification/endorsements/:userId or /verification/endorsements/me
   */
  async getUserEndorsements(userId?: string): Promise<EndorsementResponse[]> {
    try {
      const endpoint = userId ? `${this.baseUrl}/endorsements/${userId}` : `${this.baseUrl}/endorsements/me`;
      const response = await apiClient.get<EndorsementResponse[]>(endpoint);
      return response;
    } catch (error: any) {
      console.error('Get Endorsements Error:', error);
      throw this.handleError(error, 'Failed to get user endorsements');
    }
  }

  // ==================== Audit ====================

  /**
   * Get verification history/audit trail
   * GET /verification/audit/me
   */
  async getVerificationHistory(): Promise<VerificationHistoryItem[]> {
    try {
      const response = await apiClient.get<VerificationHistoryItem[]>(`${this.baseUrl}/audit/me`);
      return response;
    } catch (error: any) {
      console.error('Get Verification History Error:', error);
      throw this.handleError(error, 'Failed to get verification history');
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
   * Validate NIN number format
   */
  static validateNIN(nin: string): boolean {
    // Remove spaces and check if it's 11 digits
    const cleanNIN = nin.replace(/\s+/g, '');
    return /^\d{11}$/.test(cleanNIN);
  }

  /**
   * Format NIN number for display
   */
  static formatNIN(nin: string): string {
    const cleanNIN = nin.replace(/\s+/g, '');
    if (cleanNIN.length === 11) {
      return cleanNIN.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1 $2 $3 $4');
    }
    return nin;
  }
}

// Export singleton instance
export const verificationService = new VerificationService();
export default verificationService;
