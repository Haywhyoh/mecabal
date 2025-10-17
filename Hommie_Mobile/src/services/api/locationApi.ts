import { apiClient } from './apiClient';
import {
  State,
  LGA,
  Ward,
  Neighborhood,
  Landmark,
  UserLocation,
  LocationSearchRequest,
  LocationSearchResponse,
  NeighborhoodRecommendationRequest,
  NeighborhoodRecommendationResponse,
  ReverseGeocodeRequest,
  ReverseGeocodeResponse,
  PhotoVerificationRequest,
  DocumentVerificationRequest,
  SmsVerificationRequest,
  AdminVerificationRequest,
  VerificationRequest,
  LocationStats,
  LocationHierarchy,
  NearbyUser,
  LocationError,
  LocationErrorCode
} from '../../types/location.types';

/**
 * Location API Service
 * Handles all location-related API calls for the MeCabal mobile app
 */
class LocationApiService {
  private readonly baseUrl = '/location';

  // ==================== CORE LOCATION ENDPOINTS ====================

  /**
   * Get all states
   */
  async getStates(): Promise<State[]> {
    try {
      const response = await apiClient.get<State[]>(`${this.baseUrl}/states`);
      return response;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch states');
    }
  }

  /**
   * Get LGAs by state ID
   */
  async getLGAsByState(stateId: string, type?: 'LGA' | 'LCDA'): Promise<LGA[]> {
    try {
      const params = type ? { type } : {};
      const response = await apiClient.get<LGA[]>(
        `${this.baseUrl}/states/${stateId}/lgas`,
        { params }
      );
      return response;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch LGAs');
    }
  }

  /**
   * Get wards by LGA ID
   */
  async getWardsByLGA(lgaId: string): Promise<Ward[]> {
    try {
      const response = await apiClient.get<Ward[]>(`${this.baseUrl}/lgas/${lgaId}/wards`);
      return response;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch wards');
    }
  }

  /**
   * Get neighborhoods by ward ID
   */
  async getNeighborhoodsByWard(wardId: string): Promise<Neighborhood[]> {
    try {
      const response = await apiClient.get<Neighborhood[]>(
        `${this.baseUrl}/wards/${wardId}/neighborhoods`
      );
      return response;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch neighborhoods');
    }
  }

  /**
   * Get neighborhood by ID
   */
  async getNeighborhoodById(neighborhoodId: string): Promise<Neighborhood> {
    try {
      const response = await apiClient.get<Neighborhood>(
        `${this.baseUrl}/neighborhoods/${neighborhoodId}`
      );
      return response;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch neighborhood');
    }
  }

  // ==================== SEARCH AND RECOMMENDATION ENDPOINTS ====================

  /**
   * Search neighborhoods with filters
   */
  async searchNeighborhoods(searchRequest: LocationSearchRequest): Promise<LocationSearchResponse<Neighborhood>> {
    try {
      const response = await apiClient.get<LocationSearchResponse<Neighborhood>>(
        `${this.baseUrl}/neighborhoods/search`,
        { params: searchRequest }
      );
      return response;
    } catch (error) {
      throw this.handleError(error, 'Failed to search neighborhoods');
    }
  }

  /**
   * Get neighborhood recommendations based on coordinates
   */
  async recommendNeighborhoods(
    recommendationRequest: NeighborhoodRecommendationRequest
  ): Promise<NeighborhoodRecommendationResponse> {
    try {
      const response = await apiClient.post<NeighborhoodRecommendationResponse>(
        `${this.baseUrl}/neighborhoods/recommend`,
        recommendationRequest
      );
      return response;
    } catch (error) {
      throw this.handleError(error, 'Failed to get neighborhood recommendations');
    }
  }

  /**
   * Reverse geocode coordinates to location information
   */
  async reverseGeocode(request: ReverseGeocodeRequest): Promise<ReverseGeocodeResponse> {
    try {
      const response = await apiClient.post<ReverseGeocodeResponse>(
        `${this.baseUrl}/reverse-geocode`,
        request
      );
      return response;
    } catch (error) {
      throw this.handleError(error, 'Failed to reverse geocode');
    }
  }

  // ==================== LANDMARK ENDPOINTS ====================

  /**
   * Get landmarks near a neighborhood
   */
  async getNearbyLandmarks(neighborhoodId: string): Promise<Landmark[]> {
    try {
      const response = await apiClient.get<Landmark[]>(
        `${this.baseUrl}/landmarks/nearby/${neighborhoodId}`
      );
      return response;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch nearby landmarks');
    }
  }

  /**
   * Search landmarks
   */
  async searchLandmarks(query: string, type?: string): Promise<Landmark[]> {
    try {
      const params = { query, ...(type && { type }) };
      const response = await apiClient.get<Landmark[]>(
        `${this.baseUrl}/landmarks/search`,
        { params }
      );
      return response;
    } catch (error) {
      throw this.handleError(error, 'Failed to search landmarks');
    }
  }

