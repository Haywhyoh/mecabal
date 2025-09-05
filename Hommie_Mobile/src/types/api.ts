// MeCabal API Response Types
// Standardized response interfaces for all API interactions

// Generic API Response Structure
export interface BaseApiResponse {
  success: boolean;
  message?: string;
  timestamp: string;
  request_id?: string;
}

export interface ApiResponse<T = any> extends BaseApiResponse {
  data?: T;
  error?: string | ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  field?: string; // For validation errors
}

// Paginated Response
export interface PaginatedApiResponse<T> extends BaseApiResponse {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

// Authentication API Responses
export interface LoginApiResponse extends ApiResponse {
  data?: {
    user: {
      id: string;
      phone_number: string;
      first_name: string;
      last_name: string;
      verification_level: number;
    };
    session: {
      access_token: string;
      refresh_token: string;
      expires_at: string;
    };
  };
}

export interface OTPApiResponse extends ApiResponse {
  data?: {
    carrier: string;
    carrier_color: string;
    expires_at: string;
    retry_after?: number;
  };
}

export interface VerifyOTPApiResponse extends ApiResponse {
  data?: {
    verified: boolean;
    carrier: string;
    next_step?: 'profile_setup' | 'location_verification' | 'complete';
  };
}

// Location API Responses
export interface LocationVerificationApiResponse extends ApiResponse {
  data?: {
    verified: boolean;
    neighborhood: {
      id: string;
      name: string;
      type: string;
      distance_meters: number;
      landmarks: any;
    };
    address: string;
    confidence_score: number;
    verification_method: string;
  };
}

export interface NeighborhoodSearchApiResponse extends ApiResponse {
  data?: {
    neighborhoods: Array<{
      id: string;
      name: string;
      type: string;
      distance_meters: number;
      distance_km: number;
      state_name: string;
      lga_name: string;
      can_join: boolean;
      member_count: number;
    }>;
    search_center: {
      latitude: number;
      longitude: number;
    };
    search_radius_km: number;
  };
}

export interface GeocodeApiResponse extends ApiResponse {
  data?: {
    address: string;
    coordinates: [number, number]; // [longitude, latitude]
    components: {
      street?: string;
      area?: string;
      lga?: string;
      state?: string;
      country?: string;
      postcode?: string;
    };
    confidence: number;
  };
}

// Payment API Responses
export interface PaymentInitApiResponse extends ApiResponse {
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
    amount_naira: number;
    amount_kobo: number;
    payment_method: string;
    expires_at: string;
  };
}

export interface PaymentVerificationApiResponse extends ApiResponse {
  data?: {
    reference: string;
    status: 'successful' | 'failed' | 'pending' | 'cancelled';
    amount: number;
    currency: 'NGN';
    paid_at?: string;
    channel: string;
    gateway_response: string;
    customer: {
      email: string;
      first_name: string;
      last_name: string;
      phone: string;
    };
  };
}

export interface PaymentStatusApiResponse extends ApiResponse {
  data?: {
    reference: string;
    status: 'pending' | 'successful' | 'failed' | 'cancelled';
    amount: number;
    currency: string;
    payment_method: string;
    created_at: string;
    updated_at: string;
  };
}

// Content API Responses
export interface PostApiResponse extends ApiResponse {
  data?: {
    id: string;
    title?: string;
    content: string;
    post_type: string;
    category: string;
    media_urls: string[];
    engagement_score: number;
    created_at: string;
    user: {
      id: string;
      first_name: string;
      last_name: string;
      profile_picture_url?: string;
      verification_level: number;
    };
    neighborhood: {
      id: string;
      name: string;
      type: string;
    };
  };
}

export interface EventApiResponse extends ApiResponse {
  data?: {
    id: string;
    title: string;
    description: string;
    event_type: string;
    venue_name: string;
    venue_address: string;
    start_datetime: string;
    end_datetime?: string;
    max_attendees?: number;
    current_attendees: number;
    is_free: boolean;
    ticket_price?: number;
    registration_required: boolean;
    cover_image_url?: string;
    organizer: {
      id: string;
      first_name: string;
      last_name: string;
      profile_picture_url?: string;
    };
    user_rsvp?: {
      status: 'going' | 'maybe' | 'not_going';
      plus_ones: number;
    };
  };
}

