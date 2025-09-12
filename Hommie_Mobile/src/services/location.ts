// MeCabal Location Services
// Nigerian estates/compounds location verification and management

import { supabase, handleSupabaseError, logPerformance } from './supabase';
import * as Location from 'expo-location';
import { GooglePlacesService } from './googlePlaces';
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

        // === ALIMOSHO LGA NEIGHBORHOODS ===
        {
          id: 'abesan-estate',
          name: 'Abesan Estate',
          state_name: 'Lagos',
          type: 'estate' as const,
          center: { latitude: 6.620, longitude: 3.260 },
          radius_km: 2.0, // Increased from 1.5km
          member_count: 234,
          recent_posts_count: 8
        },
        {
          id: 'abule-egba',
          name: 'Abule Egba',
          state_name: 'Lagos',
          type: 'traditional_area' as const,
          center: { latitude: 6.680, longitude: 3.280 },
          radius_km: 3.0,
          member_count: 567,
          recent_posts_count: 15
        },
        {
          id: 'ipaja',
          name: 'Ipaja',
          state_name: 'Lagos',
          type: 'traditional_area' as const,
          center: { latitude: 6.620, longitude: 3.290 },
          radius_km: 2.8,
          member_count: 445,
          recent_posts_count: 12
        },
        {
          id: 'ayobo',
          name: 'Ayobo',
          state_name: 'Lagos',
          type: 'traditional_area' as const,
          center: { latitude: 6.640, longitude: 3.270 },
          radius_km: 2.5,
          member_count: 389,
          recent_posts_count: 10
        },
        {
          id: 'iyana-ipaja',
          name: 'Iyana Ipaja',
          state_name: 'Lagos',
          type: 'transport_hub' as const,
          center: { latitude: 6.610, longitude: 3.300 },
          radius_km: 2.5,
          member_count: 512,
          recent_posts_count: 18
        },
        {
          id: 'egbeda',
          name: 'Egbeda',
          state_name: 'Lagos',
          type: 'traditional_area' as const,
          center: { latitude: 6.580, longitude: 3.320 },
          radius_km: 2.2,
          member_count: 423,
          recent_posts_count: 11
        },
        {
          id: 'idimu',
          name: 'Idimu',
          state_name: 'Lagos',
          type: 'traditional_area' as const,
          center: { latitude: 6.590, longitude: 3.310 },
          radius_km: 2.0,
          member_count: 356,
          recent_posts_count: 9
        },
        {
          id: 'ikotun',
          name: 'Ikotun',
          state_name: 'Lagos',
          type: 'traditional_area' as const,
          center: { latitude: 6.570, longitude: 3.290 },
          radius_km: 2.5,
          member_count: 478,
          recent_posts_count: 13
        },
        {
          id: 'egbe',
          name: 'Egbe',
          state_name: 'Lagos',
          type: 'traditional_area' as const,
          center: { latitude: 6.54, longitude: 3.29 }, // Adjusted coordinates
          radius_km: 1.5, // Increased radius
          member_count: 312,
          recent_posts_count: 7
        },
        {
          id: 'igando',
          name: 'Igando',
          state_name: 'Lagos',
          type: 'traditional_area' as const,
          center: { latitude: 6.550, longitude: 3.270 },
          radius_km: 2.2,
          member_count: 389,
          recent_posts_count: 10
        },

        // === OSHODI-ISOLO LGA ===
        {
          id: 'oshodi',
          name: 'Oshodi',
          state_name: 'Lagos',
          type: 'transport_hub' as const,
          center: { latitude: 6.550, longitude: 3.307 },
          radius_km: 2.5,
          member_count: 634,
          recent_posts_count: 19
        },
        {
          id: 'isolo',
          name: 'Isolo',
          state_name: 'Lagos',
          type: 'traditional_area' as const,
          center: { latitude: 6.540, longitude: 3.320 },
          radius_km: 2.0,
          member_count: 456,
          recent_posts_count: 12
        },
        {
          id: 'mushin-oshodi',
          name: 'Mushin-Oshodi',
          state_name: 'Lagos',
          type: 'traditional_area' as const,
          center: { latitude: 6.530, longitude: 3.330 },
          radius_km: 2.8,
          member_count: 523,
          recent_posts_count: 14
        },

        // === SHOMOLU LGA ===
        {
          id: 'shomolu',
          name: 'Shomolu',
          state_name: 'Lagos',
          type: 'traditional_area' as const,
          center: { latitude: 6.540, longitude: 3.380 },
          radius_km: 2.5,
          member_count: 445,
          recent_posts_count: 11
        },
        {
          id: 'bariga',
          name: 'Bariga',
          state_name: 'Lagos',
          type: 'traditional_area' as const,
          center: { latitude: 6.520, longitude: 3.390 },
          radius_km: 2.2,
          member_count: 378,
          recent_posts_count: 9
        },
        {
          id: 'sabon-gari',
          name: 'Sabon Gari',
          state_name: 'Lagos',
          type: 'traditional_area' as const,
          center: { latitude: 6.550, longitude: 3.370 },
          radius_km: 1.8,
          member_count: 312,
          recent_posts_count: 8
        },

        // === KOSOFE LGA ===
        {
          id: 'ikorodu-road',
          name: 'Ikorodu Road Area',
          state_name: 'Lagos',
          type: 'road_based' as const,
          center: { latitude: 6.580, longitude: 3.400 },
          radius_km: 3.0,
          member_count: 567,
          recent_posts_count: 16
        },
        {
          id: 'ogudu',
          name: 'Ogudu',
          state_name: 'Lagos',
          type: 'traditional_area' as const,
          center: { latitude: 6.570, longitude: 3.420 },
          radius_km: 2.0,
          member_count: 389,
          recent_posts_count: 10
        },
        {
          id: 'oworonshoki',
          name: 'Oworonshoki',
          state_name: 'Lagos',
          type: 'traditional_area' as const,
          center: { latitude: 6.540, longitude: 3.410 },
          radius_km: 2.5,
          member_count: 456,
          recent_posts_count: 13
        },

        // === IKORODU LGA ===
        {
          id: 'ikorodu-main',
          name: 'Ikorodu',
          state_name: 'Lagos',
          type: 'traditional_area' as const,
          center: { latitude: 6.620, longitude: 3.500 },
          radius_km: 4.0,
          member_count: 789,
          recent_posts_count: 22
        },
        {
          id: 'sagamu-road',
          name: 'Sagamu Road Area',
          state_name: 'Lagos',
          type: 'road_based' as const,
          center: { latitude: 6.600, longitude: 3.480 },
          radius_km: 2.5,
          member_count: 423,
          recent_posts_count: 11
        },
        {
          id: 'itokin',
          name: 'Itokin',
          state_name: 'Lagos',
          type: 'traditional_area' as const,
          center: { latitude: 6.650, longitude: 3.520 },
          radius_km: 2.0,
          member_count: 312,
          recent_posts_count: 8
        },

        // === BADAGRY LGA ===
        {
          id: 'badagry-main',
          name: 'Badagry',
          state_name: 'Lagos',
          type: 'traditional_area' as const,
          center: { latitude: 6.420, longitude: 2.880 },
          radius_km: 3.5,
          member_count: 456,
          recent_posts_count: 12
        },
        {
          id: 'ajara',
          name: 'Ajara',
          state_name: 'Lagos',
          type: 'traditional_area' as const,
          center: { latitude: 6.400, longitude: 2.900 },
          radius_km: 2.0,
          member_count: 289,
          recent_posts_count: 7
        },
        {
          id: 'seme-border',
          name: 'Seme Border Area',
          state_name: 'Lagos',
          type: 'landmark_based' as const,
          center: { latitude: 6.380, longitude: 2.850 },
          radius_km: 2.5,
          member_count: 234,
          recent_posts_count: 6
        },

        // === EPE LGA ===
        {
          id: 'epe-main',
          name: 'Epe',
          state_name: 'Lagos',
          type: 'traditional_area' as const,
          center: { latitude: 6.580, longitude: 3.980 },
          radius_km: 3.0,
          member_count: 345,
          recent_posts_count: 9
        },
        {
          id: 'lekki-epe',
          name: 'Lekki-Epe Expressway',
          state_name: 'Lagos',
          type: 'road_based' as const,
          center: { latitude: 6.450, longitude: 3.750 },
          radius_km: 4.0,
          member_count: 567,
          recent_posts_count: 18
        },
        {
          id: 'ibejue',
          name: 'Ibeju',
          state_name: 'Lagos',
          type: 'traditional_area' as const,
          center: { latitude: 6.420, longitude: 3.850 },
          radius_km: 2.5,
          member_count: 234,
          recent_posts_count: 6
        },

        // === IBEJU-LEKKI LGA ===
        {
          id: 'lekki-phase2',
          name: 'Lekki Phase 2',
          state_name: 'Lagos',
          type: 'estate' as const,
          center: { latitude: 6.440, longitude: 3.580 },
          radius_km: 2.0,
          member_count: 423,
          recent_posts_count: 14
        },
        {
          id: 'ajah',
          name: 'Ajah',
          state_name: 'Lagos',
          type: 'traditional_area' as const,
          center: { latitude: 6.460, longitude: 3.620 },
          radius_km: 3.0,
          member_count: 567,
          recent_posts_count: 16
        },
        {
          id: 'sangotedo',
          name: 'Sangotedo',
          state_name: 'Lagos',
          type: 'traditional_area' as const,
          center: { latitude: 6.480, longitude: 3.650 },
          radius_km: 2.5,
          member_count: 389,
          recent_posts_count: 11
        },
        {
          id: 'abijo',
          name: 'Abijo',
          state_name: 'Lagos',
          type: 'traditional_area' as const,
          center: { latitude: 6.500, longitude: 3.680 },
          radius_km: 2.0,
          member_count: 312,
          recent_posts_count: 8
        },
        {
          id: 'ikate',
          name: 'Ikate',
          state_name: 'Lagos',
          type: 'traditional_area' as const,
          center: { latitude: 6.420, longitude: 3.600 },
          radius_km: 1.8,
          member_count: 267,
          recent_posts_count: 7
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

  // Discover real landmarks and businesses near a location using Google Places API with timeout and fallback
  static async discoverNearbyLandmarks(
    latitude: number,
    longitude: number,
    radius: number = 2000 // Reduced from 5000 for faster response
  ): Promise<{
    success: boolean;
    data?: {
      landmarks: any[];
      businesses: any[];
      total_found: number;
    };
    error?: string;
  }> {
    const startTime = Date.now();
    const maxTimeout = 3000; // 3 second timeout
    
    console.log(`🔍 [LANDMARK DEBUG] Starting landmark discovery at ${latitude}, ${longitude} with ${radius}m radius`);
    
    try {
      // Validate input parameters
      if (typeof latitude !== 'number' || typeof longitude !== 'number' || 
          isNaN(latitude) || isNaN(longitude)) {
        return {
          success: false,
          error: 'Invalid coordinates provided for landmark discovery'
        };
      }
      
      // Create a promise with timeout
      const landmarkDiscovery = Promise.race([
        // Main discovery process
        this.performLandmarkDiscovery(latitude, longitude, radius),
        
        // Timeout promise
        new Promise<{ success: false; error: string }>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Landmark discovery timeout after ${maxTimeout}ms`));
          }, maxTimeout);
        })
      ]);
      
      const result = await landmarkDiscovery;
      
      logPerformance('discoverNearbyLandmarks', startTime);
      console.log(`🔍 [LANDMARK DEBUG] Discovery completed in ${Date.now() - startTime}ms`);
      
      return result;
    } catch (error: any) {
      logPerformance('discoverNearbyLandmarks', startTime);
      console.warn(`🔍 [LANDMARK DEBUG] Discovery failed in ${Date.now() - startTime}ms:`, error.message);
      
      // Return fallback landmarks for common Nigerian areas
      const fallbackLandmarks = this.getFallbackLandmarks(latitude, longitude, radius / 1000);
      
      return {
        success: true, // Still return success with fallback
        data: {
          landmarks: fallbackLandmarks,
          businesses: [],
          total_found: fallbackLandmarks.length
        },
        error: `Using fallback landmarks due to: ${error.message}`
      };
    }
  }
  
  // Separate method for the actual discovery process
  private static async performLandmarkDiscovery(
    latitude: number,
    longitude: number,
    radius: number
  ): Promise<{
    success: boolean;
    data?: {
      landmarks: any[];
      businesses: any[];
      total_found: number;
    };
    error?: string;
  }> {
    try {
      // Try to get landmarks first (faster than getting both in parallel)
      const landmarksResult = await GooglePlacesService.findNigerianLandmarks(latitude, longitude, radius);
      
      let businessesResult = { success: true, data: [] as any[] };
      
      // Only get businesses if landmarks were successful and we have time
      if (landmarksResult.success) {
        try {
          businessesResult = await GooglePlacesService.findNigerianBusinesses(latitude, longitude, undefined, radius);
        } catch (error) {
          console.warn('Business discovery failed, continuing with landmarks only:', error);
        }
      }

      if (!landmarksResult.success && !businessesResult.success) {
        return {
          success: false,
          error: landmarksResult.error || 'Failed to discover landmarks'
        };
      }

      const landmarks = landmarksResult.data || [];
      const businesses = businessesResult.data || [];

      // Process and format the results (simplified for performance)
      const processedLandmarks = landmarks.slice(0, 10).map(place => ({
        id: place.place_id,
        name: place.name,
        address: place.formatted_address || place.vicinity,
        coordinates: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng
        },
        types: place.types?.[0] || 'establishment',
        rating: place.rating
      }));

      const processedBusinesses = businesses.slice(0, 5).map(place => ({
        id: place.place_id,
        name: place.name,
        address: place.formatted_address || place.vicinity,
        coordinates: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng
        },
        types: place.types?.[0] || 'establishment',
        rating: place.rating,
        business_status: place.business_status
      }));

      return {
        success: true,
        data: {
          landmarks: processedLandmarks,
          businesses: processedBusinesses,
          total_found: processedLandmarks.length + processedBusinesses.length
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Discovery failed'
      };
    }
  }
  
  // Fallback landmarks for common Nigerian locations
  private static getFallbackLandmarks(
    latitude: number,
    longitude: number,
    radiusKm: number
  ): any[] {
    const commonLandmarks = [
      { name: 'Ikeja City Mall', type: 'Shopping Center', lat: 6.6018, lng: 3.3515 },
      { name: 'Murtala Muhammed Airport', type: 'Airport', lat: 6.5777, lng: 3.3211 },
      { name: 'National Stadium Lagos', type: 'Stadium', lat: 6.5244, lng: 3.3792 },
      { name: 'University of Lagos', type: 'University', lat: 6.5158, lng: 3.3974 },
      { name: 'Victoria Island', type: 'Area', lat: 6.430, lng: 3.415 },
      { name: 'Computer Village', type: 'Market', lat: 6.600, lng: 3.348 },
      { name: 'Alaba Market', type: 'Market', lat: 6.447, lng: 3.180 }
    ];
    
    return commonLandmarks
      .map(landmark => ({
        ...landmark,
        distance: this.calculateDistance(latitude, longitude, landmark.lat, landmark.lng)
      }))
      .filter(landmark => landmark.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5)
      .map(landmark => ({
        id: `fallback-${landmark.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: landmark.name,
        address: `${landmark.name}, Lagos, Nigeria`,
        coordinates: {
          latitude: landmark.lat,
          longitude: landmark.lng
        },
        types: landmark.type,
        rating: null,
        distance: Math.round(landmark.distance * 100) / 100
      }));
  }

  // Get detailed information about a specific place
  static async getPlaceDetails(
    placeId: string
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const result = await GooglePlacesService.getPlaceDetails(placeId);
      
      logPerformance('getPlaceDetails', startTime);

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to get place details'
        };
      }

      const place = result.data;
      if (!place) {
        return {
          success: false,
          error: 'Place not found'
        };
      }

      // Format the place data for Nigerian context
      const formattedPlace = {
        id: place.place_id,
        name: place.name,
        address: GooglePlacesService.formatNigerianAddress(place),
        coordinates: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng
        },
        types: place.types,
        rating: place.rating,
        price_level: place.price_level,
        vicinity: place.vicinity,
        business_status: place.business_status,
        opening_hours: place.opening_hours ? {
          open_now: place.opening_hours.open_now,
          hours: GooglePlacesService.getNigerianBusinessHours(place)
        } : null,
        website: place.website,
        phone: place.international_phone_number,
        reviews: place.reviews?.map(review => ({
          author: review.author_name,
          rating: review.rating,
          text: review.text,
          time: new Date(review.time * 1000).toISOString()
        })),
        photos: place.photos?.map(photo => ({
          reference: photo.photo_reference,
          url: GooglePlacesService.getPlacePhotoUrl(photo.photo_reference),
          width: photo.width,
          height: photo.height
        }))
      };

      return {
        success: true,
        data: formattedPlace
      };
    } catch (error: any) {
      logPerformance('getPlaceDetails', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  // Find the closest neighborhood to a set of landmarks
  static async findNeighborhoodFromLandmarks(
    latitude: number,
    longitude: number,
    landmarks: any[]
  ): Promise<{
    success: boolean;
    data?: {
      neighborhood: Neighborhood;
      confidence: number;
      landmark_matches: number;
    };
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      // Get all neighborhoods
      const { data: neighborhoods, error } = await supabase
        .from('neighborhoods')
        .select('*');

      if (error) {
        return {
          success: false,
          error: handleSupabaseError(error)
        };
      }

      if (!neighborhoods || neighborhoods.length === 0) {
        return {
          success: false,
          error: 'No neighborhoods found'
        };
      }

      // Calculate confidence scores for each neighborhood based on landmark proximity
      const neighborhoodScores = neighborhoods.map(neighborhood => {
        let totalScore = 0;
        let landmarkMatches = 0;

        landmarks.forEach(landmark => {
          const distance = this.calculateDistance(
            latitude,
            longitude,
            neighborhood.center.latitude,
            neighborhood.center.longitude
          );

          // If landmark is within neighborhood radius, add to score
          if (distance <= neighborhood.radius_km) {
            const landmarkDistance = this.calculateDistance(
              landmark.coordinates.latitude,
              landmark.coordinates.longitude,
              neighborhood.center.latitude,
              neighborhood.center.longitude
            );

            if (landmarkDistance <= neighborhood.radius_km) {
              landmarkMatches++;
              // Higher score for closer landmarks
              totalScore += (neighborhood.radius_km - landmarkDistance) / neighborhood.radius_km;
            }
          }
        });

        return {
          neighborhood,
          score: totalScore,
          landmark_matches: landmarkMatches
        };
      });

      // Sort by score and landmark matches
      neighborhoodScores.sort((a, b) => {
        if (b.landmark_matches !== a.landmark_matches) {
          return b.landmark_matches - a.landmark_matches;
        }
        return b.score - a.score;
      });

      const bestMatch = neighborhoodScores[0];
      const confidence = Math.min(bestMatch.score / landmarks.length, 1);

      logPerformance('findNeighborhoodFromLandmarks', startTime);

      return {
        success: true,
        data: {
          neighborhood: bestMatch.neighborhood,
          confidence,
          landmark_matches: bestMatch.landmark_matches
        }
      };
    } catch (error: any) {
      logPerformance('findNeighborhoodFromLandmarks', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }
}