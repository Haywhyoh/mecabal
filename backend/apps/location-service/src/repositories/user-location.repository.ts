import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserLocation, UserLocationVerificationStatus } from '@app/database';

export interface Point {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface UserLocationFilters {
  userId?: string;
  stateId?: string;
  lgaId?: string;
  wardId?: string;
  neighborhoodId?: string;
  isPrimary?: boolean;
  verificationStatus?: UserLocationVerificationStatus;
}

@Injectable()
export class UserLocationRepository extends Repository<UserLocation> {
  constructor(
    @InjectRepository(UserLocation)
    private readonly userLocationRepo: Repository<UserLocation>,
  ) {
    super(userLocationRepo.target, userLocationRepo.manager, userLocationRepo.queryRunner);
  }

  /**
   * Find user locations near a specific point within a radius
   */
  async findNearPoint(
    point: Point,
    radius: number,
    filters?: UserLocationFilters
  ): Promise<UserLocation[]> {
    const query = this.userLocationRepo
      .createQueryBuilder('userLocation')
      .leftJoinAndSelect('userLocation.user', 'user')
      .leftJoinAndSelect('userLocation.state', 'state')
      .leftJoinAndSelect('userLocation.lga', 'lga')
      .leftJoinAndSelect('userLocation.ward', 'ward')
      .leftJoinAndSelect('userLocation.neighborhood', 'neighborhood')
      .where(
        'ST_DWithin(userLocation.coordinates, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), :radius)',
        { 
          lng: point.coordinates[0], 
          lat: point.coordinates[1], 
          radius 
        }
      )
      .orderBy('ST_Distance(userLocation.coordinates, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))', 'ASC');

    this.applyFilters(query, filters);

    return query.getMany();
  }

  /**
   * Find user locations within a bounding box
   */
  async findByBoundingBox(
    minLat: number,
    minLng: number,
    maxLat: number,
    maxLng: number,
    filters?: UserLocationFilters
  ): Promise<UserLocation[]> {
    const query = this.userLocationRepo
      .createQueryBuilder('userLocation')
      .leftJoinAndSelect('userLocation.user', 'user')
      .leftJoinAndSelect('userLocation.state', 'state')
      .leftJoinAndSelect('userLocation.lga', 'lga')
      .leftJoinAndSelect('userLocation.ward', 'ward')
      .leftJoinAndSelect('userLocation.neighborhood', 'neighborhood')
      .where(
        'ST_Within(userLocation.coordinates, ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326))',
        { minLng, minLat, maxLng, maxLat }
      )
      .orderBy('userLocation.createdAt', 'DESC');

    this.applyFilters(query, filters);

    return query.getMany();
  }

  /**
   * Find user locations within a polygon
   */
  async findByPolygon(
    polygon: { type: 'Polygon'; coordinates: number[][][] },
    filters?: UserLocationFilters
  ): Promise<UserLocation[]> {
    const query = this.userLocationRepo
      .createQueryBuilder('userLocation')
      .leftJoinAndSelect('userLocation.user', 'user')
      .leftJoinAndSelect('userLocation.state', 'state')
      .leftJoinAndSelect('userLocation.lga', 'lga')
      .leftJoinAndSelect('userLocation.ward', 'ward')
      .leftJoinAndSelect('userLocation.neighborhood', 'neighborhood')
      .where(
        'ST_Within(userLocation.coordinates, ST_GeomFromGeoJSON(:polygon))',
        { polygon: JSON.stringify(polygon) }
      )
      .orderBy('userLocation.createdAt', 'DESC');

    this.applyFilters(query, filters);

    return query.getMany();
  }

  /**
   * Find users in a specific neighborhood
   */
  async findByNeighborhood(
    neighborhoodId: string,
    filters?: Omit<UserLocationFilters, 'neighborhoodId'>
  ): Promise<UserLocation[]> {
    const query = this.userLocationRepo
      .createQueryBuilder('userLocation')
      .leftJoinAndSelect('userLocation.user', 'user')
      .leftJoinAndSelect('userLocation.state', 'state')
      .leftJoinAndSelect('userLocation.lga', 'lga')
      .leftJoinAndSelect('userLocation.ward', 'ward')
      .leftJoinAndSelect('userLocation.neighborhood', 'neighborhood')
      .where('userLocation.neighborhoodId = :neighborhoodId', { neighborhoodId })
      .orderBy('userLocation.createdAt', 'DESC');

    this.applyFilters(query, filters);

    return query.getMany();
  }

