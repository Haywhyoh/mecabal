// Location Data Models for MeCabal Mobile App
// Based on Nigerian administrative hierarchy

// ==================== CORE LOCATION ENTITIES ====================

export interface State {
  id: string;
  name: string;
  code: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LGA {
  id: string;
  name: string;
  code: string;
  stateId: string;
  type: 'LGA' | 'LCDA';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Ward {
  id: string;
  name: string;
  code: string;
  lgaId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Neighborhood {
  id: string;
  name: string;
  type: 'AREA' | 'ESTATE' | 'COMMUNITY';
  wardId: string;
  stateId: string;
  lgaId: string;
  isGated: boolean;
  requiresVerification: boolean;
  subNeighborhoods?: Neighborhood[];
  boundaries?: GeoJSON.Polygon;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  memberCount?: number;
  recentPostsCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Landmark {
  id: string;
  name: string;
  type: LandmarkType;
  neighborhoodId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  description?: string;
  verificationStatus: VerificationStatus;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserLocation {
  id: string;
  userId: string;
  stateId: string;
  lgaId: string;
  wardId?: string;
  neighborhoodId: string;
  cityTown?: string;
  address?: string;
  street?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  isPrimary: boolean;
  verificationStatus: VerificationStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

// ==================== ENUMS ====================

export enum LandmarkType {
  MARKET = 'MARKET',
  SCHOOL = 'SCHOOL',
  HOSPITAL = 'HOSPITAL',
  CHURCH = 'CHURCH',
  MOSQUE = 'MOSQUE',
  BANK = 'BANK',
  ATM = 'ATM',
  RESTAURANT = 'RESTAURANT',
  SHOPPING_MALL = 'SHOPPING_MALL',
  BUS_STOP = 'BUS_STOP',
  TRAIN_STATION = 'TRAIN_STATION',
  AIRPORT = 'AIRPORT',
  POLICE_STATION = 'POLICE_STATION',
  FIRE_STATION = 'FIRE_STATION',
  GOVERNMENT_OFFICE = 'GOVERNMENT_OFFICE',
  PARK = 'PARK',
  SPORTS_CENTER = 'SPORTS_CENTER',
  CINEMA = 'CINEMA',
  HOTEL = 'HOTEL',
  PHARMACY = 'PHARMACY',
  FUEL_STATION = 'FUEL_STATION',
  OTHER = 'OTHER'
}

export enum VerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

export enum NeighborhoodType {
  AREA = 'AREA',
  ESTATE = 'ESTATE',
  COMMUNITY = 'COMMUNITY'
}

// ==================== API REQUEST/RESPONSE TYPES ====================

export interface LocationSearchRequest {
  query?: string;
  stateId?: string;
  lgaId?: string;
  wardId?: string;
  type?: NeighborhoodType;
  isGated?: boolean;
  limit?: number;
  offset?: number;
}

export interface LocationSearchResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface NeighborhoodRecommendationRequest {
  latitude: number;
  longitude: number;
  radius?: number;
  limit?: number;
}

export interface NeighborhoodRecommendationResponse {
  detectedLocation: {
    state?: State;
    lga?: LGA;
    ward?: Ward;
    neighborhood?: Neighborhood;
  } | null;
  recommendations: Array<{
    neighborhood: Neighborhood;
    distance: number;
    landmarks: Landmark[];
    memberCount: number;
    confidence: number;
  }>;
}

export interface ReverseGeocodeRequest {
  latitude: number;
  longitude: number;
}

export interface ReverseGeocodeResponse {
  success: boolean;
  data?: {
    state?: State;
    lga?: LGA;
    ward?: Ward;
    neighborhood?: Neighborhood;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  error?: string;
}

// ==================== VERIFICATION TYPES ====================

export interface PhotoVerificationRequest {
  photoUrl: string;
  landmarkId?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
  description?: string;
}

export interface DocumentVerificationRequest {
  documentUrl: string;
  documentType: 'utility_bill' | 'bank_statement' | 'government_id' | 'lease_agreement' | 'other';
  address: string;
  issueDate?: string;
  expiryDate?: string;
}

export interface SmsVerificationRequest {
  phoneNumber: string;
  code: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface AdminVerificationRequest {
  estateId: string;
  address: string;
  houseNumber?: string;
  blockNumber?: string;
  moveInDate: string;
  phone: string;
  message?: string;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  locationId: string;
  type: 'PHOTO' | 'DOCUMENT' | 'SMS' | 'ADMIN';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  data: any;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reason?: string;
}

// ==================== LOCATION CONTEXT TYPES ====================

export interface LocationContextState {
  selectedState: State | null;
  selectedLGA: LGA | null;
  selectedWard: Ward | null;
  selectedNeighborhood: Neighborhood | null;
  currentCoordinates: {
    latitude: number;
    longitude: number;
  } | null;
  recommendedNeighborhoods: Neighborhood[];
  isLoadingLocation: boolean;
  locationError: string | null;
  userLocations: UserLocation[];
  primaryLocation: UserLocation | null;
}

export interface LocationContextActions {
  setSelectedState: (state: State | null) => void;
  setSelectedLGA: (lga: LGA | null) => void;
  setSelectedWard: (ward: Ward | null) => void;
  setSelectedNeighborhood: (neighborhood: Neighborhood | null) => void;
  setCurrentCoordinates: (coordinates: { latitude: number; longitude: number } | null) => void;
  setRecommendedNeighborhoods: (neighborhoods: Neighborhood[]) => void;
  setLoadingLocation: (loading: boolean) => void;
  setLocationError: (error: string | null) => void;
  getUserLocations: () => Promise<void>;
  setLocationAsPrimary: (location: UserLocation) => Promise<void>;
  addUserLocation: (location: Omit<UserLocation, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateUserLocation: (locationId: string, updates: Partial<UserLocation>) => Promise<void>;
  deleteUserLocation: (locationId: string) => Promise<void>;
  getCurrentLocation: () => Promise<void>;
  getRecommendations: (latitude: number, longitude: number) => Promise<void>;
  saveUserLocation: (location: Omit<UserLocation, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  clearLocationSelection: () => void;
  
  // Offline support
  syncOfflineData: () => Promise<void>;
  getOfflineStatus: () => Promise<{
    isOnline: boolean;
    hasOfflineData: boolean;
    queueLength: number;
    lastSyncTime: Date | null;
  }>;
  clearOfflineCache: () => Promise<void>;
}

// ==================== COMPONENT PROPS TYPES ====================

export interface HierarchicalLocationSelectorProps {
  onLocationSelected: (location: {
    state: State;
    lga: LGA;
    ward?: Ward;
    neighborhood: Neighborhood;
    coordinates?: LocationCoordinates;
  }) => void;
  initialLocation?: {
    state?: State;
    lga?: LGA;
    ward?: Ward;
    neighborhood?: Neighborhood;
  };
  showProgress?: boolean;
  allowSkip?: boolean;
  onSkip?: () => void;
  onCancel?: () => void;
}

export interface GPSLocationPickerProps {
  onLocationSelected: (location: {
    coordinates: { latitude: number; longitude: number };
    neighborhood?: Neighborhood;
    address?: string;
  }) => void;
  initialCoordinates?: { latitude: number; longitude: number };
  showMap?: boolean;
  allowManualInput?: boolean;
  onCancel?: () => void;
}

export interface LocationSearchProps {
  onLocationSelected: (location: Neighborhood) => void;
  placeholder?: string;
  showFilters?: boolean;
  filters?: LocationSearchRequest;
  onFiltersChange?: (filters: LocationSearchRequest) => void;
}

// ==================== UTILITY TYPES ====================

export interface LocationHierarchy {
  state: State;
  lga: LGA;
  ward?: Ward;
  neighborhood: Neighborhood;
}

export interface LocationStats {
  totalStates: number;
  totalLGAs: number;
  totalWards: number;
  totalNeighborhoods: number;
  totalLandmarks: number;
  verifiedLocations: number;
  pendingVerifications: number;
}

export interface NearbyUser {
  id: string;
  name: string;
  profilePicture?: string;
  distance: number;
  neighborhood: Neighborhood;
  isVerified: boolean;
}

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'restricted' | 'undetermined';
}

// ==================== ERROR TYPES ====================

export interface LocationError {
  code: string;
  message: string;
  details?: any;
}

export enum LocationErrorCode {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  LOCATION_UNAVAILABLE = 'LOCATION_UNAVAILABLE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// ==================== EXPORT ALL TYPES ====================

export type {
  State,
  LGA,
  Ward,
  Neighborhood,
  Landmark,
  UserLocation,
  LocationSearchRequest,
  LocationSearchResponse,
  NeighborhoodRecommendationRequest,
  NeighborhoodRecommendationResponse,
  ReverseGeocodeRequest,
  ReverseGeocodeResponse,
  PhotoVerificationRequest,
  DocumentVerificationRequest,
  SmsVerificationRequest,
  AdminVerificationRequest,
  VerificationRequest,
  LocationContextState,
  LocationContextActions,
  HierarchicalLocationSelectorProps,
  GPSLocationPickerProps,
  LocationSearchProps,
  LocationHierarchy,
  LocationStats,
  NearbyUser,
  LocationPermissionStatus,
  LocationError
};

export {
  LandmarkType,
  VerificationStatus,
  NeighborhoodType,
  LocationErrorCode
};
