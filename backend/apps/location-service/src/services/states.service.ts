import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { State } from '../../../libs/database/src/entities';

@Injectable()
export class StatesService {
  constructor(
    @InjectRepository(State)
    private readonly stateRepository: Repository<State>,
  ) {}

  async getAllStates(): Promise<State[]> {
    return this.stateRepository.find({
      order: { name: 'ASC' },
    });
  }

  async getStateById(id: string): Promise<State> {
    const state = await this.stateRepository.findOne({
      where: { id },
    });

    if (!state) {
      throw new Error(`State with ID ${id} not found`);
    }

    return state;
  }

  async getStateByCode(code: string): Promise<State> {
    const state = await this.stateRepository.findOne({
      where: { code },
    });

    if (!state) {
      throw new Error(`State with code ${code} not found`);
    }

    return state;
  }

  async searchStates(query: string): Promise<State[]> {
    return this.stateRepository
      .createQueryBuilder('state')
      .where('LOWER(state.name) LIKE LOWER(:query)', { query: `%${query}%` })
      .orWhere('LOWER(state.code) LIKE LOWER(:query)', { query: `%${query}%` })
      .orderBy('state.name', 'ASC')
      .getMany();
  }
}
