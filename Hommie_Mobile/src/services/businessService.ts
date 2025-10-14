import { ENV, API_ENDPOINTS } from '../config/environment';
import { MeCabalAuth } from './auth';
import NetInfo from '@react-native-community/netinfo';

export interface BusinessProfile {
  id: string;
  userId: string;
  businessName: string;
  description: string;
  category: string;
  subcategory?: string;
  serviceArea: string;
  pricingModel: string;
  availability: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  businessAddress?: string;
  latitude?: number;
  longitude?: number;
  state?: string;
  city?: string;
  yearsOfExperience: number;
  isVerified: boolean;
  verificationLevel: 'basic' | 'enhanced' | 'premium';
  profileImageUrl?: string;
  coverImageUrl?: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  hasInsurance: boolean;
  isActive: boolean;
  paymentMethods?: string[];
  businessHours?: Record<string, { open: string; close: string }>;
  servicesOffered?: {
    category: string;
    subcategory: string;
    description: string;
    pricing: {
      model: 'hourly' | 'project' | 'fixed' | 'negotiable';
      rate?: number;
    };
    availability: {
      days: string[];
      startTime: string;
      endTime: string;
    };
  }[];
  serviceAreas?: {
    type: 'estate' | 'neighborhood' | 'city' | 'state';
    radius?: number;
    specificAreas?: string[];
  };
  responseTime: number;
  contactPreferences?: {
    allowCalls: boolean;
    allowMessages: boolean;
    allowWhatsApp: boolean;
    preferredTime: string;
  };
  joinedDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessInquiry {
  id: string;
  businessId: string;
  customerId: string;
  serviceType: string;
  description: string;
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  budgetMin?: number;
  budgetMax?: number;
  preferredContact: 'call' | 'message' | 'whatsapp';
  status: 'pending' | 'responded' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface BusinessFilter {
  page?: number;
  limit?: number;
  category?: string;
  serviceArea?: string;
  search?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  minRating?: number;
  isVerified?: boolean;
  hasInsurance?: boolean;
  sortBy?: 'rating' | 'distance' | 'recent' | 'completedJobs';
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedBusinesses {
  data: BusinessProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class BusinessService {
  private static instance: BusinessService;
  private baseUrl: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1 second

  private constructor() {
    this.baseUrl = ENV.API.BASE_URL;
  }

  public static getInstance(): BusinessService {
    if (!BusinessService.instance) {
      BusinessService.instance = new BusinessService();
    }
    return BusinessService.instance;
  }

  /**
   * Get authentication headers
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    console.log('🔧 BusinessService: Getting auth headers...');
    const token = await MeCabalAuth.getAuthToken();
    console.log('🔧 Retrieved token:', token ? 'Token exists' : 'No token');

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  /**
   * Check if device is online
   */
  private async isOnline(): Promise<boolean> {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected ?? false;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry logic for API calls
   */
  private async retryApiCall<T>(
    apiCall: () => Promise<T>,
    operation: string,
    retryCount: number = 0
  ): Promise<T> {
    try {
      // Check if device is online
      const online = await this.isOnline();
      if (!online) {
        throw new Error('No internet connection. Please check your network and try again.');
      }

      return await apiCall();
    } catch (error: any) {
      console.error(`❌ ${operation} failed (attempt ${retryCount + 1}):`, error);

      // Don't retry on authentication errors or client errors (4xx)
      if (error.message?.includes('401') || error.message?.includes('403') || 
          error.message?.includes('400') || error.message?.includes('404')) {
        throw error;
      }

      // Retry on network errors or server errors (5xx)
      if (retryCount < this.maxRetries) {
        console.log(`🔄 Retrying ${operation} in ${this.retryDelay}ms...`);
        await this.sleep(this.retryDelay * (retryCount + 1)); // Exponential backoff
        return this.retryApiCall(apiCall, operation, retryCount + 1);
      }

      // Final attempt failed
      throw new Error(
        error.message || 
        `Failed to ${operation.toLowerCase()} after ${this.maxRetries + 1} attempts. Please try again later.`
      );
    }
  }

  /**
   * Make API request with retry logic
   */
  private async makeApiRequest<T>(
    url: string,
    options: RequestInit,
    operation: string
  ): Promise<T> {
    return this.retryApiCall(async () => {
      console.log(`🌐 Making API request: ${operation}`);
      console.log(`🌐 URL: ${url}`);
      console.log(`🌐 Method: ${options.method || 'GET'}`);
      
      const headers = {
        ...await this.getAuthHeaders(),
        ...options.headers,
      };
      console.log(`🌐 Headers:`, headers);

      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log(`🌐 Response status: ${response.status} ${response.statusText}`);
      console.log(`🌐 Response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ API Error Response:`, errorData);
        const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log(`✅ API Success Response:`, responseData);
      return responseData;
    }, operation);
  }

  /**
   * Get all businesses with filters
   */
  async getBusinesses(filter: BusinessFilter = {}): Promise<PaginatedBusinesses> {
    const queryParams = new URLSearchParams();
    
    // Add filter parameters
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const url = `${this.baseUrl}/businesses?${queryParams.toString()}`;
    
    return this.makeApiRequest<PaginatedBusinesses>(
      url,
      { method: 'GET' },
      'Fetch businesses'
    );
  }

  /**
   * Get a single business by ID
   */
  async getBusiness(id: string): Promise<BusinessProfile> {
    return this.makeApiRequest<BusinessProfile>(
      `${this.baseUrl}/businesses/${id}`,
      { method: 'GET' },
      'Fetch business'
    );
  }

  /**
   * Search businesses by text query
   */
  async searchBusinesses(query: string, filter: Omit<BusinessFilter, 'search'> = {}): Promise<BusinessProfile[]> {
    const searchFilter: BusinessFilter = {
      ...filter,
      search: query,
    };

    const result = await this.getBusinesses(searchFilter);
    return result.data;
  }

  /**
   * Get businesses near a location
   */
  async getNearbyBusinesses(
    lat: number, 
    lon: number, 
    radius: number, 
    filter: Omit<BusinessFilter, 'latitude' | 'longitude' | 'radius'> = {}
  ): Promise<BusinessProfile[]> {
    const locationFilter: BusinessFilter = {
      ...filter,
      latitude: lat,
      longitude: lon,
      radius: radius,
    };

    const result = await this.getBusinesses(locationFilter);
    return result.data;
  }

  /**
   * Create business inquiry
   */
  async createInquiry(data: {
    businessId: string;
    serviceType: string;
    description: string;
    urgency?: 'low' | 'normal' | 'high' | 'urgent';
    budgetMin?: number;
    budgetMax?: number;
    preferredContact: 'call' | 'message' | 'whatsapp';
  }): Promise<BusinessInquiry> {
    return this.makeApiRequest<BusinessInquiry>(
      `${this.baseUrl}/businesses/inquiries`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      'Create business inquiry'
    );
  }

  /**
   * Get business inquiries (for business owner)
   */
  async getMyInquiries(): Promise<BusinessInquiry[]> {
    return this.makeApiRequest<BusinessInquiry[]>(
      `${this.baseUrl}/businesses/inquiries/my`,
      { method: 'GET' },
      'Fetch my inquiries'
    );
  }

  /**
   * Update inquiry status
   */
  async updateInquiryStatus(inquiryId: string, status: 'pending' | 'responded' | 'completed' | 'cancelled'): Promise<BusinessInquiry> {
    return this.makeApiRequest<BusinessInquiry>(
      `${this.baseUrl}/businesses/inquiries/${inquiryId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      },
      'Update inquiry status'
    );
  }

  /**
   * Get business reviews
   */
  async getBusinessReviews(businessId: string, page: number = 1, limit: number = 10): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    return this.makeApiRequest<{
      data: any[];
      total: number;
      page: number;
      limit: number;
    }>(
      `${this.baseUrl}/businesses/${businessId}/reviews?${queryParams.toString()}`,
      { method: 'GET' },
      'Fetch business reviews'
    );
  }

  /**
   * Create business review
   */
  async createReview(businessId: string, data: {
    rating: number;
    comment: string;
    serviceType: string;
  }): Promise<any> {
    return this.makeApiRequest<any>(
      `${this.baseUrl}/businesses/${businessId}/reviews`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      'Create business review'
    );
  }

  /**
   * Get business categories
   */
  async getBusinessCategories(): Promise<{
    id: string;
    name: string;
    iconUrl?: string;
    subcategories?: {
      id: string;
      name: string;
    }[];
  }[]> {
    return this.makeApiRequest<{
      id: string;
      name: string;
      iconUrl?: string;
      subcategories?: {
        id: string;
        name: string;
      }[];
    }[]>(
      `${this.baseUrl}/businesses/categories`,
      { method: 'GET' },
      'Fetch business categories'
    );
  }

  /**
   * Save business to favorites
   */
  async saveBusiness(businessId: string): Promise<void> {
    return this.makeApiRequest<void>(
      `${this.baseUrl}/businesses/${businessId}/save`,
      { method: 'POST' },
      'Save business'
    );
  }

  /**
   * Remove business from favorites
   */
  async unsaveBusiness(businessId: string): Promise<void> {
    return this.makeApiRequest<void>(
      `${this.baseUrl}/businesses/${businessId}/save`,
      { method: 'DELETE' },
      'Unsave business'
    );
  }

  /**
   * Get saved businesses
   */
  async getSavedBusinesses(filter: BusinessFilter = {}): Promise<PaginatedBusinesses> {
    const queryParams = new URLSearchParams();
    
    // Add filter parameters
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const url = `${this.baseUrl}/businesses/saved?${queryParams.toString()}`;
    
    return this.makeApiRequest<PaginatedBusinesses>(
      url,
      { method: 'GET' },
      'Fetch saved businesses'
    );
  }
}

export default BusinessService;
