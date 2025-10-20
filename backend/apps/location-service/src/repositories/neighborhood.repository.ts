import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Neighborhood } from '@app/database/entities';

export interface Polygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface Point {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface GeospatialFilters {
  types?: string[];
  isGated?: boolean;
  requiresVerification?: boolean;
  minMemberCount?: number;
  maxMemberCount?: number;
}

@Injectable()
export class NeighborhoodRepository extends Repository<Neighborhood> {
  constructor(
    @InjectRepository(Neighborhood)
    private readonly neighborhoodRepo: Repository<Neighborhood>,
  ) {
    super(neighborhoodRepo.target, neighborhoodRepo.manager, neighborhoodRepo.queryRunner);
  }

  /**
   * Find neighborhoods that contain a specific polygon
   */
  async findByBoundary(polygon: Polygon): Promise<Neighborhood[]> {
    return this.neighborhoodRepo
      .createQueryBuilder('neighborhood')
      .leftJoinAndSelect('neighborhood.ward', 'ward')
      .leftJoinAndSelect('ward.lga', 'lga')
      .leftJoinAndSelect('lga.state', 'state')
      .leftJoinAndSelect('neighborhood.landmarks', 'landmarks')
      .where(
        'ST_Contains(neighborhood.boundaries, ST_GeomFromGeoJSON(:polygon))',
        { polygon: JSON.stringify(polygon) }
      )
      .orderBy('neighborhood.name', 'ASC')
      .getMany();
  }

  /**
   * Find neighborhoods near a specific point within a radius
   */
  async findNearPoint(
    point: Point,
    radius: number,
    filters?: GeospatialFilters
  ): Promise<Neighborhood[]> {
    const query = this.neighborhoodRepo
      .createQueryBuilder('neighborhood')
      .leftJoinAndSelect('neighborhood.ward', 'ward')
      .leftJoinAndSelect('ward.lga', 'lga')
      .leftJoinAndSelect('lga.state', 'state')
      .leftJoinAndSelect('neighborhood.landmarks', 'landmarks')
      .where(
        'ST_DWithin(neighborhood.boundaries, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), :radius)',
        { 
          lng: point.coordinates[0], 
          lat: point.coordinates[1], 
          radius 
        }
      )
      .orderBy('ST_Distance(neighborhood.boundaries, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))', 'ASC');

    this.applyFilters(query, filters);

    return query.getMany();
  }

  /**
   * Find neighborhoods that intersect with a polygon
   */
  async findIntersecting(polygon: Polygon, filters?: GeospatialFilters): Promise<Neighborhood[]> {
    const query = this.neighborhoodRepo
      .createQueryBuilder('neighborhood')
      .leftJoinAndSelect('neighborhood.ward', 'ward')
      .leftJoinAndSelect('ward.lga', 'lga')
      .leftJoinAndSelect('lga.state', 'state')
      .leftJoinAndSelect('neighborhood.landmarks', 'landmarks')
      .where(
        'ST_Intersects(neighborhood.boundaries, ST_GeomFromGeoJSON(:polygon))',
        { polygon: JSON.stringify(polygon) }
      )
      .orderBy('neighborhood.name', 'ASC');

    this.applyFilters(query, filters);

    return query.getMany();
  }

  /**
   * Find neighborhoods within a bounding box
   */
  async findByBoundingBox(
    minLat: number,
    minLng: number,
    maxLat: number,
    maxLng: number,
    filters?: GeospatialFilters
  ): Promise<Neighborhood[]> {
    const query = this.neighborhoodRepo
      .createQueryBuilder('neighborhood')
      .leftJoinAndSelect('neighborhood.ward', 'ward')
      .leftJoinAndSelect('ward.lga', 'lga')
      .leftJoinAndSelect('lga.state', 'state')
      .leftJoinAndSelect('neighborhood.landmarks', 'landmarks')
      .where(
        'ST_Intersects(neighborhood.boundaries, ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326))',
        { minLng, minLat, maxLng, maxLat }
      )
      .orderBy('neighborhood.name', 'ASC');

    this.applyFilters(query, filters);

    return query.getMany();
  }

  /**
   * Find neighborhoods that contain a specific point
   */
  async findByPoint(point: Point, filters?: GeospatialFilters): Promise<Neighborhood[]> {
    const query = this.neighborhoodRepo
      .createQueryBuilder('neighborhood')
      .leftJoinAndSelect('neighborhood.ward', 'ward')
      .leftJoinAndSelect('ward.lga', 'lga')
      .leftJoinAndSelect('lga.state', 'state')
      .leftJoinAndSelect('neighborhood.landmarks', 'landmarks')
      .where(
        'ST_Contains(neighborhood.boundaries, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))',
        { lng: point.coordinates[0], lat: point.coordinates[1] }
      )
      .orderBy('neighborhood.name', 'ASC');

    this.applyFilters(query, filters);

    return query.getMany();
  }

  /**
   * Find neighborhoods within a specific distance of a line
   */
  async findNearLine(
    line: { type: 'LineString'; coordinates: number[][] },
    distance: number,
    filters?: GeospatialFilters
  ): Promise<Neighborhood[]> {
    const query = this.neighborhoodRepo
      .createQueryBuilder('neighborhood')
      .leftJoinAndSelect('neighborhood.ward', 'ward')
      .leftJoinAndSelect('ward.lga', 'lga')
      .leftJoinAndSelect('lga.state', 'state')
      .leftJoinAndSelect('neighborhood.landmarks', 'landmarks')
      .where(
        'ST_DWithin(neighborhood.boundaries, ST_GeomFromGeoJSON(:line), :distance)',
        { line: JSON.stringify(line), distance }
      )
      .orderBy('ST_Distance(neighborhood.boundaries, ST_GeomFromGeoJSON(:line))', 'ASC');

    this.applyFilters(query, filters);

    return query.getMany();
  }

