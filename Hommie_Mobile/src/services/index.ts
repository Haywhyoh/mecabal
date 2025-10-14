// MeCabal Services - Main Export File
// Centralized export for all MeCabal mobile services

// Main Supabase client and configuration
export { default as supabase, SUPABASE_CONFIG } from './supabase';
export {
  getStorageUrl,
  getEdgeFunctionUrl,
  monitorConnection,
  handleSupabaseError,
  logPerformance,
  checkNetworkConnection,
  healthCheck
} from './supabase';

// Authentication services
export { MeCabalAuth } from './auth';
export { MockOTPService } from './mockOTP';

// Location services
export { MeCabalLocation } from './location';

// Payment services
export { MeCabalPayments } from './payments';

// Real-time services
export { MeCabalRealtime } from './realtime';

// Data management services
export { MeCabalData } from './data';

// Post services
export { default as PostsService } from './postsService';
export { default as MediaService } from './mediaService';
export { default as OfflineService } from './offlineService';

// Listing services
export { default as ListingsService } from './listingsService';
export { default as ListingCategoriesService } from './listingCategoriesService';

// Events services
export { default as EventsApi, EventsApi as EventsService } from './EventsApi';

// States services
export { default as StatesApi, StatesApi as StatesService } from './StatesApi';

// Verification services
export { default as verificationService } from './verificationService';
export { default as userProfileService } from './userProfileService';

// Messaging services
export { default as MessagingService } from './MessagingService';
export { messagingApi, MessagingApiService } from './api/messagingApi';
export { webSocketService, WebSocketService } from './WebSocketService';
export { simpleWebSocketService, SimpleWebSocketService } from './SimpleWebSocketService';

// Type exports for convenience
export type {
  NigerianUser,
  Neighborhood,
  Post,
  Event,
  EventRSVP,
  MarketplaceListing,
  Message,
  SafetyAlert,
  PaymentTransaction,
  ApiResponse,
  PaginatedResponse,
  OTPResponse,
  VerifyOTPResponse,
  AuthResponse,
  LocationVerificationResponse,
  NeighborhoodMatch,
  GeocodeResponse,
  PaymentInitResponse,
  PaymentVerifyResponse,
  RealtimeSubscription,
  RealtimePayload
} from '../types';

// Export new service types
export type {
  Listing,
  CreateListingRequest,
  UpdateListingRequest,
  ListingFilter,
  PaginatedListings,
  Media as ListingMedia
} from './listingsService';

export type {
  ListingCategory
} from './listingCategoriesService';

export type {
  Event,
  EventLocation,
  EventCategory,
  EventOrganizer,
  EventMedia,
  CreateEventDto,
  EventMediaDto,
  UpdateEventDto,
  EventFilterDto,
  RsvpDto,
  AttendeeFilterDto,
  PaginatedResponse,
  PaginationMeta,
  EventAttendee
} from './EventsApi';

// Nigerian-specific types
export type {
  NigerianCarrier,
  NigerianState,
  NigerianLanguage,
  NigerianAddress,
  NigerianPhoneNumber,
  NigerianBusinessCategory,
  NigerianEventCategory,
  NigerianPostCategory,
  NigerianNeighborhoodType,
  NigerianSafetyAlertType
} from '../types/nigerian';

// Verification service types
export type {
  NINVerificationRequest,
  NINVerificationResponse,
  DocumentUploadRequest,
  DocumentUploadResponse,
  TrustScoreResponse,
  BadgeResponse,
  EndorsementRequest,
  EndorsementResponse,
  VerificationHistoryItem
} from './verificationService';

// User profile service types
export type {
  UserProfile,
  UpdateProfileData,
  ProfileCompletionResponse,
  UserSearchParams,
  UserSearchResponse,
  NearbyUsersParams,
  DashboardStats,
  BookmarkRequest,
  BookmarkResponse,
  BookmarkCheckResponse
} from './userProfileService';

// Convenience exports for commonly used service combinations
export class MeCabalServices {
  // Initialize all services for a user session
  static async initializeSession(userId: string) {
    const user = await MeCabalAuth.getCurrentUser();
    if (!user) return null;

    const neighborhoods = await MeCabalLocation.getUserNeighborhoods(userId);
    
    return {
      user,
      neighborhoods,
      primaryNeighborhood: neighborhoods.find(n => n.is_primary) || neighborhoods[0]
    };
  }

