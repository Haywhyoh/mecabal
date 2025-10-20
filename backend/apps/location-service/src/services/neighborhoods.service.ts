import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Neighborhood, NeighborhoodType } from '@app/database/entities';
import { CreateNeighborhoodDto, UpdateNeighborhoodDto, NeighborhoodSearchDto } from '../dto/neighborhood.dto';
import { GoogleMapsService } from '@app/common/services/google-maps.service';

@Injectable()
export class NeighborhoodsService {
  constructor(
    @InjectRepository(Neighborhood)
    private readonly neighborhoodRepository: Repository<Neighborhood>,
    private readonly googleMapsService: GoogleMapsService,
  ) {}

  async getNeighborhoodsByWard(
    wardId: string,
    filters?: {
      type?: NeighborhoodType;
      isGated?: boolean;
      includeSubNeighborhoods?: boolean;
    }
  ): Promise<Neighborhood[]> {
    const query = this.neighborhoodRepository
      .createQueryBuilder('neighborhood')
      .leftJoinAndSelect('neighborhood.ward', 'ward')
      .leftJoinAndSelect('ward.lga', 'lga')
      .leftJoinAndSelect('lga.state', 'state')
      .where('neighborhood.wardId = :wardId', { wardId })
      .orderBy('neighborhood.name', 'ASC');

    if (filters?.type) {
      query.andWhere('neighborhood.type = :type', { type: filters.type });
    }

    if (filters?.isGated !== undefined) {
      query.andWhere('neighborhood.isGated = :isGated', { isGated: filters.isGated });
    }

    if (filters?.includeSubNeighborhoods) {
      query.leftJoinAndSelect('neighborhood.subNeighborhoods', 'subNeighborhoods');
    }

    return query.getMany();
  }

  async getNeighborhoodById(id: string): Promise<Neighborhood> {
    const neighborhood = await this.neighborhoodRepository.findOne({
      where: { id },
      relations: [
        'ward',
        'ward.lga',
        'ward.lga.state',
        'parentNeighborhood',
        'subNeighborhoods',
        'landmarks',
      ],
    });

    if (!neighborhood) {
      throw new Error(`Neighborhood with ID ${id} not found`);
    }

    return neighborhood;
  }

  async searchNeighborhoods(searchDto: NeighborhoodSearchDto): Promise<{
    data: Neighborhood[];
    total: number;
  }> {
    const query = this.neighborhoodRepository
      .createQueryBuilder('neighborhood')
      .leftJoinAndSelect('neighborhood.ward', 'ward')
      .leftJoinAndSelect('ward.lga', 'lga')
      .leftJoinAndSelect('lga.state', 'state')
      .where('LOWER(neighborhood.name) LIKE LOWER(:query)', { query: `%${searchDto.query}%` })
      .orderBy('neighborhood.name', 'ASC');

    if (searchDto.stateId) {
      query.andWhere('state.id = :stateId', { stateId: searchDto.stateId });
    }

    if (searchDto.lgaId) {
      query.andWhere('lga.id = :lgaId', { lgaId: searchDto.lgaId });
    }

    if (searchDto.type) {
      query.andWhere('neighborhood.type = :type', { type: searchDto.type });
    }

    if (searchDto.isGated !== undefined) {
      query.andWhere('neighborhood.isGated = :isGated', { isGated: searchDto.isGated });
    }

    const [data, total] = await query
      .skip(searchDto.offset || 0)
      .take(searchDto.limit || 20)
      .getManyAndCount();

    return { data, total };
  }

  async recommendNeighborhoods(
    latitude: number,
    longitude: number,
    radius: number = 2000,
    limit: number = 10
  ): Promise<{
    detectedLocation: any;
    recommendations: Array<{
      neighborhood: Neighborhood;
      distance: number;
      landmarks: any[];
      memberCount: number;
    }>;
  }> {
    console.log('Starting neighborhood recommendations for:', { latitude, longitude, radius, limit });
    
    // Get administrative area information (with fallback if Google Maps is not available)
    let detectedLocation = null;
    try {
      detectedLocation = await this.googleMapsService.getAdministrativeArea(latitude, longitude);
      console.log('Google Maps detected location:', detectedLocation);
    } catch (error) {
      console.warn('Google Maps service unavailable, using fallback location detection:', error);
      // Fallback: return basic location info
      detectedLocation = {
        state: 'Unknown',
        lga: 'Unknown',
        city: 'Unknown',
      };
    }

    // Find neighborhoods within radius using PostGIS
    let neighborhoods: Neighborhood[] = [];
    try {
      console.log('Attempting PostGIS query for neighborhoods...');
      neighborhoods = await this.neighborhoodRepository
        .createQueryBuilder('neighborhood')
        .leftJoinAndSelect('neighborhood.ward', 'ward')
        .leftJoinAndSelect('ward.lga', 'lga')
        .leftJoinAndSelect('lga.state', 'state')
        .leftJoinAndSelect('neighborhood.landmarks', 'landmarks')
        .where(
          'ST_DWithin(neighborhood.boundaries, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), :radius)',
          { lng: longitude, lat: latitude, radius }
        )
        .orderBy('ST_Distance(neighborhood.boundaries, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))', 'ASC')
        .limit(limit)
        .getMany();
      console.log('PostGIS query successful, found', neighborhoods.length, 'neighborhoods');
    } catch (error) {
      console.warn('PostGIS query failed, falling back to basic neighborhood search:', error);
      // Fallback: get all neighborhoods without PostGIS spatial query
      try {
        neighborhoods = await this.neighborhoodRepository
          .createQueryBuilder('neighborhood')
          .leftJoinAndSelect('neighborhood.ward', 'ward')
          .leftJoinAndSelect('ward.lga', 'lga')
          .leftJoinAndSelect('lga.state', 'state')
          .leftJoinAndSelect('neighborhood.landmarks', 'landmarks')
          .limit(limit)
          .getMany();
        console.log('Fallback query successful, found', neighborhoods.length, 'neighborhoods');
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        neighborhoods = [];
      }
    }

    // Calculate distances and prepare recommendations
    const recommendations = neighborhoods.map(neighborhood => {
      // Calculate distance (simplified - in real implementation, use PostGIS)
      const distance = this.calculateDistance(
        latitude,
        longitude,
        neighborhood.boundaries?.coordinates?.[0]?.[0]?.[1] || 0,
        neighborhood.boundaries?.coordinates?.[0]?.[0]?.[0] || 0
      );

      return {
        neighborhood,
        distance,
        landmarks: neighborhood.landmarks || [],
        memberCount: 0, // This would come from user count query
      };
    });

    return {
      detectedLocation: detectedLocation || {
        state: 'Lagos',
        lga: 'Eti-Osa',
        city: 'Lagos',
      },
      recommendations: recommendations || [],
    };
  }

  async createNeighborhood(createDto: CreateNeighborhoodDto): Promise<Neighborhood> {
    const neighborhood = this.neighborhoodRepository.create(createDto);
    return this.neighborhoodRepository.save(neighborhood);
  }

  async updateNeighborhood(id: string, updateDto: UpdateNeighborhoodDto): Promise<Neighborhood> {
    const neighborhood = await this.getNeighborhoodById(id);
    Object.assign(neighborhood, updateDto);
    return this.neighborhoodRepository.save(neighborhood);
  }

  async deleteNeighborhood(id: string): Promise<void> {
    const neighborhood = await this.getNeighborhoodById(id);
    await this.neighborhoodRepository.remove(neighborhood);
  }

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

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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
}
