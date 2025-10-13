import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Tags for cache invalidation
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    hitRate: 0,
  };

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value !== undefined) {
        this.stats.hits++;
        this.logger.debug(`Cache HIT: ${key}`);
      } else {
        this.stats.misses++;
        this.logger.debug(`Cache MISS: ${key}`);
      }
      this.updateHitRate();
      return value;
    } catch (error) {
      this.logger.error(`Cache GET error for key ${key}:`, error);
      return undefined;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      const ttl = options?.ttl || 300; // Default 5 minutes
      await this.cacheManager.set(key, value, ttl * 1000); // Convert to milliseconds
      this.stats.sets++;
      this.logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      this.logger.error(`Cache SET error for key ${key}:`, error);
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.stats.deletes++;
      this.logger.debug(`Cache DELETE: ${key}`);
    } catch (error) {
      this.logger.error(`Cache DELETE error for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple keys from cache
   */
  async delMultiple(keys: string[]): Promise<void> {
    try {
      await Promise.all(keys.map(key => this.cacheManager.del(key)));
      this.stats.deletes += keys.length;
      this.logger.debug(`Cache DELETE MULTIPLE: ${keys.length} keys`);
    } catch (error) {
      this.logger.error(`Cache DELETE MULTIPLE error:`, error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      // Note: reset() method might not be available in all cache implementations
      // For now, we'll use del() with a pattern or implement a custom clear method
      this.logger.debug('Cache CLEAR: All cache cleared (method not implemented)');
    } catch (error) {
      this.logger.error('Cache CLEAR error:', error);
    }
  }

  /**
   * Get or set pattern - get from cache or execute function and cache result
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      // This would need to be implemented based on your Redis setup
      // For now, we'll log the pattern
      this.logger.debug(`Cache INVALIDATE PATTERN: ${pattern}`);
    } catch (error) {
      this.logger.error(`Cache INVALIDATE PATTERN error for ${pattern}:`, error);
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      // This would need to be implemented based on your Redis setup
      // For now, we'll log the tags
      this.logger.debug(`Cache INVALIDATE TAGS: ${tags.join(', ')}`);
    } catch (error) {
      this.logger.error(`Cache INVALIDATE TAGS error for ${tags}:`, error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hitRate: 0,
    };
  }

  /**
   * Update hit rate calculation
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * Generate cache key with namespace
   */
  generateKey(namespace: string, ...parts: (string | number)[]): string {
    return `${namespace}:${parts.join(':')}`;
  }

  /**
   * Check if cache is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.cacheManager.get('health_check');
      return true;
    } catch (error) {
      this.logger.error('Cache health check failed:', error);
      return false;
    }
  }
}
