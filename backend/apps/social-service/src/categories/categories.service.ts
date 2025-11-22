import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { PostCategory, Post } from '@app/database';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryResponseDto,
  CategoryFilterDto,
  CategoryStatsDto,
} from './dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(PostCategory)
    private readonly categoryRepository: Repository<PostCategory>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async createCategory(
    createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    // Check if category with same name already exists
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name },
    });

    if (existingCategory) {
      throw new BadRequestException('Category with this name already exists');
    }

    // Create the category
    const category = this.categoryRepository.create(createCategoryDto);
    const savedCategory = await this.categoryRepository.save(category);

    return this.formatCategoryResponse(savedCategory);
  }

  async getCategories(
    filterDto: CategoryFilterDto,
  ): Promise<CategoryResponseDto[]> {
    try {
      // Use simple query builder without GROUP BY since post count is calculated separately
      const queryBuilder = this.categoryRepository.createQueryBuilder('category');

      // Apply filters
      if (filterDto.isActive !== undefined) {
        queryBuilder.andWhere('category.isActive = :isActive', {
          isActive: filterDto.isActive,
        });
      }

      if (filterDto.search) {
        queryBuilder.andWhere(
          '(category.name ILIKE :search OR category.description ILIKE :search)',
          { search: `%${filterDto.search}%` },
        );
      }

      // Order by name
      queryBuilder.orderBy('category.name', 'ASC');

      const categories = await queryBuilder.getMany();

      // Format categories with post counts
      return Promise.all(
        categories.map((category) => this.formatCategoryResponse(category)),
      );
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  async getCategoryById(id: number): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.formatCategoryResponse(category);
  }

  async updateCategory(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if new name conflicts with existing category
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { name: updateCategoryDto.name },
      });

      if (existingCategory) {
        throw new BadRequestException('Category with this name already exists');
      }
    }

    // Update category
    Object.assign(category, updateCategoryDto);
    const updatedCategory = await this.categoryRepository.save(category);

    return this.formatCategoryResponse(updatedCategory);
  }

  async deleteCategory(id: number): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if category has posts
    const postCount = await this.postRepository.count({
      where: { categoryId: id },
    });

    if (postCount > 0) {
      throw new BadRequestException(
        'Cannot delete category with existing posts',
      );
    }

    await this.categoryRepository.remove(category);
  }

  async getCategoryStats(): Promise<CategoryStatsDto> {
    const totalCategories = await this.categoryRepository.count();
    const activeCategories = await this.categoryRepository.count({
      where: { isActive: true },
    });
    const inactiveCategories = totalCategories - activeCategories;

    // Get top categories by post count
    const topCategories = await this.postRepository
      .createQueryBuilder('post')
      .select('category.id', 'id')
      .addSelect('category.name', 'name')
      .addSelect('COUNT(post.id)', 'postCount')
      .leftJoin('post.category', 'category')
      .where('post.categoryId IS NOT NULL')
      .groupBy('category.id, category.name')
      .orderBy('postCount', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      totalCategories,
      activeCategories,
      inactiveCategories,
      topCategories: topCategories.map((cat) => ({
        id: parseInt(cat.id),
        name: cat.name,
        postCount: parseInt(cat.postCount),
      })),
    };
  }

  async seedDefaultCategories(): Promise<void> {
    const defaultCategories = [
      {
        name: 'Community News',
        description: 'News and updates about the community',
        colorCode: '#3498db',
        iconUrl: 'https://example.com/icons/news.png',
      },
      {
        name: 'Events',
        description: 'Community events and activities',
        colorCode: '#e74c3c',
        iconUrl: 'https://example.com/icons/events.png',
      },
      {
        name: 'Safety Alerts',
        description: 'Important safety information and alerts',
        colorCode: '#f39c12',
        iconUrl: 'https://example.com/icons/safety.png',
      },
      {
        name: 'Marketplace',
        description: 'Buy and sell items in the community',
        colorCode: '#2ecc71',
        iconUrl: 'https://example.com/icons/marketplace.png',
      },
      {
        name: 'Lost & Found',
        description: 'Lost and found items in the community',
        colorCode: '#9b59b6',
        iconUrl: 'https://example.com/icons/lost-found.png',
      },
      {
        name: 'General Discussion',
        description: 'General community discussions',
        colorCode: '#34495e',
        iconUrl: 'https://example.com/icons/discussion.png',
      },
    ];

    for (const categoryData of defaultCategories) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { name: categoryData.name },
      });

      if (!existingCategory) {
        const category = this.categoryRepository.create(categoryData);
        await this.categoryRepository.save(category);
      }
    }
  }

  // Removed createCategoriesQueryBuilder - no longer needed since we calculate post count separately
  // This method was causing issues with GROUP BY not selecting all category fields properly

  private async formatCategoryResponse(
    category: PostCategory,
  ): Promise<CategoryResponseDto> {
    // Get post count for this category
    const postCount = await this.postRepository.count({
      where: { categoryId: category.id },
    });

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      iconUrl: category.iconUrl,
      colorCode: category.colorCode,
      isActive: category.isActive,
      postCount,
      createdAt: new Date(), // TODO: Add createdAt to PostCategory entity
      updatedAt: new Date(), // TODO: Add updatedAt to PostCategory entity
    };
  }
}
