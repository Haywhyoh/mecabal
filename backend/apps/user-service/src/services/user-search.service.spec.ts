import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserSearchService } from './user-search.service';
import { User } from '@app/database';
import { Repository } from 'typeorm';

describe('UserSearchService', () => {
  let service: UserSearchService;
  let userRepository: Repository<User>;

  const mockUsers = [
    {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      occupation: 'Developer',
      state: 'Lagos',
      city: 'Lagos',
      estate: 'Victoria Island',
      culturalBackground: 'Yoruba',
      isActive: true,
      isVerified: true,
      trustScore: 85,
    },
    {
      id: 'user-2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      occupation: 'Designer',
      state: 'Lagos',
      city: 'Lagos',
      estate: 'Ikoyi',
      culturalBackground: 'Igbo',
      isActive: true,
      isVerified: true,
      trustScore: 90,
    },
  ];

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  const mockRepository = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSearchService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserSearchService>(UserSearchService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchUsers', () => {
    it('should search users with basic query', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockUsers, 2]);

      const searchDto = {
        query: 'John',
        page: 1,
        limit: 20,
      };

      const result = await service.searchUsers(searchDto);

      expect(result.users).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(user.firstName ILIKE :query OR user.lastName ILIKE :query OR user.email ILIKE :query OR user.occupation ILIKE :query)',
        { query: '%John%' },
      );
    });

    it('should search users with location filters', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockUsers, 2]);

      const searchDto = {
        state: 'Lagos',
        city: 'Lagos',
        page: 1,
        limit: 20,
      };

      const result = await service.searchUsers(searchDto);

      expect(result.users).toHaveLength(2);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.state = :state',
        { state: 'Lagos' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.city = :city',
        { city: 'Lagos' },
      );
    });

    it('should search users with cultural background filter', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockUsers, 2]);

      const searchDto = {
        culturalBackground: 'Yoruba',
        page: 1,
        limit: 20,
      };

      const result = await service.searchUsers(searchDto);

      expect(result.users).toHaveLength(2);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.culturalBackground = :culturalBackground',
        { culturalBackground: 'Yoruba' },
      );
    });

    it('should search users with verification filter', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockUsers, 2]);

      const searchDto = {
        verifiedOnly: true,
        page: 1,
        limit: 20,
      };

      const result = await service.searchUsers(searchDto);

      expect(result.users).toHaveLength(2);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.isVerified = :verified',
        { verified: true },
      );
    });

    it('should search users with verification level filter', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockUsers, 2]);

      const searchDto = {
        verificationLevel: 'phone',
        page: 1,
        limit: 20,
      };

      const result = await service.searchUsers(searchDto);

      expect(result.users).toHaveLength(2);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.phoneVerified = :phoneVerified',
        { phoneVerified: true },
      );
    });

    it('should handle pagination correctly', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockUsers, 25]);

      const searchDto = {
        page: 2,
        limit: 10,
      };

      const result = await service.searchUsers(searchDto);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(3);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPreviousPage).toBe(true);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should sort by specified field and order', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockUsers, 2]);

      const searchDto = {
        sortBy: 'trustScore',
        sortOrder: 'DESC',
        page: 1,
        limit: 20,
      };

      const result = await service.searchUsers(searchDto);

      expect(result.users).toHaveLength(2);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'user.trustScore',
        'DESC',
      );
    });
  });

  describe('getUsersByLocation', () => {
    it('should get users by location with verified filter', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockUsers, 2]);

      const result = await service.getUsersByLocation('Lagos', 'Lagos', 'Ikoyi');

      expect(result.users).toHaveLength(2);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.state = :state',
        { state: 'Lagos' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.city = :city',
        { city: 'Lagos' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.estate ILIKE :estate',
        { estate: '%Ikoyi%' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.isVerified = :verified',
        { verified: true },
      );
    });
  });

  describe('getUsersByCulture', () => {
    it('should get users by cultural background', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockUsers, 2]);

      const result = await service.getUsersByCulture('Yoruba');

      expect(result.users).toHaveLength(2);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.culturalBackground = :culturalBackground',
        { culturalBackground: 'Yoruba' },
      );
    });
  });

  describe('getVerifiedUsers', () => {
    it('should get verified users sorted by trust score', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockUsers, 2]);

      const result = await service.getVerifiedUsers();

      expect(result.users).toHaveLength(2);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.isVerified = :verified',
        { verified: true },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'user.trustScore',
        'DESC',
      );
    });
  });
});
