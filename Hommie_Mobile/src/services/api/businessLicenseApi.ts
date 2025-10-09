import { apiClient } from './apiClient';
import {
  BusinessLicense,
  CreateLicenseDto,
  UpdateLicenseDto,
  VerifyLicenseDto,
  ApiResponse,
} from '../types/api.types';

/**
 * Business License API Service
 * Handles business license management and verification
 */
export const businessLicenseApi = {
  /**
   * Add a license to business profile
   * POST /business/:businessId/licenses
   */
  async createLicense(
    businessId: string,
    data: CreateLicenseDto
  ): Promise<BusinessLicense> {
    const response = await apiClient.post<ApiResponse<BusinessLicense>>(
      `/business/${businessId}/licenses`,
      data
    );
    return response.data;
  },

  /**
   * Get all licenses for a business
   * GET /business/:businessId/licenses
   */
  async getLicenses(businessId: string): Promise<BusinessLicense[]> {
    const response = await apiClient.get<ApiResponse<BusinessLicense[]>>(
      `/business/${businessId}/licenses`
    );
    return response.data;
  },

  /**
   * Update a license
   * PUT /business/:businessId/licenses/:licenseId
   */
  async updateLicense(
    businessId: string,
    licenseId: string,
    data: UpdateLicenseDto
  ): Promise<BusinessLicense> {
    const response = await apiClient.put<ApiResponse<BusinessLicense>>(
      `/business/${businessId}/licenses/${licenseId}`,
      data
    );
    return response.data;
  },

  /**
   * Delete a license
   * DELETE /business/:businessId/licenses/:licenseId
   */
  async deleteLicense(businessId: string, licenseId: string): Promise<void> {
    await apiClient.delete(`/business/${businessId}/licenses/${licenseId}`);
  },

  /**
   * Verify a license (Admin only)
   * POST /business/:businessId/licenses/:licenseId/verify
   */
  async verifyLicense(
    businessId: string,
    licenseId: string,
    data: VerifyLicenseDto
  ): Promise<BusinessLicense> {
    const response = await apiClient.post<ApiResponse<BusinessLicense>>(
      `/business/${businessId}/licenses/${licenseId}/verify`,
      data
    );
    return response.data;
  },

  /**
   * Upload license document
   * POST /business/:businessId/licenses/:licenseId/upload
   */
  async uploadLicenseDocument(
    businessId: string,
    licenseId: string,
    file: FormData,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<BusinessLicense> {
    const response = await apiClient.upload<ApiResponse<BusinessLicense>>(
      `/business/${businessId}/licenses/${licenseId}/upload`,
      file,
      onUploadProgress
    );
    return response.data;
  },
};

export default businessLicenseApi;
