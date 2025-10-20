import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Neighborhood, User, UserLocation } from '@app/database/entities';
import { GoogleMapsService } from '@app/common/services/google-maps.service';

export interface NeighborhoodRecommendation {
  neighborhood: Neighborhood;
  distance: number; // in meters
  score: number; // 0-1 recommendation score
  reasons: string[]; // why this neighborhood was recommended
  landmarks: any[]; // nearby landmarks
  memberCount: number;
}

export interface RecommendationFilters {
  maxDistance?: number; // meters
  types?: string[]; // neighborhood types
  isGated?: boolean;
  requiresVerification?: boolean;
  minMemberCount?: number;
  maxMemberCount?: number;
}

@Injectable()
export class NeighborhoodRecommendationService {
  constructor(
    @InjectRepository(Neighborhood)
    private readonly neighborhoodRepository: Repository<Neighborhood>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserLocation)
    private readonly userLocationRepository: Repository<UserLocation>,
    private readonly googleMapsService: GoogleMapsService,
  ) {}

  /**
   * Recommend neighborhoods based on GPS coordinates
   */
  async recommendByCoordinates(
    latitude: number,
    longitude: number,
    filters?: RecommendationFilters
  ): Promise<NeighborhoodRecommendation[]> {
    const maxDistance = filters?.maxDistance || 5000; // 5km default
    const limit = 20;

    // Get nearby neighborhoods using PostGIS
    const neighborhoods = await this.neighborhoodRepository
      .createQueryBuilder('neighborhood')
      .leftJoinAndSelect('neighborhood.ward', 'ward')
      .leftJoinAndSelect('ward.lga', 'lga')
      .leftJoinAndSelect('lga.state', 'state')
      .leftJoinAndSelect('neighborhood.landmarks', 'landmarks')
      .where(
        'ST_DWithin(neighborhood.boundaries, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), :maxDistance)',
        { lng: longitude, lat: latitude, maxDistance }
      )
      .orderBy('ST_Distance(neighborhood.boundaries, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))', 'ASC')
      .limit(limit)
      .getMany();

    // Apply additional filters
    let filteredNeighborhoods = neighborhoods;

    if (filters?.types && filters.types.length > 0) {
      filteredNeighborhoods = filteredNeighborhoods.filter(n => 
        filters.types!.includes(n.type)
      );
    }

    if (filters?.isGated !== undefined) {
      filteredNeighborhoods = filteredNeighborhoods.filter(n => 
        n.isGated === filters.isGated
      );
    }

    if (filters?.requiresVerification !== undefined) {
      filteredNeighborhoods = filteredNeighborhoods.filter(n => 
        n.requiresVerification === filters.requiresVerification
      );
    }

    // Generate recommendations with scoring
    const recommendations = await Promise.all(
      filteredNeighborhoods.map(async (neighborhood) => {
        const center = this.getNeighborhoodCenter(neighborhood);
        const distance = this.calculateDistance(
          latitude,
          longitude,
          center.lat,
          center.lng
        );

        const score = await this.calculateRecommendationScore(
          neighborhood,
          latitude,
          longitude,
          distance
        );

        const reasons = this.generateRecommendationReasons(
          neighborhood,
          distance,
          score
        );

        const memberCount = await this.getNeighborhoodMemberCount(neighborhood.id);

        return {
          neighborhood,
          distance,
          score,
          reasons,
          landmarks: neighborhood.landmarks || [],
          memberCount,
        };
      })
    );

    // Sort by score (highest first)
    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Get neighborhoods within a specific radius
   */
  async getNeighborhoodsInRadius(
    latitude: number,
    longitude: number,
    radius: number
  ): Promise<Neighborhood[]> {
    return this.neighborhoodRepository
      .createQueryBuilder('neighborhood')
      .leftJoinAndSelect('neighborhood.ward', 'ward')
      .leftJoinAndSelect('ward.lga', 'lga')
      .leftJoinAndSelect('lga.state', 'state')
      .where(
        'ST_DWithin(neighborhood.boundaries, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), :radius)',
        { lng: longitude, lat: latitude, radius }
      )
      .orderBy('ST_Distance(neighborhood.boundaries, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))', 'ASC')
      .getMany();
  }

  /**
   * Search neighborhoods with full-text search
   */
  async searchNeighborhoods(
    query: string,
    filters?: {
      stateId?: string;
      lgaId?: string;
      wardId?: string;
      types?: string[];
      isGated?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ data: Neighborhood[]; total: number }> {
    const searchQuery = this.neighborhoodRepository
      .createQueryBuilder('neighborhood')
      .leftJoinAndSelect('neighborhood.ward', 'ward')
      .leftJoinAndSelect('ward.lga', 'lga')
      .leftJoinAndSelect('lga.state', 'state')
      .leftJoinAndSelect('neighborhood.landmarks', 'landmarks')
      .where('LOWER(neighborhood.name) LIKE LOWER(:query)', { query: `%${query}%` })
      .orWhere('LOWER(neighborhood.description) LIKE LOWER(:query)', { query: `%${query}%` })
      .orderBy('neighborhood.name', 'ASC');

    if (filters?.stateId) {
      searchQuery.andWhere('state.id = :stateId', { stateId: filters.stateId });
    }

    if (filters?.lgaId) {
      searchQuery.andWhere('lga.id = :lgaId', { lgaId: filters.lgaId });
    }

    if (filters?.wardId) {
      searchQuery.andWhere('ward.id = :wardId', { wardId: filters.wardId });
    }

    if (filters?.types && filters.types.length > 0) {
      searchQuery.andWhere('neighborhood.type IN (:...types)', { types: filters.types });
    }

    if (filters?.isGated !== undefined) {
      searchQuery.andWhere('neighborhood.isGated = :isGated', { isGated: filters.isGated });
    }

    const [data, total] = await searchQuery
      .skip(filters?.offset || 0)
      .take(filters?.limit || 20)
      .getManyAndCount();

    return { data, total };
  }

  /**
   * Get personalized neighborhood suggestions for a user
   */
  async getUserNeighborhoodSuggestions(userId: string): Promise<NeighborhoodRecommendation[]> {
    // Get user's current location
    const userLocation = await this.userLocationRepository.findOne({
      where: { userId, isPrimary: true },
      relations: ['neighborhood', 'ward', 'lga', 'state'],
    });

    if (!userLocation) {
      return [];
    }

    // Get user's preferences (this would come from user profile)
    const userPreferences = await this.getUserLocationPreferences(userId);

    // Get nearby neighborhoods
    const recommendations = await this.recommendByCoordinates(
      userLocation.coordinates.coordinates[1], // latitude
      userLocation.coordinates.coordinates[0], // longitude
      {
        maxDistance: userPreferences.maxDistance || 10000,
        types: userPreferences.preferredTypes,
        isGated: userPreferences.preferGated,
      }
    );

    // Filter out user's current neighborhood
    return recommendations.filter(
      rec => rec.neighborhood.id !== userLocation.neighborhoodId
    );
  }

  /**
   * Get trending neighborhoods (most active)
   */
  async getTrendingNeighborhoods(limit: number = 10): Promise<Neighborhood[]> {
    // This would typically be based on recent activity, member count, etc.
    // For now, we'll return neighborhoods with the most landmarks
    return this.neighborhoodRepository
      .createQueryBuilder('neighborhood')
      .leftJoinAndSelect('neighborhood.ward', 'ward')
      .leftJoinAndSelect('ward.lga', 'lga')
      .leftJoinAndSelect('lga.state', 'state')
      .leftJoin('neighborhood.landmarks', 'landmarks')
      .groupBy('neighborhood.id')
      .addGroupBy('ward.id')
      .addGroupBy('lga.id')
      .addGroupBy('state.id')
      .addSelect('COUNT(landmarks.id)', 'landmarkCount')
      .orderBy('landmarkCount', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Get similar neighborhoods to a given neighborhood
   */
  async getSimilarNeighborhoods(
    neighborhoodId: string,
    limit: number = 5
  ): Promise<Neighborhood[]> {
    const neighborhood = await this.neighborhoodRepository.findOne({
      where: { id: neighborhoodId },
      relations: ['ward', 'ward.lga'],
    });

    if (!neighborhood) {
      return [];
    }

    return this.neighborhoodRepository
      .createQueryBuilder('neighborhood')
      .leftJoinAndSelect('neighborhood.ward', 'ward')
      .leftJoinAndSelect('ward.lga', 'lga')
      .leftJoinAndSelect('lga.state', 'state')
      .where('neighborhood.id != :neighborhoodId', { neighborhoodId })
      .andWhere('neighborhood.type = :type', { type: neighborhood.type })
      .andWhere('neighborhood.isGated = :isGated', { isGated: neighborhood.isGated })
      .andWhere('ward.lgaId = :lgaId', { lgaId: neighborhood.ward?.lgaId })
      .orderBy('neighborhood.name', 'ASC')
      .limit(limit)
      .getMany();
  }

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

  private getNeighborhoodCenter(neighborhood: Neighborhood): { lat: number; lng: number } {
    // If boundaries exist, calculate center
    if (neighborhood.boundaries?.coordinates?.[0]) {
      const coords = neighborhood.boundaries.coordinates[0];
      const lngSum = coords.reduce((sum: number, coord: number[]) => sum + coord[0], 0);
      const latSum = coords.reduce((sum: number, coord: number[]) => sum + coord[1], 0);
      return {
        lat: latSum / coords.length,
        lng: lngSum / coords.length,
      };
    }

    // Fallback to a default location
    return { lat: 6.5244, lng: 3.3792 }; // Lagos center
  }

  private async calculateRecommendationScore(
    neighborhood: Neighborhood,
    userLat: number,
    userLng: number,
    distance: number
  ): Promise<number> {
    let score = 0;

    // Distance factor (closer is better)
    const maxDistance = 10000; // 10km
    const distanceScore = Math.max(0, 1 - (distance / maxDistance));
    score += distanceScore * 0.4;

    // Landmark factor (more landmarks is better)
    const landmarkCount = neighborhood.landmarks?.length || 0;
    const landmarkScore = Math.min(1, landmarkCount / 10); // Normalize to 0-1
    score += landmarkScore * 0.2;

    // Type factor (estates might be preferred)
    if (neighborhood.type === 'ESTATE') {
      score += 0.2;
    }

    // Member count factor (more members might indicate popularity)
    const memberCount = await this.getNeighborhoodMemberCount(neighborhood.id);
    const memberScore = Math.min(1, memberCount / 1000); // Normalize to 0-1
    score += memberScore * 0.2;

    return Math.min(1, score);
  }

  private generateRecommendationReasons(
    neighborhood: Neighborhood,
    distance: number,
    score: number
  ): string[] {
    const reasons: string[] = [];

    if (distance < 1000) {
      reasons.push('Very close to your location');
    } else if (distance < 3000) {
      reasons.push('Close to your location');
    }

    if (neighborhood.landmarks && neighborhood.landmarks.length > 0) {
      reasons.push(`Has ${neighborhood.landmarks.length} nearby landmarks`);
    }

    if (neighborhood.type === 'ESTATE') {
      reasons.push('Gated community with security');
    }

    if (neighborhood.isGated) {
      reasons.push('Secure gated community');
    }

    if (score > 0.7) {
      reasons.push('Highly recommended based on your preferences');
    }

    return reasons;
  }

  private async getNeighborhoodMemberCount(neighborhoodId: string): Promise<number> {
    // This would query the user-location relationship table
    // For now, return a random number for demonstration
    return Math.floor(Math.random() * 500);
  }

  private async getUserLocationPreferences(userId: string): Promise<{
    maxDistance: number;
    preferredTypes: string[];
    preferGated: boolean;
  }> {
    // This would come from user profile/preferences
    // For now, return default preferences
    return {
      maxDistance: 10000,
      preferredTypes: ['AREA', 'ESTATE', 'COMMUNITY'],
      preferGated: false,
    };
  }
}
