// MeCabal Location Services
// Nigerian estates/compounds location verification and management

import { supabase, handleSupabaseError, logPerformance } from './supabase';
import type { 
  Neighborhood, 
  LocationVerificationResponse, 
  NeighborhoodMatch,
  GeocodeResponse,
  ApiResponse 
} from '../types';

export class MeCabalLocation {
  // Verify user location within Nigerian neighborhoods
  static async verifyLocation(
    userId: string,
    latitude: number,
    longitude: number,
    address?: string
  ): Promise<LocationVerificationResponse> {
    const startTime = Date.now();
    
    try {
      // Validate coordinates are within Nigeria bounds
      if (!this.isWithinNigeriaBounds(latitude, longitude)) {
        return {
          verified: false,
          error: 'Location is outside Nigeria'
        };
      }

      const { data, error } = await supabase.functions.invoke('location-services/verify-location', {
        body: { 
          user_id: userId, 
          latitude, 
          longitude, 
          address 
        }
      });

      logPerformance('verifyLocation', startTime);

      if (error) {
        return {
          verified: false,
          error: handleSupabaseError(error)
        };
      }

      return data;
    } catch (error: any) {
      logPerformance('verifyLocation', startTime);
      return {
        verified: false,
        error: handleSupabaseError(error)
      };
    }
  }

  // Find neighborhoods near user location
  static async findNearbyNeighborhoods(
    latitude: number,
    longitude: number,
    radiusKm: number = 5,
    limit: number = 10
  ): Promise<NeighborhoodMatch[]> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('location-services/find-neighborhoods', {
        body: { 
          latitude, 
          longitude, 
          radius_km: radiusKm,
          limit
        }
      });

      logPerformance('findNearbyNeighborhoods', startTime);

      if (error) {
        console.error('Error finding neighborhoods:', error);
        return [];
      }

