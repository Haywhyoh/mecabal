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

  async findAllWithServiceCounts(): Promise<Array<BusinessCategory & { serviceCount: number }>> {
    const categories = await this.findAll();

    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const result = await this.categoryRepo
          .createQueryBuilder('category')
          .leftJoin('business_profiles', 'profile', 'profile.category = :categoryId AND profile.isActive = true', { categoryId: category.id })
          .leftJoin('business_services', 'service', 'service.businessId = profile.id')
          .where('category.id = :categoryId', { categoryId: category.id })
          .select('COUNT(DISTINCT service.id)', 'count')
          .getRawOne();

        return {
          ...category,
          serviceCount: parseInt(result?.count) || 0,
        };
      })
    );

    return categoriesWithCounts;
  }
}