  /**
   * Find users in a specific ward
   */
  async findByWard(
    wardId: string,
    filters?: Omit<UserLocationFilters, 'wardId'>
  ): Promise<UserLocation[]> {
    const query = this.userLocationRepo
      .createQueryBuilder('userLocation')
      .leftJoinAndSelect('userLocation.user', 'user')
      .leftJoinAndSelect('userLocation.state', 'state')
      .leftJoinAndSelect('userLocation.lga', 'lga')
      .leftJoinAndSelect('userLocation.ward', 'ward')
      .leftJoinAndSelect('userLocation.neighborhood', 'neighborhood')
      .where('userLocation.wardId = :wardId', { wardId })
      .orderBy('userLocation.createdAt', 'DESC');

    this.applyFilters(query, filters);

    return query.getMany();
  }

  /**
   * Find users in a specific LGA
   */
  async findByLga(
    lgaId: string,
    filters?: Omit<UserLocationFilters, 'lgaId'>
  ): Promise<UserLocation[]> {
    const query = this.userLocationRepo
      .createQueryBuilder('userLocation')
      .leftJoinAndSelect('userLocation.user', 'user')
      .leftJoinAndSelect('userLocation.state', 'state')
      .leftJoinAndSelect('userLocation.lga', 'lga')
      .leftJoinAndSelect('userLocation.ward', 'ward')
      .leftJoinAndSelect('userLocation.neighborhood', 'neighborhood')
      .where('userLocation.lgaId = :lgaId', { lgaId })
      .orderBy('userLocation.createdAt', 'DESC');

    this.applyFilters(query, filters);

    return query.getMany();
  }

  /**
   * Find users in a specific state
   */
  async findByState(
    stateId: string,
    filters?: Omit<UserLocationFilters, 'stateId'>
  ): Promise<UserLocation[]> {
    const query = this.userLocationRepo
      .createQueryBuilder('userLocation')
      .leftJoinAndSelect('userLocation.user', 'user')
      .leftJoinAndSelect('userLocation.state', 'state')
      .leftJoinAndSelect('userLocation.lga', 'lga')
      .leftJoinAndSelect('userLocation.ward', 'ward')
      .leftJoinAndSelect('userLocation.neighborhood', 'neighborhood')
      .where('userLocation.stateId = :stateId', { stateId })
      .orderBy('userLocation.createdAt', 'DESC');

    this.applyFilters(query, filters);

    return query.getMany();
  }

