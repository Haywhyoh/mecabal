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

    try {
      // Use raw query for PostGIS geometry insertion
      if (boundaries) {
        const geoJsonString = JSON.stringify(boundaries);
        
        // Build the query with all required fields
        const queryParts: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;
        
        queryParts.push('name'); values.push(neighborhoodData.name); paramIndex++;
        queryParts.push('type'); values.push(neighborhoodData.type); paramIndex++;
        queryParts.push('lga_id'); values.push(neighborhoodData.lgaId); paramIndex++;
        queryParts.push('center_latitude'); values.push(neighborhoodData.centerLatitude); paramIndex++;
        queryParts.push('center_longitude'); values.push(neighborhoodData.centerLongitude); paramIndex++;
        queryParts.push('radius_meters'); values.push(neighborhoodData.radiusMeters); paramIndex++;
        queryParts.push('is_gated'); values.push(neighborhoodData.isGated); paramIndex++;
        queryParts.push('requires_verification'); values.push(neighborhoodData.requiresVerification); paramIndex++;
        queryParts.push('created_by'); values.push(neighborhoodData.createdBy); paramIndex++;
        
        const placeholders: string[] = [];
        for (let i = 1; i < paramIndex; i++) {
          placeholders.push(`$${i}`);
        }
        
        // Add optional fields
        if (createDto.wardId) {
          queryParts.push('ward_id');
          placeholders.push(`$${paramIndex}`);
          values.push(createDto.wardId);
          paramIndex++;
        }
        if (createDto.parentNeighborhoodId) {
          queryParts.push('parent_neighborhood_id');
          placeholders.push(`$${paramIndex}`);
          values.push(createDto.parentNeighborhoodId);
          paramIndex++;
        }
        if (createDto.adminUserId) {
          queryParts.push('admin_user_id');
          placeholders.push(`$${paramIndex}`);
          values.push(createDto.adminUserId);
          paramIndex++;
        }
        if (createDto.description) {
          queryParts.push('description');
          placeholders.push(`$${paramIndex}`);
          values.push(createDto.description);
          paramIndex++;
        }
        
        // Add boundaries with ST_GeomFromGeoJSON
        queryParts.push('boundaries');
        placeholders.push(`ST_GeomFromGeoJSON($${paramIndex}::json)`);
        values.push(geoJsonString);
        
        const insertQuery = `
          INSERT INTO neighborhoods (${queryParts.join(', ')})
          VALUES (${placeholders.join(', ')})
          RETURNING id
        `;
        
        console.log('Executing query with', values.length, 'parameters');
        const result = await this.neighborhoodRepository.query(insertQuery, values);
        const newId = result[0]?.id;
        
        if (!newId) {
          throw new Error('Failed to create neighborhood - no ID returned from database');
        }
        
        return this.neighborhoodRepository.findOne({
          where: { id: newId },
          relations: ['lga', 'ward', 'parentNeighborhood'],
        }) as Promise<Neighborhood>;
      } else {
        // No boundaries, use normal TypeORM save
        const neighborhood = this.neighborhoodRepository.create(neighborhoodData);
        const savedNeighborhood = await this.neighborhoodRepository.save(neighborhood);
        
        return this.neighborhoodRepository.findOne({
          where: { id: savedNeighborhood.id },
          relations: ['lga', 'ward', 'parentNeighborhood'],
        }) as Promise<Neighborhood>;
      }
    } catch (dbErr: any) {
      console.error('=== Database error creating neighborhood ===');
      console.error('Error type:', typeof dbErr);
      console.error('Error code:', dbErr?.code);
      console.error('Error detail:', dbErr?.detail);
      console.error('Error message:', dbErr?.message);
      console.error('Error stack:', dbErr?.stack);
      console.error('Error constraint:', dbErr?.constraint);
      console.error('Error table:', dbErr?.table);
      console.error('Error column:', dbErr?.column);
      console.error('Neighborhood data being inserted:', JSON.stringify(neighborhoodData, null, 2));
      console.error('Boundaries data:', boundaries ? JSON.stringify(boundaries, null, 2) : 'No boundaries provided');

      // Provide detailed, helpful error messages based on error type
      if (dbErr?.code === '23505') {
        // Unique constraint violation
        const constraintName = dbErr?.constraint || 'unknown constraint';
        throw new Error(`A neighborhood with this name "${createDto.name}" already exists in this LGA (Constraint: ${constraintName})`);
      } else if (dbErr?.code === '23503') {
        // Foreign key violation
        const detail = dbErr?.detail || 'Referenced record does not exist';
        const constraint = dbErr?.constraint || 'unknown';
        throw new Error(`Invalid reference in ${constraint}: ${detail}. Please verify that LGA ID "${createDto.lgaId}"${createDto.wardId ? ` and Ward ID "${createDto.wardId}"` : ''} exist in the database.`);
      } else if (dbErr?.code === '22P02') {
        // Invalid text representation (e.g., invalid UUID format)
        throw new Error(`Invalid ID format provided. LGA ID must be a valid number. Received: "${createDto.lgaId}"`);
      } else if (dbErr?.code === '42P01') {
        // Undefined table
        throw new Error(`Database table not found: ${dbErr?.message}. Please ensure migrations have been run.`);
      } else if (dbErr?.message?.includes('geometry') || dbErr?.message?.includes('ST_GeomFromGeoJSON')) {
        // PostGIS geometry errors
        const geoErrorDetail = dbErr?.message || 'Invalid geometry format';
        throw new Error(`Invalid boundaries format: ${geoErrorDetail}. Please ensure coordinates form a valid closed polygon with matching first and last points.`);
      } else if (dbErr?.message?.includes('GeoJSON')) {
        throw new Error(`GeoJSON parsing error: ${dbErr?.message}. Boundaries must be valid GeoJSON Polygon format.`);
      } else if (dbErr?.code) {
        // Other PostgreSQL errors with error codes
        throw new Error(`Database error (Code ${dbErr.code}): ${dbErr?.message || dbErr?.detail || 'Unknown error'}. ${dbErr?.hint || ''}`);
      } else {
        // Generic errors
        const errorMsg = dbErr?.message || (typeof dbErr === 'string' ? dbErr : 'Unknown database error');
        throw new Error(`Failed to create neighborhood: ${errorMsg}`);
      }
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
