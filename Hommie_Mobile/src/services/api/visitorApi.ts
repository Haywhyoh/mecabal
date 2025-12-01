import { apiClient } from './apiClient';

export interface PreRegisterVisitorDto {
  fullName: string;
  phoneNumber?: string;
  email?: string;
  photoUrl?: string;
  vehicleRegistration?: string;
  vehicleMake?: string;
  vehicleColor?: string;
  idCardNumber?: string;
  idCardType?: string;
  companyName?: string;
  purpose?: string;
  notes?: string;
}

export interface GenerateVisitorPassDto {
  visitorId: string;
  hostId: string;
  expectedArrival: string; // ISO string
  expiresAt: string; // ISO string
  guestCount?: number;
  purpose?: string;
  notes?: string;
  generateAccessCode?: boolean;
  sendMethod?: 'EMAIL' | 'SMS' | 'QR';
}

export interface VisitorPass {
  id: string;
  visitorId: string;
  hostId: string;
  estateId: string;
  qrCode: string;
  accessCode?: string;
  sendMethod?: 'EMAIL' | 'SMS' | 'QR';
  status: 'PENDING' | 'ACTIVE' | 'CHECKED_IN' | 'CHECKED_OUT' | 'EXPIRED' | 'REVOKED';
  expectedArrival: string;
  expiresAt: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  guestCount: number;
  purpose?: string;
  notes?: string;
  visitor?: {
    id: string;
    fullName: string;
    phoneNumber?: string;
    email?: string;
  };
  estate?: {
    id: string;
    name: string;
  };
}

export interface Visitor {
  id: string;
  fullName: string;
  phoneNumber?: string;
  email?: string;
  photoUrl?: string;
  vehicleRegistration?: string;
  vehicleMake?: string;
  vehicleColor?: string;
  estateId: string;
}

export interface UserQRCode {
  qrCode: string;
  data: {
    userId: string;
    fullName: string;
    phoneNumber?: string;
    email: string;
    estateId?: string;
    estateName?: string;
    verified: boolean;
    timestamp: string;
  };
}

class VisitorApi {
  /**
   * Pre-register a visitor for an estate
   */
  async preRegisterVisitor(
    estateId: string,
    visitorData: PreRegisterVisitorDto,
  ): Promise<Visitor> {
    return apiClient.post<Visitor>(`/estate/${estateId}/visitors/pre-register`, visitorData);
  }

  /**
   * Pre-register visitor and generate pass in one call
   */
  async preRegisterVisitorWithPass(
    estateId: string,
    visitorData: PreRegisterVisitorDto,
    passData: Omit<GenerateVisitorPassDto, 'visitorId' | 'hostId'>,
  ): Promise<{ visitor: Visitor; pass: VisitorPass }> {
    return apiClient.post<{ visitor: Visitor; pass: VisitorPass }>(
      `/estate/${estateId}/visitors/pre-register-with-pass`,
      { visitor: visitorData, pass: passData },
    );
  }

  /**
   * Generate visitor pass with QR code or access code
   */
  async generateVisitorPass(
    estateId: string,
    passData: GenerateVisitorPassDto,
  ): Promise<VisitorPass> {
    return apiClient.post<VisitorPass>(
      `/estate/${estateId}/visitor-pass/generate`,
      passData,
    );
  }

  /**
   * Get visitor pass by ID
   */
  async getVisitorPass(
    estateId: string,
    passId: string,
  ): Promise<VisitorPass> {
    return apiClient.get<VisitorPass>(`/estate/${estateId}/visitor-pass/${passId}`);
  }

  /**
   * Get visitor passes created by current user
   */
  async getMyVisitorPasses(estateId: string): Promise<VisitorPass[]> {
    const response = await apiClient.get<{ data: VisitorPass[]; count: number }>(
      `/estate/${estateId}/visitor-pass/my-passes`,
    );
    return response.data;
  }

  /**
   * Send visitor code via email or SMS
   */
  async sendVisitorCode(
    estateId: string,
    passId: string,
    method: 'EMAIL' | 'SMS' | 'QR',
  ): Promise<void> {
    return apiClient.post(`/estate/${estateId}/visitor-pass/${passId}/send-code`, {
      method,
    });
  }

  /**
   * Validate 4-digit access code (for gate scanners)
   */
  async validateVisitorCode(
    code: string,
    estateId: string,
  ): Promise<{ valid: boolean; pass?: VisitorPass; message: string }> {
    const response = await apiClient.post<{
      success: boolean;
      data: { valid: boolean; pass?: VisitorPass; message: string };
    }>('/estate/visitor-pass/validate-code', {
      code,
      estateId,
    });
    return response.data;
  }

  /**
   * Revoke visitor pass
   */
  async revokeVisitorPass(estateId: string, passId: string): Promise<VisitorPass> {
    // Use the existing revoke endpoint from the controller
    // The backend already has revokeVisitorPass method, we just need to call it via PUT
    return apiClient.put<VisitorPass>(
      `/estate/${estateId}/visitor-pass/${passId}/revoke`,
      {},
    );
  }

  /**
   * Get user's QR code with profile information
   */
  async getUserQRCode(): Promise<UserQRCode> {
    const response = await apiClient.get<{ success: boolean; data: UserQRCode }>(
      '/users/me/qr-code',
    );
    return response.data;
  }
}

export const visitorApi = new VisitorApi();

