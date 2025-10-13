import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;
  let mockCacheManager: any;

  beforeEach(async () => {
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get value from cache', async () => {
    const testValue = { id: 1, name: 'test' };
    mockCacheManager.get.mockResolvedValue(testValue);

    const result = await service.get('test-key');

    expect(result).toEqual(testValue);
    expect(mockCacheManager.get).toHaveBeenCalledWith('test-key');
  });

  it('should return undefined when cache miss', async () => {
    mockCacheManager.get.mockResolvedValue(undefined);

    const result = await service.get('test-key');

    expect(result).toBeUndefined();
  });

  it('should set value in cache', async () => {
    const testValue = { id: 1, name: 'test' };
    mockCacheManager.set.mockResolvedValue(undefined);

    await service.set('test-key', testValue);

    expect(mockCacheManager.set).toHaveBeenCalledWith('test-key', testValue, 300000);
  });

  it('should set value in cache with custom TTL', async () => {
    const testValue = { id: 1, name: 'test' };
    mockCacheManager.set.mockResolvedValue(undefined);

    await service.set('test-key', testValue, { ttl: 600 });

    expect(mockCacheManager.set).toHaveBeenCalledWith('test-key', testValue, 600000);
  });

  it('should delete value from cache', async () => {
    mockCacheManager.del.mockResolvedValue(undefined);

    await service.del('test-key');

    expect(mockCacheManager.del).toHaveBeenCalledWith('test-key');
  });

  it('should delete multiple values from cache', async () => {
    const keys = ['key1', 'key2', 'key3'];
    mockCacheManager.del.mockResolvedValue(undefined);

    await service.delMultiple(keys);

    expect(mockCacheManager.del).toHaveBeenCalledTimes(3);
    keys.forEach(key => {
      expect(mockCacheManager.del).toHaveBeenCalledWith(key);
    });
  });

  it('should get or set value', async () => {
    const testValue = { id: 1, name: 'test' };
    const factory = jest.fn().mockResolvedValue(testValue);
    mockCacheManager.get.mockResolvedValue(undefined);
    mockCacheManager.set.mockResolvedValue(undefined);

    const result = await service.getOrSet('test-key', factory);

    expect(result).toEqual(testValue);
    expect(factory).toHaveBeenCalled();
    expect(mockCacheManager.set).toHaveBeenCalledWith('test-key', testValue, 300000);
  });

  it('should return cached value when available', async () => {
    const testValue = { id: 1, name: 'test' };
    const factory = jest.fn().mockResolvedValue({ id: 2, name: 'new' });
    mockCacheManager.get.mockResolvedValue(testValue);

    const result = await service.getOrSet('test-key', factory);

    expect(result).toEqual(testValue);
    expect(factory).not.toHaveBeenCalled();
  });

  it('should generate cache key with namespace', () => {
    const key = service.generateKey('listings', 'user123', 'page1');
    
    expect(key).toBe('listings:user123:page1');
  });

  it('should get cache statistics', () => {
    const stats = service.getStats();
    
    expect(stats).toBeDefined();
    expect(typeof stats.hits).toBe('number');
    expect(typeof stats.misses).toBe('number');
    expect(typeof stats.sets).toBe('number');
    expect(typeof stats.deletes).toBe('number');
    expect(typeof stats.hitRate).toBe('number');
  });

  it('should reset cache statistics', () => {
    service.resetStats();
    const stats = service.getStats();
    
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
    expect(stats.sets).toBe(0);
    expect(stats.deletes).toBe(0);
    expect(stats.hitRate).toBe(0);
  });

  it('should check cache availability', async () => {
    mockCacheManager.get.mockResolvedValue('test');

    const isAvailable = await service.isAvailable();

    expect(isAvailable).toBe(true);
    expect(mockCacheManager.get).toHaveBeenCalledWith('health_check');
  });

  it('should handle cache errors gracefully', async () => {
    mockCacheManager.get.mockRejectedValue(new Error('Cache error'));

    const result = await service.get('test-key');

    expect(result).toBeUndefined();
  });
});
