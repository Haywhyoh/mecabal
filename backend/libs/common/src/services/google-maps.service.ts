import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@googlemaps/google-maps-services-js';

export interface LocationInfo {
  state: string;
  lga: string;
  ward?: string;
  city: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  formattedAddress: string;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  types: string[];
  rating?: number;
  priceLevel?: number;
  phoneNumber?: string;
  website?: string;
}

export interface NearbyPlace {
  placeId: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  distance: number; // in meters
  types: string[];
  rating?: number;
}

@Injectable()
export class GoogleMapsService {
  private readonly logger = new Logger(GoogleMapsService.name);
  private readonly client: Client;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
    
    if (!this.apiKey) {
      this.logger.warn('GOOGLE_MAPS_API_KEY not found. Google Maps features will be disabled.');
    }

    this.client = new Client({});
  }

  /**
   * Reverse geocode coordinates to get location information
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<LocationInfo | null> {
    if (!this.apiKey) {
      this.logger.warn('Google Maps API key not configured');
      return null;
    }

    try {
      const response = await this.client.reverseGeocode({
        params: {
          latlng: { lat: latitude, lng: longitude },
          key: this.apiKey,
          result_type: ['administrative_area_level_1', 'administrative_area_level_2', 'locality', 'political'],
        },
      });

      if (response.data.results.length === 0) {
        this.logger.warn(`No results found for coordinates: ${latitude}, ${longitude}`);
        return null;
      }

      const result = response.data.results[0];
      const addressComponents = result.address_components;

      // Extract location information
      const state = this.extractComponent(addressComponents, 'administrative_area_level_1');
      const lga = this.extractComponent(addressComponents, 'administrative_area_level_2');
      const city = this.extractComponent(addressComponents, 'locality') || 
                   this.extractComponent(addressComponents, 'sublocality_level_1') ||
                   this.extractComponent(addressComponents, 'sublocality');

      return {
        state: state || 'Unknown',
        lga: lga || 'Unknown',
        city: city || 'Unknown',
        coordinates: { latitude, longitude },
        formattedAddress: result.formatted_address,
      };
    } catch (error) {
      this.logger.error('Error in reverse geocoding:', error);
      return null;
    }
  }

  /**
   * Find nearby places of specific types
   */
  async findNearbyPlaces(
    latitude: number,
    longitude: number,
    types: string[],
    radius: number = 1000,
    limit: number = 20
  ): Promise<NearbyPlace[]> {
    if (!this.apiKey) {
      this.logger.warn('Google Maps API key not configured');
      return [];
    }

    try {
      const response = await this.client.placesNearby({
        params: {
          location: { lat: latitude, lng: longitude },
          radius,
          type: types.join('|'),
          key: this.apiKey,
        },
      });

      const places: NearbyPlace[] = response.data.results
        .slice(0, limit)
        .map(place => ({
          placeId: place.place_id,
          name: place.name,
          address: place.vicinity,
          coordinates: {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
          },
          distance: this.calculateDistance(
            latitude,
            longitude,
            place.geometry.location.lat,
            place.geometry.location.lng
          ),
          types: place.types,
          rating: place.rating,
        }));

      return places.sort((a, b) => a.distance - b.distance);
    } catch (error) {
      this.logger.error('Error finding nearby places:', error);
      return [];
    }
  }

  /**
   * Get detailed information about a place
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    if (!this.apiKey) {
      this.logger.warn('Google Maps API key not configured');
      return null;
    }

    try {
      const response = await this.client.placeDetails({
        params: {
          place_id: placeId,
          fields: ['name', 'formatted_address', 'geometry', 'types', 'rating', 'price_level', 'formatted_phone_number', 'website'],
          key: this.apiKey,
        },
      });

      const place = response.data.result;

      return {
        placeId: place.place_id,
        name: place.name,
        address: place.formatted_address,
        coordinates: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        },
        types: place.types,
        rating: place.rating,
        priceLevel: place.price_level,
        phoneNumber: place.formatted_phone_number,
        website: place.website,
      };
    } catch (error) {
      this.logger.error('Error getting place details:', error);
      return null;
    }
  }

  /**
   * Search for estates and communities in a specific area
   */
  async searchEstates(
    query: string,
    latitude: number,
    longitude: number,
    radius: number = 5000
  ): Promise<NearbyPlace[]> {
    if (!this.apiKey) {
      this.logger.warn('Google Maps API key not configured');
      return [];
    }

    try {
      const response = await this.client.textSearch({
        params: {
          query: `${query} estate community residential`,
          location: { lat: latitude, lng: longitude },
          radius,
          key: this.apiKey,
        },
      });

      const places: NearbyPlace[] = response.data.results.map(place => ({
        placeId: place.place_id,
        name: place.name,
        address: place.formatted_address,
        coordinates: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        },
        distance: this.calculateDistance(
          latitude,
          longitude,
          place.geometry.location.lat,
          place.geometry.location.lng
        ),
        types: place.types,
        rating: place.rating,
      }));

      return places.sort((a, b) => a.distance - b.distance);
    } catch (error) {
      this.logger.error('Error searching estates:', error);
      return [];
    }
  }

  /**
   * Get administrative area information from coordinates
   */
  async getAdministrativeArea(latitude: number, longitude: number): Promise<{
    state: string;
    lga: string;
    ward?: string;
    city: string;
  } | null> {
    const locationInfo = await this.reverseGeocode(latitude, longitude);
    
    if (!locationInfo) {
      return null;
    }

    return {
      state: locationInfo.state,
      lga: locationInfo.lga,
      city: locationInfo.city,
    };
  }

  /**
   * Search for landmarks by type in a specific area
   */
  async searchLandmarks(
    latitude: number,
    longitude: number,
    landmarkTypes: string[],
    radius: number = 2000
  ): Promise<NearbyPlace[]> {
    const commonTypes = [
      'market',
      'school',
      'hospital',
      'mosque',
      'church',
      'park',
      'shopping_mall',
      'bank',
      'gas_station',
      'restaurant',
    ];

    const searchTypes = landmarkTypes.length > 0 ? landmarkTypes : commonTypes;
    
    return this.findNearbyPlaces(latitude, longitude, searchTypes, radius);
  }

  /**
   * Extract specific component from address components
   */
  private extractComponent(components: any[], type: string): string | null {
    const component = components.find(comp => comp.types.includes(type));
    return component ? component.long_name : null;
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get rate limit information (for monitoring)
   */
  getRateLimitInfo(): {
    configured: boolean;
    apiKey: string | null;
  } {
    return {
      configured: this.isConfigured(),
      apiKey: this.apiKey ? `${this.apiKey.substring(0, 8)}...` : null,
    };
  }
}
