import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListingCategory } from '@app/database';

@Injectable()
export class ListingCategoriesService {
  constructor(
    @InjectRepository(ListingCategory)
    private readonly categoryRepository: Repository<ListingCategory>,
  ) {}

  async findAll(listingType?: string): Promise<ListingCategory[]> {
    const query = this.categoryRepository
      .createQueryBuilder('category')
      .where('category.isActive = :isActive', { isActive: true })
      .orderBy('category.displayOrder', 'ASC')
      .addOrderBy('category.name', 'ASC');

    if (listingType) {
      query.andWhere('category.listingType = :listingType', { listingType });
    }

    return query.getMany();
  }

  async findOne(id: number): Promise<ListingCategory> {
    const category = await this.categoryRepository.findOne({
      where: { id, isActive: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }
}
