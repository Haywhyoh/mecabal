// MeCabal NIN Verification Service
// Handles National ID verification with backend

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ApiResponse } from '../types/api';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const API_TIMEOUT = 30000; // 30 seconds for verification

export interface NINVerificationRequest {
  ninNumber: string;
}

export interface NINVerificationResponse {
  verified: boolean;
  ninNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  stateOfOrigin: string;
  phoneNumber?: string;
  photo?: string;
}

export interface VerificationStatusResponse {
  status: 'pending' | 'verified' | 'failed' | 'rejected';
  ninNumber?: string;
  verifiedAt?: Date;
  failureReason?: string;
  trustScoreBoost?: number;
}

export interface TrustScoreResponse {
  trustScore: number;
  phoneVerified: boolean;
  identityVerified: boolean;
  addressVerified: boolean;
  verificationLevel: 'unverified' | 'phone' | 'identity' | 'full';
  verificationBadge?: string;
}

class NINVerificationApiClient {
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
      console.error('NIN Verification API Request failed:', error);

      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout. Verification may take longer. Please try again.',
        };
      }

      return {
        success: false,
        error: error.message || 'Network error. Please try again.',
      };
    }
  }

  static async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'GET' });
  }
}

export class NINVerificationService {
  /**
   * Validate NIN format (11 digits)
   */
  static validateNIN(nin: string): boolean {
    const cleanedNIN = nin.replace(/\s+/g, '');
    return /^\d{11}$/.test(cleanedNIN);
  }

  /**
   * Format NIN for display (XXXX XXX XXXX)
   */
  static formatNIN(nin: string): string {
    const cleaned = nin.replace(/\s+/g, '');
    if (cleaned.length <= 4) return cleaned;
    if (cleaned.length <= 7) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 11)}`;
  }

  /**
   * Initiate NIN verification
   */
  static async verifyNIN(
    ninNumber: string
  ): Promise<ApiResponse<NINVerificationResponse>> {
    console.log('📝 Initiating NIN verification...');

    if (!this.validateNIN(ninNumber)) {
      return {
        success: false,
        error: 'Invalid NIN format. Must be 11 digits.',
      };
    }

    const cleanedNIN = ninNumber.replace(/\s+/g, '');

    return NINVerificationApiClient.post<NINVerificationResponse>(
      '/verification/nin/verify',
      { ninNumber: cleanedNIN }
    );
  }

  /**
   * Get verification status
   */
  static async getVerificationStatus(): Promise<
    ApiResponse<VerificationStatusResponse>
  > {
    console.log('📊 Fetching verification status...');
    return NINVerificationApiClient.get<VerificationStatusResponse>(
      '/verification/nin/status'
    );
  }

  /**
   * Get user trust score
   */
  static async getTrustScore(): Promise<ApiResponse<TrustScoreResponse>> {
    console.log('🏆 Fetching trust score...');
    return NINVerificationApiClient.get<TrustScoreResponse>(
      '/verification/trust-score'
    );
  }

  /**
   * Upload verification document
   */
  static async uploadDocument(
    documentType: 'nin_card' | 'drivers_license' | 'voters_card' | 'passport',
    documentUri: string
  ): Promise<ApiResponse<{ documentUrl: string }>> {
    try {
      console.log('📤 Uploading verification document...');

      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        return {
          success: false,
          error: 'Not authenticated',
        };
      }

      const formData = new FormData();

      const uriParts = documentUri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      formData.append('document', {
        uri: documentUri,
        name: `${documentType}.${fileType}`,
        type: `image/${fileType}`,
      } as any);

      formData.append('documentType', documentType);

      const response = await fetch(`${API_BASE_URL}/verification/documents/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Upload failed with status ${response.status}`,
        }));

        return {
          success: false,
          error: errorData.message || 'Document upload failed',
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('Document upload error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload document',
      };
    }
  }

  /**
   * Skip verification (mark as skipped)
   */
  static async skipVerification(): Promise<ApiResponse<{ message: string }>> {
    console.log('⏭️ Skipping verification...');
    return NINVerificationApiClient.post<{ message: string }>(
      '/verification/nin/skip',
      {}
    );
  }
}

