import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Landmark, LandmarkType, LandmarkVerificationStatus } from '../../../libs/database/src/entities';
import { CreateLandmarkDto, UpdateLandmarkDto, LandmarkSearchDto } from '../dto/landmark.dto';

@Injectable()
export class LandmarksService {
  constructor(
    @InjectRepository(Landmark)
    private readonly landmarkRepository: Repository<Landmark>,
  ) {}

  async getNearbyLandmarks(
    neighborhoodId: string,
    filters?: {
      type?: string;
      limit?: number;
    }
  ): Promise<Landmark[]> {
    const query = this.landmarkRepository
      .createQueryBuilder('landmark')
      .leftJoinAndSelect('landmark.neighborhood', 'neighborhood')
      .where('landmark.neighborhoodId = :neighborhoodId', { neighborhoodId })
      .orderBy('landmark.name', 'ASC');

    if (filters?.type) {
      query.andWhere('landmark.type = :type', { type: filters.type });
    }

    if (filters?.limit) {
      query.limit(filters.limit);
    }

    return query.getMany();
  }

  async getLandmarkById(id: string): Promise<Landmark> {
    const landmark = await this.landmarkRepository.findOne({
      where: { id },
      relations: ['neighborhood', 'neighborhood.ward', 'neighborhood.ward.lga', 'neighborhood.ward.lga.state'],
    });

    if (!landmark) {
      throw new Error(`Landmark with ID ${id} not found`);
    }

    return landmark;
  }

  async searchLandmarks(searchDto: LandmarkSearchDto): Promise<{
    data: Landmark[];
    total: number;
  }> {
    const query = this.landmarkRepository
      .createQueryBuilder('landmark')
      .leftJoinAndSelect('landmark.neighborhood', 'neighborhood')
      .leftJoinAndSelect('neighborhood.ward', 'ward')
      .leftJoinAndSelect('ward.lga', 'lga')
      .leftJoinAndSelect('lga.state', 'state')
      .where('LOWER(landmark.name) LIKE LOWER(:query)', { query: `%${searchDto.query}%` })
      .orWhere('LOWER(landmark.address) LIKE LOWER(:query)', { query: `%${searchDto.query}%` })
      .orderBy('landmark.name', 'ASC');

    if (searchDto.type) {
      query.andWhere('landmark.type = :type', { type: searchDto.type });
    }

    if (searchDto.neighborhoodId) {
      query.andWhere('landmark.neighborhoodId = :neighborhoodId', { neighborhoodId: searchDto.neighborhoodId });
    }

    const [data, total] = await query
      .skip(searchDto.offset || 0)
      .take(searchDto.limit || 20)
      .getManyAndCount();

    return { data, total };
  }

  async createLandmark(createDto: CreateLandmarkDto): Promise<Landmark> {
    const landmark = this.landmarkRepository.create({
      ...createDto,
      location: {
        type: 'Point',
        coordinates: [createDto.location.longitude, createDto.location.latitude],
      },
      verificationStatus: LandmarkVerificationStatus.PENDING,
    });

    return this.landmarkRepository.save(landmark);
  }

  async updateLandmark(id: string, updateDto: UpdateLandmarkDto): Promise<Landmark> {
    const landmark = await this.getLandmarkById(id);
    
    if (updateDto.location) {
      updateDto.location = {
        type: 'Point',
        coordinates: [updateDto.location.longitude, updateDto.location.latitude],
      } as any;
    }

    Object.assign(landmark, updateDto);
    return this.landmarkRepository.save(landmark);
  }

  async deleteLandmark(id: string): Promise<void> {
    const landmark = await this.getLandmarkById(id);
    await this.landmarkRepository.remove(landmark);
  }

  async verifyLandmark(
    id: string,
    approved: boolean,
    reason?: string
  ): Promise<void> {
    const landmark = await this.getLandmarkById(id);
    
    landmark.verificationStatus = approved 
      ? LandmarkVerificationStatus.VERIFIED 
      : LandmarkVerificationStatus.REJECTED;

    await this.landmarkRepository.save(landmark);
  }

  async getLandmarksByType(type: LandmarkType): Promise<Landmark[]> {
    return this.landmarkRepository.find({
      where: { type },
      relations: ['neighborhood'],
      order: { name: 'ASC' },
    });
  }

  async getLandmarksByVerificationStatus(status: LandmarkVerificationStatus): Promise<Landmark[]> {
    return this.landmarkRepository.find({
      where: { verificationStatus: status },
      relations: ['neighborhood'],
      order: { createdAt: 'DESC' },
    });
  }

  async getLandmarksInRadius(
    latitude: number,
    longitude: number,
    radius: number,
    type?: LandmarkType
  ): Promise<Landmark[]> {
    const query = this.landmarkRepository
      .createQueryBuilder('landmark')
      .leftJoinAndSelect('landmark.neighborhood', 'neighborhood')
      .where(
        'ST_DWithin(landmark.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), :radius)',
        { lng: longitude, lat: latitude, radius }
      )
      .orderBy('ST_Distance(landmark.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))', 'ASC');

    if (type) {
      query.andWhere('landmark.type = :type', { type });
    }

    return query.getMany();
  }

  async getLandmarkStats(): Promise<{
    total: number;
    verified: number;
    pending: number;
    rejected: number;
    byType: Record<string, number>;
  }> {
    const [total, verified, pending, rejected] = await Promise.all([
      this.landmarkRepository.count(),
      this.landmarkRepository.count({ where: { verificationStatus: LandmarkVerificationStatus.VERIFIED } }),
      this.landmarkRepository.count({ where: { verificationStatus: LandmarkVerificationStatus.PENDING } }),
      this.landmarkRepository.count({ where: { verificationStatus: LandmarkVerificationStatus.REJECTED } }),
    ]);

    // Get count by type
    const typeStats = await this.landmarkRepository
      .createQueryBuilder('landmark')
      .select('landmark.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('landmark.type')
      .getRawMany();

    const byType = typeStats.reduce((acc, stat) => {
      acc[stat.type] = parseInt(stat.count);
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      verified,
      pending,
      rejected,
      byType,
    };
  }

  /**
   * Create landmark (user-submitted)
   */
  async createLandmark(dto: CreateLandmarkDto): Promise<Landmark> {
    const landmark = this.landmarkRepository.create({
      ...dto,
      location: {
        type: 'Point',
        coordinates: [dto.location.longitude, dto.location.latitude],
      },
      verificationStatus: LandmarkVerificationStatus.PENDING,
    });

    return this.landmarkRepository.save(landmark);
  }

  /**
   * Get nearby landmarks for a neighborhood (simplified version)
   */
  async getNearbyLandmarksSimple(neighborhoodId: string): Promise<Landmark[]> {
    return this.landmarkRepository.find({
      where: { neighborhoodId },
      relations: ['neighborhood'],
      order: { name: 'ASC' },
    });
  }

  /**
   * Verify landmark (admin function)
   */
  async verifyLandmark(landmarkId: string): Promise<void> {
    const landmark = await this.getLandmarkById(landmarkId);
    landmark.verificationStatus = LandmarkVerificationStatus.VERIFIED;
    await this.landmarkRepository.save(landmark);
  }

  /**
   * Search landmarks by query and type
   */
  async searchLandmarks(query: string, type?: string): Promise<Landmark[]> {
    const searchDto: LandmarkSearchDto = {
      query,
      type,
      limit: 20,
      offset: 0,
    };

    const result = await this.searchLandmarks(searchDto);
    return result.data;
  }
}
