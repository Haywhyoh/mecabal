/**
 * API Services Index
 * Central export point for all API services
 */

// Export API client
export { apiClient } from './apiClient';

// Export business services
export { businessApi } from './businessApi';
export { businessSearchApi } from './businessSearchApi';
export { businessReviewApi } from './businessReviewApi';
export { businessInquiryApi } from './businessInquiryApi';
export { businessAnalyticsApi } from './businessAnalyticsApi';
export { businessLicenseApi } from './businessLicenseApi';

// Export types
export * from '../types/business.types';
export * from '../types/review.types';
export * from '../types/inquiry.types';
export * from '../types/api.types';
