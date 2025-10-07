import { ENV, API_ENDPOINTS } from '../config/environment';
import { MeCabalAuth } from './auth';

// Types
export interface Listing {
  id: string;
  userId: string;
  listingType: 'property' | 'item' | 'service';
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
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  rentalPeriod?: string;
  condition?: string;
  brand?: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  media: Media[];
  status: 'active' | 'sold' | 'expired' | 'draft';
  viewsCount: number;
  savesCount: number;
  isSaved: boolean;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    isVerified: boolean;
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
  listingType: 'property' | 'item' | 'service';
  categoryId: number;
  title: string;
  description: string;
  price: number;
  priceType: 'fixed' | 'negotiable' | 'per_hour' | 'per_day';
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  rentalPeriod?: string;
  condition?: string;
  brand?: string;
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
  condition?: string;
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
   * Create a new listing
   */
  async createListing(data: CreateListingRequest): Promise<Listing> {
    try {
      const response = await fetch(`${this.baseUrl}/listings`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create listing');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating listing:', error);
      throw new Error('Failed to create listing');
    }
  }

  /**
   * Get listings with filters
   */
  async getListings(filter: ListingFilter = {}): Promise<PaginatedListings> {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filter parameters
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const url = `${this.baseUrl}/listings?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch listings');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching listings:', error);
      throw new Error('Failed to fetch listings');
    }
  }

  /**
   * Get a single listing by ID
   */
  async getListing(id: string): Promise<Listing> {
    try {
      const response = await fetch(`${this.baseUrl}/listings/${id}`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch listing');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching listing:', error);
      throw new Error('Failed to fetch listing');
    }
  }

  /**
   * Update a listing
   */
  async updateListing(id: string, data: Partial<CreateListingRequest>): Promise<Listing> {
    try {
      const response = await fetch(`${this.baseUrl}/listings/${id}`, {
        method: 'PATCH',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update listing');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating listing:', error);
      throw new Error('Failed to update listing');
    }
  }

  /**
   * Delete a listing
   */
  async deleteListing(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/listings/${id}`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete listing');
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
      throw new Error('Failed to delete listing');
    }
  }

  /**
   * Save a listing
   */
  async saveListing(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/listings/${id}/save`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save listing');
      }
    } catch (error) {
      console.error('Error saving listing:', error);
      throw new Error('Failed to save listing');
    }
  }

  /**
   * Unsave a listing
   */
  async unsaveListing(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/listings/${id}/save`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to unsave listing');
      }
    } catch (error) {
      console.error('Error unsaving listing:', error);
      throw new Error('Failed to unsave listing');
    }
  }

  /**
   * Get user's saved listings
   */
  async getSavedListings(filter: ListingFilter = {}): Promise<PaginatedListings> {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filter parameters
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const url = `${this.baseUrl}/listings/saved?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch saved listings');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching saved listings:', error);
      throw new Error('Failed to fetch saved listings');
    }
  }

  /**
   * Get user's own listings
   */
  async getMyListings(filter: ListingFilter = {}): Promise<PaginatedListings> {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filter parameters
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const url = `${this.baseUrl}/listings/my-listings?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch my listings');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching my listings:', error);
      throw new Error('Failed to fetch my listings');
    }
  }

  /**
   * Mark listing as sold
   */
  async markAsSold(id: string): Promise<Listing> {
    try {
      const response = await fetch(`${this.baseUrl}/listings/${id}/mark-sold`, {
        method: 'PATCH',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark listing as sold');
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking listing as sold:', error);
      throw new Error('Failed to mark listing as sold');
    }
  }

  /**
   * Increment view count for a listing
   */
  async incrementView(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/listings/${id}/view`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to increment view count');
      }
    } catch (error) {
      console.error('Error incrementing view count:', error);
      throw new Error('Failed to increment view count');
    }
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
    try {
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

      const url = `${this.baseUrl}/listings/nearby?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to search nearby listings');
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching nearby listings:', error);
      throw new Error('Failed to search nearby listings');
    }
  }

  /**
   * Search listings with text query
   */
  async searchListings(query: string, filter: Omit<ListingFilter, 'search'> = {}): Promise<Listing[]> {
    try {
      const searchFilter: ListingFilter = {
        ...filter,
        search: query,
      };

      const result = await this.getListings(searchFilter);
      return result.data;
    } catch (error) {
      console.error('Error searching listings:', error);
      throw new Error('Failed to search listings');
    }
  }
}

export default ListingsService;
