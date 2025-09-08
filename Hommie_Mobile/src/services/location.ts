// MeCabal Location Services
// Nigerian estates/compounds location verification and management

import { supabase, handleSupabaseError, logPerformance } from './supabase';
import * as Location from 'expo-location';
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

      // Comprehensive Nigerian neighborhood database with flexible boundaries
      // Using center-point + radius model to accommodate Nigerian community patterns
      const mockNeighborhoods = [
        // === ESTATES (Planned Residential Developments) ===
        {
          id: 'ikeja-gra',
          name: 'Ikeja GRA',
          state_name: 'Lagos',
          type: 'estate' as const,
          center: { latitude: 6.605, longitude: 3.355 },
          radius_km: 1.2,
          member_count: 245,
          recent_posts_count: 12
        },
        {
          id: 'victoria-island',
          name: 'Victoria Island',
          state_name: 'Lagos',
          type: 'estate' as const,
          center: { latitude: 6.430, longitude: 3.415 },
          radius_km: 2.0,
          member_count: 189,
          recent_posts_count: 8
        },
        {
          id: 'lekki-phase1',
          name: 'Lekki Phase 1',
          state_name: 'Lagos',
          type: 'estate' as const,
          center: { latitude: 6.450, longitude: 3.505 },
          radius_km: 1.5,
          member_count: 156,
          recent_posts_count: 15
        },
        {
          id: 'banana-island',
          name: 'Banana Island',
          state_name: 'Lagos',
          type: 'estate' as const,
          center: { latitude: 6.440, longitude: 3.430 },
          radius_km: 0.8,
          member_count: 67,
          recent_posts_count: 3
        },

        // === TRADITIONAL AREAS (Large Cultural/Historical Neighborhoods) ===
        {
          id: 'surulere-lagos',
          name: 'Surulere',
          state_name: 'Lagos',
          type: 'traditional_area' as const,
          center: { latitude: 6.495, longitude: 3.348 },
          radius_km: 3.5,
          member_count: 892,
          recent_posts_count: 24
        },
        {
          id: 'yaba-lagos',
          name: 'Yaba',
          state_name: 'Lagos',
          type: 'traditional_area' as const,
          center: { latitude: 6.515, longitude: 3.378 },
          radius_km: 2.8,
          member_count: 756,
          recent_posts_count: 18
        },
        {
          id: 'ikeja-main',
          name: 'Ikeja',
          state_name: 'Lagos',
          type: 'traditional_area' as const,
          center: { latitude: 6.595, longitude: 3.337 },
          radius_km: 4.0,
          member_count: 1243,
          recent_posts_count: 31
        },
        {
          id: 'mushin-lagos',
          name: 'Mushin',
          state_name: 'Lagos',
          type: 'traditional_area' as const,
          center: { latitude: 6.527, longitude: 3.347 },
          radius_km: 3.2,
          member_count: 678,
          recent_posts_count: 19
        },
        {
          id: 'agege-lagos',
          name: 'Agege',
          state_name: 'Lagos',
          type: 'traditional_area' as const,
          center: { latitude: 6.613, longitude: 3.318 },
          radius_km: 3.8,
          member_count: 534,
          recent_posts_count: 14
        },

        // === ROAD-BASED AREAS (Communities Around Major Roads) ===
        {
          id: 'allen-avenue-area',
          name: 'Allen Avenue Area',
          state_name: 'Lagos',
          type: 'road_based' as const,
          center: { latitude: 6.588, longitude: 3.367 },
          radius_km: 2.0,
          member_count: 423,
          recent_posts_count: 16
        },
        {
          id: 'opebi-area',
          name: 'Opebi Area',
          state_name: 'Lagos',
          type: 'road_based' as const,
          center: { latitude: 6.595, longitude: 3.352 },
          radius_km: 1.5,
          member_count: 312,
          recent_posts_count: 11
        },
        {
          id: 'admiralty-way-area',
          name: 'Admiralty Way Area',
          state_name: 'Lagos',
          type: 'road_based' as const,
          center: { latitude: 6.425, longitude: 3.410 },
          radius_km: 2.2,
          member_count: 267,
          recent_posts_count: 9
        },

        // === LANDMARK-BASED AREAS (Communities Around Major Landmarks) ===
        {
          id: 'computer-village-area',
          name: 'Computer Village Area',
          state_name: 'Lagos',
          type: 'landmark_based' as const,
          center: { latitude: 6.600, longitude: 3.348 },
          radius_km: 1.8,
          member_count: 389,
          recent_posts_count: 22
        },
        {
          id: 'national-theater-area',
          name: 'National Theater Area',
          state_name: 'Lagos',
          type: 'landmark_based' as const,
          center: { latitude: 6.473, longitude: 3.324 },
          radius_km: 2.0,
          member_count: 445,
          recent_posts_count: 13
        },
        {
          id: 'unilag-area',
          name: 'UNILAG Area',
          state_name: 'Lagos',
          type: 'landmark_based' as const,
          center: { latitude: 6.515, longitude: 3.397 },
          radius_km: 2.5,
          member_count: 567,
          recent_posts_count: 28
        },

        // === TRANSPORT HUB AREAS (Communities Around Major Transport Points) ===
        {
          id: 'ojota-area',
          name: 'Ojota Area',
          state_name: 'Lagos',
          type: 'transport_hub' as const,
          center: { latitude: 6.573, longitude: 3.384 },
          radius_km: 1.5,
          member_count: 612,
          recent_posts_count: 17
        },
        {
          id: 'ketu-area',
          name: 'Ketu Area',
          state_name: 'Lagos',
          type: 'transport_hub' as const,
          center: { latitude: 6.592, longitude: 3.398 },
          radius_km: 1.8,
          member_count: 487,
          recent_posts_count: 15
        },

        // === MARKET-BASED AREAS (Communities Around Commercial Centers) ===
        {
          id: 'alaba-market-area',
          name: 'Alaba Market Area',
          state_name: 'Lagos',
          type: 'market_based' as const,
          center: { latitude: 6.447, longitude: 3.180 },
          radius_km: 2.5,
          member_count: 723,
          recent_posts_count: 21
        },
        {
          id: 'oshodi-market-area',
          name: 'Oshodi Market Area',
          state_name: 'Lagos',
          type: 'market_based' as const,
          center: { latitude: 6.550, longitude: 3.307 },
          radius_km: 2.0,
          member_count: 634,
          recent_posts_count: 19
        },

        // === ABUJA AREAS ===
        {
          id: 'garki-abuja',
          name: 'Garki',
          state_name: 'Abuja',
          type: 'traditional_area' as const,
          center: { latitude: 9.035, longitude: 7.495 },
          radius_km: 2.8,
          member_count: 434,
          recent_posts_count: 12
        },
        {
          id: 'maitama-abuja',
          name: 'Maitama',
          state_name: 'Abuja',
          type: 'estate' as const,
          center: { latitude: 9.090, longitude: 7.505 },
          radius_km: 2.0,
          member_count: 298,
          recent_posts_count: 8
        },
        {
          id: 'wuse-abuja',
          name: 'Wuse',
          state_name: 'Abuja',
          type: 'traditional_area' as const,
          center: { latitude: 9.065, longitude: 7.485 },
          radius_km: 2.5,
          member_count: 356,
          recent_posts_count: 10
        }
      ];

      // Use new flexible center-point + radius verification with confidence scoring
      const neighborhoodMatches = mockNeighborhoods
        .map(neighborhood => {
          const distance = this.calculateDistance(
            latitude, 
            longitude, 
            neighborhood.center.latitude, 
            neighborhood.center.longitude
          );
          
          // Calculate confidence score based on distance within radius
          let confidence = 0;
          if (distance <= neighborhood.radius_km) {
            // Full confidence if within 50% of radius, scaling down to edge
            const radiusRatio = distance / neighborhood.radius_km;
            if (radiusRatio <= 0.5) {
              confidence = 0.95; // High confidence in center
            } else {
              confidence = 0.95 - (radiusRatio - 0.5) * 0.4; // Scale from 0.95 to 0.75 at edge
            }
          }
          
          return {
            ...neighborhood,
            distance,
            confidence
          };
        })
        .filter(neighborhood => neighborhood.confidence > 0)
        .sort((a, b) => b.confidence - a.confidence); // Sort by highest confidence first

      logPerformance('verifyLocation', startTime);

      if (neighborhoodMatches.length > 0) {
        const bestMatch = neighborhoodMatches[0];
        
        // If confidence is high enough, verify location
        if (bestMatch.confidence >= 0.75) {
          return {
            verified: true,
            neighborhood: {
              id: bestMatch.id,
              name: bestMatch.name,
              state_name: bestMatch.state_name,
              type: bestMatch.type,
              verification_method: 'gps',
              member_count: bestMatch.member_count,
              recent_posts_count: bestMatch.recent_posts_count
            },
            confidence: bestMatch.confidence,
            message: `Location verified in ${bestMatch.name}, ${bestMatch.state_name} (${bestMatch.distance.toFixed(1)}km from center)`
          };
        }
      }
      
      // If no high-confidence matches, find nearby options
      const nearbyNeighborhoods = mockNeighborhoods
        .map(neighborhood => ({
          ...neighborhood,
          distance: this.calculateDistance(
            latitude, 
            longitude, 
            neighborhood.center.latitude, 
            neighborhood.center.longitude
          )
        }))
        .filter(neighborhood => neighborhood.distance <= 5)
        .sort((a, b) => a.distance - b.distance);

      if (nearbyNeighborhoods.length > 0) {
        const nearest = nearbyNeighborhoods[0];
        return {
          verified: false,
          error: `We found you near ${nearest.name} (${nearest.distance.toFixed(1)}km away), but you're outside the community area. Try selecting a landmark or enter your address manually.`,
          suggestions: nearbyNeighborhoods.slice(0, 3).map(n => ({
            name: n.name,
            distance: n.distance,
            type: n.type
          }))
        };
      } else {
        return {
          verified: false,
          error: 'No registered neighborhoods found in your area. This area may not be supported yet. Try selecting a nearby landmark or enter your address manually.',
          suggestions: []
        };
      }
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
    success: boolean;
    data?: {
      latitude: number;
      longitude: number;
      accuracy: number;
      address?: string;
    };
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      // Request location permissions
      const permissionRequest = await Location.requestForegroundPermissionsAsync();
      
      if (!permissionRequest || permissionRequest.status !== 'granted') {
        return {
          success: false,
          error: 'Location permission not granted. Please allow location access to use this feature.'
        };
      }

      // Get current position with high accuracy
      const locationData = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 10000, // 10 seconds maximum age for cached location
        timeout: 15000, // 15 seconds timeout
      });

      // Ensure we have valid location data
      if (!locationData || !locationData.coords) {
        return {
          success: false,
          error: 'Could not retrieve location data. Please try again.'
        };
      }

      // Validate location is within Nigeria
      const { latitude, longitude, accuracy } = locationData.coords;
      
      // Check for valid coordinates
      if (typeof latitude !== 'number' || typeof longitude !== 'number' || 
          isNaN(latitude) || isNaN(longitude)) {
        return {
          success: false,
          error: 'Invalid location coordinates received. Please try again.'
        };
      }
      
      if (!this.isWithinNigeriaBounds(latitude, longitude)) {
        return {
          success: false,
          error: 'Your current location appears to be outside Nigeria. Please ensure you are in Nigeria or select your location manually.'
        };
      }

      // Get human-readable address using reverse geocoding
      let address: string | undefined;
      try {
        const reverseGeocodeResult = await Location.reverseGeocodeAsync({
          latitude,
          longitude
        });
        
        if (reverseGeocodeResult && reverseGeocodeResult.length > 0) {
          const locationInfo = reverseGeocodeResult[0];
          if (locationInfo) {
            address = this.formatNigerianAddress({
              street: locationInfo.street || undefined,
              area: locationInfo.city || locationInfo.district || undefined,
              lga: locationInfo.subregion || undefined,
              state: locationInfo.region || undefined
            });
          }
        }
      } catch (geocodeError) {
        console.warn('Reverse geocoding failed, continuing without address:', geocodeError);
        // Continue without address - this is not a critical error
      }

      logPerformance('getCurrentLocation', startTime);

      return {
        success: true,
        data: {
          latitude,
          longitude,
          accuracy: accuracy || 0,
          address
        }
      };
    } catch (error: any) {
      logPerformance('getCurrentLocation', startTime);
      console.error('Error getting current location:', error);
      
      let errorMessage = 'Unable to get your current location.';
      
      if (error && error.code === 'E_LOCATION_UNAVAILABLE') {
        errorMessage = 'Location services are not available. Please enable GPS and try again.';
      } else if (error && error.code === 'E_LOCATION_TIMEOUT') {
        errorMessage = 'Location request timed out. Please try again or check your network connection.';
      } else if (error && error.code === 'E_LOCATION_SERVICES_DISABLED') {
        errorMessage = 'Location services are disabled. Please enable location services in your device settings.';
      } else if (error && error.message) {
        errorMessage = `Location error: ${error.message}`;
      } else {
        errorMessage = `Unexpected error: ${typeof error === 'object' ? JSON.stringify(error) : String(error)}`;
      }
      
      return {
        success: false,
        error: errorMessage
      };
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

  // Verify landmark-based location (used in LocationSetupScreen)
  static async verifyLandmarkLocation(
    userId: string,
    landmarkName: string,
    landmarkType: string
  ): Promise<LocationVerificationResponse> {
    const startTime = Date.now();
    
    try {
      // For now, use a mock verification system
      // In production, this would call a backend service to:
      // 1. Look up the landmark in a places database
      // 2. Find associated neighborhoods
      // 3. Return verification result
      
      // Mock verification based on landmark name
      const mockNeighborhoods = [
        { name: 'Ikeja GRA', id: 'ikeja-gra', state: 'Lagos' },
        { name: 'Victoria Island', id: 'vi', state: 'Lagos' },
        { name: 'Lekki Phase 1', id: 'lekki-1', state: 'Lagos' },
        { name: 'Garki', id: 'garki', state: 'Abuja' },
        { name: 'Maitama', id: 'maitama', state: 'Abuja' }
      ];
      
      // Simple mock logic - in production this would be more sophisticated
      const foundNeighborhood = mockNeighborhoods.find(n => 
        landmarkName.toLowerCase().includes(n.name.toLowerCase()) ||
        landmarkName.toLowerCase().includes(n.state.toLowerCase())
      );
      
      logPerformance('verifyLandmarkLocation', startTime);
      
      if (foundNeighborhood) {
        return {
          verified: true,
          neighborhood: {
            id: foundNeighborhood.id,
            name: foundNeighborhood.name,
            state_name: foundNeighborhood.state,
            type: 'estate' as const,
            verification_method: 'landmark',
            member_count: 0,
            recent_posts_count: 0
          },
          confidence: 0.8,
          message: `Location verified based on ${landmarkName}`
        };
      } else {
        return {
          verified: false,
          error: `Could not verify location based on ${landmarkName}. Please try a different landmark or use GPS location.`
        };
      }
    } catch (error: any) {
      logPerformance('verifyLandmarkLocation', startTime);
      return {
        verified: false,
        error: handleSupabaseError(error)
      };
    }
  }

  // Discover nearby landmarks (for dynamic landmark list)
  static async discoverNearbyLandmarks(
    latitude: number,
    longitude: number,
    radiusKm: number = 2,
    limit: number = 10
  ): Promise<{
    success: boolean;
    landmarks?: Array<{
      id: string;
      name: string;
      type: string;
      distance: number;
      address?: string;
    }>;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      // Validate input parameters
      if (typeof latitude !== 'number' || typeof longitude !== 'number' || 
          isNaN(latitude) || isNaN(longitude)) {
        return {
          success: false,
          error: 'Invalid coordinates provided for landmark discovery'
        };
      }

      if (typeof radiusKm !== 'number' || radiusKm <= 0 || radiusKm > 50) {
        radiusKm = 2; // Default to 2km if invalid radius
      }

      if (typeof limit !== 'number' || limit <= 0 || limit > 50) {
        limit = 10; // Default to 10 if invalid limit
      }
      // For now, return mock landmarks based on coordinates
      // In production, this would integrate with Google Places API or similar
      
      const mockLandmarks = [
        { id: '1', name: 'Ikeja City Mall', type: 'Shopping Center', lat: 6.6018, lng: 3.3515 },
        { id: '2', name: 'St. Mary\'s Catholic Church', type: 'Church', lat: 6.5964, lng: 3.3515 },
        { id: '3', name: 'Ikeja Grammar School', type: 'School', lat: 6.5890, lng: 3.3441 },
        { id: '4', name: 'Ikeja Market', type: 'Market', lat: 6.5955, lng: 3.3472 },
        { id: '5', name: 'Allen Avenue', type: 'Major Road', lat: 6.5878, lng: 3.3674 },
        { id: '6', name: 'Murtala Muhammed Airport', type: 'Airport', lat: 6.5777, lng: 3.3211 },
        { id: '7', name: 'National Stadium Lagos', type: 'Stadium', lat: 6.5244, lng: 3.3792 },
        { id: '8', name: 'University of Lagos', type: 'University', lat: 6.5158, lng: 3.3974 }
      ];
      
      const landmarksWithDistance = mockLandmarks
        .map(landmark => ({
          ...landmark,
          distance: this.calculateDistance(latitude, longitude, landmark.lat, landmark.lng)
        }))
        .filter(landmark => landmark.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit)
        .map(landmark => ({
          id: landmark.id,
          name: landmark.name,
          type: landmark.type,
          distance: Math.round(landmark.distance * 100) / 100, // Round to 2 decimal places
          address: `${landmark.name}, Lagos, Nigeria`
        }));
      
      logPerformance('discoverNearbyLandmarks', startTime);
      
      return {
        success: true,
        landmarks: landmarksWithDistance
      };
    } catch (error: any) {
      logPerformance('discoverNearbyLandmarks', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
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