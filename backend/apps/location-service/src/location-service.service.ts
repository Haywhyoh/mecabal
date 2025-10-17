import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { 
  State, 
  LocalGovernmentArea, 
  Ward, 
  Neighborhood, 
  Landmark 
} from '../../libs/database/src/entities';

@Injectable()
export class LocationServiceService {
  constructor(
    @InjectRepository(State)
    private readonly stateRepository: Repository<State>,
    @InjectRepository(LocalGovernmentArea)
    private readonly lgaRepository: Repository<LocalGovernmentArea>,
    @InjectRepository(Ward)
    private readonly wardRepository: Repository<Ward>,
    @InjectRepository(Neighborhood)
    private readonly neighborhoodRepository: Repository<Neighborhood>,
    @InjectRepository(Landmark)
    private readonly landmarkRepository: Repository<Landmark>,
  ) {}

  async getStats() {
    const [states, lgas, wards, neighborhoods, landmarks] = await Promise.all([
      this.stateRepository.count(),
      this.lgaRepository.count(),
      this.wardRepository.count(),
      this.neighborhoodRepository.count(),
      this.landmarkRepository.count(),
    ]);

    return {
      success: true,
      data: {
        states,
        lgas,
        wards,
        neighborhoods,
        landmarks,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
