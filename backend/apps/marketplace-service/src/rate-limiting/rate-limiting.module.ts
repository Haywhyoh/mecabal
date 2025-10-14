import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@app/database';
import { RateLimitingService } from './rate-limiting.service';
import { CustomThrottlerGuard } from './guards/custom-throttler.guard';
import { RateLimitInterceptor } from './interceptors/rate-limit.interceptor';
import { RateLimitStatsController } from './controllers/rate-limit-stats.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          name: 'short',
          ttl: 60000, // 1 minute
          limit: 1000, // 1000 requests per minute (increased from 100)
        },
        {
          name: 'medium',
          ttl: 300000, // 5 minutes
          limit: 5000, // 5000 requests per 5 minutes (increased from 500)
        },
        {
          name: 'long',
          ttl: 3600000, // 1 hour
          limit: 10000, // 10000 requests per hour (increased from 1000)
        },
      ],
      inject: [ConfigService],
    }),
  ],
  controllers: [RateLimitStatsController],
  providers: [
    RateLimitingService,
    {
      provide: APP_INTERCEPTOR,
      useClass: RateLimitInterceptor,
    },
  ],
  exports: [RateLimitingService],
})
export class RateLimitingModule {}
