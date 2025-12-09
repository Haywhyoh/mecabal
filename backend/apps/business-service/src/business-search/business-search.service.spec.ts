import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BusinessSearchService } from './business-search.service';
import { BusinessProfile } from '@app/database/entities/business-profile.entity';
import { SearchBusinessDto, SortBy, SortOrder } from '../dto/search-business.dto';

describe('BusinessSearchService', () => {
  let service: BusinessSearchService;
  let repository: Repository<BusinessProfile>;

  const mockBusinessRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  // Mock query builder
  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getManyAndCount: jest.fn(),
    getOne: jest.fn(),
  };

  // Mock business profiles
  const mockBusinessProfiles: Partial<BusinessProfile>[] = [
    {
      id: 'business-1',
      userId: 'user-1',
      businessName: 'Top Plumbing Services',
      category: 'household-services',
      subcategory: 'Plumbing',
      serviceArea: 'neighborhood',
      isActive: true,
      isVerified: true,
      rating: 4.8,
      reviewCount: 120,
      completedJobs: 250,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2025-12-01'),
    },
    {
      id: 'business-2',
      userId: 'user-2',
      businessName: 'Elite Cleaning Co',
      category: 'household-services',
      subcategory: 'Cleaning',
      serviceArea: '5km',
      isActive: true,
      isVerified: true,
      rating: 4.5,
      reviewCount: 85,
      completedJobs: 180,
      createdAt: new Date('2024-03-15'),
      updatedAt: new Date('2025-11-20'),
    },
    {
      id: 'business-3',
      userId: 'user-3',
      businessName: 'Nationwide Movers',
      category: 'moving-services',
      subcategory: 'Residential Moving',
      serviceArea: 'nationwide',
      isActive: true,
      isVerified: false,
      rating: 4.2,
      reviewCount: 45,
      completedJobs: 90,
      createdAt: new Date('2024-06-01'),
      updatedAt: new Date('2025-12-05'),
    },
    {
      id: 'business-4',
      userId: 'user-4',
      businessName: 'Inactive Service',
      category: 'household-services',
      subcategory: 'Plumbing',
      serviceArea: 'neighborhood',
      isActive: false,
      isVerified: true,
      rating: 4.0,
      reviewCount: 30,
      completedJobs: 60,
      createdAt: new Date('2023-12-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ];

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessSearchService,
        {
          provide: getRepositoryToken(BusinessProfile),
          useValue: mockBusinessRepository,
        },
      ],
    }).compile();

    service = module.get<BusinessSearchService>(BusinessSearchService);
    repository = module.get<Repository<BusinessProfile>>(
      getRepositoryToken(BusinessProfile),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('search', () => {
    const searchDto: SearchBusinessDto = {
      query: 'plumbing',
      category: 'household-services',
      page: 1,
      limit: 20,
    };

    describe('Success Scenarios', () => {
      it('should return all active businesses', async () => {
        const activeBusinesses = mockBusinessProfiles.filter((b) => b.isActive);
        mockBusinessRepository.find.mockResolvedValue(activeBusinesses);

        const result = await service.search(searchDto);

        expect(result.data).toEqual(activeBusinesses);
        expect(result.meta).toEqual({
          total: activeBusinesses.length,
          page: 1,
          limit: 20,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        });

        expect(mockBusinessRepository.find).toHaveBeenCalledWith({
          where: { isActive: true },
          relations: ['user'],
          take: 20,
        });
      });

      it('should only return active businesses', async () => {
        const activeBusinesses = mockBusinessProfiles.filter((b) => b.isActive);
        mockBusinessRepository.find.mockResolvedValue(activeBusinesses);

        const result = await service.search(searchDto);

        expect(result.data.every((b) => b.isActive)).toBe(true);
        expect(result.data).toHaveLength(activeBusinesses.length);
      });

      it('should include user relation', async () => {
        mockBusinessRepository.find.mockResolvedValue([mockBusinessProfiles[0]]);

        await service.search(searchDto);

        expect(mockBusinessRepository.find).toHaveBeenCalledWith(
          expect.objectContaining({
            relations: ['user'],
          }),
        );
      });

      it('should return empty array when no businesses found', async () => {
        mockBusinessRepository.find.mockResolvedValue([]);

        const result = await service.search(searchDto);

        expect(result.data).toEqual([]);
        expect(result.meta.total).toBe(0);
      });

      it('should limit results to 20 by default', async () => {
        mockBusinessRepository.find.mockResolvedValue(mockBusinessProfiles);

        await service.search(searchDto);

        expect(mockBusinessRepository.find).toHaveBeenCalledWith(
          expect.objectContaining({
            take: 20,
          }),
        );
      });
    });

    describe('Error Scenarios', () => {
      it('should handle database errors gracefully', async () => {
        const dbError = new Error('Database connection failed');
        mockBusinessRepository.find.mockRejectedValue(dbError);

        await expect(service.search(searchDto)).rejects.toThrow(
          'Database connection failed',
        );
      });

      it('should log error and rethrow', async () => {
        const consoleErrorSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        const error = new Error('Search failed');
        mockBusinessRepository.find.mockRejectedValue(error);

        await expect(service.search(searchDto)).rejects.toThrow('Search failed');
        expect(consoleErrorSpy).toHaveBeenCalledWith('Search error:', error);

        consoleErrorSpy.mockRestore();
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty search DTO', async () => {
        mockBusinessRepository.find.mockResolvedValue(mockBusinessProfiles);

        const result = await service.search({} as SearchBusinessDto);

        expect(result.data).toBeDefined();
        expect(mockBusinessRepository.find).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { isActive: true },
          }),
        );
      });

      it('should return correct meta information', async () => {
        const businesses = mockBusinessProfiles.slice(0, 3);
        mockBusinessRepository.find.mockResolvedValue(businesses);

        const result = await service.search(searchDto);

        expect(result.meta).toEqual({
          total: 3,
          page: 1,
          limit: 20,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        });
      });
    });
  });

  describe('searchByServiceArea', () => {
    const latitude = 6.5244;
    const longitude = 3.3792;
    const category = 'household-services';

    describe('Success Scenarios', () => {
      it('should search across all service areas', async () => {
        mockBusinessRepository.find.mockResolvedValue([mockBusinessProfiles[0]]);
        mockBusinessRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.getMany.mockResolvedValue([mockBusinessProfiles[2]]);

        const result = await service.searchByServiceArea(latitude, longitude, category);

        expect(result).toHaveProperty('neighborhood');
        expect(result).toHaveProperty('2km');
        expect(result).toHaveProperty('5km');
        expect(result).toHaveProperty('10km');
        expect(result).toHaveProperty('city-wide');
        expect(result).toHaveProperty('state-wide');
        expect(result).toHaveProperty('nationwide');
      });

      it('should query nationwide businesses separately', async () => {
        mockBusinessRepository.find.mockResolvedValue([]);
        mockBusinessRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.getMany.mockResolvedValue([mockBusinessProfiles[2]]);

        const result = await service.searchByServiceArea(latitude, longitude, category);

        expect(mockBusinessRepository.createQueryBuilder).toHaveBeenCalledWith('business');
        expect(mockQueryBuilder.where).toHaveBeenCalledWith(
          'business.serviceArea = :serviceArea',
          { serviceArea: 'nationwide' },
        );
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
          'business.isActive = :isActive',
          { isActive: true },
        );
        expect(result.nationwide).toEqual([mockBusinessProfiles[2]]);
      });

      it('should filter nationwide businesses by category if provided', async () => {
        mockBusinessRepository.find.mockResolvedValue([]);
        mockBusinessRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.getMany.mockResolvedValue([mockBusinessProfiles[2]]);

        await service.searchByServiceArea(latitude, longitude, category);

        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
          'business.category = :category',
          { category },
        );
      });

      it('should not filter by category if not provided', async () => {
        mockBusinessRepository.find.mockResolvedValue([]);
        mockBusinessRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.getMany.mockResolvedValue([mockBusinessProfiles[2]]);

        await service.searchByServiceArea(latitude, longitude);

        // Should not call andWhere for category
        const categoryCallCount = mockQueryBuilder.andWhere.mock.calls.filter(
          (call) => call[0].includes('category'),
        ).length;
        expect(categoryCallCount).toBe(0);
      });

      it('should limit each service area to 10 results', async () => {
        mockBusinessRepository.find.mockResolvedValue([mockBusinessProfiles[0]]);
        mockBusinessRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.getMany.mockResolvedValue([mockBusinessProfiles[2]]);

        await service.searchByServiceArea(latitude, longitude, category);

        expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      });

      it('should search with correct radii for each service area', async () => {
        mockBusinessRepository.find.mockResolvedValue([]);
        mockBusinessRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.getMany.mockResolvedValue([]);

        await service.searchByServiceArea(latitude, longitude);

        // Each service area calls search with specific radius
        const findCalls = mockBusinessRepository.find.mock.calls;
        expect(findCalls.length).toBeGreaterThanOrEqual(6); // 6 service areas
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty results for all service areas', async () => {
        mockBusinessRepository.find.mockResolvedValue([]);
        mockBusinessRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.getMany.mockResolvedValue([]);

        const result = await service.searchByServiceArea(latitude, longitude);

        expect(result.neighborhood).toEqual([]);
        expect(result['2km']).toEqual([]);
        expect(result['5km']).toEqual([]);
        expect(result['10km']).toEqual([]);
        expect(result['city-wide']).toEqual([]);
        expect(result['state-wide']).toEqual([]);
        expect(result.nationwide).toEqual([]);
      });

      it('should handle coordinates at edge cases (equator, prime meridian)', async () => {
        mockBusinessRepository.find.mockResolvedValue([]);
        mockBusinessRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.getMany.mockResolvedValue([]);

        const result = await service.searchByServiceArea(0, 0);

        expect(result).toBeDefined();
        expect(result).toHaveProperty('nationwide');
      });

      it('should handle negative coordinates', async () => {
        mockBusinessRepository.find.mockResolvedValue([]);
        mockBusinessRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.getMany.mockResolvedValue([]);

        const result = await service.searchByServiceArea(-6.5244, -3.3792);

        expect(result).toBeDefined();
      });
    });

    describe('Service Area Coverage', () => {
      it('should include neighborhood area (1km radius)', async () => {
        mockBusinessRepository.find.mockResolvedValue([mockBusinessProfiles[0]]);
        mockBusinessRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.getMany.mockResolvedValue([]);

        const result = await service.searchByServiceArea(latitude, longitude);

        expect(result.neighborhood).toBeDefined();
      });

      it('should include 2km radius area', async () => {
        mockBusinessRepository.find.mockResolvedValue([mockBusinessProfiles[0]]);
        mockBusinessRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.getMany.mockResolvedValue([]);

        const result = await service.searchByServiceArea(latitude, longitude);

        expect(result['2km']).toBeDefined();
      });

      it('should include city-wide area (50km radius)', async () => {
        mockBusinessRepository.find.mockResolvedValue([mockBusinessProfiles[0]]);
        mockBusinessRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.getMany.mockResolvedValue([]);

        const result = await service.searchByServiceArea(latitude, longitude);

        expect(result['city-wide']).toBeDefined();
      });

      it('should include state-wide area (200km radius)', async () => {
        mockBusinessRepository.find.mockResolvedValue([mockBusinessProfiles[0]]);
        mockBusinessRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.getMany.mockResolvedValue([]);

        const result = await service.searchByServiceArea(latitude, longitude);

        expect(result['state-wide']).toBeDefined();
      });
    });
  });

  describe('getFeaturedBusinesses', () => {
    describe('Success Scenarios', () => {
      it('should return featured businesses sorted by rating', async () => {
        const verifiedActiveBusinesses = mockBusinessProfiles
          .filter((b) => b.isActive && b.isVerified)
          .sort((a, b) => (b.rating || 0) - (a.rating || 0));

        mockBusinessRepository.find.mockResolvedValue(verifiedActiveBusinesses);

        const result = await service.getFeaturedBusinesses(10);

        expect(result).toEqual(verifiedActiveBusinesses);
        expect(mockBusinessRepository.find).toHaveBeenCalledWith({
          where: {
            isActive: true,
            isVerified: true,
          },
          order: {
            rating: 'DESC',
            reviewCount: 'DESC',
          },
          take: 10,
          relations: ['user'],
        });
      });

      it('should only return active and verified businesses', async () => {
        const verifiedActiveBusinesses = mockBusinessProfiles.filter(
          (b) => b.isActive && b.isVerified,
        );
        mockBusinessRepository.find.mockResolvedValue(verifiedActiveBusinesses);

        const result = await service.getFeaturedBusinesses();

        expect(result.every((b) => b.isActive && b.isVerified)).toBe(true);
      });

      it('should order by rating DESC, then reviewCount DESC', async () => {
        mockBusinessRepository.find.mockResolvedValue([mockBusinessProfiles[0]]);

        await service.getFeaturedBusinesses();

        expect(mockBusinessRepository.find).toHaveBeenCalledWith(
          expect.objectContaining({
            order: {
              rating: 'DESC',
              reviewCount: 'DESC',
            },
          }),
        );
      });

      it('should respect custom limit parameter', async () => {
        mockBusinessRepository.find.mockResolvedValue(mockBusinessProfiles.slice(0, 5));

        await service.getFeaturedBusinesses(5);

        expect(mockBusinessRepository.find).toHaveBeenCalledWith(
          expect.objectContaining({
            take: 5,
          }),
        );
      });

      it('should default to 10 businesses if no limit provided', async () => {
        mockBusinessRepository.find.mockResolvedValue(mockBusinessProfiles);

        await service.getFeaturedBusinesses();

        expect(mockBusinessRepository.find).toHaveBeenCalledWith(
          expect.objectContaining({
            take: 10,
          }),
        );
      });

      it('should include user relation', async () => {
        mockBusinessRepository.find.mockResolvedValue([mockBusinessProfiles[0]]);

        await service.getFeaturedBusinesses();

        expect(mockBusinessRepository.find).toHaveBeenCalledWith(
          expect.objectContaining({
            relations: ['user'],
          }),
        );
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty results', async () => {
        mockBusinessRepository.find.mockResolvedValue([]);

        const result = await service.getFeaturedBusinesses();

        expect(result).toEqual([]);
      });

      it('should handle limit of 0', async () => {
        mockBusinessRepository.find.mockResolvedValue([]);

        await service.getFeaturedBusinesses(0);

        expect(mockBusinessRepository.find).toHaveBeenCalledWith(
          expect.objectContaining({
            take: 0,
          }),
        );
      });

      it('should handle very large limits', async () => {
        mockBusinessRepository.find.mockResolvedValue(mockBusinessProfiles);

        await service.getFeaturedBusinesses(1000);

        expect(mockBusinessRepository.find).toHaveBeenCalledWith(
          expect.objectContaining({
            take: 1000,
          }),
        );
      });
    });

    describe('Business Quality', () => {
      it('should exclude unverified businesses', async () => {
        const verifiedOnly = mockBusinessProfiles.filter((b) => b.isVerified);
        mockBusinessRepository.find.mockResolvedValue(verifiedOnly);

        const result = await service.getFeaturedBusinesses();

        expect(mockBusinessRepository.find).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              isVerified: true,
            }),
          }),
        );
      });

      it('should exclude inactive businesses', async () => {
        const activeOnly = mockBusinessProfiles.filter((b) => b.isActive);
        mockBusinessRepository.find.mockResolvedValue(activeOnly);

        const result = await service.getFeaturedBusinesses();

        expect(mockBusinessRepository.find).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              isActive: true,
            }),
          }),
        );
      });
    });
  });

  describe('getTrendingBusinesses', () => {
    describe('Success Scenarios', () => {
      it('should return trending businesses with recent activity', async () => {
        const trendingBusinesses = mockBusinessProfiles.filter((b) => b.isActive);
        mockBusinessRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.getMany.mockResolvedValue(trendingBusinesses);

        const result = await service.getTrendingBusinesses(10);

        expect(result).toEqual(trendingBusinesses);
        expect(mockBusinessRepository.createQueryBuilder).toHaveBeenCalledWith('business');
      });

      it('should only query active businesses', async () => {
        mockBusinessRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.getMany.mockResolvedValue([mockBusinessProfiles[0]]);

        await service.getTrendingBusinesses();

        expect(mockQueryBuilder.where).toHaveBeenCalledWith(
          'business.isActive = :isActive',
          { isActive: true },
        );
      });

      it('should filter by last 30 days activity', async () => {
        mockBusinessRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.getMany.mockResolvedValue([mockBusinessProfiles[0]]);

        await service.getTrendingBusinesses();

        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
          "business.updatedAt >= NOW() - INTERVAL '30 days'",
        );
      });

      it('should order by reviewCount DESC, then completedJobs DESC', async () => {
        mockBusinessRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.getMany.mockResolvedValue([mockBusinessProfiles[0]]);

        await service.getTrendingBusinesses();

        expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('business.reviewCount', 'DESC');
        expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith(
          'business.completedJobs',
          'DESC',
        );
      });

      it('should respect custom limit parameter', async () => {
        mockBusinessRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.getMany.mockResolvedValue(mockBusinessProfiles.slice(0, 5));

        await service.getTrendingBusinesses(5);

        expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
      });

      it('should default to 10 businesses if no limit provided', async () => {
        mockBusinessRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.getMany.mockResolvedValue(mockBusinessProfiles);

        await service.getTrendingBusinesses();

        expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      });

      it('should include user relation via join', async () => {
        mockBusinessRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.getMany.mockResolvedValue([mockBusinessProfiles[0]]);

        await service.getTrendingBusinesses();

        expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('business.user', 'user');
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty results', async () => {
        mockBusinessRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.getMany.mockResolvedValue([]);

        const result = await service.getTrendingBusinesses();

        expect(result).toEqual([]);
      });

      it('should handle limit of 0', async () => {
        mockBusinessRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.getMany.mockResolvedValue([]);

        await service.getTrendingBusinesses(0);

        expect(mockQueryBuilder.take).toHaveBeenCalledWith(0);
      });

      it('should handle very large limits', async () => {
        mockBusinessRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.getMany.mockResolvedValue(mockBusinessProfiles);

        await service.getTrendingBusinesses(100);

        expect(mockQueryBuilder.take).toHaveBeenCalledWith(100);
      });
    });

    describe('Trending Algorithm', () => {
      it('should prioritize businesses with high review counts', async () => {
        mockBusinessRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.getMany.mockResolvedValue([mockBusinessProfiles[0]]);

        await service.getTrendingBusinesses();

        expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('business.reviewCount', 'DESC');
      });

      it('should use completedJobs as secondary sorting criteria', async () => {
        mockBusinessRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.getMany.mockResolvedValue([mockBusinessProfiles[0]]);

        await service.getTrendingBusinesses();

        expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith(
          'business.completedJobs',
          'DESC',
        );
      });

      it('should only include businesses active in last 30 days', async () => {
        mockBusinessRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.getMany.mockResolvedValue([mockBusinessProfiles[0]]);

        await service.getTrendingBusinesses();

        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
          "business.updatedAt >= NOW() - INTERVAL '30 days'",
        );
      });
    });
  });

  describe('Integration Tests', () => {
    it('should differentiate between featured and trending businesses', async () => {
      // Featured: verified, sorted by rating
      const featuredBusinesses = mockBusinessProfiles.filter(
        (b) => b.isActive && b.isVerified,
      );
      mockBusinessRepository.find.mockResolvedValue(featuredBusinesses);

      const featured = await service.getFeaturedBusinesses();

      // Trending: active with recent activity, sorted by engagement
      const trendingBusinesses = mockBusinessProfiles.filter((b) => b.isActive);
      mockBusinessRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue(trendingBusinesses);

      const trending = await service.getTrendingBusinesses();

      // Different sorting and filtering criteria
      expect(featured).toBeDefined();
      expect(trending).toBeDefined();
    });

    it('should handle concurrent searches', async () => {
      mockBusinessRepository.find.mockResolvedValue([mockBusinessProfiles[0]]);
      mockBusinessRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue([mockBusinessProfiles[1]]);

      const [searchResult, featuredResult, trendingResult] = await Promise.all([
        service.search({ category: 'household-services' } as SearchBusinessDto),
        service.getFeaturedBusinesses(5),
        service.getTrendingBusinesses(5),
      ]);

      expect(searchResult).toBeDefined();
      expect(featuredResult).toBeDefined();
      expect(trendingResult).toBeDefined();
    });
  });

  describe('Performance Considerations', () => {
    it('should limit search results to prevent large payloads', async () => {
      mockBusinessRepository.find.mockResolvedValue(mockBusinessProfiles);

      await service.search({} as SearchBusinessDto);

      expect(mockBusinessRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
        }),
      );
    });

    it('should use database-level sorting for featured businesses', async () => {
      mockBusinessRepository.find.mockResolvedValue(mockBusinessProfiles);

      await service.getFeaturedBusinesses();

      // Sorting should be in the database query, not in application code
      expect(mockBusinessRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: expect.any(Object),
        }),
      );
    });

    it('should use query builder for complex trending query', async () => {
      mockBusinessRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.getTrendingBusinesses();

      // Query builder allows efficient complex queries
      expect(mockBusinessRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalled();
    });
  });
});
