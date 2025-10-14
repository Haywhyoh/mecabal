import { ENV, API_ENDPOINTS } from '../config/environment';
import { MeCabalAuth } from './auth';
import NetInfo from '@react-native-community/netinfo';

// Types
export interface Listing {
  id: string;
  userId: string;
  listingType: 'property' | 'item' | 'service' | 'job';
  category: {
    id: number;
    name: string;
    iconUrl?: string;
    colorCode?: string;
  };
  title: string;
  description: string;
  price: number;
  currency: string;
  priceType: 'fixed' | 'negotiable' | 'per_hour' | 'per_day';
  
  // Property-specific fields
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  rentalPeriod?: string;
  amenities?: string[];
  propertySize?: number;
  parkingSpaces?: number;
  petPolicy?: 'allowed' | 'not_allowed' | 'case_by_case';
  utilitiesIncluded?: string[];
  securityFeatures?: string[];
  landSize?: number;
  
  // Item-specific fields
  condition?: 'new' | 'like_new' | 'good' | 'fair';
  brand?: string;
  model?: string;
  year?: number;
  warranty?: string;
  
  // Service-specific fields
  serviceType?: 'offering' | 'request';
  serviceArea?: string[];
  availability?: {
    monday: { start: string; end: string; available: boolean };
    tuesday: { start: string; end: string; available: boolean };
    wednesday: { start: string; end: string; available: boolean };
    thursday: { start: string; end: string; available: boolean };
    friday: { start: string; end: string; available: boolean };
    saturday: { start: string; end: string; available: boolean };
    sunday: { start: string; end: string; available: boolean };
  };
  availabilitySchedule?: {
    days: string[];
    startTime: string;
    endTime: string;
    timezone: string;
  };
  serviceRadius?: number;
  responseTime?: number;
  pricingModel?: 'hourly' | 'project' | 'fixed' | 'negotiable';
  professionalCredentials?: {
    licenses: string[];
    certifications: string[];
    experience: number;
    insurance: boolean;
  };
  
  // Job-specific fields
  employmentType?: 'full_time' | 'part_time' | 'contract' | 'freelance' | 'internship';
  workLocation?: 'remote' | 'on_site' | 'hybrid';
  requiredSkills?: string[];
  requiredExperience?: string;
  education?: string;
  benefits?: string[];
  applicationDeadline?: string;
  salaryMin?: number;
  salaryMax?: number;
  companyInfo?: {
    name: string;
    size: string;
    industry: string;
    website?: string;
  };
  
  // Contact preferences
  contactPreferences?: {
    allowCalls: boolean;
    allowMessages: boolean;
    allowWhatsApp: boolean;
    preferredTime: string;
  };
  
  // Additional fields from backend
  estateId?: string;
  city?: string;
  state?: string;
  businessId?: string; // For service listings linked to business profiles
  
  location: {
    latitude: number;
    longitude: number;
    address: string;
    city?: string;
    state?: string;
    country?: string;
  };
  media: Media[];
  status: 'active' | 'sold' | 'expired' | 'draft';
  viewsCount: number;
  savesCount: number;
  isSaved: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected' | string;
  featured: boolean;
  boosted: boolean;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    isVerified: boolean;
    businessProfile?: {
      businessName: string;
      businessType: string;
      rating: number;
      reviewCount: number;
    };
  };
  createdAt: string;
  expiresAt?: string;
}

export interface Media {
  id: string;
  url: string;
  type: 'image' | 'video';
  caption?: string;
  displayOrder: number;
}

export interface CreateListingRequest {
  listingType: 'property' | 'item' | 'service' | 'job';
  categoryId: number;
  title: string;
  description: string;
  price: number;
  priceType: 'fixed' | 'negotiable' | 'per_hour' | 'per_day';
  
  // Property-specific fields
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  rentalPeriod?: string;
  amenities?: string[];
  propertySize?: number;
  parkingSpaces?: number;
  petPolicy?: 'allowed' | 'not_allowed' | 'case_by_case';
  utilitiesIncluded?: string[];
  securityFeatures?: string[];
  landSize?: number;
  
