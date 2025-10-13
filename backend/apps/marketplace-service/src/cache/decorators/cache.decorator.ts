import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache_key';
export const CACHE_TTL_METADATA = 'cache_ttl';
export const CACHE_TAGS_METADATA = 'cache_tags';

export interface CacheOptions {
  key?: string;
  ttl?: number;
  tags?: string[];
}

/**
 * Cache decorator for methods
 */
export function Cache(options: CacheOptions = {}) {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY_METADATA, options.key || `${target.constructor.name}:${propertyName}`)(target, propertyName, descriptor);
    SetMetadata(CACHE_TTL_METADATA, options.ttl || 300)(target, propertyName, descriptor);
    SetMetadata(CACHE_TAGS_METADATA, options.tags || [])(target, propertyName, descriptor);
    return descriptor;
  };
}

/**
 * Cache key generator for method parameters
 */
export function CacheKey(keyGenerator: (...args: any[]) => string) {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY_METADATA, keyGenerator)(target, propertyName, descriptor);
    return descriptor;
  };
}

/**
 * Cache TTL for specific methods
 */
export function CacheTTL(ttl: number) {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_TTL_METADATA, ttl)(target, propertyName, descriptor);
    return descriptor;
  };
}

/**
 * Cache tags for invalidation
 */
export function CacheTags(tags: string[]) {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_TAGS_METADATA, tags)(target, propertyName, descriptor);
    return descriptor;
  };
}
