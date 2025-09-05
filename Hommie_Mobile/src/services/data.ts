// MeCabal Data Services
// CRUD operations and data management for all app entities

import { supabase, handleSupabaseError, logPerformance } from './supabase';
import type { 
  Post, 
  Event, 
  EventRSVP,
  MarketplaceListing, 
  Message, 
  SafetyAlert,
  Neighborhood,
  NigerianUser,
  ApiResponse,
  PaginatedResponse,
  PostFilter,
  EventFilter,
  MarketplaceFilter 
} from '../types';

export class MeCabalData {
  // ==== POSTS ====

  // Get neighborhood feed with pagination and filtering
  static async getNeighborhoodFeed(
    neighborhoodId: string,
    options?: {
      page?: number;
      limit?: number;
      filter?: PostFilter;
    }
  ): Promise<PaginatedResponse<Post>> {
    const startTime = Date.now();
    const page = options?.page || 0;
    const limit = options?.limit || 20;
    
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          user:users!posts_user_id_fkey(
            id, first_name, last_name, profile_picture_url, verification_level
          ),
          neighborhood:neighborhoods!posts_neighborhood_id_fkey(
            id, name, type
          )
        `, { count: 'exact' })
        .eq('neighborhood_id', neighborhoodId)
        .eq('is_approved', true)
        .eq('moderation_status', 'approved');

      // Apply filters
      if (options?.filter?.post_type) {
        query = query.eq('post_type', options.filter.post_type);
      }
      if (options?.filter?.category) {
        query = query.eq('category', options.filter.category);
      }
      if (options?.filter?.is_pinned !== undefined) {
        query = query.eq('is_pinned', options.filter.is_pinned);
      }

      const { data, error, count } = await query
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      logPerformance('getNeighborhoodFeed', startTime);

      if (error) {
        throw error;
      }

      return {
        data: data as Post[] || [],
        count: count || 0,
        page,
        limit,
        has_more: (count || 0) > (page + 1) * limit
      };
    } catch (error: any) {
      logPerformance('getNeighborhoodFeed', startTime);
      console.error('Error getting neighborhood feed:', error);
      return { data: [], count: 0, page, limit, has_more: false };
    }
  }

  // Create new post
  static async createPost(postData: {
    user_id: string;
    neighborhood_id: string;
    title?: string;
    content: string;
    post_type?: string;
    category?: string;
    media_urls?: string[];
    location_data?: any;
  }): Promise<ApiResponse<Post>> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          ...postData,
          post_type: postData.post_type || 'general',
          engagement_score: 0
        })
        .select(`
          *,
          user:users!posts_user_id_fkey(
            id, first_name, last_name, profile_picture_url, verification_level
          )
        `)
        .single();

      logPerformance('createPost', startTime);

      if (error) {
        return {
          success: false,
          error: handleSupabaseError(error)
        };
      }

      return {
        success: true,
        data: data as Post,
        message: 'Post created successfully'
      };
    } catch (error: any) {
      logPerformance('createPost', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  // Update post
  static async updatePost(
    postId: string, 
    updates: Partial<Post>
  ): Promise<ApiResponse<Post>> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('posts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .select()
        .single();

      logPerformance('updatePost', startTime);

      if (error) {
        return {
          success: false,
          error: handleSupabaseError(error)
        };
      }

      return {
        success: true,
        data: data as Post,
        message: 'Post updated successfully'
      };
    } catch (error: any) {
      logPerformance('updatePost', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  // Delete post
  static async deletePost(postId: string, userId: string): Promise<ApiResponse> {
    const startTime = Date.now();
    
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', userId); // Ensure user can only delete their own posts

      logPerformance('deletePost', startTime);

      if (error) {
        return {
          success: false,
          error: handleSupabaseError(error)
        };
      }

      return {
        success: true,
        message: 'Post deleted successfully'
      };
    } catch (error: any) {
      logPerformance('deletePost', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  // ==== EVENTS ====

  // Get neighborhood events
  static async getNeighborhoodEvents(
    neighborhoodId: string,
    options?: {
      page?: number;
      limit?: number;
      filter?: EventFilter;
    }
  ): Promise<PaginatedResponse<Event>> {
    const startTime = Date.now();
    const page = options?.page || 0;
    const limit = options?.limit || 20;
    
    try {
      let query = supabase
        .from('events')
        .select(`
          *,
          organizer:users!events_organizer_id_fkey(
            id, first_name, last_name, profile_picture_url, verification_level
          ),
          user_rsvp:event_rsvps!left(
            rsvp_status, plus_ones
          )
        `, { count: 'exact' })
        .eq('neighborhood_id', neighborhoodId)
        .eq('is_cancelled', false);

      // Apply filters
      if (options?.filter?.event_type) {
        query = query.eq('event_type', options.filter.event_type);
      }
      if (options?.filter?.is_free !== undefined) {
        query = query.eq('is_free', options.filter.is_free);
      }
      if (options?.filter?.date_from) {
        query = query.gte('start_datetime', options.filter.date_from);
      }
      if (options?.filter?.date_to) {
        query = query.lte('start_datetime', options.filter.date_to);
      }

      const { data, error, count } = await query
        .order('start_datetime', { ascending: true })
        .range(page * limit, (page + 1) * limit - 1);

      logPerformance('getNeighborhoodEvents', startTime);

      if (error) {
        throw error;
      }

      return {
        data: data as Event[] || [],
        count: count || 0,
        page,
        limit,
        has_more: (count || 0) > (page + 1) * limit
      };
    } catch (error: any) {
      logPerformance('getNeighborhoodEvents', startTime);
      console.error('Error getting neighborhood events:', error);
      return { data: [], count: 0, page, limit, has_more: false };
    }
  }

  // Create event
  static async createEvent(eventData: {
    organizer_id: string;
    neighborhood_id: string;
    title: string;
    description?: string;
    event_type: string;
    venue_name?: string;
    venue_address?: string;
    venue_coordinates?: { latitude: number; longitude: number };
    start_datetime: string;
    end_datetime?: string;
    max_attendees?: number;
    is_free: boolean;
    ticket_price?: number;
    registration_required: boolean;
    registration_deadline?: string;
    cover_image_url?: string;
    event_data?: any;
  }): Promise<ApiResponse<Event>> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          ...eventData,
          current_attendees: 0
        })
        .select(`
          *,
          organizer:users!events_organizer_id_fkey(
            id, first_name, last_name, profile_picture_url
          )
        `)
        .single();

      logPerformance('createEvent', startTime);

      if (error) {
        return {
          success: false,
          error: handleSupabaseError(error)
        };
      }

      return {
        success: true,
        data: data as Event,
        message: 'Event created successfully'
      };
    } catch (error: any) {
      logPerformance('createEvent', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  // RSVP to event
  static async rsvpToEvent(
    eventId: string,
    userId: string,
    rsvpData: {
      rsvp_status: 'going' | 'maybe' | 'not_going';
      plus_ones?: number;
      special_requests?: string;
    }
  ): Promise<ApiResponse<EventRSVP>> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('event_rsvps')
        .upsert({
          event_id: eventId,
          user_id: userId,
          ...rsvpData,
          plus_ones: rsvpData.plus_ones || 0
        })
        .select()
        .single();

      logPerformance('rsvpToEvent', startTime);

      if (error) {
        return {
          success: false,
          error: handleSupabaseError(error)
        };
      }

      // Update event attendee count if status is 'going'
      if (rsvpData.rsvp_status === 'going') {
        await this.updateEventAttendeeCount(eventId);
      }

      return {
        success: true,
        data: data as EventRSVP,
        message: 'RSVP updated successfully'
      };
    } catch (error: any) {
      logPerformance('rsvpToEvent', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  // ==== MARKETPLACE ====

  // Get marketplace listings
  static async getMarketplaceListings(
    neighborhoodId: string,
    options?: {
      page?: number;
      limit?: number;
      filter?: MarketplaceFilter;
    }
  ): Promise<PaginatedResponse<MarketplaceListing>> {
    const startTime = Date.now();
    const page = options?.page || 0;
    const limit = options?.limit || 20;
    
    try {
      let query = supabase
        .from('marketplace_listings')
        .select(`
          *,
          seller:users!marketplace_listings_seller_id_fkey(
            id, first_name, last_name, profile_picture_url, verification_level
          )
        `, { count: 'exact' })
        .eq('neighborhood_id', neighborhoodId)
        .eq('availability_status', 'available');

      // Apply filters
      if (options?.filter?.listing_type) {
        query = query.eq('listing_type', options.filter.listing_type);
      }
      if (options?.filter?.category) {
        query = query.eq('category', options.filter.category);
      }
      if (options?.filter?.price_min !== undefined) {
        query = query.gte('price', options.filter.price_min);
      }
      if (options?.filter?.price_max !== undefined) {
        query = query.lte('price', options.filter.price_max);
      }
      if (options?.filter?.condition_type) {
        query = query.eq('condition_type', options.filter.condition_type);
      }

      const { data, error, count } = await query
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      logPerformance('getMarketplaceListings', startTime);

      if (error) {
        throw error;
      }

      return {
        data: data as MarketplaceListing[] || [],
        count: count || 0,
        page,
        limit,
        has_more: (count || 0) > (page + 1) * limit
      };
    } catch (error: any) {
      logPerformance('getMarketplaceListings', startTime);
      console.error('Error getting marketplace listings:', error);
      return { data: [], count: 0, page, limit, has_more: false };
    }
  }

  // Create marketplace listing
  static async createListing(listingData: {
    seller_id: string;
    neighborhood_id: string;
    title: string;
    description?: string;
    listing_type: string;
    category?: string;
    price?: number;
    price_type: string;
    condition_type?: string;
    media_urls?: string[];
    location_details?: string;
    contact_preference: string;
  }): Promise<ApiResponse<MarketplaceListing>> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .insert({
          ...listingData,
          availability_status: 'available',
          is_featured: false,
          trust_score: 0
        })
        .select(`
          *,
          seller:users!marketplace_listings_seller_id_fkey(
            id, first_name, last_name, profile_picture_url, verification_level
          )
        `)
        .single();

      logPerformance('createListing', startTime);

      if (error) {
        return {
          success: false,
          error: handleSupabaseError(error)
        };
      }

      return {
        success: true,
        data: data as MarketplaceListing,
        message: 'Listing created successfully'
      };
    } catch (error: any) {
      logPerformance('createListing', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  // ==== MESSAGES ====

  // Get conversation messages
  static async getMessages(
    senderId: string,
    recipientId: string,
    options?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<Message>> {
    const startTime = Date.now();
    const page = options?.page || 0;
    const limit = options?.limit || 50;
    
    try {
      const { data, error, count } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey(
            id, first_name, last_name, profile_picture_url
          ),
          recipient:users!messages_recipient_id_fkey(
            id, first_name, last_name, profile_picture_url
          )
        `, { count: 'exact' })
        .or(`and(sender_id.eq.${senderId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${senderId})`)
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      logPerformance('getMessages', startTime);

