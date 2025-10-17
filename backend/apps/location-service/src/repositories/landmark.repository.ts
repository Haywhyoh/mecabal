import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Landmark, LandmarkType, LandmarkVerificationStatus } from '../../../libs/database/src/entities';

export interface Point {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface LandmarkFilters {
  types?: LandmarkType[];
  verificationStatus?: LandmarkVerificationStatus;
  neighborhoodId?: string;
  createdBy?: string;
}

@Injectable()
export class LandmarkRepository extends Repository<Landmark> {
  constructor(
    @InjectRepository(Landmark)
    private readonly landmarkRepo: Repository<Landmark>,
  ) {
    super(landmarkRepo.target, landmarkRepo.manager, landmarkRepo.queryRunner);
  }

  /**
   * Find landmarks near a specific point within a radius
   */
  async findNearPoint(
    point: Point,
    radius: number,
    filters?: LandmarkFilters
  ): Promise<Landmark[]> {
    const query = this.landmarkRepo
      .createQueryBuilder('landmark')
      .leftJoinAndSelect('landmark.neighborhood', 'neighborhood')
      .leftJoinAndSelect('neighborhood.ward', 'ward')
      .leftJoinAndSelect('ward.lga', 'lga')
      .leftJoinAndSelect('lga.state', 'state')
      .where(
        'ST_DWithin(landmark.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), :radius)',
        { 
          lng: point.coordinates[0], 
          lat: point.coordinates[1], 
          radius 
        }
      )
      .orderBy('ST_Distance(landmark.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))', 'ASC');

    this.applyFilters(query, filters);

    return query.getMany();
  }

  /**
   * Find landmarks within a bounding box
   */
  async findByBoundingBox(
    minLat: number,
    minLng: number,
    maxLat: number,
    maxLng: number,
    filters?: LandmarkFilters
  ): Promise<Landmark[]> {
    const query = this.landmarkRepo
      .createQueryBuilder('landmark')
      .leftJoinAndSelect('landmark.neighborhood', 'neighborhood')
      .leftJoinAndSelect('neighborhood.ward', 'ward')
      .leftJoinAndSelect('ward.lga', 'lga')
      .leftJoinAndSelect('lga.state', 'state')
      .where(
        'ST_Within(landmark.location, ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326))',
        { minLng, minLat, maxLng, maxLat }
      )
      .orderBy('landmark.name', 'ASC');

    this.applyFilters(query, filters);

    return query.getMany();
  }

  /**
   * Find landmarks within a polygon
   */
  async findByPolygon(
    polygon: { type: 'Polygon'; coordinates: number[][][] },
    filters?: LandmarkFilters
  ): Promise<Landmark[]> {
    const query = this.landmarkRepo
      .createQueryBuilder('landmark')
      .leftJoinAndSelect('landmark.neighborhood', 'neighborhood')
      .leftJoinAndSelect('neighborhood.ward', 'ward')
      .leftJoinAndSelect('ward.lga', 'lga')
      .leftJoinAndSelect('lga.state', 'state')
      .where(
        'ST_Within(landmark.location, ST_GeomFromGeoJSON(:polygon))',
        { polygon: JSON.stringify(polygon) }
      )
      .orderBy('landmark.name', 'ASC');

    this.applyFilters(query, filters);

    return query.getMany();
  }

  /**
   * Find the nearest landmarks to a point
   */
  async findNearest(
    point: Point,
    limit: number = 10,
    filters?: LandmarkFilters
  ): Promise<Array<Landmark & { distance: number }>> {
    const query = this.landmarkRepo
      .createQueryBuilder('landmark')
      .leftJoinAndSelect('landmark.neighborhood', 'neighborhood')
      .leftJoinAndSelect('neighborhood.ward', 'ward')
      .leftJoinAndSelect('ward.lga', 'lga')
      .leftJoinAndSelect('lga.state', 'state')
      .addSelect(
        'ST_Distance(landmark.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))',
        'distance'
      )
      .where('landmark.location IS NOT NULL')
      .orderBy('distance', 'ASC')
      .limit(limit);

    this.applyFilters(query, filters);

    const results = await query.getRawAndEntities();
    
    return results.entities.map((entity, index) => ({
      ...entity,
      distance: parseFloat(results.raw[index].distance),
    }));
  }

