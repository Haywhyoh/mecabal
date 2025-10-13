import { Injectable } from '@nestjs/common';
import { CacheService } from '../cache.service';
import { ListingResponseDto, PaginatedListingsResponseDto } from '../../listings/dto';

export interface ListingCacheKeys {
  LISTINGS: 'listings';
  LISTING_DETAIL: 'listing:detail';
  USER_LISTINGS: 'user:listings';
  CATEGORY_LISTINGS: 'category:listings';
  SEARCH_RESULTS: 'search:results';
  POPULAR_LISTINGS: 'popular:listings';
  FEATURED_LISTINGS: 'featured:listings';
  NEARBY_LISTINGS: 'nearby:listings';
}

@Injectable()
export class ListingCacheStrategy {
  private readonly CACHE_KEYS: ListingCacheKeys = {
    LISTINGS: 'listings',
    LISTING_DETAIL: 'listing:detail',
    USER_LISTINGS: 'user:listings',
    CATEGORY_LISTINGS: 'category:listings',
    SEARCH_RESULTS: 'search:results',
    POPULAR_LISTINGS: 'popular:listings',
    FEATURED_LISTINGS: 'featured:listings',
    NEARBY_LISTINGS: 'nearby:listings',
  };

  constructor(private readonly cacheService: CacheService) {}

  /**
   * Cache listing details
   */
  async cacheListingDetail(listingId: string, listing: ListingResponseDto): Promise<void> {
    const key = this.cacheService.generateKey(this.CACHE_KEYS.LISTING_DETAIL, listingId);
    await this.cacheService.set(key, listing, { ttl: 300 }); // 5 minutes
  }

  /**
   * Get cached listing details
   */
  async getCachedListingDetail(listingId: string): Promise<ListingResponseDto | undefined> {
    const key = this.cacheService.generateKey(this.CACHE_KEYS.LISTING_DETAIL, listingId);
    return await this.cacheService.get<ListingResponseDto>(key);
  }

  /**
   * Cache paginated listings
   */
  async cacheListings(
    page: number,
    limit: number,
    filters: any,
    listings: PaginatedListingsResponseDto,
  ): Promise<void> {
    const filterHash = this.generateFilterHash(filters);
    const key = this.cacheService.generateKey(
      this.CACHE_KEYS.LISTINGS,
      page,
      limit,
      filterHash,
    );
    await this.cacheService.set(key, listings, { ttl: 300 }); // 5 minutes
  }

  /**
   * Get cached listings
   */
  async getCachedListings(
    page: number,
    limit: number,
    filters: any,
  ): Promise<PaginatedListingsResponseDto | undefined> {
    const filterHash = this.generateFilterHash(filters);
    const key = this.cacheService.generateKey(
      this.CACHE_KEYS.LISTINGS,
      page,
      limit,
      filterHash,
    );
    return await this.cacheService.get<PaginatedListingsResponseDto>(key);
  }

  /**
   * Cache user listings
   */
  async cacheUserListings(
    userId: string,
    page: number,
    limit: number,
    listings: PaginatedListingsResponseDto,
  ): Promise<void> {
    const key = this.cacheService.generateKey(
      this.CACHE_KEYS.USER_LISTINGS,
      userId,
      page,
      limit,
    );
    await this.cacheService.set(key, listings, { ttl: 600 }); // 10 minutes
  }

