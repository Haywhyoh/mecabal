import {
  Injectable,
  ExecutionContext,
  ThrottlerGuard,
  ThrottlerException,
  ThrottlerOptions,
} from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { RateLimitingService } from '../rate-limiting.service';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  constructor(
    options: ThrottlerOptions,
    reflector: Reflector,
    private readonly rateLimitingService: RateLimitingService,
  ) {
    super(options, reflector);
  }

  async handleRequest(
    context: ExecutionContext,
    limit: number,
    ttl: number,
    throttler: ThrottlerOptions,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = (request as any).user?.userId;
    const ipAddress = this.getClientIP(request);
    const endpoint = this.getEndpoint(context);

    // Determine rate limit configuration based on endpoint
    const configName = this.getConfigNameForEndpoint(endpoint);
    
    try {
      // Check user-specific rate limit if user is authenticated
      if (userId) {
        const userResult = await this.rateLimitingService.checkUserRateLimit(userId, configName);
        if (!userResult.allowed) {
          throw new ThrottlerException(
            `Rate limit exceeded for user. Try again in ${userResult.retryAfter} seconds.`,
          );
        }
      }

      // Check IP-based rate limit
      const ipResult = await this.rateLimitingService.checkIPRateLimit(ipAddress, 'ip-based');
      if (!ipResult.allowed) {
        throw new ThrottlerException(
          `Rate limit exceeded for IP address. Try again in ${ipResult.retryAfter} seconds.`,
        );
      }

      // Check endpoint-specific rate limit
      const endpointResult = await this.rateLimitingService.checkEndpointRateLimit(
        endpoint,
        configName,
        userId,
        ipAddress,
      );
      if (!endpointResult.allowed) {
        throw new ThrottlerException(
          `Rate limit exceeded for endpoint. Try again in ${endpointResult.retryAfter} seconds.`,
        );
      }

      return true;
    } catch (error) {
      if (error instanceof ThrottlerException) {
        throw error;
      }
      
      // If there's an error with rate limiting, allow the request but log it
      console.error('Rate limiting error:', error);
      return true;
    }
  }

  /**
   * Get client IP address from request
   */
  private getClientIP(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    const realIP = request.headers['x-real-ip'];
    
    if (forwarded) {
      return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return Array.isArray(realIP) ? realIP[0] : realIP;
    }
    
    return request.connection.remoteAddress || request.socket.remoteAddress || 'unknown';
  }

  /**
   * Get endpoint from execution context
   */
  private getEndpoint(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest<Request>();
    return `${request.method}:${request.route?.path || request.path}`;
  }

  /**
   * Get rate limit configuration name based on endpoint
   */
  private getConfigNameForEndpoint(endpoint: string): string {
    const method = endpoint.split(':')[0];
    const path = endpoint.split(':')[1];

    // Search endpoints
    if (path.includes('/search')) {
      return 'search';
    }

    // Create listing endpoints
    if (method === 'POST' && path.includes('/listings')) {
      return 'create-listing';
    }

    // Upload media endpoints
    if (path.includes('/media') || path.includes('/upload')) {
      return 'upload-media';
    }

    // Business operation endpoints
    if (path.includes('/business')) {
      return 'business-operations';
    }

    // Job operation endpoints
    if (path.includes('/jobs')) {
      return 'job-operations';
    }

    // General API endpoints
    return 'general';
  }

  /**
   * Generate rate limit key
   */
  protected generateKey(
    context: ExecutionContext,
    ttl: number,
    limit: number,
  ): string {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = (request as any).user?.userId;
    const ipAddress = this.getClientIP(request);
    const endpoint = this.getEndpoint(context);

    if (userId) {
      return `user:${userId}:${endpoint}`;
    }

    return `ip:${ipAddress}:${endpoint}`;
  }
}
