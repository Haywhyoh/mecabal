import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserLocation } from '@app/database';
import { VerificationStatus } from '@app/database/entities/user-location.entity';
import { CreateUserLocationDto, UpdateUserLocationDto } from '../dto/user-location.dto';

@Injectable()
export class UserLocationService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserLocation)
    private readonly userLocationRepository: Repository<UserLocation>,
  ) {}

  /**
   * Set user's primary location
   */
  async setPrimaryLocation(
    userId: string,
    createLocationDto: CreateUserLocationDto
  ): Promise<UserLocation> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Create new location
    const userLocation = this.userLocationRepository.create({
      ...createLocationDto,
      userId,
      isPrimary: true,
      verificationStatus: VerificationStatus.UNVERIFIED,
    });

    // If this is being set as primary, unset any existing primary location
    if (createLocationDto.isPrimary !== false) {
      await this.userLocationRepository.update(
        { userId, isPrimary: true },
        { isPrimary: false }
      );
    }

    const savedLocation = await this.userLocationRepository.save(userLocation);

    // Update user's primary location ID
    await this.userRepository.update(userId, {
      primaryLocationId: savedLocation.id,
    });

    return savedLocation;
  }

  /**
   * Add secondary location for user
   */
  async addSecondaryLocation(
    userId: string,
    createLocationDto: CreateUserLocationDto
  ): Promise<UserLocation> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userLocation = this.userLocationRepository.create({
      ...createLocationDto,
      userId,
      isPrimary: false,
      verificationStatus: VerificationStatus.UNVERIFIED,
    });

    return this.userLocationRepository.save(userLocation);
  }

  /**
   * Update user location
   */
  async updateUserLocation(
    locationId: string,
    updateLocationDto: UpdateUserLocationDto,
    userId: string
  ): Promise<UserLocation> {
    const userLocation = await this.userLocationRepository.findOne({
      where: { id: locationId, userId },
      relations: ['neighborhood', 'ward', 'lga', 'state'],
    });

    if (!userLocation) {
      throw new NotFoundException('User location not found');
    }

    // If updating to primary, unset other primary locations
    if (updateLocationDto.isPrimary) {
      await this.userLocationRepository.update(
        { userId, isPrimary: true },
        { isPrimary: false }
      );

      // Update user's primary location ID
      await this.userRepository.update(userId, {
        primaryLocationId: locationId,
      });
    }

    Object.assign(userLocation, updateLocationDto);
    return this.userLocationRepository.save(userLocation);
  }

  /**
   * Get user's primary location
   */
  async getPrimaryLocation(userId: string): Promise<UserLocation | null> {
    return this.userLocationRepository.findOne({
      where: { userId, isPrimary: true },
      relations: ['neighborhood', 'ward', 'lga', 'state'],
    });
  }

  /**
   * Get all user locations
   */
  async getUserLocations(userId: string): Promise<UserLocation[]> {
    return this.userLocationRepository.find({
      where: { userId },
      relations: ['neighborhood', 'ward', 'lga', 'state'],
      order: { isPrimary: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Get user location by ID
   */
  async getUserLocationById(
    locationId: string,
    userId: string
  ): Promise<UserLocation> {
    const userLocation = await this.userLocationRepository.findOne({
      where: { id: locationId, userId },
      relations: ['neighborhood', 'ward', 'lga', 'state'],
    });

    if (!userLocation) {
      throw new NotFoundException('User location not found');
    }

    return userLocation;
  }

  /**
   * Delete user location
   */
  async deleteUserLocation(locationId: string, userId: string): Promise<void> {
    const userLocation = await this.userLocationRepository.findOne({
      where: { id: locationId, userId },
    });

    if (!userLocation) {
      throw new NotFoundException('User location not found');
    }

    // If deleting primary location, update user's primary location ID
    if (userLocation.isPrimary) {
      await this.userRepository.update(userId, {
        primaryLocationId: undefined,
      });
    }

    await this.userLocationRepository.remove(userLocation);
  }

  /**
   * Set location as primary
   */
  async setLocationAsPrimary(locationId: string, userId: string): Promise<UserLocation> {
    const userLocation = await this.userLocationRepository.findOne({
      where: { id: locationId, userId },
    });

    if (!userLocation) {
      throw new NotFoundException('User location not found');
    }

    // Unset current primary location
    await this.userLocationRepository.update(
      { userId, isPrimary: true },
      { isPrimary: false }
    );

    // Set new primary location
    userLocation.isPrimary = true;
    const savedLocation = await this.userLocationRepository.save(userLocation);

    // Update user's primary location ID
    await this.userRepository.update(userId, {
      primaryLocationId: locationId,
    });

    return savedLocation;
  }

  /**
   * Verify user location
   */
  async verifyUserLocation(
    locationId: string,
    userId: string,
    verificationStatus: VerificationStatus,
    reason?: string
  ): Promise<UserLocation> {
    const userLocation = await this.userLocationRepository.findOne({
      where: { id: locationId, userId },
    });

    if (!userLocation) {
      throw new NotFoundException('User location not found');
    }

    userLocation.verificationStatus = verificationStatus;
    return this.userLocationRepository.save(userLocation);
  }

  /**
   * Get location verification status
   */
  async getLocationVerificationStatus(userId: string): Promise<{
    totalLocations: number;
    verifiedLocations: number;
    pendingLocations: number;
    unverifiedLocations: number;
  }> {
    const [total, verified, pending, unverified] = await Promise.all([
      this.userLocationRepository.count({ where: { userId } }),
      this.userLocationRepository.count({ 
        where: { userId, verificationStatus: VerificationStatus.VERIFIED } 
      }),
      this.userLocationRepository.count({ 
        where: { userId, verificationStatus: VerificationStatus.PENDING } 
      }),
      this.userLocationRepository.count({ 
        where: { userId, verificationStatus: VerificationStatus.UNVERIFIED } 
      }),
    ]);

    return {
      totalLocations: total,
      verifiedLocations: verified,
      pendingLocations: pending,
      unverifiedLocations: unverified,
    };
  }

  /**
   * Get users in same neighborhood
   */
  async getUsersInNeighborhood(
    neighborhoodId: string,
    excludeUserId?: string
  ): Promise<User[]> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.primaryLocation', 'primaryLocation')
      .leftJoinAndSelect('primaryLocation.neighborhood', 'neighborhood')
      .where('primaryLocation.neighborhoodId = :neighborhoodId', { neighborhoodId })
      .andWhere('primaryLocation.isPrimary = :isPrimary', { isPrimary: true });

    if (excludeUserId) {
      query.andWhere('user.id != :excludeUserId', { excludeUserId });
    }

    return query.getMany();
  }

  /**
   * Get users in same LGA
   */
  async getUsersInLga(
    lgaId: string,
    excludeUserId?: string
  ): Promise<User[]> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.primaryLocation', 'primaryLocation')
      .leftJoinAndSelect('primaryLocation.lga', 'lga')
      .where('primaryLocation.lgaId = :lgaId', { lgaId })
      .andWhere('primaryLocation.isPrimary = :isPrimary', { isPrimary: true });

    if (excludeUserId) {
      query.andWhere('user.id != :excludeUserId', { excludeUserId });
    }

    return query.getMany();
  }

  /**
   * Get users in same state
   */
  async getUsersInState(
    stateId: string,
    excludeUserId?: string
  ): Promise<User[]> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.primaryLocation', 'primaryLocation')
      .leftJoinAndSelect('primaryLocation.state', 'state')
      .where('primaryLocation.stateId = :stateId', { stateId })
      .andWhere('primaryLocation.isPrimary = :isPrimary', { isPrimary: true });

    if (excludeUserId) {
      query.andWhere('user.id != :excludeUserId', { excludeUserId });
    }

    return query.getMany();
  }

  /**
   * Find nearby users within radius
   */
  async findNearbyUsers(
    userId: string,
    radius: number = 5000 // 5km default
  ): Promise<Array<any & { distance: number }>> {
    const userLocation = await this.getPrimaryLocation(userId);
    
    if (!userLocation || !userLocation.coordinates) {
      return [];
    }

    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.primaryLocation', 'primaryLocation')
      .leftJoinAndSelect('primaryLocation.neighborhood', 'neighborhood')
      .addSelect(
        'ST_Distance(primaryLocation.coordinates, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))',
        'distance'
      )
      .where('primaryLocation.coordinates IS NOT NULL')
      .andWhere('primaryLocation.isPrimary = :isPrimary', { isPrimary: true })
      .andWhere('user.id != :userId', { userId })
      .andWhere(
        'ST_DWithin(primaryLocation.coordinates, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), :radius)',
        { 
          lng: userLocation.coordinates.coordinates[0], 
          lat: userLocation.coordinates.coordinates[1], 
          radius 
        }
      )
      .orderBy('distance', 'ASC')
      .limit(50);

    const results = await query.getRawAndEntities();
    
    return results.entities.map((entity, index) => ({
      ...entity,
      distance: parseFloat(results.raw[index].distance),
    }));
  }

  /**
   * Migrate user from old location fields to new UserLocation entity
   */
  async migrateUserLocation(userId: string): Promise<UserLocation | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || !user.primaryNeighborhood) {
      return null;
    }

    // Check if user already has a primary location
    const existingLocation = await this.getPrimaryLocation(userId);
    if (existingLocation) {
      return existingLocation;
    }

    // Create UserLocation from existing neighborhood data
    const userLocation = this.userLocationRepository.create({
      userId,
      stateId: user.primaryNeighborhood.ward?.lga?.state?.id || '',
      lgaId: user.primaryNeighborhood.ward?.lga?.id || '',
      wardId: user.primaryNeighborhood.ward?.id,
      neighborhoodId: user.primaryNeighborhood.id,
      isPrimary: true,
      verificationStatus: VerificationStatus.UNVERIFIED,
    });

    const savedLocation = await this.userLocationRepository.save(userLocation);

    // Update user's primary location ID
    await this.userRepository.update(userId, {
      primaryLocationId: savedLocation.id,
    });

    return savedLocation;
  }
}
