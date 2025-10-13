import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CacheService } from '../cache.service';
import { CacheInvalidationService } from '../services/cache-invalidation.service';
import { MarketplaceAuthGuard } from '../../guards/marketplace-auth.guard';

@ApiTags('cache')
@Controller('cache')
@UseGuards(MarketplaceAuthGuard)
@ApiBearerAuth()
export class CacheStatsController {
  constructor(
    private readonly cacheService: CacheService,
    private readonly cacheInvalidationService: CacheInvalidationService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get cache statistics' })
  @ApiResponse({
    status: 200,
    description: 'Cache statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        hits: { type: 'number', description: 'Number of cache hits' },
        misses: { type: 'number', description: 'Number of cache misses' },
        sets: { type: 'number', description: 'Number of cache sets' },
        deletes: { type: 'number', description: 'Number of cache deletes' },
        hitRate: { type: 'number', description: 'Cache hit rate percentage' },
      },
    },
  })
  getCacheStats() {
    return this.cacheInvalidationService.getCacheStats();
  }

  @Post('stats/reset')
  @ApiOperation({ summary: 'Reset cache statistics' })
  @ApiResponse({
    status: 200,
    description: 'Cache statistics reset successfully',
  })
  resetCacheStats() {
    this.cacheInvalidationService.resetCacheStats();
    return { message: 'Cache statistics reset successfully' };
  }

  @Get('health')
  @ApiOperation({ summary: 'Check cache health' })
  @ApiResponse({
    status: 200,
    description: 'Cache health status',
    schema: {
      type: 'object',
      properties: {
        available: { type: 'boolean', description: 'Whether cache is available' },
        stats: {
          type: 'object',
          description: 'Current cache statistics',
        },
      },
    },
  })
  async getCacheHealth() {
    const available = await this.cacheService.isAvailable();
    const stats = this.cacheInvalidationService.getCacheStats();
    
    return {
      available,
      stats,
    };
  }

  @Post('clear')
  @ApiOperation({ summary: 'Clear all cache' })
  @ApiResponse({
    status: 200,
    description: 'All cache cleared successfully',
  })
  async clearAllCache() {
    await this.cacheInvalidationService.clearAllCache();
    return { message: 'All cache cleared successfully' };
  }

  @Post('invalidate/listings')
  @ApiOperation({ summary: 'Invalidate all listings cache' })
  @ApiResponse({
    status: 200,
    description: 'Listings cache invalidated successfully',
  })
  async invalidateListingsCache() {
    await this.cacheInvalidationService.invalidateByPattern('listings:*');
    return { message: 'Listings cache invalidated successfully' };
  }

  @Post('invalidate/categories')
  @ApiOperation({ summary: 'Invalidate all categories cache' })
  @ApiResponse({
    status: 200,
    description: 'Categories cache invalidated successfully',
  })
  async invalidateCategoriesCache() {
    await this.cacheInvalidationService.invalidateByPattern('categories:*');
    return { message: 'Categories cache invalidated successfully' };
  }
}