  /**
   * Create a new landmark
   */
  async createLandmark(landmark: Omit<Landmark, 'id' | 'createdAt' | 'updatedAt'>): Promise<Landmark> {
    try {
      const response = await apiClient.post<Landmark>(
        `${this.baseUrl}/landmarks`,
        landmark
      );
      return response;
    } catch (error) {
      throw this.handleError(error, 'Failed to create landmark');
    }
  }

  // ==================== USER LOCATION ENDPOINTS ====================

  /**
   * Get user's locations
   */
  async getUserLocations(): Promise<UserLocation[]> {
    try {
      const response = await apiClient.get<UserLocation[]>(`${this.baseUrl}/user/locations`);
      return response;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch user locations');
    }
  }

  /**
   * Get user's primary location
   */
  async getPrimaryLocation(): Promise<UserLocation | null> {
    try {
      const response = await apiClient.get<UserLocation | null>(`${this.baseUrl}/user/locations/primary`);
      return response;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch primary location');
    }
  }

  /**
   * Set user's primary location
   */
  async setPrimaryLocation(location: Omit<UserLocation, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<UserLocation> {
    try {
      const response = await apiClient.post<UserLocation>(
        `${this.baseUrl}/user/locations/primary`,
        location
      );
      return response;
    } catch (error) {
      throw this.handleError(error, 'Failed to set primary location');
    }
  }

  /**
   * Add secondary location
   */
  async addSecondaryLocation(location: Omit<UserLocation, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<UserLocation> {
    try {
      const response = await apiClient.post<UserLocation>(
        `${this.baseUrl}/user/locations`,
        { ...location, isPrimary: false }
      );
      return response;
    } catch (error) {
      throw this.handleError(error, 'Failed to add secondary location');
    }
  }

  /**
   * Update user location
   */
  async updateUserLocation(
    locationId: string,
    updates: Partial<Omit<UserLocation, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<UserLocation> {
    try {
      const response = await apiClient.put<UserLocation>(
        `${this.baseUrl}/user/locations/${locationId}`,
        updates
      );
      return response;
    } catch (error) {
      throw this.handleError(error, 'Failed to update location');
    }
  }

  /**
   * Delete user location
   */
  async deleteUserLocation(locationId: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/user/locations/${locationId}`);
    } catch (error) {
      throw this.handleError(error, 'Failed to delete location');
    }
  }

  /**
   * Set location as primary
   */
  async setLocationAsPrimary(locationId: string): Promise<UserLocation> {
    try {
      const response = await apiClient.post<UserLocation>(
        `${this.baseUrl}/user/locations/${locationId}/set-primary`
      );
      return response;
    } catch (error) {
      throw this.handleError(error, 'Failed to set location as primary');
    }
  }

  // ==================== VERIFICATION ENDPOINTS ====================

  /**
   * Submit photo verification
   */
  async submitPhotoVerification(
    locationId: string,
    verification: PhotoVerificationRequest
  ): Promise<VerificationRequest> {
    try {
      const response = await apiClient.post<VerificationRequest>(
        `${this.baseUrl}/verification/photo/${locationId}`,
        verification
      );
      return response;
    } catch (error) {
      throw this.handleError(error, 'Failed to submit photo verification');
    }
  }

  /**
   * Submit document verification
   */
  async submitDocumentVerification(
    locationId: string,
    verification: DocumentVerificationRequest
  ): Promise<VerificationRequest> {
    try {
      const response = await apiClient.post<VerificationRequest>(
        `${this.baseUrl}/verification/document/${locationId}`,
        verification
      );
      return response;
    } catch (error) {
      throw this.handleError(error, 'Failed to submit document verification');
    }
  }

  /**
   * Submit SMS verification
   */
  async submitSmsVerification(
    locationId: string,
    verification: SmsVerificationRequest
  ): Promise<VerificationRequest> {
    try {
      const response = await apiClient.post<VerificationRequest>(
        `${this.baseUrl}/verification/sms/${locationId}`,
        verification
      );
      return response;
    } catch (error) {
      throw this.handleError(error, 'Failed to submit SMS verification');
    }
  }

  /**
   * Submit admin verification
   */
  async submitAdminVerification(
    locationId: string,
    verification: AdminVerificationRequest
  ): Promise<VerificationRequest> {
    try {
      const response = await apiClient.post<VerificationRequest>(
        `${this.baseUrl}/verification/admin/${locationId}`,
        verification
      );
      return response;
    } catch (error) {
      throw this.handleError(error, 'Failed to submit admin verification');
    }
  }

  /**
   * Send SMS verification code
   */
  async sendSmsVerificationCode(phoneNumber: string): Promise<{ success: boolean; messageId?: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; messageId?: string }>(
        `${this.baseUrl}/verification/sms/send-code`,
        { phoneNumber }
      );
      return response;
    } catch (error) {
      throw this.handleError(error, 'Failed to send SMS verification code');
    }
  }

  /**
   * Get verification requirements for a location
   */
  async getVerificationRequirements(locationId: string): Promise<{
    requiresVerification: boolean;
    allowedMethods: string[];
    requiredDocuments: string[];
    maxDistance: number;
  }> {
    try {
      const response = await apiClient.get<{
        requiresVerification: boolean;
        allowedMethods: string[];
        requiredDocuments: string[];
        maxDistance: number;
      }>(`${this.baseUrl}/verification/requirements/${locationId}`);
      return response;
    } catch (error) {
      throw this.handleError(error, 'Failed to get verification requirements');
    }
  }

  /**
   * Get user's verification history
   */
  async getUserVerificationHistory(limit: number = 20, offset: number = 0): Promise<VerificationRequest[]> {
    try {
      const response = await apiClient.get<VerificationRequest[]>(
        `${this.baseUrl}/verification/history`,
        { params: { limit, offset } }
      );
      return response;
    } catch (error) {
      throw this.handleError(error, 'Failed to get verification history');
    }
  }

  // ==================== STATISTICS AND ANALYTICS ====================

  /**
   * Get location statistics
   */
  async getLocationStats(): Promise<LocationStats> {
    try {
      const response = await apiClient.get<LocationStats>(`${this.baseUrl}/stats`);
      return response;
    } catch (error) {
      throw this.handleError(error, 'Failed to get location statistics');
    }
  }

  /**
   * Get verification statistics
   */
  async getVerificationStats(): Promise<{
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    byType: Record<string, number>;
  }> {
    try {
      const response = await apiClient.get<{
        totalRequests: number;
        pendingRequests: number;
        approvedRequests: number;
        rejectedRequests: number;
        byType: Record<string, number>;
      }>(`${this.baseUrl}/verification/stats`);
      return response;
    } catch (error) {
      throw this.handleError(error, 'Failed to get verification statistics');
    }
  }

  // ==================== SOCIAL FEATURES ====================

  /**
   * Get nearby users
   */
  async getNearbyUsers(
    latitude: number,
    longitude: number,
    radius: number = 5000
  ): Promise<NearbyUser[]> {
    try {
      const response = await apiClient.get<NearbyUser[]>(
        `${this.baseUrl}/user/nearby`,
        { params: { latitude, longitude, radius } }
      );
      return response;
    } catch (error) {
      throw this.handleError(error, 'Failed to get nearby users');
    }
  }

  /**
   * Get users in same neighborhood
   */
  async getUsersInNeighborhood(neighborhoodId: string): Promise<NearbyUser[]> {
    try {
      const response = await apiClient.get<NearbyUser[]>(
        `${this.baseUrl}/user/neighborhood/${neighborhoodId}`
      );
      return response;
    } catch (error) {
      throw this.handleError(error, 'Failed to get users in neighborhood');
    }
  }

  /**
   * Get location hierarchy
   */
  async getLocationHierarchy(neighborhoodId: string): Promise<LocationHierarchy> {
    try {
      const response = await apiClient.get<LocationHierarchy>(
        `${this.baseUrl}/hierarchy/${neighborhoodId}`
      );
      return response;
    } catch (error) {
      throw this.handleError(error, 'Failed to get location hierarchy');
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Handle API errors and convert to standardized error format
   */
  private handleError(error: any, defaultMessage: string): LocationError {
    console.error('Location API Error:', error);

    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.message || defaultMessage;

      return {
        code: this.getErrorCodeFromStatus(status),
        message,
        details: error.response.data
      };
    } else if (error.request) {
      // Network error
      return {
        code: LocationErrorCode.NETWORK_ERROR,
        message: 'Network error. Please check your connection.',
        details: error.request
      };
    } else {
      // Other error
      return {
        code: LocationErrorCode.UNKNOWN_ERROR,
        message: defaultMessage,
        details: error.message
      };
    }
  }

  /**
   * Map HTTP status codes to error codes
   */
  private getErrorCodeFromStatus(status: number): LocationErrorCode {
    switch (status) {
      case 400:
        return LocationErrorCode.VALIDATION_ERROR;
      case 401:
        return LocationErrorCode.PERMISSION_DENIED;
      case 403:
        return LocationErrorCode.PERMISSION_DENIED;
      case 404:
        return LocationErrorCode.LOCATION_UNAVAILABLE;
      case 422:
        return LocationErrorCode.VERIFICATION_FAILED;
      case 500:
        return LocationErrorCode.API_ERROR;
      default:
        return LocationErrorCode.UNKNOWN_ERROR;
    }
  }

  /**
   * Check if location services are available
   */
  async checkLocationServices(): Promise<{
    available: boolean;
    permission: 'granted' | 'denied' | 'restricted' | 'undetermined';
  }> {
    try {
      const response = await apiClient.get<{
        available: boolean;
        permission: 'granted' | 'denied' | 'restricted' | 'undetermined';
      }>(`${this.baseUrl}/services/status`);
      return response;
    } catch (error) {
      throw this.handleError(error, 'Failed to check location services');
    }
  }

  /**
   * Get location service health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    services: Record<string, boolean>;
    features: string[];
  }> {
    try {
      const response = await apiClient.get<{
        status: 'healthy' | 'degraded' | 'down';
        services: Record<string, boolean>;
        features: string[];
      }>(`${this.baseUrl}/health`);
      return response;
    } catch (error) {
      throw this.handleError(error, 'Failed to get health status');
    }
  }
}

// Export singleton instance
export const locationApi = new LocationApiService();
export default locationApi;
