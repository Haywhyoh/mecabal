// Review-related TypeScript interfaces matching backend DTOs

// Business review interface
export interface BusinessReview {
  id: string;
  businessId: string;
  userId: string;
  rating: number; // 1-5
  reviewText?: string;
  serviceQuality?: number; // 1-5
  professionalism?: number; // 1-5
  valueForMoney?: number; // 1-5
  businessResponse?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Populated fields from backend
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  business?: {
    id: string;
    businessName: string;
  };
}

// DTO for creating a review
export interface CreateReviewDto {
  rating: number; // 1-5
  reviewText?: string;
  serviceQuality?: number; // 1-5
  professionalism?: number; // 1-5
  valueForMoney?: number; // 1-5
}

// DTO for responding to a review (business owner)
export interface RespondToReviewDto {
  response: string;
}

// Review query parameters
export interface ReviewQueryDto {
  page?: number;
  limit?: number;
  rating?: number; // Filter by specific rating
}

// Review statistics
export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  averageServiceQuality: number;
  averageProfessionalism: number;
  averageValueForMoney: number;
}

// Review list response with pagination
export interface ReviewListResponse {
  success: boolean;
  data: BusinessReview[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
