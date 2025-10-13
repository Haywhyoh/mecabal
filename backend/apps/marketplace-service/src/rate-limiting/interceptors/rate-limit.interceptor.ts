import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { RateLimitingService } from '../rate-limiting.service';
import { RATE_LIMIT_KEY, RATE_LIMIT_SKIP_KEY, RateLimitOptions } from '../decorators/rate-limit.decorator';

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RateLimitInterceptor.name);

  constructor(
    private readonly rateLimitingService: RateLimitingService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const method = context.getHandler();
    const className = context.getClass().name;

    // Check if rate limiting should be skipped
    const skipRateLimit = this.reflector.get<boolean>(RATE_LIMIT_SKIP_KEY, method);
    if (skipRateLimit) {
      return next.handle();
    }

    // Get rate limit options
    const rateLimitOptions = this.reflector.get<RateLimitOptions>(RATE_LIMIT_KEY, method);
    if (!rateLimitOptions) {
      return next.handle();
    }

    // Check skip condition
    if (rateLimitOptions.skipIf && rateLimitOptions.skipIf(request)) {
      return next.handle();
    }

    const userId = request.user?.userId;
    const ipAddress = this.getClientIP(request);
    const endpoint = this.getEndpoint(context);
    const configName = rateLimitOptions.configName || 'general';

    try {
      // Check rate limits
      const results = await Promise.all([
        userId ? this.rateLimitingService.checkUserRateLimit(userId, configName) : Promise.resolve({ allowed: true, remaining: 0, resetTime: 0 }),
        this.rateLimitingService.checkIPRateLimit(ipAddress, 'ip-based'),
        this.rateLimitingService.checkEndpointRateLimit(endpoint, configName, userId, ipAddress),
      ]);

      // Check if any rate limit is exceeded
      const exceededResult = results.find(result => !result.allowed);
      if (exceededResult) {
        const message = rateLimitOptions.message || 'Rate limit exceeded. Please try again later.';
        const retryAfter = (exceededResult as any).retryAfter || 60;
        
        throw new HttpException(
          {
            message,
            retryAfter,
            resetTime: exceededResult.resetTime,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Add rate limit headers to response
      const minRemaining = Math.min(...results.map(r => r.remaining));
      const maxResetTime = Math.max(...results.map(r => r.resetTime));

      return next.handle().pipe(
        tap(() => {
          // Add rate limit headers
          const response = context.switchToHttp().getResponse();
          response.setHeader('X-RateLimit-Limit', this.getRateLimitConfig(configName)?.limit || 100);
          response.setHeader('X-RateLimit-Remaining', minRemaining);
          response.setHeader('X-RateLimit-Reset', new Date(maxResetTime).toISOString());
        }),
        catchError((error) => {
          if (error instanceof HttpException && error.getStatus() === HttpStatus.TOO_MANY_REQUESTS) {
            this.logger.warn(`Rate limit exceeded for ${userId ? `user:${userId}` : `ip:${ipAddress}`} on ${endpoint}`);
          }
          return throwError(() => error);
        }),
      );
    } catch (error) {
      this.logger.error(`Rate limiting error for ${userId ? `user:${userId}` : `ip:${ipAddress}`} on ${endpoint}:`, error);
      
      // If there's an error with rate limiting, allow the request but log it
      return next.handle();
    }
  }

  /**
   * Get client IP address from request
   */
  private getClientIP(request: any): string {
    const forwarded = request.headers['x-forwarded-for'];
    const realIP = request.headers['x-real-ip'];
    
    if (forwarded) {
      return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return Array.isArray(realIP) ? realIP[0] : realIP;
    }
    
    return request.connection?.remoteAddress || request.socket?.remoteAddress || 'unknown';
  }

  /**
   * Get endpoint from execution context
   */
  private getEndpoint(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest();
    return `${request.method}:${request.route?.path || request.path}`;
  }

  /**
   * Get rate limit configuration
   */
  private getRateLimitConfig(configName: string) {
    return this.rateLimitingService.getRateLimitConfig(configName);
  }
}