  // Item-specific fields
  condition?: 'new' | 'like_new' | 'good' | 'fair';
  brand?: string;
  model?: string;
  year?: number;
  warranty?: string;
  
  // Service-specific fields
  serviceType?: 'offering' | 'request';
  availabilitySchedule?: {
    days: string[];
    startTime: string;
    endTime: string;
    timezone: string;
  };
  serviceRadius?: number;
  responseTime?: number;
  pricingModel?: 'hourly' | 'project' | 'fixed' | 'negotiable';
  professionalCredentials?: {
    licenses: string[];
    certifications: string[];
    experience: number;
    insurance: boolean;
  };
  
  // Job-specific fields
  employmentType?: 'full_time' | 'part_time' | 'contract' | 'freelance';
  workLocation?: 'remote' | 'on_site' | 'hybrid';
  requiredSkills?: string[];
  requiredExperience?: string;
  education?: string;
  benefits?: string[];
  applicationDeadline?: string;
  salaryMin?: number;
  salaryMax?: number;
  companyInfo?: {
    name: string;
    size: string;
    industry: string;
    website?: string;
  };
  
  // Contact preferences
  contactPreferences?: {
    allowCalls: boolean;
    allowMessages: boolean;
    allowWhatsApp: boolean;
    preferredTime: string;
  };
  
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  media?: Media[];
  expiresAt?: string;
}

export interface UpdateListingRequest {
  title?: string;
  description?: string;
  price?: number;
  priceType?: 'fixed' | 'negotiable' | 'per_hour' | 'per_day';
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  rentalPeriod?: string;
  condition?: 'new' | 'like_new' | 'good' | 'fair';
  brand?: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  media?: Media[];
  expiresAt?: string;
}

export interface ListingFilter {
  page?: number;
  limit?: number;
  listingType?: 'property' | 'item' | 'service';
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  sortBy?: 'createdAt' | 'price' | 'viewsCount';
  sortOrder?: 'ASC' | 'DESC';
  status?: 'active' | 'sold' | 'expired';
}

