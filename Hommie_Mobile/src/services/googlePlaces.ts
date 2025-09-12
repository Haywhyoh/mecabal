import { Platform } from 'react-native';

export interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  rating?: number;
  price_level?: number;
  vicinity?: string;
  business_status?: string;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
}

export interface NearbySearchResult {
  results: PlaceResult[];
  status: string;
  next_page_token?: string;
}

export interface PlaceDetailsResult {
  result: PlaceResult & {
    opening_hours?: {
      open_now: boolean;
      weekday_text: string[];
    };
    website?: string;
    international_phone_number?: string;
    reviews?: Array<{
      author_name: string;
      rating: number;
      text: string;
      time: number;
    }>;
  };
  status: string;
}

export class GooglePlacesService {
  private static readonly API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  private static readonly BASE_URL = 'https://maps.googleapis.com/maps/api/place';
  private static readonly RADIUS = 5000; // 5km radius for nearby search
  
  // Simple cache to prevent repeated API calls
  private static cache: Map<string, { data: any; timestamp: number }> = new Map();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Search for nearby places using Google Places API
   */
  static async searchNearbyPlaces(
    latitude: number,
    longitude: number,
    type: string = 'establishment',
    radius: number = this.RADIUS,
    keyword?: string
  ): Promise<{ success: boolean; data?: PlaceResult[]; error?: string }> {
    try {
      if (!this.API_KEY) {
        return {
          success: false,
          error: 'Google Places API key not configured'
        };
      }

      const url = `${this.BASE_URL}/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${this.API_KEY}${keyword ? `&keyword=${encodeURIComponent(keyword)}` : ''}`;

      const response = await fetch(url);
      const data: NearbySearchResult = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        return {
          success: false,
          error: `Google Places API error: ${data.status}`
        };
      }

      return {
        success: true,
        data: data.results || []
      };
    } catch (error) {
      console.error('Google Places API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get detailed information about a specific place
   */
  static async getPlaceDetails(
    placeId: string,
    fields: string[] = ['place_id', 'name', 'formatted_address', 'geometry', 'types', 'rating', 'price_level', 'vicinity', 'photos', 'opening_hours', 'website', 'international_phone_number', 'reviews']
  ): Promise<{ success: boolean; data?: PlaceDetailsResult['result']; error?: string }> {
    try {
      if (!this.API_KEY) {
        return {
          success: false,
          error: 'Google Places API key not configured'
        };
      }

      const url = `${this.BASE_URL}/details/json?place_id=${placeId}&fields=${fields.join(',')}&key=${this.API_KEY}`;

      const response = await fetch(url);
      const data: PlaceDetailsResult = await response.json();

      if (data.status !== 'OK') {
        return {
          success: false,
          error: `Google Places API error: ${data.status}`
        };
      }

      return {
        success: true,
        data: data.result
      };
    } catch (error) {
      console.error('Google Places API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Search for multiple variations of a Nigerian location
   */
  static async searchNigerianLocationVariations(
    query: string,
    latitude?: number,
    longitude?: number
  ): Promise<{ success: boolean; data?: PlaceResult[]; error?: string }> {
    try {
      const variations = this.generateLocationVariations(query);
      const allResults: PlaceResult[] = [];
      
      console.log('🔍 [SEARCH DEBUG] Trying variations:', variations);
      
      // Try each variation
      for (const variation of variations) {
        const result = await this.searchPlacesByText(variation, latitude, longitude);
        if (result.success && result.data && result.data.length > 0) {
          allResults.push(...result.data);
          // If we found good results with this variation, prioritize them
          if (result.data.length >= 3) break;
        }
      }
      
      // Remove duplicates based on place_id
      const uniqueResults = allResults.filter((place, index, self) => 
        index === self.findIndex(p => p.place_id === place.place_id)
      );
      
      return {
        success: true,
        data: uniqueResults.slice(0, 8), // Limit to 8 results
        error: uniqueResults.length === 0 ? 'No locations found. Try different search terms or check spelling.' : undefined
      };
    } catch (error) {
      console.error('Error searching Nigerian location variations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }
  
  /**
   * Generate search variations for Nigerian locations
   */
  private static generateLocationVariations(query: string): string[] {
    const variations = [query]; // Start with original query
    const lowerQuery = query.toLowerCase();
    
    // Estate-specific variations
    if (lowerQuery.includes('estate')) {
      const baseName = query.replace(/estate/gi, '').trim();
      variations.push(
        baseName,
        `${baseName} Housing Estate`,
        `${baseName} Estate Lagos`,
        `${baseName} Residential Estate`
      );
    }
    
    // Area-specific variations
    const areaKeywords = ['area', 'district', 'zone', 'community'];
    areaKeywords.forEach(keyword => {
      if (lowerQuery.includes(keyword)) {
        const baseName = query.replace(new RegExp(keyword, 'gi'), '').trim();
        variations.push(baseName, `${baseName} ${keyword}`);
      }
    });
    
    // Add common Nigerian location suffixes
    if (!lowerQuery.includes('lagos') && !lowerQuery.includes('abuja')) {
      variations.push(`${query} Lagos`);
    }
    
    // Remove duplicates and empty strings
    return [...new Set(variations)].filter(v => v.trim().length > 0);
  }

  /**
   * Get cached result or return null if expired
   */
  private static getCachedResult(cacheKey: string): any | null {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`🔍 [CACHE HIT] Using cached result for: ${cacheKey}`);
      return cached.data;
    }
    return null;
  }
  
  /**
   * Cache a result with timestamp
   */
  private static setCachedResult(cacheKey: string, data: any): void {
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
  }

  /**
   * Search for Nigerian landmarks and businesses near a location (with caching)
   */
  static async findNigerianLandmarks(
    latitude: number,
    longitude: number,
    radius: number = this.RADIUS
  ): Promise<{ success: boolean; data?: PlaceResult[]; error?: string }> {
    const cacheKey = `landmarks-${latitude.toFixed(4)}-${longitude.toFixed(4)}-${radius}`;
    
    // Check cache first
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }
    
    try {
      // Reduced set of landmark types for faster response
      const landmarkTypes = [
        'hospital',
        'school',
        'shopping_mall',
        'bank',
        'restaurant',
        'church',
        'mosque'
      ];

      const allResults: PlaceResult[] = [];
      const maxPerType = 3; // Limit results per type for performance

      // Search for each type of landmark (limit concurrent requests)
      for (let i = 0; i < landmarkTypes.length; i += 2) {
        const batch = landmarkTypes.slice(i, i + 2);
        const batchPromises = batch.map(type => 
          this.searchNearbyPlaces(latitude, longitude, type, radius)
        );
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.success && result.value.data) {
            allResults.push(...result.value.data.slice(0, maxPerType));
          }
        });
      }

      // Remove duplicates based on place_id
      const uniqueResults = allResults.filter((place, index, self) => 
        index === self.findIndex(p => p.place_id === place.place_id)
      );

      // Sort by rating and limit results
      uniqueResults.sort((a, b) => {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return ratingB - ratingA;
      });

      const result = {
        success: true,
        data: uniqueResults.slice(0, 15) // Limit to top 15 results
      };
      
      // Cache the result
      this.setCachedResult(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Error finding Nigerian landmarks:', error);
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
      
      // Cache error result for shorter duration
      this.cache.set(cacheKey, { data: errorResult, timestamp: Date.now() - this.CACHE_DURATION + 60000 }); // 1 minute cache for errors
      
      return errorResult;
    }
  }

  /**
   * Text search for places (better for specific locations like estates)
   */
  static async searchPlacesByText(
    query: string,
    latitude?: number,
    longitude?: number,
    radius: number = 100000 // 100km radius for better Nigerian coverage
  ): Promise<{ success: boolean; data?: PlaceResult[]; error?: string }> {
    try {
      if (!this.API_KEY) {
        return {
          success: false,
          error: 'Google Places API key not configured. Please check your environment variables.'
        };
      }

      // Enhance query with Nigerian context for better results
      const enhancedQuery = this.enhanceNigerianQuery(query);
      
      let url = `${this.BASE_URL}/textsearch/json?query=${encodeURIComponent(enhancedQuery)}&key=${this.API_KEY}`;
      
      // Add location bias if coordinates provided
      if (latitude && longitude) {
        url += `&location=${latitude},${longitude}&radius=${radius}`;
      } else {
        // Default to Lagos, Nigeria for Nigerian searches
        url += `&location=6.5244,3.3792&radius=${radius}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      console.log('🔍 [SEARCH DEBUG] Query:', enhancedQuery);
      console.log('🔍 [SEARCH DEBUG] API Response status:', data.status);
      console.log('🔍 [SEARCH DEBUG] Results count:', data.results?.length || 0);

      if (data.status === 'ZERO_RESULTS') {
        return {
          success: true,
          data: [],
          error: 'No locations found. Try searching with different keywords.'
        };
      }

      if (data.status !== 'OK') {
        return {
          success: false,
          error: `Search failed: ${data.status}. ${this.getErrorMessage(data.status)}`
        };
      }

      return {
        success: true,
        data: data.results || []
      };
    } catch (error) {
      console.error('🔍 [SEARCH ERROR]:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred. Please check your internet connection.'
      };
    }
  }

  /**
   * Enhance search queries for better Nigerian location results
   */
  private static enhanceNigerianQuery(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    // Nigerian estate patterns
    const estatePatterns = [
      'estate',
      'housing estate',
      'residential estate',
      'government residential area',
      'gra'
    ];
    
    // Add "Nigeria" or "Lagos" context if not present
    if (!lowerQuery.includes('nigeria') && !lowerQuery.includes('lagos') && 
        !lowerQuery.includes('abuja') && !lowerQuery.includes('kano') && 
        !lowerQuery.includes('ibadan') && !lowerQuery.includes('port harcourt')) {
      
      // If it looks like an estate, add Lagos context
      if (estatePatterns.some(pattern => lowerQuery.includes(pattern))) {
        return `${query} Lagos Nigeria`;
      }
      
      // For other searches, just add Nigeria
      return `${query} Nigeria`;
    }
    
    return query;
  }

  /**
   * Get user-friendly error messages for API status codes
   */
  private static getErrorMessage(status: string): string {
    switch (status) {
      case 'REQUEST_DENIED':
        return 'API key is invalid or Places API is not enabled.';
      case 'INVALID_REQUEST':
        return 'The search request was invalid.';
      case 'OVER_QUERY_LIMIT':
        return 'API quota exceeded. Please try again later.';
      case 'UNKNOWN_ERROR':
        return 'Server error occurred. Please try again.';
      default:
        return 'Please try again with different search terms.';
    }
  }

  /**
   * Search for Nigerian businesses and services
   */
  static async findNigerianBusinesses(
    latitude: number,
    longitude: number,
    businessType?: string,
    radius: number = this.RADIUS
  ): Promise<{ success: boolean; data?: PlaceResult[]; error?: string }> {
    try {
      const keywords = businessType ? [businessType] : [
        'Nigerian restaurant',
        'Nigerian food',
        'local business',
        'market',
        'shop',
        'service',
        'repair',
        'tailor',
        'barber',
        'salon',
        'mechanic',
        'electrician',
        'plumber'
      ];

      const allResults: PlaceResult[] = [];

      for (const keyword of keywords) {
        const result = await this.searchNearbyPlaces(
          latitude, 
          longitude, 
          'establishment', 
          radius, 
          keyword
        );
        if (result.success && result.data) {
          allResults.push(...result.data);
        }
      }

      // Remove duplicates and sort by relevance
      const uniqueResults = allResults.filter((place, index, self) => 
        index === self.findIndex(p => p.place_id === place.place_id)
      );

      return {
        success: true,
        data: uniqueResults.slice(0, 15) // Limit to top 15 results
      };
    } catch (error) {
      console.error('Error finding Nigerian businesses:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get photo URL for a place
   */
  static getPlacePhotoUrl(
    photoReference: string,
    maxWidth: number = 400,
    maxHeight: number = 400
  ): string {
    if (!this.API_KEY) {
      return '';
    }
    return `${this.BASE_URL}/photo?maxwidth=${maxWidth}&maxheight=${maxHeight}&photo_reference=${photoReference}&key=${this.API_KEY}`;
  }

  /**
   * Calculate distance between two coordinates
   */
  static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Format Nigerian address from place result
   */
  static formatNigerianAddress(place: PlaceResult): string {
    const address = place.formatted_address;
    
    // Extract Nigerian-specific address components
    const nigerianPatterns = [
      /Lagos, Nigeria/i,
      /Abuja, Nigeria/i,
      /Kano, Nigeria/i,
      /Ibadan, Nigeria/i,
      /Port Harcourt, Nigeria/i
    ];

    // Check if it's a Nigerian address
    const isNigerian = nigerianPatterns.some(pattern => pattern.test(address));
    
    if (!isNigerian) {
      return address;
    }

    // Format for Nigerian context
    let formatted = address;
    
    // Add area/estate information if available
    if (place.vicinity) {
      formatted = `${place.vicinity}, ${formatted}`;
    }

    return formatted;
  }

  /**
   * Check if a place is currently open
   */
  static isPlaceOpen(place: PlaceDetailsResult['result']): boolean | null {
    if (!place.opening_hours) {
      return null; // Unknown
    }
    return place.opening_hours.open_now;
  }

  /**
   * Get Nigerian business hours format
   */
  static getNigerianBusinessHours(place: PlaceDetailsResult['result']): string[] | null {
    if (!place.opening_hours?.weekday_text) {
      return null;
    }

    // Convert to Nigerian time format (WAT - West Africa Time)
    return place.opening_hours.weekday_text.map(day => {
      // Convert to 12-hour format with Nigerian context
      return day.replace(/(\d{1,2}):(\d{2})/g, (match, hour, minute) => {
        const hour24 = parseInt(hour);
        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
        const ampm = hour24 >= 12 ? 'PM' : 'AM';
        return `${hour12}:${minute} ${ampm}`;
      });
    });
  }
}
