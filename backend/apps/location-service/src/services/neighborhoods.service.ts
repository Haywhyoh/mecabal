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
      // First try a simple query without complex joins to avoid type mismatches
      // Use COALESCE to check both boundaries (Polygon) and center point (Point) for neighborhoods without boundaries
      neighborhoods = await this.neighborhoodRepository
        .createQueryBuilder('neighborhood')
        .where(
          'ST_DWithin(COALESCE(neighborhood.boundaries, ST_SetSRID(ST_MakePoint(neighborhood.center_longitude, neighborhood.center_latitude), 4326)), ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), :radius)',
          { lng: longitude, lat: latitude, radius }
        )
        .orderBy('ST_Distance(COALESCE(neighborhood.boundaries, ST_SetSRID(ST_MakePoint(neighborhood.center_longitude, neighborhood.center_latitude), 4326)), ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))', 'ASC')
        .limit(limit)
        .getMany();
      console.log('PostGIS query successful, found', neighborhoods.length, 'neighborhoods');
      
      // Skip loading relations due to database schema type mismatches (integer vs uuid in lga_id, ward_id)
      // The neighborhoods array already has the basic data needed for recommendations
      console.log('Skipping relation loading due to known database schema type mismatches');
    } catch (error) {
      console.warn('PostGIS query failed, falling back to basic neighborhood search:', error);
      // Fallback: get all neighborhoods without PostGIS spatial query
      // Don't join landmarks to avoid potential type mismatch issues
      try {
        // Don't load relations due to database schema type mismatches
        neighborhoods = await this.neighborhoodRepository
          .createQueryBuilder('neighborhood')
          .limit(limit)
          .getMany();
        console.log('Fallback query successful, found', neighborhoods.length, 'neighborhoods');
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        // Ultimate fallback: return empty array
        neighborhoods = [];
      }
    }

    // Calculate distances and prepare recommendations
    const recommendations = neighborhoods
      .map(neighborhood => {
        // Calculate distance using center coordinates or boundaries
        let targetLat: number = neighborhood.centerLatitude ? Number(neighborhood.centerLatitude) : 0;
        let targetLng: number = neighborhood.centerLongitude ? Number(neighborhood.centerLongitude) : 0;

        // Fallback to boundaries if center coordinates not available
        if (targetLat === 0 || targetLng === 0) {
          targetLat = neighborhood.boundaries?.coordinates?.[0]?.[0]?.[1] || 0;
          targetLng = neighborhood.boundaries?.coordinates?.[0]?.[0]?.[0] || 0;
        }

        const distance = this.calculateDistance(
          latitude,
          longitude,
          targetLat,
          targetLng
        );

        return {
          neighborhood,
          distance,
          landmarks: [], // Landmarks not loaded to avoid type mismatch issues
          memberCount: 0, // This would come from user count query
        };
      })
      // Filter by radius - only return neighborhoods within the specified distance
      .filter(rec => rec.distance <= radius)
      // Sort by distance (closest first)
      .sort((a, b) => a.distance - b.distance)
      // Limit results
      .slice(0, limit);

    console.log(`Filtered to ${recommendations.length} neighborhoods within ${radius}m radius`);

    return {
      detectedLocation: detectedLocation || {
        state: 'Unknown',
        lga: 'Unknown',
        city: 'Unknown',
      },
      recommendations: recommendations || [],
    };
  }

  async createNeighborhood(createDto: CreateNeighborhoodDto): Promise<Neighborhood> {
    // Prepare boundaries for PostGIS
    let boundaries = createDto.boundaries;
    if (boundaries) {
      // Ensure boundaries is a valid GeoJSON Polygon
      if (boundaries.type !== 'Polygon') {
        throw new Error('Boundaries must be a GeoJSON Polygon');
      }
      if (!boundaries.coordinates || !Array.isArray(boundaries.coordinates)) {
        throw new Error('Boundaries must have valid coordinates array');
      }
      // Ensure the polygon ring is closed (first and last points match)
      const ring = boundaries.coordinates[0];
      if (ring && ring.length > 0) {
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          // Close the polygon
          boundaries = {
            ...boundaries,
            coordinates: [[...ring, [first[0], first[1]]]],
          };
        }
      }
    }

    // Create neighborhood with boundaries as GeoJSON string for PostGIS
    const neighborhoodData: any = {
      name: createDto.name,
      type: createDto.type,
      lgaId: createDto.lgaId,
      centerLatitude: createDto.centerLatitude,
      centerLongitude: createDto.centerLongitude,
      radiusMeters: createDto.radiusMeters || 1000,
      isGated: createDto.isGated || false,
      requiresVerification: createDto.requiresVerification || false,
      createdBy: createDto.createdBy,
    };

    if (createDto.wardId) {
      neighborhoodData.wardId = createDto.wardId;
    }
    if (createDto.parentNeighborhoodId) {
      neighborhoodData.parentNeighborhoodId = createDto.parentNeighborhoodId;
    }
    if (createDto.adminUserId) {
      neighborhoodData.adminUserId = createDto.adminUserId;
    }
    if (createDto.description) {
      neighborhoodData.description = createDto.description;
    }

    // Handle boundaries - TypeORM with PostGIS needs GeoJSON as string
    if (boundaries) {
      // Convert GeoJSON object to string for PostGIS
      const geoJsonString = JSON.stringify(boundaries);
      
      // Build columns and values arrays dynamically
      const columns = ['name', 'type', 'lga_id', 'center_latitude', 'center_longitude', 
                      'radius_meters', 'is_gated', 'requires_verification', 'created_by'];
      const placeholders: string[] = [];
      const params: any[] = [
        neighborhoodData.name,
        neighborhoodData.type,
        neighborhoodData.lgaId,
        neighborhoodData.centerLatitude,
        neighborhoodData.centerLongitude,
        neighborhoodData.radiusMeters,
        neighborhoodData.isGated,
        neighborhoodData.requiresVerification,
        neighborhoodData.createdBy,
      ];
      
      let paramIndex = 10;
      if (createDto.wardId) {
        columns.push('ward_id');
        placeholders.push(`$${paramIndex}`);
        params.push(createDto.wardId);
        paramIndex++;
      }
      if (createDto.parentNeighborhoodId) {
        columns.push('parent_neighborhood_id');
        placeholders.push(`$${paramIndex}`);
        params.push(createDto.parentNeighborhoodId);
        paramIndex++;
      }
      if (createDto.adminUserId) {
        columns.push('admin_user_id');
        placeholders.push(`$${paramIndex}`);
        params.push(createDto.adminUserId);
        paramIndex++;
      }
      if (createDto.description) {
        columns.push('description');
        placeholders.push(`$${paramIndex}`);
        params.push(createDto.description);
        paramIndex++;
      }
      
      columns.push('boundaries');
      placeholders.push(`ST_GeomFromGeoJSON($${paramIndex})`);
      params.push(geoJsonString);
      
      const insertQuery = `
        INSERT INTO neighborhoods (${columns.join(', ')})
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, ${placeholders.join(', ')})
        RETURNING id
      `;
      
      try {
        const result = await this.neighborhoodRepository.query(insertQuery, params);
        const newId = result[0]?.id;
        
        if (!newId) {
          throw new Error('Failed to create neighborhood - no ID returned from database');
        }
        
        return this.neighborhoodRepository.findOne({
          where: { id: newId },
          relations: ['lga', 'ward', 'parentNeighborhood'],
        }) as Promise<Neighborhood>;
      } catch (dbError: any) {
        console.error('Database error creating neighborhood:', dbError);
        console.error('Query:', insertQuery);
        console.error('Params:', params);
        
        // Provide more helpful error messages
        if (dbError.code === '23505') { // Unique constraint violation
          throw new Error(`A neighborhood with this name already exists in this LGA`);
        } else if (dbError.code === '23503') { // Foreign key violation
          throw new Error(`Invalid reference: ${dbError.detail || 'Referenced record does not exist'}`);
        } else if (dbError.message?.includes('ST_GeomFromGeoJSON')) {
          throw new Error(`Invalid boundaries format: ${dbError.message}`);
        } else {
          throw new Error(`Database error: ${dbError.message || 'Unknown database error'}`);
        }
      }
    } else {
      // No boundaries, use normal save
      const neighborhood = this.neighborhoodRepository.create(neighborhoodData);
      return this.neighborhoodRepository.save(neighborhood);
    }
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
        'ST_DWithin(COALESCE(neighborhood.boundaries, ST_SetSRID(ST_MakePoint(neighborhood.center_longitude, neighborhood.center_latitude), 4326)), ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), :radius)',
        { lng: longitude, lat: latitude, radius }
      )
      .orderBy('ST_Distance(COALESCE(neighborhood.boundaries, ST_SetSRID(ST_MakePoint(neighborhood.center_longitude, neighborhood.center_latitude), 4326)), ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))', 'ASC')
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