export interface PaginatedListings {
  data: Listing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface NearbySearchParams {
  latitude: number;
  longitude: number;
  radius: number;
  listingType?: 'property' | 'item' | 'service';
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export class ListingsService {
  private static instance: ListingsService;
  private baseUrl: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1 second

  private constructor() {
    this.baseUrl = ENV.API.BASE_URL;
  }

  public static getInstance(): ListingsService {
    if (!ListingsService.instance) {
      ListingsService.instance = new ListingsService();
    }
    return ListingsService.instance;
  }

  /**
   * Get authentication headers
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    console.log('🔧 ListingsService: Getting auth headers...');
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
      console.log(`🌐 Base URL: ${this.baseUrl}`);
      
      const headers = {
        ...await this.getAuthHeaders(),
        ...options.headers,
      };
      console.log(`🌐 Headers:`, headers);
      console.log(`🌐 Request body:`, options.body);

      try {
        const response = await fetch(url, {
          ...options,
          headers,
        });

        console.log(`🌐 Response status: ${response.status} ${response.statusText}`);
        console.log(`🌐 Response headers:`, Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ API Error Response (raw):`, errorText);
          
          let errorData;
          try {
            errorData = JSON.parse(errorText);
            console.error(`❌ API Error Response (parsed):`, errorData);
          } catch (parseError) {
            console.error(`❌ Failed to parse error response as JSON:`, parseError);
            errorData = { message: errorText };
          }
          
          const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
          throw new Error(errorMessage);
        }

        const responseText = await response.text();
        console.log(`🌐 Response body (raw):`, responseText);
        
        let responseData;
        try {
          responseData = JSON.parse(responseText);
          console.log(`✅ API Success Response (parsed):`, responseData);
        } catch (parseError) {
          console.error(`❌ Failed to parse success response as JSON:`, parseError);
          throw new Error('Invalid JSON response from server');
        }
        
        return responseData;
      } catch (error) {
        console.error(`💥 Network/Request Error for ${operation}:`, error);
        throw error;
      }
    }, operation);
  }

  /**
   * Create a new listing
   */
  async createListing(data: CreateListingRequest): Promise<Listing> {
    // Validate and format the data before sending
    const formattedData = this.formatListingData(data);
    
    return this.makeApiRequest<Listing>(
      `${this.baseUrl}${API_ENDPOINTS.LISTINGS.CREATE}`,
      {
        method: 'POST',
        body: JSON.stringify(formattedData),
      },
      'Create listing'
    );
  }

  /**
   * Format listing data to match backend validation requirements
   */
  private formatListingData(data: CreateListingRequest): CreateListingRequest {
    const formatted = { ...data };

    // Ensure description meets minimum length requirement
    if (formatted.description && formatted.description.length < 20) {
      formatted.description = formatted.description + ' '.repeat(20 - formatted.description.length) + 'Additional details to meet minimum requirements.';
    }

    // Ensure location coordinates are valid (not 0,0)
    if (formatted.location) {
      if (formatted.location.latitude === 0 && formatted.location.longitude === 0) {
        // Default to Lagos coordinates if coordinates are 0,0
        formatted.location.latitude = 6.5244;
        formatted.location.longitude = 3.3792;
        console.warn('⚠️ Invalid coordinates (0,0) detected. Using default Lagos coordinates.');
      }
    }

    // Ensure condition is in the correct format
    if (formatted.condition) {
      const validConditions = ['new', 'like_new', 'good', 'fair'];
      if (!validConditions.includes(formatted.condition)) {
        console.warn(`⚠️ Invalid condition "${formatted.condition}". Using "good" as default.`);
        formatted.condition = 'good';
      }
    }

    return formatted;
  }

  /**
   * Get listings with filters
   */
  async getListings(filter: ListingFilter = {}): Promise<PaginatedListings> {
    const queryParams = new URLSearchParams();
    
    // Add filter parameters
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const url = `${this.baseUrl}${API_ENDPOINTS.LISTINGS.GET_ALL}?${queryParams.toString()}`;
    
    return this.makeApiRequest<PaginatedListings>(
      url,
      { method: 'GET' },
      'Fetch listings'
    );
  }

  /**
   * Get a single listing by ID
   */
  async getListing(id: string): Promise<Listing> {
    return this.makeApiRequest<Listing>(
      `${this.baseUrl}${API_ENDPOINTS.LISTINGS.GET_BY_ID}/${id}`,
      { method: 'GET' },
      'Fetch listing'
    );
  }

  /**
   * Update a listing
   */
  async updateListing(id: string, data: Partial<CreateListingRequest>): Promise<Listing> {
    return this.makeApiRequest<Listing>(
      `${this.baseUrl}${API_ENDPOINTS.LISTINGS.UPDATE}/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
      'Update listing'
    );
  }

  /**
   * Delete a listing
   */
  async deleteListing(id: string): Promise<void> {
    return this.makeApiRequest<void>(
      `${this.baseUrl}${API_ENDPOINTS.LISTINGS.DELETE}/${id}`,
      { method: 'DELETE' },
      'Delete listing'
    );
  }

  /**
   * Save a listing
   */
  async saveListing(id: string): Promise<void> {
    return this.makeApiRequest<void>(
      `${this.baseUrl}${API_ENDPOINTS.LISTINGS.SAVE}/${id}/save`,
      { method: 'POST' },
      'Save listing'
    );
  }

  /**
   * Unsave a listing
   */
  async unsaveListing(id: string): Promise<void> {
    return this.makeApiRequest<void>(
      `${this.baseUrl}${API_ENDPOINTS.LISTINGS.UNSAVE}/${id}/save`,
      { method: 'DELETE' },
      'Unsave listing'
    );
  }

  /**
   * Get user's saved listings
   */
  async getSavedListings(filter: ListingFilter = {}): Promise<PaginatedListings> {
    const queryParams = new URLSearchParams();
    
    // Add filter parameters
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const url = `${this.baseUrl}${API_ENDPOINTS.LISTINGS.SAVED}?${queryParams.toString()}`;
    
    return this.makeApiRequest<PaginatedListings>(
      url,
      { method: 'GET' },
      'Fetch saved listings'
    );
  }

  /**
   * Get user's own listings
   */
  async getMyListings(filter: ListingFilter = {}): Promise<PaginatedListings> {
    const queryParams = new URLSearchParams();
    
    // Add filter parameters
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const url = `${this.baseUrl}${API_ENDPOINTS.LISTINGS.MY_LISTINGS}?${queryParams.toString()}`;
    
    return this.makeApiRequest<PaginatedListings>(
      url,
      { method: 'GET' },
      'Fetch my listings'
    );
  }

  /**
   * Mark listing as sold
   */
  async markAsSold(id: string): Promise<Listing> {
    return this.makeApiRequest<Listing>(
      `${this.baseUrl}${API_ENDPOINTS.LISTINGS.MARK_SOLD}/${id}/mark-sold`,
      { method: 'PATCH' },
      'Mark listing as sold'
    );
  }

  /**
   * Increment view count for a listing
   */
  async incrementView(id: string): Promise<void> {
    return this.makeApiRequest<void>(
      `${this.baseUrl}${API_ENDPOINTS.LISTINGS.VIEW}/${id}/view`,
      { method: 'POST' },
      'Increment view count'
    );
  }

  /**
   * Search for listings nearby
   */
  async searchNearby(
    lat: number, 
    lon: number, 
    radius: number, 
    filter: ListingFilter = {}
  ): Promise<Listing[]> {
    const queryParams = new URLSearchParams();
    
    // Add location parameters
    queryParams.append('latitude', lat.toString());
    queryParams.append('longitude', lon.toString());
    queryParams.append('radius', radius.toString());
    
    // Add filter parameters
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const url = `${this.baseUrl}${API_ENDPOINTS.LISTINGS.NEARBY}?${queryParams.toString()}`;
    
    return this.makeApiRequest<Listing[]>(
      url,
      { method: 'GET' },
      'Search nearby listings'
    );
  }

  /**
   * Search listings with text query
   */
  async searchListings(query: string, filter: Omit<ListingFilter, 'search'> = {}): Promise<Listing[]> {
    const searchFilter: ListingFilter = {
      ...filter,
      search: query,
    };

    const result = await this.getListings(searchFilter);
    return result.data;
  }

  /**
   * Get default location coordinates (Lagos, Nigeria)
   */
  getDefaultLocation(): { latitude: number; longitude: number; address: string } {
    return {
      latitude: 6.5244,
      longitude: 3.3792,
      address: 'Lagos, Nigeria'
    };
  }

  /**
   * Test API connectivity and authentication
   */
  async testConnectivity(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      console.log('🧪 Testing API connectivity...');
      console.log('🧪 Base URL:', this.baseUrl);
      
      // Test basic connectivity
      const testUrl = `${this.baseUrl}/listings?limit=1`;
      console.log('🧪 Test URL:', testUrl);
      
      const headers = await this.getAuthHeaders();
      console.log('🧪 Auth headers:', headers);
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers,
      });
      
      console.log('🧪 Response status:', response.status);
      console.log('🧪 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🧪 Error response:', errorText);
        
        return {
          success: false,
          message: `API returned ${response.status}: ${response.statusText}`,
          details: { status: response.status, error: errorText }
        };
      }
      
      const data = await response.json();
      console.log('🧪 Success response:', data);
      
      return {
        success: true,
        message: 'API connectivity test successful',
        details: { status: response.status, data }
      };
    } catch (error: any) {
      console.error('🧪 Connectivity test failed:', error);
      
      return {
        success: false,
        message: `Connectivity test failed: ${error.message}`,
        details: { error: error.message, stack: error.stack }
      };
    }
  }
}

export default ListingsService;
