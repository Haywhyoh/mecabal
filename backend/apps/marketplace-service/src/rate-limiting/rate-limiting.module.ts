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
          limit: 100, // 100 requests per minute
        },
        {
          name: 'medium',
          ttl: 300000, // 5 minutes
          limit: 500, // 500 requests per 5 minutes
        },
        {
          name: 'long',
          ttl: 3600000, // 1 hour
          limit: 1000, // 1000 requests per hour
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
