// MeCabal Events API Service
// Handles all events-related API calls to the backend
// Uses the same patterns as other MeCabal services

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../config/environment';

// API Base Configuration
const API_BASE_URL = ENV.API.BASE_URL;
const API_TIMEOUT = ENV.API.TIMEOUT;

// Events API endpoints
const EVENTS_ENDPOINTS = {
  BASE: '/events',
  NEARBY: '/events/nearby',
  MY_EVENTS: '/events/my-events',
  FEATURED: '/events/featured',
  UPLOAD: '/events/upload',
} as const;

// API client helper
class EventsApiClient {
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const token = await AsyncStorage.getItem('auth_token');

      // Debug token retrieval
      if (token) {
        console.log(`🔐 Retrieved token for ${endpoint}:`, token.substring(0, 50) + '...');
      } else {
        // Only log as warning for endpoints that likely need auth
        const publicEndpoints = ['/events', '/events/nearby', '/events/featured'];
        const isPublicEndpoint = publicEndpoints.some(pe => endpoint.includes(pe));
        if (!isPublicEndpoint) {
          console.log(`⚠️ No token found for ${endpoint} (may require authentication)`);
        } else {
          console.log(`🔓 Public endpoint ${endpoint} (no token needed)`);
        }
      }

      const config: RequestInit = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const duration = Date.now() - startTime;

