import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '../cache.service';
import { ListingCacheStrategy } from '../strategies/listing-cache.strategy';
import { CategoryCacheStrategy } from '../strategies/category-cache.strategy';

@Injectable()
export class CacheInvalidationService {
  private readonly logger = new Logger(CacheInvalidationService.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly listingCacheStrategy: ListingCacheStrategy,
    private readonly categoryCacheStrategy: CategoryCacheStrategy,
  ) {}

  /**
   * Invalidate cache when listing is created
   */
  async onListingCreated(listingData: any): Promise<void> {
    try {
      // Invalidate general listings cache
      await this.listingCacheStrategy.invalidateAllListings();
      
      // Invalidate category-specific cache
      if (listingData.categoryId) {
        await this.listingCacheStrategy.invalidateCategoryListings(listingData.categoryId);
      }

      // Invalidate user listings cache
      if (listingData.userId) {
        await this.listingCacheStrategy.invalidateUserListings(listingData.userId);
      }

      this.logger.debug('Cache invalidated for listing creation');
    } catch (error) {
      this.logger.error('Error invalidating cache for listing creation:', error);
    }
  }

  /**
   * Invalidate cache when listing is updated
   */
  async onListingUpdated(listingId: string, listingData: any): Promise<void> {
    try {
      // Invalidate specific listing cache
      await this.listingCacheStrategy.invalidateListing(listingId);
      
      // Invalidate general listings cache
      await this.listingCacheStrategy.invalidateAllListings();
      
      // Invalidate category-specific cache
      if (listingData.categoryId) {
        await this.listingCacheStrategy.invalidateCategoryListings(listingData.categoryId);
      }

      // Invalidate user listings cache
      if (listingData.userId) {
        await this.listingCacheStrategy.invalidateUserListings(listingData.userId);
      }

      this.logger.debug(`Cache invalidated for listing update: ${listingId}`);
    } catch (error) {
      this.logger.error(`Error invalidating cache for listing update ${listingId}:`, error);
    }
  }

  /**
   * Invalidate cache when listing is deleted
   */
  async onListingDeleted(listingId: string, listingData: any): Promise<void> {
    try {
      // Invalidate specific listing cache
      await this.listingCacheStrategy.invalidateListing(listingId);
      
      // Invalidate general listings cache
      await this.listingCacheStrategy.invalidateAllListings();
      
      // Invalidate category-specific cache
      if (listingData.categoryId) {
        await this.listingCacheStrategy.invalidateCategoryListings(listingData.categoryId);
      }

      // Invalidate user listings cache
      if (listingData.userId) {
        await this.listingCacheStrategy.invalidateUserListings(listingData.userId);
      }

      this.logger.debug(`Cache invalidated for listing deletion: ${listingId}`);
    } catch (error) {
      this.logger.error(`Error invalidating cache for listing deletion ${listingId}:`, error);
    }
  }

  /**
   * Invalidate cache when category is created
   */
  async onCategoryCreated(categoryData: any): Promise<void> {
    try {
      // Invalidate all categories cache
      await this.categoryCacheStrategy.invalidateAllCategories();
      
      // Invalidate category-specific cache by type
      if (categoryData.listingType) {
        await this.categoryCacheStrategy.invalidateCategoriesByType(categoryData.listingType);
      }

      this.logger.debug('Cache invalidated for category creation');
    } catch (error) {
      this.logger.error('Error invalidating cache for category creation:', error);
    }
  }

  /**
   * Invalidate cache when category is updated
   */
  async onCategoryUpdated(categoryId: number, categoryData: any): Promise<void> {
    try {
      // Invalidate specific category cache
      await this.categoryCacheStrategy.invalidateCategory(categoryId);
      
      // Invalidate all categories cache
      await this.categoryCacheStrategy.invalidateAllCategories();
      
      // Invalidate category-specific cache by type
      if (categoryData.listingType) {
        await this.categoryCacheStrategy.invalidateCategoriesByType(categoryData.listingType);
      }

      this.logger.debug(`Cache invalidated for category update: ${categoryId}`);
    } catch (error) {
      this.logger.error(`Error invalidating cache for category update ${categoryId}:`, error);
    }
  }

  /**
   * Invalidate cache when category is deleted
   */
  async onCategoryDeleted(categoryId: number, categoryData: any): Promise<void> {
    try {
      // Invalidate specific category cache
      await this.categoryCacheStrategy.invalidateCategory(categoryId);
      
      // Invalidate all categories cache
      await this.categoryCacheStrategy.invalidateAllCategories();
      
      // Invalidate category-specific cache by type
      if (categoryData.listingType) {
        await this.categoryCacheStrategy.invalidateCategoriesByType(categoryData.listingType);
      }

      this.logger.debug(`Cache invalidated for category deletion: ${categoryId}`);
    } catch (error) {
      this.logger.error(`Error invalidating cache for category deletion ${categoryId}:`, error);
    }
  }

  /**
   * Invalidate cache when user data changes
   */
  async onUserDataChanged(userId: string): Promise<void> {
    try {
      // Invalidate user-specific listings cache
      await this.listingCacheStrategy.invalidateUserListings(userId);
      
      this.logger.debug(`Cache invalidated for user data change: ${userId}`);
    } catch (error) {
      this.logger.error(`Error invalidating cache for user data change ${userId}:`, error);
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      await this.cacheService.invalidateByTags(tags);
      this.logger.debug(`Cache invalidated by tags: ${tags.join(', ')}`);
    } catch (error) {
      this.logger.error(`Error invalidating cache by tags ${tags}:`, error);
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidateByPattern(pattern: string): Promise<void> {
    try {
      await this.cacheService.invalidatePattern(pattern);
      this.logger.debug(`Cache invalidated by pattern: ${pattern}`);
    } catch (error) {
      this.logger.error(`Error invalidating cache by pattern ${pattern}:`, error);
    }
  }

  /**
   * Clear all cache
   */
  async clearAllCache(): Promise<void> {
    try {
      await this.cacheService.clear();
      this.logger.debug('All cache cleared');
    } catch (error) {
      this.logger.error('Error clearing all cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cacheService.getStats();
  }

  /**
   * Reset cache statistics
   */
  resetCacheStats(): void {
    this.cacheService.resetStats();
  }
}
