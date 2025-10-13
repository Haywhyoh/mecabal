import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rate_limit';
export const RATE_LIMIT_SKIP_KEY = 'rate_limit_skip';

export interface RateLimitOptions {
  configName?: string;
  skipIf?: (request: any) => boolean;
  message?: string;
}

/**
 * Apply rate limiting to a controller or method
 */
export function RateLimit(options: RateLimitOptions = {}) {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    SetMetadata(RATE_LIMIT_KEY, options)(target, propertyKey, descriptor);
    return descriptor;
  };
}

/**
 * Skip rate limiting for a method
 */
export function SkipRateLimit() {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    SetMetadata(RATE_LIMIT_SKIP_KEY, true)(target, propertyKey, descriptor);
    return descriptor;
  };
}

/**
 * Apply search rate limiting
 */
export function SearchRateLimit() {
  return RateLimit({
    configName: 'search',
    message: 'Search rate limit exceeded. Please try again later.',
  });
}

/**
 * Apply create listing rate limiting
 */
export function CreateListingRateLimit() {
  return RateLimit({
    configName: 'create-listing',
    message: 'Listing creation rate limit exceeded. Please try again later.',
  });
}

/**
 * Apply upload media rate limiting
 */
export function UploadMediaRateLimit() {
  return RateLimit({
    configName: 'upload-media',
    message: 'Media upload rate limit exceeded. Please try again later.',
  });
}

/**
 * Apply business operations rate limiting
 */
export function BusinessOperationsRateLimit() {
  return RateLimit({
    configName: 'business-operations',
    message: 'Business operations rate limit exceeded. Please try again later.',
  });
}

/**
 * Apply job operations rate limiting
 */
export function JobOperationsRateLimit() {
  return RateLimit({
    configName: 'job-operations',
    message: 'Job operations rate limit exceeded. Please try again later.',
  });
}

/**
 * Apply general API rate limiting
 */
export function GeneralRateLimit() {
  return RateLimit({
    configName: 'general',
    message: 'API rate limit exceeded. Please try again later.',
  });
}
