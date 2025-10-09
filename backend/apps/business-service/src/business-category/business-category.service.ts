import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessCategory } from '@app/database/entities/business-category.entity';

@Injectable()
export class BusinessCategoryService {
  constructor(
    @InjectRepository(BusinessCategory)
    private categoryRepo: Repository<BusinessCategory>,
  ) {}

  async findAll(): Promise<BusinessCategory[]> {
    return await this.categoryRepo.find({
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<BusinessCategory | null> {
    return await this.categoryRepo.findOne({ where: { id } });
  }

  async getSubcategories(categoryId: string): Promise<string[]> {
    const category = await this.findById(categoryId);
    return category?.subcategories || [];
  }

  async searchCategories(query: string): Promise<BusinessCategory[]> {
    return await this.categoryRepo
      .createQueryBuilder('category')
      .where('LOWER(category.name) LIKE LOWER(:query)', { query: `%${query}%` })
      .orWhere('LOWER(category.description) LIKE LOWER(:query)', { query: `%${query}%` })
      .orderBy('category.name', 'ASC')
      .getMany();
  }
}