export interface MarketplaceListingApiResponse extends ApiResponse {
  data?: {
    id: string;
    title: string;
    description: string;
    listing_type: string;
    category: string;
    price?: number;
    price_type: string;
    condition_type?: string;
    availability_status: string;
    media_urls: string[];
    trust_score: number;
    created_at: string;
    seller: {
      id: string;
      first_name: string;
      last_name: string;
      profile_picture_url?: string;
      verification_level: number;
    };
    neighborhood: {
      id: string;
      name: string;
      type: string;
    };
  };
}

// Upload API Responses
export interface MediaUploadApiResponse extends ApiResponse {
  data?: {
    url: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    bucket: string;
    public_url: string;
  };
}

export interface BulkMediaUploadApiResponse extends ApiResponse {
  data?: {
    uploaded: Array<{
      original_name: string;
      url: string;
      file_size: number;
    }>;
    failed: Array<{
      original_name: string;
      error: string;
    }>;
    total_uploaded: number;
    total_failed: number;
  };
}

// Analytics API Responses
export interface UserStatsApiResponse extends ApiResponse {
  data?: {
    posts_count: number;
    events_created: number;
    events_attended: number;
    marketplace_listings: number;
    transactions_completed: number;
    community_score: number;
    join_date: string;
    last_active: string;
  };
}

export interface NeighborhoodStatsApiResponse extends ApiResponse {
  data?: {
    total_members: number;
    active_members_30d: number;
    posts_this_month: number;
    events_this_month: number;
    marketplace_listings_active: number;
    safety_alerts_30d: number;
    community_health_score: number;
  };
}

// Search API Responses
export interface SearchApiResponse<T> extends ApiResponse {
  data?: {
    results: T[];
    total_found: number;
    search_query: string;
    search_filters: any;
    suggestions?: string[];
  };
}

// Real-time API Types
export interface RealtimeMessage<T = any> {
  type: 'INSERT' | 'UPDATE' | 'DELETE' | 'BROADCAST';
  table?: string;
  schema?: string;
  new_record?: T;
  old_record?: T;
  event_ts: string;
}

export interface RealtimeStatus {
  status: 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED';
  error?: string;
}

// Notification API Responses
export interface NotificationApiResponse extends ApiResponse {
  data?: {
    id: string;
    type: string;
    title: string;
    message: string;
    data?: any;
    is_read: boolean;
    created_at: string;
  };
}

// Error Response Types
export interface ValidationErrorResponse extends BaseApiResponse {
  success: false;
  error: {
    code: 'VALIDATION_ERROR';
    message: 'Validation failed';
    details: {
      field: string;
      message: string;
    }[];
  };
}

export interface AuthenticationErrorResponse extends BaseApiResponse {
  success: false;
  error: {
    code: 'AUTHENTICATION_ERROR' | 'AUTHORIZATION_ERROR' | 'TOKEN_EXPIRED';
    message: string;
  };
}

export interface RateLimitErrorResponse extends BaseApiResponse {
  success: false;
  error: {
    code: 'RATE_LIMIT_EXCEEDED';
    message: string;
    retry_after: number;
  };
}

export interface ServerErrorResponse extends BaseApiResponse {
  success: false;
  error: {
    code: 'INTERNAL_SERVER_ERROR' | 'SERVICE_UNAVAILABLE' | 'NETWORK_ERROR';
    message: string;
    request_id?: string;
  };
}

// Request Types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: any;
}

export interface SearchParams extends PaginationParams, SortParams, FilterParams {
  query?: string;
}

// HTTP Status Codes for API
export enum ApiStatusCode {
  SUCCESS = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  VALIDATION_ERROR = 422,
  RATE_LIMITED = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504
}

// API Endpoint Categories
export type ApiEndpointCategory = 
  | 'auth'
  | 'users'
  | 'neighborhoods'
  | 'posts'
  | 'events'
  | 'marketplace'
  | 'messages'
  | 'safety'
  | 'payments'
  | 'upload'
  | 'location'
  | 'analytics'
  | 'notifications';

// Request Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Content Types
export type ContentType = 
  | 'application/json'
  | 'application/x-www-form-urlencoded'
  | 'multipart/form-data'
  | 'text/plain';

export default ApiResponse;