import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserStatisticsService } from './user-statistics.service';
import {
  User,
  UserBookmark,
  UserDashboardStats,
  Post,
  Event,
} from '@app/database';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('UserStatisticsService', () => {
  let service: UserStatisticsService;
  let userRepository: Repository<User>;
  let bookmarkRepository: Repository<UserBookmark>;
  let statsRepository: Repository<UserDashboardStats>;
  let postRepository: Repository<Post>;
  let eventRepository: Repository<Event>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    trustScore: 85,
  };

  const mockStats = {
    userId: 'user-1',
    bookmarksCount: 5,
    savedDealsCount: 2,
    postsSharedCount: 10,
    eventsJoinedCount: 3,
    neighborsHelpedCount: 1,
    lastCalculatedAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBookmark = {
    id: 'bookmark-1',
    userId: 'user-1',
    itemType: 'post' as const,
    itemId: 'post-1',
    createdAt: new Date(),
  };

  const mockRepositories = {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    findAndCount: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserStatisticsService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepositories,
        },
        {
          provide: getRepositoryToken(UserBookmark),
          useValue: mockRepositories,
        },
        {
          provide: getRepositoryToken(UserDashboardStats),
          useValue: mockRepositories,
        },
        {
          provide: getRepositoryToken(Post),
          useValue: mockRepositories,
        },
        {
          provide: getRepositoryToken(Event),
          useValue: mockRepositories,
        },
      ],
    }).compile();

    service = module.get<UserStatisticsService>(UserStatisticsService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    bookmarkRepository = module.get<Repository<UserBookmark>>(
      getRepositoryToken(UserBookmark),
    );
    statsRepository = module.get<Repository<UserDashboardStats>>(
      getRepositoryToken(UserDashboardStats),
    );
    postRepository = module.get<Repository<Post>>(getRepositoryToken(Post));
    eventRepository = module.get<Repository<Event>>(getRepositoryToken(Event));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should return dashboard stats when user exists', async () => {
      mockRepositories.findOne
        .mockResolvedValueOnce(mockUser) // User lookup
        .mockResolvedValueOnce(mockStats); // Stats lookup
      mockRepositories.find.mockResolvedValue([mockBookmark]);
      mockRepositories.count.mockResolvedValue(2); // Attending events

      const result = await service.getDashboardStats('user-1');

      expect(result.bookmarks.count).toBe(5);
      expect(result.savedDeals.count).toBe(2);
      expect(result.posts.shared).toBe(10);
      expect(result.community.trustScore).toBe(85);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepositories.findOne.mockResolvedValue(null);

      await expect(service.getDashboardStats('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should calculate stats when cache is stale', async () => {
      const staleStats = {
        ...mockStats,
        lastCalculatedAt: new Date(Date.now() - 7200000), // 2 hours ago
      };

      mockRepositories.findOne
        .mockResolvedValueOnce(mockUser) // User lookup
        .mockResolvedValueOnce(staleStats) // Stale stats
        .mockResolvedValueOnce(mockStats); // New stats after calculation
      mockRepositories.find.mockResolvedValue([mockBookmark]);
      mockRepositories.count.mockResolvedValue(2);

      const result = await service.getDashboardStats('user-1');

      expect(result.bookmarks.count).toBe(5);
    });
  });

  describe('addBookmark', () => {
    it('should add new bookmark successfully', async () => {
      mockRepositories.findOne.mockResolvedValue(null); // No existing bookmark
      mockRepositories.create.mockReturnValue(mockBookmark);
      mockRepositories.save.mockResolvedValue(mockBookmark);

      const result = await service.addBookmark('user-1', 'post', 'post-1');

      expect(result).toEqual(mockBookmark);
      expect(mockRepositories.create).toHaveBeenCalledWith({
        userId: 'user-1',
        itemType: 'post',
        itemId: 'post-1',
      });
    });

    it('should return existing bookmark if already exists', async () => {
      mockRepositories.findOne.mockResolvedValue(mockBookmark);

      const result = await service.addBookmark('user-1', 'post', 'post-1');

      expect(result).toEqual(mockBookmark);
      expect(mockRepositories.create).not.toHaveBeenCalled();
    });
  });

  describe('removeBookmark', () => {
    it('should remove bookmark successfully', async () => {
      mockRepositories.findOne.mockResolvedValue(mockBookmark);
      mockRepositories.remove.mockResolvedValue(mockBookmark);

      const result = await service.removeBookmark('user-1', 'post', 'post-1');

      expect(result.message).toBe('Bookmark removed successfully');
      expect(mockRepositories.remove).toHaveBeenCalledWith(mockBookmark);
    });

    it('should throw NotFoundException when bookmark not found', async () => {
      mockRepositories.findOne.mockResolvedValue(null);

      await expect(
        service.removeBookmark('user-1', 'post', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getBookmarksByType', () => {
    it('should return paginated bookmarks', async () => {
      const mockBookmarks = [mockBookmark];
      mockRepositories.findAndCount.mockResolvedValue([mockBookmarks, 1]);

      const result = await service.getBookmarksByType('user-1', 'post', 1, 10);

      expect(result.bookmarks).toEqual(mockBookmarks);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('isBookmarked', () => {
    it('should return true when item is bookmarked', async () => {
      mockRepositories.count.mockResolvedValue(1);

      const result = await service.isBookmarked('user-1', 'post', 'post-1');

      expect(result).toBe(true);
    });

    it('should return false when item is not bookmarked', async () => {
      mockRepositories.count.mockResolvedValue(0);

      const result = await service.isBookmarked('user-1', 'post', 'post-1');

      expect(result).toBe(false);
    });
  });

  describe('calculateAndCacheStats', () => {
    it('should calculate and cache stats for new user', async () => {
      mockRepositories.count
        .mockResolvedValueOnce(5) // Bookmarks count
        .mockResolvedValueOnce(2) // Saved deals count
        .mockResolvedValueOnce(10); // Posts count
      mockRepositories.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(3), // Events joined
      });
      mockRepositories.findOne.mockResolvedValue(null); // No existing stats
      mockRepositories.create.mockReturnValue(mockStats);
      mockRepositories.save.mockResolvedValue(mockStats);

      const result = await service.calculateAndCacheStats('user-1');

      expect(result).toEqual(mockStats);
      expect(mockRepositories.create).toHaveBeenCalled();
      expect(mockRepositories.save).toHaveBeenCalled();
    });

    it('should update existing stats', async () => {
      const existingStats = { ...mockStats, id: 'stats-1' };
      mockRepositories.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(10);
      mockRepositories.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(3),
      });
      mockRepositories.findOne.mockResolvedValue(existingStats);
      mockRepositories.save.mockResolvedValue(existingStats);

      const result = await service.calculateAndCacheStats('user-1');

      expect(result).toEqual(existingStats);
      expect(mockRepositories.save).toHaveBeenCalledWith(existingStats);
    });
  });
});