      return data.neighborhoods || [];
    } catch (error: any) {
      logPerformance('findNearbyNeighborhoods', startTime);
      console.error('Error finding neighborhoods:', error);
      return [];
    }
  }

  // Get neighborhood details
  static async getNeighborhoodDetails(neighborhoodId: string): Promise<Neighborhood | null> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('neighborhoods')
        .select(`
          *,
          user_count:user_neighborhoods(count),
          recent_posts:posts!posts_neighborhood_id_fkey(count)
        `)
        .eq('id', neighborhoodId)
        .single();

      logPerformance('getNeighborhoodDetails', startTime);

      if (error) {
        console.error('Error getting neighborhood details:', error);
        return null;
      }

      return {
        ...data,
        member_count: data.user_count?.[0]?.count || 0,
        recent_posts_count: data.recent_posts?.[0]?.count || 0
      } as Neighborhood;
    } catch (error: any) {
      logPerformance('getNeighborhoodDetails', startTime);
      console.error('Error getting neighborhood details:', error);
      return null;
    }
  }

  // Join a neighborhood
  static async joinNeighborhood(
    userId: string,
    neighborhoodId: string,
    relationshipType: 'resident' | 'worker' | 'visitor' = 'resident',
    verificationData?: {
      coordinates?: { latitude: number; longitude: number };
      address?: string;
      method?: 'gps' | 'referral' | 'manual' | 'document';
    }
  ): Promise<ApiResponse> {
    const startTime = Date.now();
    
    try {
      // Check if already a member
      const { data: existing } = await supabase
        .from('user_neighborhoods')
        .select('id')
        .eq('user_id', userId)
        .eq('neighborhood_id', neighborhoodId)
        .single();

      if (existing) {
        return {
          success: false,
          error: 'You are already a member of this neighborhood'
        };
      }

      const { data, error } = await supabase
        .from('user_neighborhoods')
        .insert({
          user_id: userId,
          neighborhood_id: neighborhoodId,
          relationship_type: relationshipType,
          verification_method: verificationData?.method || 'gps',
          verification_data: verificationData ? {
            coordinates: verificationData.coordinates,
            address: verificationData.address,
            timestamp: new Date().toISOString()
          } : undefined,
          address_details: verificationData?.address,
          is_primary: false // User can set primary later
        })
        .select()
        .single();

      logPerformance('joinNeighborhood', startTime);

      if (error) {
        return {
          success: false,
          error: handleSupabaseError(error)
        };
      }

      // Update user verification level if this is their first neighborhood
      const { data: userNeighborhoods } = await supabase
        .from('user_neighborhoods')
        .select('id')
        .eq('user_id', userId);

      if (userNeighborhoods && userNeighborhoods.length === 1) {
        await supabase
          .from('users')
          .update({ verification_level: 2 }) // Address verified
          .eq('id', userId);
      }

      return {
        success: true,
        data,
        message: 'Successfully joined neighborhood'
      };
    } catch (error: any) {
      logPerformance('joinNeighborhood', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  // Get user's neighborhoods
  static async getUserNeighborhoods(userId: string): Promise<(Neighborhood & { relationship_type: string; is_primary: boolean })[]> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('user_neighborhoods')
        .select(`
          relationship_type,
          is_primary,
          joined_at,
          neighborhoods:neighborhood_id (*)
        `)
        .eq('user_id', userId)
        .order('is_primary', { ascending: false })
        .order('joined_at', { ascending: false });

      logPerformance('getUserNeighborhoods', startTime);

      if (error) {
        console.error('Error getting user neighborhoods:', error);
        return [];
      }

      return data?.map(item => ({
        ...item.neighborhoods,
        relationship_type: item.relationship_type,
        is_primary: item.is_primary,
        joined_at: item.joined_at
      })) || [];
    } catch (error: any) {
      logPerformance('getUserNeighborhoods', startTime);
      console.error('Error getting user neighborhoods:', error);
      return [];
    }
  }

  // Set primary neighborhood
  static async setPrimaryNeighborhood(userId: string, neighborhoodId: string): Promise<ApiResponse> {
    const startTime = Date.now();
    
    try {
      // Remove primary flag from all user neighborhoods
      await supabase
        .from('user_neighborhoods')
        .update({ is_primary: false })
        .eq('user_id', userId);

      // Set new primary
      const { error } = await supabase
        .from('user_neighborhoods')
        .update({ is_primary: true })
        .eq('user_id', userId)
        .eq('neighborhood_id', neighborhoodId);

      logPerformance('setPrimaryNeighborhood', startTime);

      if (error) {
        return {
          success: false,
          error: handleSupabaseError(error)
        };
      }

      return {
        success: true,
        message: 'Primary neighborhood updated'
      };
    } catch (error: any) {
      logPerformance('setPrimaryNeighborhood', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  // Leave a neighborhood
  static async leaveNeighborhood(userId: string, neighborhoodId: string): Promise<ApiResponse> {
    const startTime = Date.now();
    
    try {
      const { error } = await supabase
        .from('user_neighborhoods')
        .delete()
        .eq('user_id', userId)
        .eq('neighborhood_id', neighborhoodId);

      logPerformance('leaveNeighborhood', startTime);

      if (error) {
        return {
          success: false,
          error: handleSupabaseError(error)
        };
      }

      return {
        success: true,
        message: 'Successfully left neighborhood'
      };
    } catch (error: any) {
      logPerformance('leaveNeighborhood', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  // Reverse geocode coordinates to Nigerian address
  static async reverseGeocode(latitude: number, longitude: number): Promise<GeocodeResponse> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('location-services/reverse-geocode', {
        body: { latitude, longitude }
      });

      logPerformance('reverseGeocode', startTime);

      if (error) {
        return {
          success: false,
          error: handleSupabaseError(error)
        };
      }

      return data;
    } catch (error: any) {
      logPerformance('reverseGeocode', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  // Validate Nigerian address
  static async validateAddress(
    address?: string,
    coordinates?: { latitude: number; longitude: number }
  ): Promise<{
    valid: boolean;
    formatted_address?: string;
    components?: any;
    confidence?: number;
    suggestions?: string[];
  }> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('location-services/validate-address', {
        body: { 
          address,
          latitude: coordinates?.latitude,
          longitude: coordinates?.longitude
        }
      });

      logPerformance('validateAddress', startTime);

      if (error) {
        return { valid: false };
      }

      return data;
    } catch (error: any) {
      logPerformance('validateAddress', startTime);
      return { valid: false };
    }
  }

  // Search neighborhoods by name
  static async searchNeighborhoods(
    query: string,
    state?: string,
    limit: number = 20
  ): Promise<Neighborhood[]> {
    const startTime = Date.now();
    
    try {
      let queryBuilder = supabase
        .from('neighborhoods')
        .select('*')
        .ilike('name', `%${query}%`)
        .eq('is_verified', true)
        .limit(limit);

      if (state) {
        queryBuilder = queryBuilder.ilike('state_name', `%${state}%`);
      }

      const { data, error } = await queryBuilder;

      logPerformance('searchNeighborhoods', startTime);

      if (error) {
        console.error('Error searching neighborhoods:', error);
        return [];
      }

      return data || [];
    } catch (error: any) {
      logPerformance('searchNeighborhoods', startTime);
      console.error('Error searching neighborhoods:', error);
      return [];
    }
  }

  // Get current location using device GPS
  static async getCurrentLocation(): Promise<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null> {
    try {
      // This would typically use Expo Location or React Native Geolocation
      // Implementation depends on the chosen location library
      console.log('getCurrentLocation would use device GPS here');
      return null;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  // Helper: Check if coordinates are within Nigeria bounds
  private static isWithinNigeriaBounds(latitude: number, longitude: number): boolean {
    // Nigeria approximate bounds
    return latitude >= 4.0 && latitude <= 14.0 && 
           longitude >= 2.5 && longitude <= 15.0;
  }

  // Helper: Calculate distance between two points
  static calculateDistance(
    lat1: number, lon1: number, 
    lat2: number, lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Helper: Format Nigerian address for display
  static formatNigerianAddress(components: {
    street?: string;
    area?: string;
    lga?: string;
    state?: string;
  }): string {
    const parts = [
      components.street,
      components.area,
      components.lga,
      components.state
    ].filter(Boolean);
    
    return parts.join(', ') + (parts.length > 0 ? ', Nigeria' : 'Nigeria');
  }
}