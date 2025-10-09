// Common API types and interfaces

// Generic API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// Error response from API
export interface ApiError {
  success: false;
  message: string;
  error?: string;
  statusCode?: number;
}

// Pagination metadata
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Paginated response
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}

// Analytics types
export interface AnalyticsOverview {
  totalViews: number;
  totalContactClicks: number;
  totalInquiries: number;
  totalBookings: number;
  viewsThisPeriod: number;
  contactsThisPeriod: number;
  conversionRate: number;
  popularDays: string[];
  peakHours: number[];
}

export interface DailyStat {
  date: string;
  views: number;
  contacts: number;
  inquiries: number;
  bookings: number;
}

export interface Activity {
  id: string;
  businessId: string;
  activityType: string;
  metadata?: any;
  createdAt: string;
}

// License types
export interface BusinessLicense {
  id: string;
  businessId: string;
  licenseType: string;
  licenseNumber: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate?: string;
  documentUrl?: string;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLicenseDto {
  licenseType: string;
  licenseNumber: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate?: string;
  documentUrl?: string;
}

export interface UpdateLicenseDto {
  licenseType?: string;
  licenseNumber?: string;
  issuingAuthority?: string;
  issueDate?: string;
  expiryDate?: string;
  documentUrl?: string;
}

export interface VerifyLicenseDto {
  isVerified: boolean;
  verificationNotes?: string;
}