  /**
   * Get neighborhood density statistics for an area
   */
  async getDensityStats(
    polygon: Polygon
  ): Promise<{
    totalNeighborhoods: number;
    totalArea: number; // in square meters
    averageArea: number; // in square meters
    density: number; // neighborhoods per square km
  }> {
    const result = await this.neighborhoodRepo
      .createQueryBuilder('neighborhood')
      .select('COUNT(*)', 'totalNeighborhoods')
      .addSelect('SUM(ST_Area(neighborhood.boundaries))', 'totalArea')
      .addSelect('AVG(ST_Area(neighborhood.boundaries))', 'averageArea')
      .where(
        'ST_Intersects(neighborhood.boundaries, ST_GeomFromGeoJSON(:polygon))',
        { polygon: JSON.stringify(polygon) }
      )
      .getRawOne();

    const totalNeighborhoods = parseInt(result.totalNeighborhoods) || 0;
    const totalArea = parseFloat(result.totalArea) || 0;
    const averageArea = parseFloat(result.averageArea) || 0;
    const density = totalArea > 0 ? (totalNeighborhoods / (totalArea / 1000000)) : 0; // per square km

    return {
      totalNeighborhoods,
      totalArea,
      averageArea,
      density,
    };
  }

  /**
   * Find the nearest neighborhoods to a point
   */
  async findNearest(
    point: Point,
    limit: number = 10,
    filters?: GeospatialFilters
  ): Promise<Array<Neighborhood & { distance: number }>> {
    const query = this.neighborhoodRepo
      .createQueryBuilder('neighborhood')
      .leftJoinAndSelect('neighborhood.ward', 'ward')
      .leftJoinAndSelect('ward.lga', 'lga')
      .leftJoinAndSelect('lga.state', 'state')
      .leftJoinAndSelect('neighborhood.landmarks', 'landmarks')
      .addSelect(
        'ST_Distance(neighborhood.boundaries, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))',
        'distance'
      )
      .where('neighborhood.boundaries IS NOT NULL')
      .orderBy('distance', 'ASC')
      .limit(limit);

    this.applyFilters(query, filters);

    const results = await query.getRawAndEntities();

    return results.entities.map((entity, index) => {
      const withDistance = entity as Neighborhood & { distance: number };
      (withDistance as any).distance = parseFloat(results.raw[index].distance);
      return withDistance;
    });
  }

  /**
   * Find neighborhoods by administrative hierarchy
   */
  async findByAdministrativeHierarchy(
    stateId?: string,
    lgaId?: string,
    wardId?: string,
    filters?: GeospatialFilters
  ): Promise<Neighborhood[]> {
    const query = this.neighborhoodRepo
      .createQueryBuilder('neighborhood')
      .leftJoinAndSelect('neighborhood.ward', 'ward')
      .leftJoinAndSelect('ward.lga', 'lga')
      .leftJoinAndSelect('lga.state', 'state')
      .leftJoinAndSelect('neighborhood.landmarks', 'landmarks');

    if (wardId) {
      query.where('ward.id = :wardId', { wardId });
    } else if (lgaId) {
      query.where('lga.id = :lgaId', { lgaId });
    } else if (stateId) {
      query.where('state.id = :stateId', { stateId });
    }

    query.orderBy('neighborhood.name', 'ASC');

    this.applyFilters(query, filters);

    return query.getMany();
  }

  /**
   * Apply common filters to queries
   */
  private applyFilters(query: any, filters?: GeospatialFilters): void {
    if (!filters) return;

    if (filters.types && filters.types.length > 0) {
      query.andWhere('neighborhood.type IN (:...types)', { types: filters.types });
    }

    if (filters.isGated !== undefined) {
      query.andWhere('neighborhood.isGated = :isGated', { isGated: filters.isGated });
    }

    if (filters.requiresVerification !== undefined) {
      query.andWhere('neighborhood.requiresVerification = :requiresVerification', {
        requiresVerification: filters.requiresVerification,
      });
    }

    // Note: Member count filters would require additional joins and calculations
    // This is a placeholder for future implementation
  }

  /**
   * Get geospatial statistics for all neighborhoods
   */
  async getGeospatialStats(): Promise<{
    totalNeighborhoods: number;
    neighborhoodsWithBoundaries: number;
    totalArea: number;
    averageArea: number;
    minArea: number;
    maxArea: number;
  }> {
    const result = await this.neighborhoodRepo
      .createQueryBuilder('neighborhood')
      .select('COUNT(*)', 'totalNeighborhoods')
      .addSelect('COUNT(neighborhood.boundaries)', 'neighborhoodsWithBoundaries')
      .addSelect('SUM(ST_Area(neighborhood.boundaries))', 'totalArea')
      .addSelect('AVG(ST_Area(neighborhood.boundaries))', 'averageArea')
      .addSelect('MIN(ST_Area(neighborhood.boundaries))', 'minArea')
      .addSelect('MAX(ST_Area(neighborhood.boundaries))', 'maxArea')
      .where('neighborhood.boundaries IS NOT NULL')
      .getRawOne();

    return {
      totalNeighborhoods: parseInt(result.totalNeighborhoods) || 0,
      neighborhoodsWithBoundaries: parseInt(result.neighborhoodsWithBoundaries) || 0,
      totalArea: parseFloat(result.totalArea) || 0,
      averageArea: parseFloat(result.averageArea) || 0,
      minArea: parseFloat(result.minArea) || 0,
      maxArea: parseFloat(result.maxArea) || 0,
    };
  }
}
