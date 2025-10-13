import { Injectable } from '@nestjs/common';
import { CacheService } from '../cache.service';
import { ListingCategory } from '@app/database';

export interface CategoryCacheKeys {
  CATEGORIES: 'categories';
  CATEGORY_DETAIL: 'category:detail';
  CATEGORIES_BY_TYPE: 'categories:by-type';
  CATEGORY_HIERARCHY: 'categories:hierarchy';
  FEATURED_CATEGORIES: 'categories:featured';
}

@Injectable()
export class CategoryCacheStrategy {
  private readonly CACHE_KEYS: CategoryCacheKeys = {
    CATEGORIES: 'categories',
    CATEGORY_DETAIL: 'category:detail',
    CATEGORIES_BY_TYPE: 'categories:by-type',
    CATEGORY_HIERARCHY: 'categories:hierarchy',
    FEATURED_CATEGORIES: 'categories:featured',
  };

  constructor(private readonly cacheService: CacheService) {}

  /**
   * Cache all categories
   */
  async cacheAllCategories(categories: ListingCategory[]): Promise<void> {
    const key = this.cacheService.generateKey(this.CACHE_KEYS.CATEGORIES, 'all');
    await this.cacheService.set(key, categories, { ttl: 3600 }); // 1 hour
  }

  /**
   * Get cached all categories
   */
  async getCachedAllCategories(): Promise<ListingCategory[] | undefined> {
    const key = this.cacheService.generateKey(this.CACHE_KEYS.CATEGORIES, 'all');
    return await this.cacheService.get<ListingCategory[]>(key);
  }

  /**
   * Cache category details
   */
  async cacheCategoryDetail(categoryId: number, category: ListingCategory): Promise<void> {
    const key = this.cacheService.generateKey(this.CACHE_KEYS.CATEGORY_DETAIL, categoryId);
    await this.cacheService.set(key, category, { ttl: 3600 }); // 1 hour
  }

  /**
   * Get cached category details
   */
  async getCachedCategoryDetail(categoryId: number): Promise<ListingCategory | undefined> {
    const key = this.cacheService.generateKey(this.CACHE_KEYS.CATEGORY_DETAIL, categoryId);
    return await this.cacheService.get<ListingCategory>(key);
  }

  /**
   * Cache categories by type
   */
  async cacheCategoriesByType(
    listingType: string,
    categories: ListingCategory[],
  ): Promise<void> {
    const key = this.cacheService.generateKey(
      this.CACHE_KEYS.CATEGORIES_BY_TYPE,
      listingType,
    );
    await this.cacheService.set(key, categories, { ttl: 3600 }); // 1 hour
  }

  /**
   * Get cached categories by type
   */
  async getCachedCategoriesByType(
    listingType: string,
  ): Promise<ListingCategory[] | undefined> {
    const key = this.cacheService.generateKey(
      this.CACHE_KEYS.CATEGORIES_BY_TYPE,
      listingType,
    );
    return await this.cacheService.get<ListingCategory[]>(key);
  }

  /**
   * Cache category hierarchy
   */
  async cacheCategoryHierarchy(
    listingType: string,
    hierarchy: any,
  ): Promise<void> {
    const key = this.cacheService.generateKey(
      this.CACHE_KEYS.CATEGORY_HIERARCHY,
      listingType,
    );
    await this.cacheService.set(key, hierarchy, { ttl: 3600 }); // 1 hour
  }

  /**
   * Get cached category hierarchy
   */
  async getCachedCategoryHierarchy(
    listingType: string,
  ): Promise<any | undefined> {
    const key = this.cacheService.generateKey(
      this.CACHE_KEYS.CATEGORY_HIERARCHY,
      listingType,
    );
    return await this.cacheService.get<any>(key);
  }

  /**
   * Cache featured categories
   */
  async cacheFeaturedCategories(
    listingType: string,
    categories: ListingCategory[],
  ): Promise<void> {
    const key = this.cacheService.generateKey(
      this.CACHE_KEYS.FEATURED_CATEGORIES,
      listingType,
    );
    await this.cacheService.set(key, categories, { ttl: 3600 }); // 1 hour
  }

  /**
   * Get cached featured categories
   */
  async getCachedFeaturedCategories(
    listingType: string,
  ): Promise<ListingCategory[] | undefined> {
    const key = this.cacheService.generateKey(
      this.CACHE_KEYS.FEATURED_CATEGORIES,
      listingType,
    );
    return await this.cacheService.get<ListingCategory[]>(key);
  }

  /**
   * Invalidate category cache
   */
  async invalidateCategory(categoryId: number): Promise<void> {
    const keys = [
      this.cacheService.generateKey(this.CACHE_KEYS.CATEGORY_DETAIL, categoryId),
    ];
    await this.cacheService.delMultiple(keys);
  }

  /**
   * Invalidate all categories cache
   */
  async invalidateAllCategories(): Promise<void> {
    await this.cacheService.invalidatePattern(`${this.CACHE_KEYS.CATEGORIES}:*`);
    await this.cacheService.invalidatePattern(`${this.CACHE_KEYS.CATEGORIES_BY_TYPE}:*`);
    await this.cacheService.invalidatePattern(`${this.CACHE_KEYS.CATEGORY_HIERARCHY}:*`);
    await this.cacheService.invalidatePattern(`${this.CACHE_KEYS.FEATURED_CATEGORIES}:*`);
  }

  /**
   * Invalidate categories by type
   */
  async invalidateCategoriesByType(listingType: string): Promise<void> {
    const keys = [
      this.cacheService.generateKey(this.CACHE_KEYS.CATEGORIES, 'all'),
      this.cacheService.generateKey(this.CACHE_KEYS.CATEGORIES_BY_TYPE, listingType),
      this.cacheService.generateKey(this.CACHE_KEYS.CATEGORY_HIERARCHY, listingType),
      this.cacheService.generateKey(this.CACHE_KEYS.FEATURED_CATEGORIES, listingType),
    ];
    await this.cacheService.delMultiple(keys);
  }
}
