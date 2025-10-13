import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@app/database';

export interface RateLimitConfig {
  name: string;
  ttl: number; // Time to live in milliseconds
  limit: number; // Maximum number of requests
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

@Injectable()
export class RateLimitingService {
  private readonly logger = new Logger(RateLimitingService.name);
  private readonly rateLimitConfigs: Map<string, RateLimitConfig> = new Map();
  private readonly userRequestCounts: Map<string, Map<string, { count: number; resetTime: number }>> = new Map();

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    this.initializeRateLimitConfigs();
  }

  /**
   * Initialize rate limit configurations
   */
  private initializeRateLimitConfigs(): void {
    // General API rate limits
    this.rateLimitConfigs.set('general', {
      name: 'general',
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute
    });

    // Search API rate limits
    this.rateLimitConfigs.set('search', {
      name: 'search',
      ttl: 60000, // 1 minute
      limit: 50, // 50 requests per minute
    });

    // Create listing rate limits
    this.rateLimitConfigs.set('create-listing', {
      name: 'create-listing',
      ttl: 3600000, // 1 hour
      limit: 10, // 10 requests per hour
    });

    // Upload media rate limits
    this.rateLimitConfigs.set('upload-media', {
      name: 'upload-media',
      ttl: 3600000, // 1 hour
      limit: 20, // 20 requests per hour
    });

    // User-specific rate limits
    this.rateLimitConfigs.set('user-specific', {
      name: 'user-specific',
      ttl: 60000, // 1 minute
      limit: 200, // 200 requests per minute for authenticated users
    });

    // IP-based rate limits
    this.rateLimitConfigs.set('ip-based', {
      name: 'ip-based',
      ttl: 60000, // 1 minute
      limit: 150, // 150 requests per minute per IP
    });

    // Business operations rate limits
    this.rateLimitConfigs.set('business-operations', {
      name: 'business-operations',
      ttl: 300000, // 5 minutes
      limit: 30, // 30 requests per 5 minutes
    });

    // Job operations rate limits
    this.rateLimitConfigs.set('job-operations', {
      name: 'job-operations',
      ttl: 300000, // 5 minutes
      limit: 25, // 25 requests per 5 minutes
    });
  }

  /**
   * Check rate limit for a specific key and configuration
   */
  async checkRateLimit(
    key: string,
    configName: string,
    userId?: string,
  ): Promise<RateLimitResult> {
    const config = this.rateLimitConfigs.get(configName);
    if (!config) {
      this.logger.warn(`Rate limit configuration not found: ${configName}`);
      return {
        allowed: true,
        remaining: Number.MAX_SAFE_INTEGER,
        resetTime: Date.now() + 60000,
      };
    }

    const now = Date.now();
    const resetTime = now + config.ttl;

    // Get or create user request tracking
    if (!this.userRequestCounts.has(key)) {
      this.userRequestCounts.set(key, new Map());
    }

    const userCounts = this.userRequestCounts.get(key)!;
    const currentCount = userCounts.get(configName);

    if (!currentCount || currentCount.resetTime <= now) {
      // First request or reset period has passed
      userCounts.set(configName, {
        count: 1,
        resetTime,
      });

      this.logger.debug(`Rate limit check: ${key} - ${configName} - 1/${config.limit}`);
      
      return {
        allowed: true,
        remaining: config.limit - 1,
        resetTime,
      };
    }

    if (currentCount.count >= config.limit) {
      // Rate limit exceeded
      this.logger.warn(`Rate limit exceeded: ${key} - ${configName} - ${currentCount.count}/${config.limit}`);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: currentCount.resetTime,
        retryAfter: Math.ceil((currentCount.resetTime - now) / 1000),
      };
    }

    // Increment count
    currentCount.count++;
    userCounts.set(configName, currentCount);

    this.logger.debug(`Rate limit check: ${key} - ${configName} - ${currentCount.count}/${config.limit}`);

    return {
      allowed: true,
      remaining: config.limit - currentCount.count,
      resetTime: currentCount.resetTime,
    };
  }

  /**
   * Check rate limit for user
   */
  async checkUserRateLimit(
    userId: string,
    configName: string,
  ): Promise<RateLimitResult> {
    return this.checkRateLimit(`user:${userId}`, configName, userId);
  }

  /**
   * Check rate limit for IP address
   */
  async checkIPRateLimit(
    ipAddress: string,
    configName: string,
  ): Promise<RateLimitResult> {
    return this.checkRateLimit(`ip:${ipAddress}`, configName);
  }

  /**
   * Check rate limit for endpoint
   */
  async checkEndpointRateLimit(
    endpoint: string,
    configName: string,
    userId?: string,
    ipAddress?: string,
  ): Promise<RateLimitResult> {
    const key = userId ? `endpoint:${endpoint}:user:${userId}` : `endpoint:${endpoint}:ip:${ipAddress}`;
    return this.checkRateLimit(key, configName, userId);
  }

  /**
   * Get rate limit configuration
   */
  getRateLimitConfig(configName: string): RateLimitConfig | undefined {
    return this.rateLimitConfigs.get(configName);
  }

  /**
   * Get all rate limit configurations
   */
  getAllRateLimitConfigs(): Map<string, RateLimitConfig> {
    return new Map(this.rateLimitConfigs);
  }

  /**
   * Reset rate limit for a specific key
   */
  resetRateLimit(key: string, configName?: string): void {
    if (configName) {
      const userCounts = this.userRequestCounts.get(key);
      if (userCounts) {
        userCounts.delete(configName);
      }
    } else {
      this.userRequestCounts.delete(key);
    }
  }

  /**
   * Reset all rate limits
   */
  resetAllRateLimits(): void {
    this.userRequestCounts.clear();
  }

  /**
   * Get rate limit statistics
   */
  getRateLimitStats(): {
    totalKeys: number;
    totalConfigs: number;
    activeRequests: number;
  } {
    let activeRequests = 0;
    for (const userCounts of this.userRequestCounts.values()) {
      activeRequests += userCounts.size;
    }

    return {
      totalKeys: this.userRequestCounts.size,
      totalConfigs: this.rateLimitConfigs.size,
      activeRequests,
    };
  }

  /**
   * Check if user is premium (higher rate limits)
   */
  async isPremiumUser(userId: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id'], // Just check if user exists for now
      });
      // For now, return false as premium feature is not implemented
      return false;
    } catch (error) {
      this.logger.error(`Error checking premium status for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Get user-specific rate limit configuration
   */
  async getUserRateLimitConfig(userId: string, baseConfigName: string): Promise<RateLimitConfig> {
    const baseConfig = this.rateLimitConfigs.get(baseConfigName);
    if (!baseConfig) {
      throw new Error(`Base rate limit configuration not found: ${baseConfigName}`);
    }

    const isPremium = await this.isPremiumUser(userId);
    
    if (isPremium) {
      // Premium users get 2x the rate limit
      return {
        ...baseConfig,
        limit: baseConfig.limit * 2,
      };
    }

    return baseConfig;
  }

  /**
   * Clean up expired rate limit entries
   */
  cleanupExpiredEntries(): void {
    const now = Date.now();
    
    for (const [key, userCounts] of this.userRequestCounts.entries()) {
      for (const [configName, count] of userCounts.entries()) {
        if (count.resetTime <= now) {
          userCounts.delete(configName);
        }
      }
      
      if (userCounts.size === 0) {
        this.userRequestCounts.delete(key);
      }
    }
  }
}
