import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BusinessProfile } from '@app/database/entities/business-profile.entity';
import { SearchBusinessDto, SortBy } from '../dto/search-business.dto';

@Injectable()
export class BusinessSearchService {
  constructor(
    @InjectRepository(BusinessProfile)
    private businessRepo: Repository<BusinessProfile>,
  ) {}

  async search(searchDto: SearchBusinessDto) {
    try {
      // Simple search for now - just return all active businesses
      const businesses = await this.businessRepo.find({
        where: { isActive: true },
        relations: ['user'],
        take: 20,
      });

      return {
        data: businesses,
        meta: {
          total: businesses.length,
          page: 1,
          limit: 20,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  async searchByServiceArea(
    latitude: number,
    longitude: number,
    category?: string,
  ) {
    const serviceAreas = [
      { name: 'neighborhood', radius: 1 },
      { name: '2km', radius: 2 },
      { name: '5km', radius: 5 },
      { name: '10km', radius: 10 },
      { name: 'city-wide', radius: 50 },
      { name: 'state-wide', radius: 200 },
    ];

    const results: Record<string, any> = {};

    for (const area of serviceAreas) {
      const searchDto: SearchBusinessDto = {
        latitude,
        longitude,
        radius: area.radius,
        category,
        sortBy: SortBy.DISTANCE,
        page: 1,
        limit: 10,
      };

      const areaResults = await this.search(searchDto);
      results[area.name] = areaResults.data;
    }

    // Add nationwide businesses
    const nationwideQuery = this.businessRepo
      .createQueryBuilder('business')
      .where('business.serviceArea = :serviceArea', {
        serviceArea: 'nationwide',
      })
      .andWhere('business.isActive = :isActive', { isActive: true });

    if (category) {
      nationwideQuery.andWhere('business.category = :category', { category });
    }

    results['nationwide'] = await nationwideQuery.take(10).getMany();

    return results;
  }

  async getFeaturedBusinesses(limit: number = 10): Promise<BusinessProfile[]> {
    return await this.businessRepo.find({
      where: {
        isActive: true,
        isVerified: true,
      },
      order: {
        rating: 'DESC',
        reviewCount: 'DESC',
      },
      take: limit,
      relations: ['user'],
    });
  }

  async getTrendingBusinesses(limit: number = 10): Promise<BusinessProfile[]> {
    // Businesses with recent activity and high engagement
    return await this.businessRepo
      .createQueryBuilder('business')
      .where('business.isActive = :isActive', { isActive: true })
      .andWhere('business.updatedAt >= NOW() - INTERVAL \'30 days\'')
      .orderBy('business.reviewCount', 'DESC')
      .addOrderBy('business.completedJobs', 'DESC')
      .take(limit)
      .leftJoinAndSelect('business.user', 'user')
      .getMany();
  }
}
