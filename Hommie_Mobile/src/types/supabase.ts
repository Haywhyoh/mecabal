// MeCabal Supabase Types
// Nigerian Community Platform - Database and API Types

// Core Database Types
export interface NigerianUser {
  id: string;
  phoneNumber: string;
  email?: string;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string;
  // Legacy location fields (deprecated but kept for backward compatibility)
  state?: string;
  city?: string;
  estate?: string;
  location?: string;
  landmark?: string;
  address?: string;
  // New hierarchical location structure
  locationData?: {
    state: {
      id: string;
      name: string;
      code: string;
    };
    lga: {
      id: string;
      name: string;
      code: string;
      type: 'LGA' | 'LCDA';
    };
    ward?: {
      id: string;
      name: string;
      code: string;
    };
    neighborhood: {
      id: string;
      name: string;
      type: 'AREA' | 'ESTATE' | 'COMMUNITY';
      isGated: boolean;
      requiresVerification: boolean;
    };
    cityTown?: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  };
  culturalBackground?: string;
  nativeLanguages?: string;
  bio?: string;
  professionalSkills?: string;
  occupation?: string;
  phoneVerified: boolean;
  identityVerified: boolean;
  addressVerified: boolean;
  preferredLanguage: string;
  carrierInfo?: {
    name: string;
    prefix: string;
    color: string;
  };
  isVerified: boolean;
  verificationLevel: number;
  createdAt: string;
  updatedAt: string;
  // User estates/neighborhoods
  userNeighborhoods?: Array<{
    id: string;
    name: string;
    type: string;
    location: string;
    state?: string;
    lga?: string;
    city?: string;
    isPrimary: boolean;
    isVerified: boolean;
    joinedAt: string;
    relationshipType: string;
    verificationMethod: string;
    memberCount?: number;
  }>;
}

export interface Neighborhood {
  id: string;
  name: string;
  type: 'estate' | 'compound' | 'district';
  description?: string;
  state_name: string;
  lga_name: string;
  landmarks?: {
    primary?: string;
    secondary?: string[];
  };
  estate_management?: {
    contact_name?: string;
    contact_phone?: string;
    office_hours?: string;
    amenities?: string[];
    rules?: string[];
  };
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserNeighborhood {
  id: string;
  user_id: string;
  neighborhood_id: string;
  relationship_type: 'resident' | 'worker' | 'visitor';
  verification_method?: 'gps' | 'referral' | 'manual' | 'document';
  verification_data?: {
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    address?: string;
    confidence_score?: number;
    timestamp?: string;
  };
  verified_by?: string;
  is_primary: boolean;
  address_details?: string;
  joined_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  neighborhood_id: string;
  title?: string;
  content: string;
  post_type: 'general' | 'event' | 'alert' | 'marketplace' | 'lost_found';
  category?: string;
  media_urls?: string[];
  location_data?: {
    address?: string;
    landmarks?: string[];
  };
  engagement_score: number;
  is_pinned: boolean;
  is_approved: boolean;
  moderation_status: 'pending' | 'approved' | 'rejected';
  expires_at?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: Partial<NigerianUser>;
  neighborhood?: Partial<Neighborhood>;
}

export interface Event {
  id: string;
  organizer_id: string;
  neighborhood_id: string;
  title: string;
  description?: string;
  event_type: 'social' | 'educational' | 'business' | 'emergency' | 'religious' | 'cultural';
  venue_name?: string;
  venue_address?: string;
  venue_coordinates?: {
    latitude: number;
    longitude: number;
  };
  start_datetime: string;
  end_datetime?: string;
  max_attendees?: number;
  current_attendees: number;
  is_free: boolean;
  ticket_price?: number;
  registration_required: boolean;
  registration_deadline?: string;
  is_cancelled: boolean;
  cancellation_reason?: string;
  cover_image_url?: string;
  event_data?: any;
  created_at: string;
  updated_at: string;
  // Joined data
  organizer?: Partial<NigerianUser>;
  neighborhood?: Partial<Neighborhood>;
}

export interface EventRSVP {
  id: string;
  event_id: string;
  user_id: string;
  rsvp_status: 'going' | 'maybe' | 'not_going';
  plus_ones: number;
  special_requests?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: Partial<NigerianUser>;
  event?: Partial<Event>;
}

export interface MarketplaceListing {
  id: string;
  seller_id: string;
  neighborhood_id: string;
  title: string;
  description?: string;
  listing_type: 'sell' | 'buy' | 'service' | 'job';
  category?: string;
  price?: number;
  price_type: 'fixed' | 'negotiable' | 'free' | 'hourly';
  condition_type?: 'new' | 'used_like_new' | 'used_good' | 'used_fair';
  availability_status: 'available' | 'pending' | 'sold' | 'expired';
  media_urls?: string[];
  location_details?: string;
  contact_preference: 'in_app' | 'phone' | 'email';
  is_featured: boolean;
  trust_score: number;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  seller?: Partial<NigerianUser>;
  neighborhood?: Partial<Neighborhood>;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  neighborhood_id?: string;
  message_type: 'text' | 'image' | 'audio' | 'location';
  content?: string;
  media_url?: string;
  is_read: boolean;
  reply_to_message_id?: string;
  created_at: string;
  // Joined data
  sender?: Partial<NigerianUser>;
  recipient?: Partial<NigerianUser>;
}

export interface SafetyAlert {
  id: string;
  reporter_id: string;
  neighborhood_id: string;
  alert_type: 'crime' | 'accident' | 'suspicious_activity' | 'emergency' | 'traffic';
  severity_level: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  incident_location?: string;
  incident_coordinates?: {
    latitude: number;
    longitude: number;
  };
  incident_datetime: string;
  verification_status: 'unverified' | 'verified' | 'false_report';
  verification_count: number;
  is_resolved: boolean;
  resolution_notes?: string;
  media_urls?: string[];
  created_at: string;
  updated_at: string;
  // Joined data
  reporter?: Partial<NigerianUser>;
  neighborhood?: Partial<Neighborhood>;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  listing_id?: string;
  amount: number;
  currency: string;
  payment_method: 'paystack' | 'flutterwave' | 'bank_transfer';
  payment_reference: string;
  gateway_reference?: string;
  status: 'pending' | 'successful' | 'failed' | 'cancelled';
  gateway_response?: any;
  transaction_type: 'purchase' | 'escrow' | 'refund';
  created_at: string;
  updated_at: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// Authentication Types
export interface AuthResponse {
  success: boolean;
  user?: NigerianUser;
  session?: any;
  access_token?: string;
  refreshToken?: string;
  message?: string;
  needsProfileCompletion?: boolean;
  error?: string;
}

export interface OTPResponse {
  success: boolean;
  carrier?: string;
  carrier_color?: string;
  message?: string;
  expires_at?: string;
  error?: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  verified: boolean;
  carrier?: string;
  message?: string;
  error?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    phoneVerified: boolean;
    isVerified: boolean;
    verificationLevel: string;
  };
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
    sessionId: string;
  };
  method?: string;
}

