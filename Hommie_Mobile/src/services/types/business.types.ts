// Business-related TypeScript interfaces matching backend DTOs

// Enums matching backend
export enum ServiceArea {
  ESTATE_ONLY = 'estate-only',
  NEIGHBORHOOD = 'neighborhood',
  DISTRICT = 'district',
  CITY_WIDE = 'city-wide',
  STATE_WIDE = 'state-wide',
  // Legacy values for backward compatibility
  TWO_KM = '2km',
  FIVE_KM = '5km',
  TEN_KM = '10km',
  NATIONWIDE = 'nationwide',
}

export enum PricingModel {
  FIXED_RATE = 'fixed-rate',
  HOURLY_RATE = 'hourly-rate',
  PROJECT_BASED = 'project-based',
  NEGOTIABLE = 'negotiable',
  // Legacy values for backward compatibility
  HOURLY = 'hourly',
  PER_ITEM = 'per-item',
  CUSTOM_QUOTE = 'custom-quote',
}

export enum Availability {
  BUSINESS_HOURS = 'business-hours',
  EXTENDED_HOURS = 'extended-hours',
  WEEKEND_AVAILABLE = 'weekend-available',
  TWENTY_FOUR_SEVEN = 'twenty-four-seven',
  FLEXIBLE = 'flexible',
  // Legacy values for backward compatibility
  WEEKDAYS = 'weekdays',
  WEEKENDS = 'weekends',
  CUSTOM = 'custom',
}

// Main business profile interface
export interface BusinessProfile {
  id: string;
  userId: string;
  businessName: string;
  description?: string;
  category: string;
  subcategory?: string;
  serviceArea: ServiceArea;
  pricingModel: PricingModel;
  availability: Availability;
  phoneNumber?: string;
  whatsappNumber?: string;
  businessAddress?: string;
  yearsOfExperience: number;
  paymentMethods?: string[];
  hasInsurance?: boolean;
  isActive: boolean;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  createdAt: string;
  updatedAt: string;
}

// DTO for creating a new business
export interface CreateBusinessProfileDto {
  businessName: string;
  description?: string;
  category: string;
  subcategory?: string;
  serviceArea: ServiceArea;
  pricingModel: PricingModel;
  availability: Availability;
  phoneNumber?: string;
  whatsappNumber?: string;
  businessAddress?: string;
  yearsOfExperience: number;
  paymentMethods?: string[];
  hasInsurance?: boolean;
}

// DTO for updating business profile
export interface UpdateBusinessProfileDto {
  businessName?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  serviceArea?: ServiceArea;
  pricingModel?: PricingModel;
  availability?: Availability;
  phoneNumber?: string;
  whatsappNumber?: string;
  businessAddress?: string;
  yearsOfExperience?: number;
  paymentMethods?: string[];
  hasInsurance?: boolean;
}

// Search business DTO
export enum SortBy {
  RATING = 'rating',
  REVIEWS = 'reviewCount',
  JOINED_DATE = 'joinedDate',
  DISTANCE = 'distance',
  COMPLETED_JOBS = 'completedJobs',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export interface SearchBusinessDto {
  query?: string;
  category?: string;
  subcategory?: string;
  latitude?: number;
  longitude?: number;
  radius?: number; // in km, 0-200
  state?: string;
  city?: string;
  minRating?: number; // 0-5
  verifiedOnly?: boolean;
  paymentMethods?: string[];
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  page?: number;
  limit?: number;
}

// Search response with pagination
export interface SearchResponse {
  success: boolean;
  data: BusinessProfile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Service area grouping
export interface ServiceAreaGroup {
  serviceArea: string;
  businesses: BusinessProfile[];
  count: number;
}
