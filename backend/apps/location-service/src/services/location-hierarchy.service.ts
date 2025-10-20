import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { State, LocalGovernmentArea, Ward, Neighborhood } from '@app/database/entities';

export interface LocationHierarchy {
  state: State;
  lga: LocalGovernmentArea;
  ward: Ward;
  neighborhood: Neighborhood;
}

@Injectable()
export class LocationHierarchyService {
  constructor(
    @InjectRepository(State)
    private readonly stateRepository: Repository<State>,
    @InjectRepository(LocalGovernmentArea)
    private readonly lgaRepository: Repository<LocalGovernmentArea>,
    @InjectRepository(Ward)
    private readonly wardRepository: Repository<Ward>,
    @InjectRepository(Neighborhood)
    private readonly neighborhoodRepository: Repository<Neighborhood>,
  ) {}

  /**
   * Get all states
   */
  async getStates(): Promise<State[]> {
    return this.stateRepository.find({
      order: { name: 'ASC' },
    });
  }

  /**
   * Get LGAs by state ID
   */
  async getLGAsByState(stateId: string): Promise<LocalGovernmentArea[]> {
    return this.lgaRepository.find({
      where: { stateId },
      relations: ['state'],
      order: { name: 'ASC' },
    });
  }

  /**
   * Get wards by LGA ID
   */
  async getWardsByLGA(lgaId: string): Promise<Ward[]> {
    return this.wardRepository.find({
      where: { lgaId },
      relations: ['lga', 'lga.state'],
      order: { name: 'ASC' },
    });
  }

  /**
   * Get neighborhoods by ward ID
   */
  async getNeighborhoodsByWard(wardId: string): Promise<Neighborhood[]> {
    return this.neighborhoodRepository.find({
      where: { wardId },
      relations: ['ward', 'ward.lga', 'ward.lga.state'],
      order: { name: 'ASC' },
    });
  }

  /**
   * Get full location hierarchy for a neighborhood
   */
  async getNeighborhoodHierarchy(neighborhoodId: string): Promise<LocationHierarchy> {
    const neighborhood = await this.neighborhoodRepository.findOne({
      where: { id: neighborhoodId },
      relations: [
        'ward',
        'ward.lga',
        'ward.lga.state',
        'parentNeighborhood',
        'subNeighborhoods',
      ],
    });

    if (!neighborhood) {
      throw new Error(`Neighborhood with ID ${neighborhoodId} not found`);
    }

    if (!neighborhood.ward) {
      throw new Error(`Ward not found for neighborhood ${neighborhoodId}`);
    }

    if (!neighborhood.ward.lga) {
      throw new Error(`LGA not found for ward ${neighborhood.ward.id}`);
    }

    if (!neighborhood.ward.lga.state) {
      throw new Error(`State not found for LGA ${neighborhood.ward.lga.id}`);
    }

    return {
      state: neighborhood.ward.lga.state,
      lga: neighborhood.ward.lga,
      ward: neighborhood.ward,
      neighborhood,
    };
  }

  /**
   * Get location hierarchy by coordinates
   */
  async getHierarchyByCoordinates(
    latitude: number,
    longitude: number
  ): Promise<Partial<LocationHierarchy>> {
    // This would typically use PostGIS to find which administrative areas contain the point
    // For now, we'll return a basic structure that would be populated by geospatial queries
    
    return {
      state: null as any,
      lga: null as any,
      ward: null as any,
      neighborhood: null as any,
    };
  }

  /**
   * Get all states with their LGA counts
   */
  async getStatesWithLgaCounts(): Promise<Array<State & { lgaCount: number }>> {
    const states = await this.stateRepository.find({
      order: { name: 'ASC' },
    });

    const statesWithCounts = await Promise.all(
      states.map(async (state) => {
        const lgaCount = await this.lgaRepository.count({
          where: { stateId: state.id },
        });
        return { ...state, lgaCount };
      })
    );

    return statesWithCounts;
  }

  /**
   * Get all LGAs with their ward counts
   */
  async getLgasWithWardCounts(): Promise<Array<LocalGovernmentArea & { wardCount: number }>> {
    const lgas = await this.lgaRepository.find({
      relations: ['state'],
      order: { name: 'ASC' },
    });

    const lgasWithCounts = await Promise.all(
      lgas.map(async (lga) => {
        const wardCount = await this.wardRepository.count({
          where: { lgaId: lga.id },
        });
        return { ...lga, wardCount };
      })
    );

    return lgasWithCounts;
  }

  /**
   * Get all wards with their neighborhood counts
   */
  async getWardsWithNeighborhoodCounts(): Promise<Array<Ward & { neighborhoodCount: number }>> {
    const wards = await this.wardRepository.find({
      relations: ['lga', 'lga.state'],
      order: { name: 'ASC' },
    });

    const wardsWithCounts = await Promise.all(
      wards.map(async (ward) => {
        const neighborhoodCount = await this.neighborhoodRepository.count({
          where: { wardId: ward.id },
        });
        return { ...ward, neighborhoodCount };
      })
    );

    return wardsWithCounts;
  }

  /**
   * Search across all location levels
   */
  async searchAll(query: string): Promise<{
    states: State[];
    lgas: LocalGovernmentArea[];
    wards: Ward[];
    neighborhoods: Neighborhood[];
  }> {
    const [states, lgas, wards, neighborhoods] = await Promise.all([
      this.stateRepository
        .createQueryBuilder('state')
        .where('LOWER(state.name) LIKE LOWER(:query)', { query: `%${query}%` })
        .orWhere('LOWER(state.code) LIKE LOWER(:query)', { query: `%${query}%` })
        .orderBy('state.name', 'ASC')
        .getMany(),
      
      this.lgaRepository
        .createQueryBuilder('lga')
        .leftJoinAndSelect('lga.state', 'state')
        .where('LOWER(lga.name) LIKE LOWER(:query)', { query: `%${query}%` })
        .orWhere('LOWER(lga.code) LIKE LOWER(:query)', { query: `%${query}%` })
        .orderBy('lga.name', 'ASC')
        .getMany(),
      
      this.wardRepository
        .createQueryBuilder('ward')
        .leftJoinAndSelect('ward.lga', 'lga')
        .leftJoinAndSelect('lga.state', 'state')
        .where('LOWER(ward.name) LIKE LOWER(:query)', { query: `%${query}%` })
        .orWhere('LOWER(ward.code) LIKE LOWER(:query)', { query: `%${query}%` })
        .orderBy('ward.name', 'ASC')
        .getMany(),
      
      this.neighborhoodRepository
        .createQueryBuilder('neighborhood')
        .leftJoinAndSelect('neighborhood.ward', 'ward')
        .leftJoinAndSelect('ward.lga', 'lga')
        .leftJoinAndSelect('lga.state', 'state')
        .where('LOWER(neighborhood.name) LIKE LOWER(:query)', { query: `%${query}%` })
        .orderBy('neighborhood.name', 'ASC')
        .getMany(),
    ]);

    return { states, lgas, wards, neighborhoods };
  }
}