  // Setup real-time subscriptions for user's neighborhoods
  static setupUserSubscriptions(
    userId: string,
    neighborhoodIds: string[],
    callbacks: {
      onNewPost?: (post: Post, neighborhoodId: string) => void;
      onNewMessage?: (message: Message) => void;
      onSafetyAlert?: (alert: SafetyAlert, neighborhoodId: string) => void;
    }
  ) {
    const subscriptions = [];

    // Subscribe to messages for the user
    if (callbacks.onNewMessage) {
      const messageSubscription = MeCabalRealtime.subscribeToMessages(userId, {
        onNewMessage: callbacks.onNewMessage,
        onMessageUpdate: () => {}, // Handle if needed
      });
      subscriptions.push(messageSubscription);
    }

    // Subscribe to posts and alerts for all neighborhoods
    if ((callbacks.onNewPost || callbacks.onSafetyAlert) && neighborhoodIds.length > 0) {
      const neighborhoodSubscription = MeCabalRealtime.subscribeToMultipleNeighborhoods(
        neighborhoodIds,
        {
          onNewPost: callbacks.onNewPost || (() => {}),
          onNewAlert: callbacks.onSafetyAlert || (() => {}),
        }
      );
      subscriptions.push(neighborhoodSubscription);
    }

    return {
      unsubscribeAll: () => {
        subscriptions.forEach(sub => sub.unsubscribe());
      }
    };
  }

  // Get comprehensive user dashboard data
  static async getUserDashboard(userId: string) {
    try {
      const [user, neighborhoods, recentPosts, upcomingEvents] = await Promise.all([
        MeCabalAuth.getCurrentUser(),
        MeCabalLocation.getUserNeighborhoods(userId),
        this.getUserRecentActivity(userId),
        this.getUserUpcomingEvents(userId)
      ]);

      return {
        user,
        neighborhoods,
        primaryNeighborhood: neighborhoods.find(n => n.is_primary) || neighborhoods[0],
        stats: {
          neighborhoods_count: neighborhoods.length,
          recent_posts: recentPosts.length,
          upcoming_events: upcomingEvents.length
        },
        activity: {
          recent_posts: recentPosts,
          upcoming_events: upcomingEvents
        }
      };
    } catch (error) {
      console.error('Error getting user dashboard:', error);
      return null;
    }
  }

  // Get user's recent activity across all neighborhoods
  private static async getUserRecentActivity(userId: string, limit: number = 10) {
    try {
      const { data } = await supabase
        .from('posts')
        .select('*, neighborhood:neighborhoods!posts_neighborhood_id_fkey(name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      return data || [];
    } catch (error) {
      console.error('Error getting user recent activity:', error);
      return [];
    }
  }

  // Get user's upcoming events
  private static async getUserUpcomingEvents(userId: string, limit: number = 5) {
    try {
      const { data } = await supabase
        .from('event_rsvps')
        .select(`
          *,
          event:events!event_rsvps_event_id_fkey(
            *, 
            neighborhood:neighborhoods!events_neighborhood_id_fkey(name)
          )
        `)
        .eq('user_id', userId)
        .eq('rsvp_status', 'going')
        .gte('event.start_datetime', new Date().toISOString())
        .order('event.start_datetime', { ascending: true })
        .limit(limit);

      return data?.map(rsvp => rsvp.event) || [];
    } catch (error) {
      console.error('Error getting user upcoming events:', error);
      return [];
    }
  }

  // Bulk operations for better performance
  static async bulkCreatePosts(posts: Array<Parameters<typeof MeCabalData.createPost>[0]>) {
    const results = await Promise.allSettled(
      posts.map(postData => MeCabalData.createPost(postData))
    );

    const successful = results
      .filter((result, index) => result.status === 'fulfilled' && result.value.success)
      .map((result, index) => ({ index, data: (result as PromiseFulfilledResult<any>).value.data }));

    const failed = results
      .map((result, index) => ({ result, index }))
      .filter(({ result }) => result.status === 'rejected' || !result.value?.success)
      .map(({ result, index }) => ({
        index,
        error: result.status === 'rejected' ? result.reason : result.value?.error
      }));

    return { successful, failed };
  }

  // Health check for all services
  static async performHealthCheck() {
    try {
      const [supabaseHealth, networkStatus] = await Promise.all([
        healthCheck(),
        checkNetworkConnection()
      ]);

      return {
        overall_status: supabaseHealth.database && supabaseHealth.storage && networkStatus ? 'healthy' : 'degraded',
        supabase: supabaseHealth,
        network: networkStatus,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        overall_status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Cleanup resources (call when app is backgrounded or closed)
  static cleanup() {
    MeCabalRealtime.cleanupAllSubscriptions();
  }
}

// Export commonly used service combinations as default
export default MeCabalServices;