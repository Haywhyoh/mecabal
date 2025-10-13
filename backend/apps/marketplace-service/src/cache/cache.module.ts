import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-ioredis-yet';
import { CacheService } from './cache.service';
import { ListingCacheStrategy } from './strategies/listing-cache.strategy';
import { CategoryCacheStrategy } from './strategies/category-cache.strategy';
import { CacheInvalidationService } from './services/cache-invalidation.service';
import { CacheInterceptor } from './interceptors/cache.interceptor';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisHost = configService.get('REDIS_HOST', 'localhost');
        const redisPort = configService.get('REDIS_PORT', 6379);
        const redisPassword = configService.get('REDIS_PASSWORD', '');
        const redisDb = configService.get('REDIS_DB', 0);

        return {
          store: redisStore,
          host: redisHost,
          port: redisPort,
          password: redisPassword,
          db: redisDb,
          ttl: 300, // Default TTL of 5 minutes
          max: 1000, // Maximum number of items in cache
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    CacheService,
    ListingCacheStrategy,
    CategoryCacheStrategy,
    CacheInvalidationService,
    CacheInterceptor,
  ],
  exports: [
    CacheService,
    ListingCacheStrategy,
    CategoryCacheStrategy,
    CacheInvalidationService,
    CacheInterceptor,
  ],
})
export class AppCacheModule {}