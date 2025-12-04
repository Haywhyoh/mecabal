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
  // Bank details
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  // Profile images
  profileImageUrl?: string;
  coverImageUrl?: string;
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
  // Bank details
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
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

// Business Service interface
export interface BusinessService {
  id: string;
  businessId: string;
  serviceName: string;
  description?: string;
  priceMin?: number;
  priceMax?: number;
  duration?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  // Business info (when fetched with relations)
  business?: BusinessProfile;
}

// DTO for creating a business service
export interface CreateBusinessServiceDto {
  serviceName: string;
  description?: string;
  priceMin?: number;
  priceMax?: number;
  duration?: string;
  isActive?: boolean;
}

// DTO for updating a business service
export interface UpdateBusinessServiceDto {
  serviceName?: string;
  description?: string;
  priceMin?: number;
  priceMax?: number;
  duration?: string;
  isActive?: boolean;
}

// Bank details interface
export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

// Service Booking interface
export interface ServiceBooking {
  id: string;
  userId: string;
  businessId: string;
  serviceId?: string;
  serviceName: string;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  scheduledDate?: string;
  scheduledTime?: string;
  address?: string;
  description?: string;
  price: number;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  paymentId?: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  canReview?: boolean;
  hasReviewed?: boolean;
  reviewId?: string;
  businessName?: string;
  businessProfileImageUrl?: string;
  serviceDescription?: string;
  serviceDuration?: string;
}

// DTO for creating a booking
export interface CreateBookingDto {
  businessId: string;
  serviceId?: string;
  serviceName: string;
  scheduledDate?: string;
  scheduledTime?: string;
  address?: string;
  description?: string;
  price: number;
}

// DTO for updating booking status
export interface UpdateBookingStatusDto {
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  cancellationReason?: string;
}

// Filter for booking queries
export interface BookingFilter {
  page?: number;
  limit?: number;
  status?: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | string;
  businessId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}