      if (error) {
        throw error;
      }

      return {
        data: (data as Message[] || []).reverse(), // Reverse to show oldest first
        count: count || 0,
        page,
        limit,
        has_more: (count || 0) > (page + 1) * limit
      };
    } catch (error: any) {
      logPerformance('getMessages', startTime);
      console.error('Error getting messages:', error);
      return { data: [], count: 0, page, limit, has_more: false };
    }
  }

  // Send message
  static async sendMessage(messageData: {
    sender_id: string;
    recipient_id: string;
    neighborhood_id?: string;
    message_type: string;
    content?: string;
    media_url?: string;
    reply_to_message_id?: string;
  }): Promise<ApiResponse<Message>> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          ...messageData,
          is_read: false
        })
        .select(`
          *,
          sender:users!messages_sender_id_fkey(
            id, first_name, last_name, profile_picture_url
          )
        `)
        .single();

      logPerformance('sendMessage', startTime);

      if (error) {
        return {
          success: false,
          error: handleSupabaseError(error)
        };
      }

      return {
        success: true,
        data: data as Message,
        message: 'Message sent successfully'
      };
    } catch (error: any) {
      logPerformance('sendMessage', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  // ==== SAFETY ALERTS ====

  // Get safety alerts
  static async getSafetyAlerts(
    neighborhoodId: string,
    options?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<SafetyAlert>> {
    const startTime = Date.now();
    const page = options?.page || 0;
    const limit = options?.limit || 20;
    
    try {
      const { data, error, count } = await supabase
        .from('safety_alerts')
        .select(`
          *,
          reporter:users!safety_alerts_reporter_id_fkey(
            id, first_name, last_name, verification_level
          )
        `, { count: 'exact' })
        .eq('neighborhood_id', neighborhoodId)
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      logPerformance('getSafetyAlerts', startTime);

      if (error) {
        throw error;
      }

      return {
        data: data as SafetyAlert[] || [],
        count: count || 0,
        page,
        limit,
        has_more: (count || 0) > (page + 1) * limit
      };
    } catch (error: any) {
      logPerformance('getSafetyAlerts', startTime);
      console.error('Error getting safety alerts:', error);
      return { data: [], count: 0, page, limit, has_more: false };
    }
  }

  // Create safety alert
  static async createSafetyAlert(alertData: {
    reporter_id: string;
    neighborhood_id: string;
    alert_type: string;
    severity_level: string;
    title: string;
    description: string;
    incident_location?: string;
    incident_coordinates?: { latitude: number; longitude: number };
    incident_datetime?: string;
    media_urls?: string[];
  }): Promise<ApiResponse<SafetyAlert>> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('safety_alerts')
        .insert({
          ...alertData,
          incident_datetime: alertData.incident_datetime || new Date().toISOString(),
          verification_status: 'unverified',
          verification_count: 0,
          is_resolved: false
        })
        .select(`
          *,
          reporter:users!safety_alerts_reporter_id_fkey(
            id, first_name, last_name
          )
        `)
        .single();

      logPerformance('createSafetyAlert', startTime);

      if (error) {
        return {
          success: false,
          error: handleSupabaseError(error)
        };
      }

      return {
        success: true,
        data: data as SafetyAlert,
        message: 'Safety alert created successfully'
      };
    } catch (error: any) {
      logPerformance('createSafetyAlert', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  // ==== UTILITY FUNCTIONS ====

  // Update event attendee count
  private static async updateEventAttendeeCount(eventId: string): Promise<void> {
    try {
      // Count current 'going' RSVPs
      const { count } = await supabase
        .from('event_rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('rsvp_status', 'going');

      // Update event with new count
      await supabase
        .from('events')
        .update({ current_attendees: count || 0 })
        .eq('id', eventId);
    } catch (error) {
      console.error('Error updating event attendee count:', error);
    }
  }

  // Search across multiple content types
  static async globalSearch(
    query: string,
    neighborhoodIds: string[],
    contentTypes: ('posts' | 'events' | 'marketplace' | 'users')[] = ['posts', 'events', 'marketplace']
  ): Promise<{
    posts: Post[];
    events: Event[];
    marketplace: MarketplaceListing[];
    users: NigerianUser[];
  }> {
    const results = {
      posts: [] as Post[],
      events: [] as Event[],
      marketplace: [] as MarketplaceListing[],
      users: [] as NigerianUser[]
    };

    const searchPromises = [];

    if (contentTypes.includes('posts')) {
      searchPromises.push(
        supabase
          .from('posts')
          .select('*, user:users!posts_user_id_fkey(*)')
          .in('neighborhood_id', neighborhoodIds)
          .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
          .eq('is_approved', true)
          .limit(10)
      );
    }

    if (contentTypes.includes('events')) {
      searchPromises.push(
        supabase
          .from('events')
          .select('*, organizer:users!events_organizer_id_fkey(*)')
          .in('neighborhood_id', neighborhoodIds)
          .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
          .eq('is_cancelled', false)
          .limit(10)
      );
    }

    if (contentTypes.includes('marketplace')) {
      searchPromises.push(
        supabase
          .from('marketplace_listings')
          .select('*, seller:users!marketplace_listings_seller_id_fkey(*)')
          .in('neighborhood_id', neighborhoodIds)
          .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
          .eq('availability_status', 'available')
          .limit(10)
      );
    }

    try {
      const responses = await Promise.all(searchPromises);
      
      responses.forEach((response, index) => {
        if (response.data) {
          switch (contentTypes[index]) {
            case 'posts':
              results.posts = response.data as Post[];
              break;
            case 'events':
              results.events = response.data as Event[];
              break;
            case 'marketplace':
              results.marketplace = response.data as MarketplaceListing[];
              break;
          }
        }
      });
    } catch (error) {
      console.error('Error in global search:', error);
    }

    return results;
  }
}