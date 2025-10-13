import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../cache.service';
import {
  CACHE_KEY_METADATA,
  CACHE_TTL_METADATA,
  CACHE_TAGS_METADATA,
} from '../decorators/cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const method = context.getHandler();
    const className = context.getClass().name;

    // Get cache metadata
    const cacheKey = this.reflector.get<string | Function>(
      CACHE_KEY_METADATA,
      method,
    );
    const cacheTTL = this.reflector.get<number>(CACHE_TTL_METADATA, method);
    const cacheTags = this.reflector.get<string[]>(CACHE_TAGS_METADATA, method);

    // Skip caching if no cache key is defined
    if (!cacheKey) {
      return next.handle();
    }

    // Generate cache key
    const key = this.generateCacheKey(cacheKey, request, className, method.name);

    // Try to get from cache
    try {
      const cachedResult = await this.cacheService.get(key);
      if (cachedResult !== undefined) {
        this.logger.debug(`Cache HIT: ${key}`);
        return of(cachedResult);
      }
    } catch (error) {
      this.logger.error(`Cache GET error for key ${key}:`, error);
    }

    // Execute method and cache result
    return next.handle().pipe(
      tap(async (result) => {
        try {
          await this.cacheService.set(key, result, {
            ttl: cacheTTL,
            tags: cacheTags,
          });
          this.logger.debug(`Cache SET: ${key} (TTL: ${cacheTTL}s)`);
        } catch (error) {
          this.logger.error(`Cache SET error for key ${key}:`, error);
        }
      }),
    );
  }

  /**
   * Generate cache key from metadata and request
   */
  private generateCacheKey(
    cacheKey: string | Function,
    request: any,
    className: string,
    methodName: string,
  ): string {
    if (typeof cacheKey === 'function') {
      // Use the function to generate the key
      return cacheKey(request.params, request.query, request.body);
    }

    // Replace placeholders in the key
    let key = cacheKey
      .replace('{className}', className)
      .replace('{methodName}', methodName)
      .replace('{userId}', request.user?.userId || 'anonymous')
      .replace('{neighborhoodId}', request.user?.neighborhoodId || 'default');

    // Add query parameters to key
    const queryString = this.serializeQuery(request.query);
    if (queryString) {
      key += `:${queryString}`;
    }

    // Add path parameters to key
    const pathParams = this.serializePathParams(request.params);
    if (pathParams) {
      key += `:${pathParams}`;
    }

    return key;
  }

  /**
   * Serialize query parameters for cache key
   */
  private serializeQuery(query: any): string {
    if (!query || Object.keys(query).length === 0) {
      return '';
    }

    const sortedQuery = Object.keys(query)
      .sort()
      .reduce((result, key) => {
        result[key] = query[key];
        return result;
      }, {} as any);

    return Buffer.from(JSON.stringify(sortedQuery)).toString('base64').slice(0, 16);
  }

  /**
   * Serialize path parameters for cache key
   */
  private serializePathParams(params: any): string {
    if (!params || Object.keys(params).length === 0) {
      return '';
    }

    return Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join(',');
  }
}
