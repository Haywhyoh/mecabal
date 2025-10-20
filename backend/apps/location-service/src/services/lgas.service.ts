import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocalGovernmentArea, LGAType } from '@app/database/entities';

@Injectable()
export class LgasService {
  constructor(
    @InjectRepository(LocalGovernmentArea)
    private readonly lgaRepository: Repository<LocalGovernmentArea>,
  ) {}

  async getLgasByState(stateId: string, type?: LGAType): Promise<LocalGovernmentArea[]> {
    const query = this.lgaRepository
      .createQueryBuilder('lga')
      .leftJoinAndSelect('lga.state', 'state')
      .where('lga.stateId = :stateId', { stateId })
      .orderBy('lga.name', 'ASC');

    if (type) {
      query.andWhere('lga.type = :type', { type });
    }

    return query.getMany();
  }

  async getLgaById(id: string): Promise<LocalGovernmentArea> {
    const lga = await this.lgaRepository.findOne({
      where: { id },
      relations: ['state'],
    });

    if (!lga) {
      throw new Error(`LGA with ID ${id} not found`);
    }

    return lga;
  }

  async getLgaByCode(code: string): Promise<LocalGovernmentArea> {
    const lga = await this.lgaRepository.findOne({
      where: { code },
      relations: ['state'],
    });

    if (!lga) {
      throw new Error(`LGA with code ${code} not found`);
    }

    return lga;
  }

  async searchLgas(query: string, stateId?: string): Promise<LocalGovernmentArea[]> {
    const queryBuilder = this.lgaRepository
      .createQueryBuilder('lga')
      .leftJoinAndSelect('lga.state', 'state')
      .where('LOWER(lga.name) LIKE LOWER(:query)', { query: `%${query}%` })
      .orWhere('LOWER(lga.code) LIKE LOWER(:query)', { query: `%${query}%` })
      .orderBy('lga.name', 'ASC');

    if (stateId) {
      queryBuilder.andWhere('lga.stateId = :stateId', { stateId });
    }

    return queryBuilder.getMany();
  }

  async getLgaCountByState(stateId: string): Promise<{ total: number; lga: number; lcda: number }> {
    const [total, lga, lcda] = await Promise.all([
      this.lgaRepository.count({ where: { stateId } }),
      this.lgaRepository.count({ where: { stateId, type: LGAType.LGA } }),
      this.lgaRepository.count({ where: { stateId, type: LGAType.LCDA } }),
    ]);

    return { total, lga, lcda };
  }
}