  /**
   * Find landmarks by type within a radius
   */
  async findByTypeNearPoint(
    point: Point,
    radius: number,
    types: LandmarkType[],
    filters?: Omit<LandmarkFilters, 'types'>
  ): Promise<Landmark[]> {
    const query = this.landmarkRepo
      .createQueryBuilder('landmark')
      .leftJoinAndSelect('landmark.neighborhood', 'neighborhood')
      .leftJoinAndSelect('neighborhood.ward', 'ward')
      .leftJoinAndSelect('ward.lga', 'lga')
      .leftJoinAndSelect('lga.state', 'state')
      .where(
        'ST_DWithin(landmark.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), :radius)',
        { 
          lng: point.coordinates[0], 
          lat: point.coordinates[1], 
          radius 
        }
      )
      .andWhere('landmark.type IN (:...types)', { types })
      .orderBy('ST_Distance(landmark.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))', 'ASC');

    this.applyFilters(query, filters);

    return query.getMany();
  }

  /**
   * Find landmarks along a route (within distance of a line)
   */
  async findAlongRoute(
    line: { type: 'LineString'; coordinates: number[][] },
    distance: number,
    filters?: LandmarkFilters
  ): Promise<Landmark[]> {
    const query = this.landmarkRepo
      .createQueryBuilder('landmark')
      .leftJoinAndSelect('landmark.neighborhood', 'neighborhood')
      .leftJoinAndSelect('neighborhood.ward', 'ward')
      .leftJoinAndSelect('ward.lga', 'lga')
      .leftJoinAndSelect('lga.state', 'state')
      .where(
        'ST_DWithin(landmark.location, ST_GeomFromGeoJSON(:line), :distance)',
        { line: JSON.stringify(line), distance }
      )
      .orderBy('ST_Distance(landmark.location, ST_GeomFromGeoJSON(:line))', 'ASC');

    this.applyFilters(query, filters);

    return query.getMany();
  }

  /**
   * Get landmark density statistics for an area
   */
  async getDensityStats(
    polygon: { type: 'Polygon'; coordinates: number[][][] }
  ): Promise<{
    totalLandmarks: number;
    byType: Record<string, number>;
    averageDistance: number; // average distance between landmarks
  }> {
    const result = await this.landmarkRepo
      .createQueryBuilder('landmark')
      .select('COUNT(*)', 'totalLandmarks')
      .addSelect('landmark.type', 'type')
      .where(
        'ST_Within(landmark.location, ST_GeomFromGeoJSON(:polygon))',
        { polygon: JSON.stringify(polygon) }
      )
      .groupBy('landmark.type')
      .getRawMany();

    const totalLandmarks = result.reduce((sum, row) => sum + parseInt(row.totalLandmarks), 0);
    const byType = result.reduce((acc, row) => {
      acc[row.type] = parseInt(row.totalLandmarks);
      return acc;
    }, {} as Record<string, number>);

    // Calculate average distance between landmarks
    const distanceResult = await this.landmarkRepo
      .createQueryBuilder('l1')
      .select('AVG(ST_Distance(l1.location, l2.location))', 'averageDistance')
      .leftJoin('landmark', 'l2', 'l1.id != l2.id')
      .where(
        'ST_Within(l1.location, ST_GeomFromGeoJSON(:polygon))',
        { polygon: JSON.stringify(polygon) }
      )
      .andWhere(
        'ST_Within(l2.location, ST_GeomFromGeoJSON(:polygon))',
        { polygon: JSON.stringify(polygon) }
      )
      .getRawOne();

    const averageDistance = parseFloat(distanceResult?.averageDistance) || 0;

    return {
      totalLandmarks,
      byType,
      averageDistance,
    };
  }

  /**
   * Find landmarks by verification status within an area
   */
  async findByVerificationStatusInArea(
    polygon: { type: 'Polygon'; coordinates: number[][][] },
    verificationStatus: LandmarkVerificationStatus,
    filters?: Omit<LandmarkFilters, 'verificationStatus'>
  ): Promise<Landmark[]> {
    const query = this.landmarkRepo
      .createQueryBuilder('landmark')
      .leftJoinAndSelect('landmark.neighborhood', 'neighborhood')
      .leftJoinAndSelect('neighborhood.ward', 'ward')
      .leftJoinAndSelect('ward.lga', 'lga')
      .leftJoinAndSelect('lga.state', 'state')
      .where(
        'ST_Within(landmark.location, ST_GeomFromGeoJSON(:polygon))',
        { polygon: JSON.stringify(polygon) }
      )
      .andWhere('landmark.verificationStatus = :verificationStatus', { verificationStatus })
      .orderBy('landmark.name', 'ASC');

    this.applyFilters(query, filters);

    return query.getMany();
  }

