import { apiClient } from './apiClient';
import { ApiResponse } from '../types/api.types';

// Payment types
export interface InitializePaymentDto {
  amount: number;
  email: string;
  currency?: string;
  type: 'service-booking' | 'event' | 'bill' | string;
  description?: string;
  metadata?: Record<string, any>;
  bookingId?: string;
  billId?: string;
  eventId?: string;
}

export interface PaymentResponse {
  authorizationUrl: string;
  reference: string;
  accessCode: string;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  reference: string;
  provider: 'paystack' | 'flutterwave';
  type: string;
  bookingId?: string;
  billId?: string;
  eventId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
  paidAt?: string;
}

export interface PaymentFilter {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedPayments {
  data: Payment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Payment API Service
 * Handles payment initialization and verification
 */
export const paymentApi = {
  /**
   * Initialize Paystack payment
   * POST /payments/initialize
   */
  async initializePayment(data: InitializePaymentDto): Promise<PaymentResponse> {
    const response = await apiClient.post<ApiResponse<PaymentResponse>>(
      '/payments/initialize',
      data
    );
    return response.data;
  },

  /**
   * Verify payment
   * GET /payments/verify/:reference
   */
  async verifyPayment(reference: string): Promise<Payment> {
    const response = await apiClient.get<ApiResponse<Payment>>(
      `/payments/verify/${reference}`
    );
    return response.data;
  },

  /**
   * Get payment history
   * GET /payments
   */
  async getPaymentHistory(filter: PaymentFilter = {}): Promise<PaginatedPayments> {
    const queryParams = new URLSearchParams();
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    const queryString = queryParams.toString();
    
    const response = await apiClient.get<ApiResponse<PaginatedPayments>>(
      `/payments${queryString ? `?${queryString}` : ''}`
    );
    return response.data;
  },

  /**
   * Get payment by ID
   * GET /payments/:id
   */
  async getPaymentById(paymentId: string): Promise<Payment> {
    const response = await apiClient.get<ApiResponse<Payment>>(
      `/payments/${paymentId}`
    );
    return response.data;
  },
};

export default paymentApi;