// Location Types
export interface LocationVerificationResponse {
  verified: boolean;
  neighborhood?: {
    id: string;
    name: string;
    type: string;
    distance_meters: number;
    landmarks?: any;
  };
  address?: string;
  confidence_score?: number;
  verification_method?: string;
  error?: string;
}

export interface NeighborhoodMatch {
  id: string;
  name: string;
  type: string;
  distance_meters: number;
  distance_km: number;
  state_name: string;
  lga_name: string;
  landmarks?: any;
  can_join: boolean;
}

export interface GeocodeResponse {
  success: boolean;
  address?: string;
  coordinates?: [number, number];
  components?: {
    street?: string;
    area?: string;
    lga?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
  raw_data?: any;
  error?: string;
}

// Payment Types
export interface PaymentInitResponse {
  success: boolean;
  authorization_url?: string;
  access_code?: string;
  reference?: string;
  amount_naira?: number;
  amount_kobo?: number;
  message?: string;
  error?: string;
}

export interface PaymentVerifyResponse {
  success: boolean;
  data?: {
    reference: string;
    status: string;
    amount: number;
    paid_at?: string;
    channel: string;
    customer: {
      email: string;
      firstName: string;
      lastName: string;
    };
  };
  message?: string;
  error?: string;
}

// Real-time Types
export interface RealtimeSubscription {
  unsubscribe: () => void;
}

export interface RealtimePayload<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: T;
  old?: T;
  errors?: any;
}

// Filter and Query Types
export interface PostFilter {
  neighborhood_id?: string;
  user_id?: string;
  post_type?: string;
  category?: string;
  is_pinned?: boolean;
  date_from?: string;
  date_to?: string;
}

export interface EventFilter {
  neighborhood_id?: string;
  event_type?: string;
  date_from?: string;
  date_to?: string;
  is_free?: boolean;
  organizer_id?: string;
}

export interface MarketplaceFilter {
  neighborhood_id?: string;
  listing_type?: string;
  category?: string;
  price_min?: number;
  price_max?: number;
  condition_type?: string;
  availability_status?: string;
}

// Upload Types
export interface MediaUploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export interface FileUploadOptions {
  bucket?: string;
  folder?: string;
  maxSize?: number;
  allowedTypes?: string[];
}

// Utility Types
export type DatabaseTable = 
  | 'users'
  | 'neighborhoods'
  | 'user_neighborhoods'
  | 'posts'
  | 'events'
  | 'event_rsvps'
  | 'marketplace_listings'
  | 'messages'
  | 'safety_alerts'
  | 'payment_transactions';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export type SubscriptionStatus = 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR';

// Export all types as a namespace for easier importing
export namespace MeCabalTypes {
  export type User = NigerianUser;
  export type NeighborhoodType = Neighborhood;
  export type PostType = Post;
  export type EventType = Event;
  export type MarketplaceListingType = MarketplaceListing;
  export type MessageType = Message;
  export type SafetyAlertType = SafetyAlert;
  export type PaymentTransactionType = PaymentTransaction;
}