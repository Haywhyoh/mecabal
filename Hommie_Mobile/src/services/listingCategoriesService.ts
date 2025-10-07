import { ENV, API_ENDPOINTS } from '../config/environment';
import { MeCabalAuth } from './auth';

// Types
export interface ListingCategory {
  id: number;
  listingType: 'property' | 'item' | 'service';
  name: string;
  description?: string;
  iconUrl?: string;
  colorCode?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

export class ListingCategoriesService {
  private static instance: ListingCategoriesService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = ENV.API.BASE_URL;
  }

  public static getInstance(): ListingCategoriesService {
    if (!ListingCategoriesService.instance) {
      ListingCategoriesService.instance = new ListingCategoriesService();
    }
    return ListingCategoriesService.instance;
  }

  /**
   * Get authentication headers
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    console.log('🔧 ListingCategoriesService: Getting auth headers...');
    const token = await MeCabalAuth.getAuthToken();
    console.log('🔧 Retrieved token:', token ? 'Token exists' : 'No token');

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  /**
   * Get all listing categories
   */
  async getCategories(listingType?: 'property' | 'item' | 'service'): Promise<ListingCategory[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (listingType) {
        queryParams.append('listingType', listingType);
      }

      const url = `${this.baseUrl}/listing-categories?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch listing categories');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching listing categories:', error);
      throw new Error('Failed to fetch listing categories');
    }
  }

  /**
   * Get a single category by ID
   */
  async getCategory(id: number): Promise<ListingCategory> {
    try {
      const response = await fetch(`${this.baseUrl}/listing-categories/${id}`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch listing category');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching listing category:', error);
      throw new Error('Failed to fetch listing category');
    }
  }

  /**
   * Get categories grouped by listing type
   */
  async getCategoriesGrouped(): Promise<{
    property: ListingCategory[];
    item: ListingCategory[];
    service: ListingCategory[];
  }> {
    try {
      const allCategories = await this.getCategories();
      
      return {
        property: allCategories.filter(cat => cat.listingType === 'property'),
        item: allCategories.filter(cat => cat.listingType === 'item'),
        service: allCategories.filter(cat => cat.listingType === 'service'),
      };
    } catch (error) {
      console.error('Error fetching grouped categories:', error);
      throw new Error('Failed to fetch grouped categories');
    }
  }

  /**
   * Get categories for a specific listing type with proper ordering
   */
  async getCategoriesForType(listingType: 'property' | 'item' | 'service'): Promise<ListingCategory[]> {
    try {
      const categories = await this.getCategories(listingType);
      
      // Sort by displayOrder
      return categories.sort((a, b) => a.displayOrder - b.displayOrder);
    } catch (error) {
      console.error('Error fetching categories for type:', error);
      throw new Error('Failed to fetch categories for type');
    }
  }
}

export default ListingCategoriesService;