  /**
   * Get landmark clustering information
   */
  async getClusteringInfo(
    point: Point,
    radius: number,
    minClusterSize: number = 3
  ): Promise<{
    clusters: Array<{
      center: Point;
      landmarks: Landmark[];
      count: number;
      radius: number;
    }>;
    isolatedLandmarks: Landmark[];
  }> {
    // Find all landmarks in the area
    const landmarks = await this.findNearPoint(point, radius);
    
    const clusters: Array<{
      center: Point;
      landmarks: Landmark[];
      count: number;
      radius: number;
    }> = [];
    
    const processed = new Set<string>();
    const isolatedLandmarks: Landmark[] = [];

    for (const landmark of landmarks) {
      if (processed.has(landmark.id)) continue;

      // Find nearby landmarks to this one
      const nearbyLandmarks = await this.findNearPoint(
        landmark.location as Point,
        500, // 500m cluster radius
        { types: [landmark.type] }
      );

      if (nearbyLandmarks.length >= minClusterSize) {
        // Calculate cluster center
        const lngSum = nearbyLandmarks.reduce((sum, l) => sum + l.location.coordinates[0], 0);
        const latSum = nearbyLandmarks.reduce((sum, l) => sum + l.location.coordinates[1], 0);
        
        const center: Point = {
          type: 'Point',
          coordinates: [lngSum / nearbyLandmarks.length, latSum / nearbyLandmarks.length],
        };

        clusters.push({
          center,
          landmarks: nearbyLandmarks,
          count: nearbyLandmarks.length,
          radius: 500,
        });

        nearbyLandmarks.forEach(l => processed.add(l.id));
      } else {
        isolatedLandmarks.push(landmark);
        processed.add(landmark.id);
      }
    }

    return { clusters, isolatedLandmarks };
  }

  /**
   * Apply common filters to queries
   */
  private applyFilters(query: any, filters?: LandmarkFilters): void {
    if (!filters) return;

    if (filters.types && filters.types.length > 0) {
      query.andWhere('landmark.type IN (:...types)', { types: filters.types });
    }

    if (filters.verificationStatus) {
      query.andWhere('landmark.verificationStatus = :verificationStatus', {
        verificationStatus: filters.verificationStatus,
      });
    }

    if (filters.neighborhoodId) {
      query.andWhere('landmark.neighborhoodId = :neighborhoodId', {
        neighborhoodId: filters.neighborhoodId,
      });
    }

    if (filters.createdBy) {
      query.andWhere('landmark.createdBy = :createdBy', {
        createdBy: filters.createdBy,
      });
    }
  }

  /**
   * Get geospatial statistics for all landmarks
   */
  async getGeospatialStats(): Promise<{
    totalLandmarks: number;
    landmarksWithLocation: number;
    byType: Record<string, number>;
    byVerificationStatus: Record<string, number>;
  }> {
    const [total, withLocation, byType, byStatus] = await Promise.all([
      this.landmarkRepo.count(),
      this.landmarkRepo.count({ where: { location: { $ne: null } } }),
      this.landmarkRepo
        .createQueryBuilder('landmark')
        .select('landmark.type', 'type')
        .addSelect('COUNT(*)', 'count')
        .groupBy('landmark.type')
        .getRawMany(),
      this.landmarkRepo
        .createQueryBuilder('landmark')
        .select('landmark.verificationStatus', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('landmark.verificationStatus')
        .getRawMany(),
    ]);

    const byTypeMap = byType.reduce((acc, row) => {
      acc[row.type] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);

    const byStatusMap = byStatus.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);

    return {
      totalLandmarks: total,
      landmarksWithLocation: withLocation,
      byType: byTypeMap,
      byVerificationStatus: byStatusMap,
    };
  }
}