  /**
   * Find the nearest users to a point
   */
  async findNearest(
    point: Point,
    limit: number = 10,
    filters?: UserLocationFilters
  ): Promise<Array<UserLocation & { distance: number }>> {
    const query = this.userLocationRepo
      .createQueryBuilder('userLocation')
      .leftJoinAndSelect('userLocation.user', 'user')
      .leftJoinAndSelect('userLocation.state', 'state')
      .leftJoinAndSelect('userLocation.lga', 'lga')
      .leftJoinAndSelect('userLocation.ward', 'ward')
      .leftJoinAndSelect('userLocation.neighborhood', 'neighborhood')
      .addSelect(
        'ST_Distance(userLocation.coordinates, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))',
        'distance'
      )
      .where('userLocation.coordinates IS NOT NULL')
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
   * Get user density statistics for an area
   */
  async getDensityStats(
    polygon: { type: 'Polygon'; coordinates: number[][][] }
  ): Promise<{
    totalUsers: number;
    verifiedUsers: number;
    unverifiedUsers: number;
    byState: Record<string, number>;
    byLga: Record<string, number>;
    byWard: Record<string, number>;
    byNeighborhood: Record<string, number>;
  }> {
    const [total, verified, unverified, byState, byLga, byWard, byNeighborhood] = await Promise.all([
      this.userLocationRepo
        .createQueryBuilder('userLocation')
        .where(
          'ST_Within(userLocation.coordinates, ST_GeomFromGeoJSON(:polygon))',
          { polygon: JSON.stringify(polygon) }
        )
        .getCount(),
      
      this.userLocationRepo
        .createQueryBuilder('userLocation')
        .where(
          'ST_Within(userLocation.coordinates, ST_GeomFromGeoJSON(:polygon))',
          { polygon: JSON.stringify(polygon) }
        )
        .andWhere('userLocation.verificationStatus = :status', { status: UserLocationVerificationStatus.VERIFIED })
        .getCount(),
      
      this.userLocationRepo
        .createQueryBuilder('userLocation')
        .where(
          'ST_Within(userLocation.coordinates, ST_GeomFromGeoJSON(:polygon))',
          { polygon: JSON.stringify(polygon) }
        )
        .andWhere('userLocation.verificationStatus = :status', { status: UserLocationVerificationStatus.UNVERIFIED })
        .getCount(),
      
      this.userLocationRepo
        .createQueryBuilder('userLocation')
        .leftJoin('userLocation.state', 'state')
        .select('state.name', 'stateName')
        .addSelect('COUNT(*)', 'count')
        .where(
          'ST_Within(userLocation.coordinates, ST_GeomFromGeoJSON(:polygon))',
          { polygon: JSON.stringify(polygon) }
        )
        .groupBy('state.id, state.name')
        .getRawMany(),
      
      this.userLocationRepo
        .createQueryBuilder('userLocation')
        .leftJoin('userLocation.lga', 'lga')
        .select('lga.name', 'lgaName')
        .addSelect('COUNT(*)', 'count')
        .where(
          'ST_Within(userLocation.coordinates, ST_GeomFromGeoJSON(:polygon))',
          { polygon: JSON.stringify(polygon) }
        )
        .groupBy('lga.id, lga.name')
        .getRawMany(),
      
      this.userLocationRepo
        .createQueryBuilder('userLocation')
        .leftJoin('userLocation.ward', 'ward')
        .select('ward.name', 'wardName')
        .addSelect('COUNT(*)', 'count')
        .where(
          'ST_Within(userLocation.coordinates, ST_GeomFromGeoJSON(:polygon))',
          { polygon: JSON.stringify(polygon) }
        )
        .groupBy('ward.id, ward.name')
        .getRawMany(),
      
      this.userLocationRepo
        .createQueryBuilder('userLocation')
        .leftJoin('userLocation.neighborhood', 'neighborhood')
        .select('neighborhood.name', 'neighborhoodName')
        .addSelect('COUNT(*)', 'count')
        .where(
          'ST_Within(userLocation.coordinates, ST_GeomFromGeoJSON(:polygon))',
          { polygon: JSON.stringify(polygon) }
        )
        .groupBy('neighborhood.id, neighborhood.name')
        .getRawMany(),
    ]);

    const byStateMap = byState.reduce((acc, row) => {
      acc[row.stateName] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);

    const byLgaMap = byLga.reduce((acc, row) => {
      acc[row.lgaName] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);

    const byWardMap = byWard.reduce((acc, row) => {
      acc[row.wardName] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);

    const byNeighborhoodMap = byNeighborhood.reduce((acc, row) => {
      acc[row.neighborhoodName] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);

    return {
      totalUsers: total,
      verifiedUsers: verified,
      unverifiedUsers: unverified,
      byState: byStateMap,
      byLga: byLgaMap,
      byWard: byWardMap,
      byNeighborhood: byNeighborhoodMap,
    };
  }

  /**
   * Find users by verification status in an area
   */
  async findByVerificationStatusInArea(
    polygon: { type: 'Polygon'; coordinates: number[][][] },
    verificationStatus: UserLocationVerificationStatus,
    filters?: Omit<UserLocationFilters, 'verificationStatus'>
  ): Promise<UserLocation[]> {
    const query = this.userLocationRepo
      .createQueryBuilder('userLocation')
      .leftJoinAndSelect('userLocation.user', 'user')
      .leftJoinAndSelect('userLocation.state', 'state')
      .leftJoinAndSelect('userLocation.lga', 'lga')
      .leftJoinAndSelect('userLocation.ward', 'ward')
      .leftJoinAndSelect('userLocation.neighborhood', 'neighborhood')
      .where(
        'ST_Within(userLocation.coordinates, ST_GeomFromGeoJSON(:polygon))',
        { polygon: JSON.stringify(polygon) }
      )
      .andWhere('userLocation.verificationStatus = :verificationStatus', { verificationStatus })
      .orderBy('userLocation.createdAt', 'DESC');

    this.applyFilters(query, filters);

    return query.getMany();
  }

  /**
   * Get user's primary location
   */
  async getPrimaryLocation(userId: string): Promise<UserLocation | null> {
    return this.userLocationRepo.findOne({
      where: { userId, isPrimary: true },
      relations: ['state', 'lga', 'ward', 'neighborhood'],
    });
  }

  /**
   * Get all user locations (primary and secondary)
   */
  async getUserLocations(userId: string): Promise<UserLocation[]> {
    return this.userLocationRepo.find({
      where: { userId },
      relations: ['state', 'lga', 'ward', 'neighborhood'],
      order: { isPrimary: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Apply common filters to queries
   */
  private applyFilters(query: any, filters?: UserLocationFilters): void {
    if (!filters) return;

    if (filters.userId) {
      query.andWhere('userLocation.userId = :userId', { userId: filters.userId });
    }

    if (filters.stateId) {
      query.andWhere('userLocation.stateId = :stateId', { stateId: filters.stateId });
    }

    if (filters.lgaId) {
      query.andWhere('userLocation.lgaId = :lgaId', { lgaId: filters.lgaId });
    }

    if (filters.wardId) {
      query.andWhere('userLocation.wardId = :wardId', { wardId: filters.wardId });
    }

    if (filters.neighborhoodId) {
      query.andWhere('userLocation.neighborhoodId = :neighborhoodId', {
        neighborhoodId: filters.neighborhoodId,
      });
    }

    if (filters.isPrimary !== undefined) {
      query.andWhere('userLocation.isPrimary = :isPrimary', { isPrimary: filters.isPrimary });
    }

    if (filters.verificationStatus) {
      query.andWhere('userLocation.verificationStatus = :verificationStatus', {
        verificationStatus: filters.verificationStatus,
      });
    }
  }

  /**
   * Get geospatial statistics for all user locations
   */
  async getGeospatialStats(): Promise<{
    totalUserLocations: number;
    primaryLocations: number;
    secondaryLocations: number;
    verifiedLocations: number;
    unverifiedLocations: number;
    pendingLocations: number;
    byState: Record<string, number>;
    byLga: Record<string, number>;
    byWard: Record<string, number>;
    byNeighborhood: Record<string, number>;
  }> {
    const [
      total,
      primary,
      secondary,
      verified,
      unverified,
      pending,
      byState,
      byLga,
      byWard,
      byNeighborhood,
    ] = await Promise.all([
      this.userLocationRepo.count(),
      this.userLocationRepo.count({ where: { isPrimary: true } }),
      this.userLocationRepo.count({ where: { isPrimary: false } }),
      this.userLocationRepo.count({ where: { verificationStatus: UserLocationVerificationStatus.VERIFIED } }),
      this.userLocationRepo.count({ where: { verificationStatus: UserLocationVerificationStatus.UNVERIFIED } }),
      this.userLocationRepo.count({ where: { verificationStatus: UserLocationVerificationStatus.PENDING } }),
      this.userLocationRepo
        .createQueryBuilder('userLocation')
        .leftJoin('userLocation.state', 'state')
        .select('state.name', 'stateName')
        .addSelect('COUNT(*)', 'count')
        .groupBy('state.id, state.name')
        .getRawMany(),
      this.userLocationRepo
        .createQueryBuilder('userLocation')
        .leftJoin('userLocation.lga', 'lga')
        .select('lga.name', 'lgaName')
        .addSelect('COUNT(*)', 'count')
        .groupBy('lga.id, lga.name')
        .getRawMany(),
      this.userLocationRepo
        .createQueryBuilder('userLocation')
        .leftJoin('userLocation.ward', 'ward')
        .select('ward.name', 'wardName')
        .addSelect('COUNT(*)', 'count')
        .groupBy('ward.id, ward.name')
        .getRawMany(),
      this.userLocationRepo
        .createQueryBuilder('userLocation')
        .leftJoin('userLocation.neighborhood', 'neighborhood')
        .select('neighborhood.name', 'neighborhoodName')
        .addSelect('COUNT(*)', 'count')
        .groupBy('neighborhood.id, neighborhood.name')
        .getRawMany(),
    ]);

    const byStateMap = byState.reduce((acc, row) => {
      acc[row.stateName] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);

    const byLgaMap = byLga.reduce((acc, row) => {
      acc[row.lgaName] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);

    const byWardMap = byWard.reduce((acc, row) => {
      acc[row.wardName] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);

    const byNeighborhoodMap = byNeighborhood.reduce((acc, row) => {
      acc[row.neighborhoodName] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);

    return {
      totalUserLocations: total,
      primaryLocations: primary,
      secondaryLocations: secondary,
      verifiedLocations: verified,
      unverifiedLocations: unverified,
      pendingLocations: pending,
      byState: byStateMap,
      byLga: byLgaMap,
      byWard: byWardMap,
      byNeighborhood: byNeighborhoodMap,
    };
  }
}