  /**
   * Get cached user listings
   */
  async getCachedUserListings(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedListingsResponseDto | undefined> {
    const key = this.cacheService.generateKey(
      this.CACHE_KEYS.USER_LISTINGS,
      userId,
      page,
      limit,
    );
    return await this.cacheService.get<PaginatedListingsResponseDto>(key);
  }

  /**
   * Cache category listings
   */
  async cacheCategoryListings(
    categoryId: number,
    page: number,
    limit: number,
    listings: PaginatedListingsResponseDto,
  ): Promise<void> {
    const key = this.cacheService.generateKey(
      this.CACHE_KEYS.CATEGORY_LISTINGS,
      categoryId,
      page,
      limit,
    );
    await this.cacheService.set(key, listings, { ttl: 300 }); // 5 minutes
  }

  /**
   * Get cached category listings
   */
  async getCachedCategoryListings(
    categoryId: number,
    page: number,
    limit: number,
  ): Promise<PaginatedListingsResponseDto | undefined> {
    const key = this.cacheService.generateKey(
      this.CACHE_KEYS.CATEGORY_LISTINGS,
      categoryId,
      page,
      limit,
    );
    return await this.cacheService.get<PaginatedListingsResponseDto>(key);
  }

  /**
   * Cache search results
   */
  async cacheSearchResults(
    query: string,
    filters: any,
    page: number,
    limit: number,
    results: PaginatedListingsResponseDto,
  ): Promise<void> {
    const filterHash = this.generateFilterHash(filters);
    const queryHash = this.generateQueryHash(query);
    const key = this.cacheService.generateKey(
      this.CACHE_KEYS.SEARCH_RESULTS,
      queryHash,
      filterHash,
      page,
      limit,
    );
    await this.cacheService.set(key, results, { ttl: 120 }); // 2 minutes
  }

  /**
   * Get cached search results
   */
  async getCachedSearchResults(
    query: string,
    filters: any,
    page: number,
    limit: number,
  ): Promise<PaginatedListingsResponseDto | undefined> {
    const filterHash = this.generateFilterHash(filters);
    const queryHash = this.generateQueryHash(query);
    const key = this.cacheService.generateKey(
      this.CACHE_KEYS.SEARCH_RESULTS,
      queryHash,
      filterHash,
      page,
      limit,
    );
    return await this.cacheService.get<PaginatedListingsResponseDto>(key);
  }

  /**
   * Cache popular listings
   */
  async cachePopularListings(
    listingType: string,
    limit: number,
    listings: ListingResponseDto[],
  ): Promise<void> {
    const key = this.cacheService.generateKey(
      this.CACHE_KEYS.POPULAR_LISTINGS,
      listingType,
      limit,
    );
    await this.cacheService.set(key, listings, { ttl: 1800 }); // 30 minutes
  }

  /**
   * Get cached popular listings
   */
  async getCachedPopularListings(
    listingType: string,
    limit: number,
  ): Promise<ListingResponseDto[] | undefined> {
    const key = this.cacheService.generateKey(
      this.CACHE_KEYS.POPULAR_LISTINGS,
      listingType,
      limit,
    );
    return await this.cacheService.get<ListingResponseDto[]>(key);
  }

  /**
   * Cache featured listings
   */
  async cacheFeaturedListings(
    listingType: string,
    limit: number,
    listings: ListingResponseDto[],
  ): Promise<void> {
    const key = this.cacheService.generateKey(
      this.CACHE_KEYS.FEATURED_LISTINGS,
      listingType,
      limit,
    );
    await this.cacheService.set(key, listings, { ttl: 1800 }); // 30 minutes
  }

  /**
   * Get cached featured listings
   */
  async getCachedFeaturedListings(
    listingType: string,
    limit: number,
  ): Promise<ListingResponseDto[] | undefined> {
    const key = this.cacheService.generateKey(
      this.CACHE_KEYS.FEATURED_LISTINGS,
      listingType,
      limit,
    );
    return await this.cacheService.get<ListingResponseDto[]>(key);
  }

  /**
   * Cache nearby listings
   */
  async cacheNearbyListings(
    latitude: number,
    longitude: number,
    radius: number,
    limit: number,
    listings: ListingResponseDto[],
  ): Promise<void> {
    const key = this.cacheService.generateKey(
      this.CACHE_KEYS.NEARBY_LISTINGS,
      Math.round(latitude * 1000) / 1000, // Round to 3 decimal places
      Math.round(longitude * 1000) / 1000,
      radius,
      limit,
    );
    await this.cacheService.set(key, listings, { ttl: 300 }); // 5 minutes
  }

  /**
   * Get cached nearby listings
   */
  async getCachedNearbyListings(
    latitude: number,
    longitude: number,
    radius: number,
    limit: number,
  ): Promise<ListingResponseDto[] | undefined> {
    const key = this.cacheService.generateKey(
      this.CACHE_KEYS.NEARBY_LISTINGS,
      Math.round(latitude * 1000) / 1000,
      Math.round(longitude * 1000) / 1000,
      radius,
      limit,
    );
    return await this.cacheService.get<ListingResponseDto[]>(key);
  }

  /**
   * Invalidate listing cache
   */
  async invalidateListing(listingId: string): Promise<void> {
    const keys = [
      this.cacheService.generateKey(this.CACHE_KEYS.LISTING_DETAIL, listingId),
    ];
    await this.cacheService.delMultiple(keys);
  }

  /**
   * Invalidate user listings cache
   */
  async invalidateUserListings(userId: string): Promise<void> {
    // This would need to be implemented with pattern matching
    // For now, we'll invalidate common patterns
    const keys = [
      this.cacheService.generateKey(this.CACHE_KEYS.USER_LISTINGS, userId),
    ];
    await this.cacheService.delMultiple(keys);
  }

  /**
   * Invalidate category listings cache
   */
  async invalidateCategoryListings(categoryId: number): Promise<void> {
    const keys = [
      this.cacheService.generateKey(this.CACHE_KEYS.CATEGORY_LISTINGS, categoryId),
    ];
    await this.cacheService.delMultiple(keys);
  }

  /**
   * Invalidate all listings cache
   */
  async invalidateAllListings(): Promise<void> {
    await this.cacheService.invalidatePattern(`${this.CACHE_KEYS.LISTINGS}:*`);
    await this.cacheService.invalidatePattern(`${this.CACHE_KEYS.POPULAR_LISTINGS}:*`);
    await this.cacheService.invalidatePattern(`${this.CACHE_KEYS.FEATURED_LISTINGS}:*`);
  }

  /**
   * Generate filter hash for cache key
   */
  private generateFilterHash(filters: any): string {
    if (!filters || Object.keys(filters).length === 0) {
      return 'no-filters';
    }
    
    const sortedFilters = Object.keys(filters)
      .sort()
      .reduce((result, key) => {
        result[key] = filters[key];
        return result;
      }, {} as any);
    
    return Buffer.from(JSON.stringify(sortedFilters)).toString('base64').slice(0, 16);
  }

  /**
   * Generate query hash for cache key
   */
  private generateQueryHash(query: string): string {
    if (!query || query.trim().length === 0) {
      return 'no-query';
    }
    
    return Buffer.from(query.toLowerCase().trim()).toString('base64').slice(0, 16);
  }
}