      if (ENV.DEV.ENABLE_LOGGING) {
        console.log(`🌐 ${config.method} ${endpoint} - ${response.status} (${duration}ms)`);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ API Error ${endpoint} (${duration}ms):`, error);
      throw error;
    }
  }

  // GET request helper
  private static async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';
    
    return this.makeRequest<T>(`${endpoint}${queryString}`, { method: 'GET' });
  }

  // POST request helper
  private static async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PATCH request helper
  private static async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request helper
  private static async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' });
  }
}

// Event Types (matching backend DTOs)
export interface Event {
  id: string;
  title: string;
  description: string;
  eventDate: string; // YYYY-MM-DD format
  startTime: string; // HH:mm format
  endTime?: string; // HH:mm format
  timezone: string;
  location: EventLocation;
  isFree: boolean;
  price?: number;
  currency: string;
  formattedPrice: string;
  maxAttendees?: number;
  allowGuests: boolean;
  requireVerification: boolean;
  ageRestriction?: string;
  languages: string[];
  isPrivate: boolean;
  coverImageUrl?: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  viewsCount: number;
  attendeesCount: number;
  specialRequirements?: string;
  createdAt: string;
  updatedAt: string;
  category: EventCategory;
  organizer: EventOrganizer;
  media: EventMedia[];
  userRsvpStatus?: 'going' | 'maybe' | 'not_going';
  canRsvp: boolean;
  isAtCapacity: boolean;
  isUpcoming: boolean;
  isToday: boolean;
  durationString: string;
}

export interface EventLocation {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  landmark?: string;
}

export interface EventCategory {
  id: number;
  name: string;
  icon: string;
  colorCode: string;
  description?: string;
}

export interface EventOrganizer {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  profilePictureUrl?: string;
  trustScore: number;
  isVerified: boolean;
}

export interface EventMedia {
  id: string;
  url: string;
  type: 'image' | 'video';
  caption?: string;
  displayOrder: number;
}

// DTOs for API calls
export interface CreateEventDto {
  categoryId: number;
  title: string;
  description: string;
  eventDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime?: string; // HH:mm
  location: EventLocation;
  isFree: boolean;
  price?: number;
  maxAttendees?: number;
  allowGuests?: boolean;
  requireVerification?: boolean;
  ageRestriction?: string;
  languages?: string[];
  isPrivate?: boolean;
  coverImageUrl?: string;
  media?: EventMediaDto[];
  specialRequirements?: string;
}

export interface EventMediaDto {
  url: string;
  type: 'image' | 'video';
  caption?: string;
  displayOrder?: number;
}

export interface UpdateEventDto extends Partial<CreateEventDto> {}

export interface EventFilterDto {
  page?: number;
  limit?: number;
  categoryId?: number;
  status?: 'draft' | 'published' | 'cancelled' | 'completed';
  search?: string;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
  neighborhoodId?: string;
  isFree?: boolean;
  sortBy?: 'createdAt' | 'eventDate' | 'attendeesCount';
  sortOrder?: 'ASC' | 'DESC';
}

export interface RsvpDto {
  rsvpStatus: 'going' | 'maybe' | 'not_going';
  guestsCount?: number;
}

export interface AttendeeFilterDto {
  page?: number;
  limit?: number;
  rsvpStatus?: 'going' | 'maybe' | 'not_going';
  search?: string;
}

// Response Types
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface EventAttendee {
  id: string;
  rsvpStatus: 'going' | 'maybe' | 'not_going';
  guestsCount: number;
  rsvpAt: string;
  checkedIn: boolean;
  checkedInAt?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    profilePictureUrl?: string;
    trustScore: number;
    isVerified: boolean;
  };
}

// Main Events API Class
export class EventsApi {
  // Get all events with filters
  static async getEvents(filters: EventFilterDto = {}): Promise<PaginatedResponse<Event>> {
    return EventsApiClient.get<PaginatedResponse<Event>>(EVENTS_ENDPOINTS.BASE, filters);
  }

  // Get single event by ID
  static async getEvent(id: string): Promise<Event> {
    return EventsApiClient.get<Event>(`${EVENTS_ENDPOINTS.BASE}/${id}`);
  }

  // Create new event
  static async createEvent(data: CreateEventDto): Promise<Event> {
    return EventsApiClient.post<Event>(EVENTS_ENDPOINTS.BASE, data);
  }

  // Update event (owner only)
  static async updateEvent(id: string, data: UpdateEventDto): Promise<Event> {
    return EventsApiClient.patch<Event>(`${EVENTS_ENDPOINTS.BASE}/${id}`, data);
  }

  // Delete event (owner only)
  static async deleteEvent(id: string): Promise<void> {
    return EventsApiClient.delete<void>(`${EVENTS_ENDPOINTS.BASE}/${id}`);
  }

  // RSVP to event
  static async rsvpEvent(id: string, data: RsvpDto): Promise<EventAttendee> {
    return EventsApiClient.post<EventAttendee>(`${EVENTS_ENDPOINTS.BASE}/${id}/rsvp`, data);
  }

  // Cancel RSVP
  static async cancelRsvp(id: string): Promise<void> {
    return EventsApiClient.delete<void>(`${EVENTS_ENDPOINTS.BASE}/${id}/rsvp`);
  }

  // Get event attendees
  static async getAttendees(id: string, filters: AttendeeFilterDto = {}): Promise<PaginatedResponse<EventAttendee>> {
    return EventsApiClient.get<PaginatedResponse<EventAttendee>>(`${EVENTS_ENDPOINTS.BASE}/${id}/attendees`, filters);
  }

  // Get nearby events
  static async getNearbyEvents(params: {
    latitude: number;
    longitude: number;
    radiusKm?: number;
    filters?: EventFilterDto;
  }): Promise<PaginatedResponse<Event>> {
    const { latitude, longitude, radiusKm = 5, filters = {} } = params;
    return EventsApiClient.get<PaginatedResponse<Event>>(EVENTS_ENDPOINTS.NEARBY, {
      latitude,
      longitude,
      radiusKm,
      ...filters,
    });
  }

  // Get user's events (organizing/attending)
  static async getMyEvents(type: 'organizing' | 'attending' | 'all' = 'all', filters: EventFilterDto = {}): Promise<PaginatedResponse<Event>> {
    return EventsApiClient.get<PaginatedResponse<Event>>(EVENTS_ENDPOINTS.MY_EVENTS, {
      type,
      ...filters,
    });
  }

  // Get featured events
  static async getFeaturedEvents(limit: number = 5): Promise<Event[]> {
    const response = await EventsApiClient.get<PaginatedResponse<Event>>(EVENTS_ENDPOINTS.FEATURED, { limit });
    return response.data;
  }

  // Increment view count (fire and forget)
  static async incrementViews(id: string): Promise<void> {
    try {
      await EventsApiClient.post<void>(`${EVENTS_ENDPOINTS.BASE}/${id}/increment-views`);
    } catch (error) {
      // Silently fail - view counting is not critical
      console.warn('Failed to increment view count:', error);
    }
  }

  // Upload event image (if media service is available)
  static async uploadImage(file: FormData): Promise<{ url: string }> {
    const token = await AsyncStorage.getItem('auth_token');
    
    const response = await fetch(`${API_BASE_URL}${EVENTS_ENDPOINTS.UPLOAD}`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        // Don't set Content-Type for FormData - let the browser set it with boundary
      },
      body: file,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}

// Error handling helper
export const handleApiError = (error: any): string => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    switch (status) {
      case 400:
        return data.message || 'Invalid request data';
      case 401:
        return 'Please log in to continue';
      case 403:
        return 'You do not have permission to perform this action';
      case 404:
        return 'Event not found';
      case 409:
        return 'Event is at capacity';
      case 500:
        return 'Server error. Please try again later';
      default:
        return data.message || 'An error occurred';
    }
  } else if (error.request) {
    // Network error
    return 'No internet connection. Please check your network.';
  } else {
    // Other error
    return 'An unexpected error occurred';
  }
};

// Event Categories (for reference)
export const EVENT_CATEGORIES = [
  { id: 1, name: 'Religious Services', icon: 'church', colorCode: '#7B68EE' },
  { id: 2, name: 'Cultural Festivals', icon: 'festival', colorCode: '#FF6B35' },
  { id: 3, name: 'Community Events', icon: 'account-group', colorCode: '#4CAF50' },
  { id: 4, name: 'Sports & Fitness', icon: 'dumbbell', colorCode: '#FF9800' },
  { id: 5, name: 'Educational', icon: 'school', colorCode: '#2196F3' },
  { id: 6, name: 'Business & Networking', icon: 'briefcase', colorCode: '#9C27B0' },
  { id: 7, name: 'Entertainment', icon: 'music', colorCode: '#E91E63' },
  { id: 8, name: 'Food & Dining', icon: 'food', colorCode: '#FF5722' },
  { id: 9, name: 'Health & Wellness', icon: 'heart-pulse', colorCode: '#00BCD4' },
  { id: 10, name: 'Technology', icon: 'laptop', colorCode: '#607D8B' }
];

// Example API call for creating an event
export const createEventExample = async () => {
  try {
    const eventData: CreateEventDto = {
      categoryId: 3, // Community Events
      title: "Tech Meetup Lagos",
      description: "Monthly tech meetup for developers and tech enthusiasts in Lagos.",
      eventDate: "2025-02-15",
      startTime: "18:00",
      endTime: "21:00",
      location: {
        name: "Lagos Tech Hub",
        address: "456 Broad Street, Lagos Island, Lagos",
        latitude: 6.4474,
        longitude: 3.3903,
        landmark: "Near Lagos Central Mosque"
      },
      isFree: false,
      price: 2000,
      maxAttendees: 100,
      allowGuests: true,
      requireVerification: false,
      ageRestriction: "18+",
      languages: ["English"],
      isPrivate: false,
      coverImageUrl: "https://example.com/tech-meetup-cover.jpg",
      specialRequirements: "Bring your laptop for hands-on coding session"
    };

    const createdEvent = await EventsApi.createEvent(eventData);
    console.log('Event created:', createdEvent);
    return createdEvent;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

export default EventsApi;
