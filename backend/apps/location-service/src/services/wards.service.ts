import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ward } from '../../../libs/database/src/entities';

@Injectable()
export class WardsService {
  constructor(
    @InjectRepository(Ward)
    private readonly wardRepository: Repository<Ward>,
  ) {}

  async getWardsByLga(lgaId: string): Promise<Ward[]> {
    return this.wardRepository
      .createQueryBuilder('ward')
      .leftJoinAndSelect('ward.lga', 'lga')
      .where('ward.lgaId = :lgaId', { lgaId })
      .orderBy('ward.name', 'ASC')
      .getMany();
  }

  async getWardById(id: string): Promise<Ward> {
    const ward = await this.wardRepository.findOne({
      where: { id },
      relations: ['lga', 'lga.state'],
    });

    if (!ward) {
      throw new Error(`Ward with ID ${id} not found`);
    }

    return ward;
  }

  async getWardByCode(code: string): Promise<Ward> {
    const ward = await this.wardRepository.findOne({
      where: { code },
      relations: ['lga', 'lga.state'],
    });

    if (!ward) {
      throw new Error(`Ward with code ${code} not found`);
    }

    return ward;
  }

  async searchWards(query: string, lgaId?: string): Promise<Ward[]> {
    const queryBuilder = this.wardRepository
      .createQueryBuilder('ward')
      .leftJoinAndSelect('ward.lga', 'lga')
      .leftJoinAndSelect('lga.state', 'state')
      .where('LOWER(ward.name) LIKE LOWER(:query)', { query: `%${query}%` })
      .orWhere('LOWER(ward.code) LIKE LOWER(:query)', { query: `%${query}%` })
      .orderBy('ward.name', 'ASC');

    if (lgaId) {
      queryBuilder.andWhere('ward.lgaId = :lgaId', { lgaId });
    }

    return queryBuilder.getMany();
  }

  async getWardCountByLga(lgaId: string): Promise<number> {
    return this.wardRepository.count({ where: { lgaId } });
  }
}
