import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RateLimitingService } from '../rate-limiting.service';
import { MarketplaceAuthGuard } from '../../guards/marketplace-auth.guard';

@ApiTags('rate-limiting')
@Controller('rate-limiting')
@UseGuards(MarketplaceAuthGuard)
@ApiBearerAuth()
export class RateLimitStatsController {
  constructor(private readonly rateLimitingService: RateLimitingService) {}

  @Get('configs')
  @ApiOperation({ summary: 'Get all rate limit configurations' })
  @ApiResponse({
    status: 200,
    description: 'Rate limit configurations retrieved successfully',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          ttl: { type: 'number' },
          limit: { type: 'number' },
          skipSuccessfulRequests: { type: 'boolean' },
          skipFailedRequests: { type: 'boolean' },
        },
      },
    },
  })
  getRateLimitConfigs() {
    const configs = this.rateLimitingService.getAllRateLimitConfigs();
    const result: any = {};
    
    for (const [key, config] of configs.entries()) {
      result[key] = config;
    }
    
    return result;
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get rate limiting statistics' })
  @ApiResponse({
    status: 200,
    description: 'Rate limiting statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalKeys: { type: 'number', description: 'Total number of rate limit keys' },
        totalConfigs: { type: 'number', description: 'Total number of rate limit configurations' },
        activeRequests: { type: 'number', description: 'Number of active requests being tracked' },
      },
    },
  })
  getRateLimitStats() {
    return this.rateLimitingService.getRateLimitStats();
  }

  @Post('reset')
  @ApiOperation({ summary: 'Reset all rate limits' })
  @ApiResponse({
    status: 200,
    description: 'All rate limits reset successfully',
  })
  resetAllRateLimits() {
    this.rateLimitingService.resetAllRateLimits();
    return { message: 'All rate limits reset successfully' };
  }

  @Post('cleanup')
  @ApiOperation({ summary: 'Clean up expired rate limit entries' })
  @ApiResponse({
    status: 200,
    description: 'Expired rate limit entries cleaned up successfully',
  })
  cleanupExpiredEntries() {
    this.rateLimitingService.cleanupExpiredEntries();
    return { message: 'Expired rate limit entries cleaned up successfully' };
  }

  @Get('test/:userId')
  @ApiOperation({ summary: 'Test rate limit for a specific user' })
  @ApiResponse({
    status: 200,
    description: 'Rate limit test completed',
    schema: {
      type: 'object',
      properties: {
        allowed: { type: 'boolean' },
        remaining: { type: 'number' },
        resetTime: { type: 'number' },
        retryAfter: { type: 'number' },
      },
    },
  })
  async testUserRateLimit(userId: string) {
    const result = await this.rateLimitingService.checkUserRateLimit(userId, 'general');
    return result;
  }

  @Get('test/ip/:ipAddress')
  @ApiOperation({ summary: 'Test rate limit for a specific IP address' })
  @ApiResponse({
    status: 200,
    description: 'Rate limit test completed',
    schema: {
      type: 'object',
      properties: {
        allowed: { type: 'boolean' },
        remaining: { type: 'number' },
        resetTime: { type: 'number' },
        retryAfter: { type: 'number' },
      },
    },
  })
  async testIPRateLimit(ipAddress: string) {
    const result = await this.rateLimitingService.checkIPRateLimit(ipAddress, 'general');
    return result;
  }
}
