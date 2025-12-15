import { apiClient } from './apiClient';
import {
  ServiceBooking,
  CreateBookingDto,
  UpdateBookingStatusDto,
  BookingFilter,
} from '../types/business.types';
import { ApiResponse } from '../types/api.types';

// Paginated bookings response
export interface PaginatedBookings {
  data: ServiceBooking[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Booking API Service
 * Handles all booking CRUD operations
 */
export const bookingApi = {
  /**
   * Create a new booking
   * POST /bookings
   */
  async createBooking(data: CreateBookingDto): Promise<ServiceBooking> {
    const response = await apiClient.post<ApiResponse<ServiceBooking>>(
      '/bookings',
      data
    );
    return response.data;
  },

  /**
   * Get user's bookings with filters
   * GET /bookings
   */
  async getMyBookings(filter: BookingFilter = {}): Promise<PaginatedBookings> {
    const queryParams = new URLSearchParams();
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    const queryString = queryParams.toString();
    
    const response = await apiClient.get<ApiResponse<PaginatedBookings>>(
      `/bookings${queryString ? `?${queryString}` : ''}`
    );
    return response.data;
  },

  /**
   * Get booking by ID
   * GET /bookings/:id
   */
  async getBookingById(bookingId: string): Promise<ServiceBooking> {
    const response = await apiClient.get<ApiResponse<ServiceBooking>>(
      `/bookings/${bookingId}`
    );
    return response.data;
  },

  /**
   * Update booking status
   * PUT /bookings/:id/status
   */
  async updateBookingStatus(
    bookingId: string,
    data: UpdateBookingStatusDto
  ): Promise<ServiceBooking> {
    const response = await apiClient.put<ApiResponse<ServiceBooking>>(
      `/bookings/${bookingId}/status`,
      data
    );
    return response.data;
  },

  /**
   * Cancel booking
   * DELETE /bookings/:id
   */
  async cancelBooking(bookingId: string): Promise<void> {
    await apiClient.delete(`/bookings/${bookingId}`);
  },

  /**
   * Get reviewable bookings (completed bookings that can be reviewed)
   * GET /bookings/reviewable
   */
  async getReviewableBookings(): Promise<ServiceBooking[]> {
    const response = await apiClient.get<ApiResponse<ServiceBooking[]>>(
      '/bookings/reviewable'
    );
    return response.data;
  },

  /**
   * Get business bookings
   * GET /business/:businessId/bookings
   */
  async getBusinessBookings(
    businessId: string,
    filter: BookingFilter = {}
  ): Promise<PaginatedBookings> {
    const queryParams = new URLSearchParams();
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    const queryString = queryParams.toString();
    
    const response = await apiClient.get<ApiResponse<PaginatedBookings>>(
      `/business/${businessId}/bookings${queryString ? `?${queryString}` : ''}`
    );
    return response.data;
  },
};

export default bookingApi;










