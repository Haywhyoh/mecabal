import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RateLimitingService } from './rate-limiting.service';
import { User } from '@app/database';

describe('RateLimitingService', () => {
  let service: RateLimitingService;
  let mockUserRepository: any;

  beforeEach(async () => {
    mockUserRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitingService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<RateLimitingService>(RateLimitingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should check user rate limit successfully', async () => {
    const result = await service.checkUserRateLimit('user123', 'general');
    
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
    expect(result.resetTime).toBeGreaterThan(Date.now());
  });

  it('should check IP rate limit successfully', async () => {
    const result = await service.checkIPRateLimit('192.168.1.1', 'general');
    
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
    expect(result.resetTime).toBeGreaterThan(Date.now());
  });

  it('should check endpoint rate limit successfully', async () => {
    const result = await service.checkEndpointRateLimit(
      'POST:/listings',
      'create-listing',
      'user123',
      '192.168.1.1'
    );
    
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
    expect(result.resetTime).toBeGreaterThan(Date.now());
  });

  it('should get rate limit configuration', () => {
    const config = service.getRateLimitConfig('general');
    
    expect(config).toBeDefined();
    expect(config?.name).toBe('general');
    expect(config?.limit).toBe(100);
    expect(config?.ttl).toBe(60000);
  });

  it('should get all rate limit configurations', () => {
    const configs = service.getAllRateLimitConfigs();
    
    expect(configs.size).toBeGreaterThan(0);
    expect(configs.has('general')).toBe(true);
    expect(configs.has('search')).toBe(true);
    expect(configs.has('create-listing')).toBe(true);
  });

  it('should get rate limit statistics', () => {
    const stats = service.getRateLimitStats();
    
    expect(stats).toBeDefined();
    expect(stats.totalConfigs).toBeGreaterThan(0);
    expect(typeof stats.totalKeys).toBe('number');
    expect(typeof stats.activeRequests).toBe('number');
  });

  it('should check if user is premium (currently returns false)', async () => {
    mockUserRepository.findOne.mockResolvedValue({ id: 'user123' });
    
    const isPremium = await service.isPremiumUser('user123');
    
    expect(isPremium).toBe(false);
  });

  it('should reset rate limits', () => {
    // This should not throw an error
    expect(() => service.resetAllRateLimits()).not.toThrow();
  });

  it('should cleanup expired entries', () => {
    // This should not throw an error
    expect(() => service.cleanupExpiredEntries()).not.toThrow();
  });
});
