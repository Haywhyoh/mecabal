import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Post } from './postsService';

const CACHE_KEYS = {
  POSTS: 'cached_posts',
  LAST_SYNC: 'last_sync_timestamp',
  PENDING_ACTIONS: 'pending_actions',
  USER_PREFERENCES: 'user_preferences',
};

export interface CachedPost extends Post {
  cachedAt: string;
  isOffline: boolean;
}

export interface PendingAction {
  id: string;
  type: 'like' | 'comment' | 'share' | 'report' | 'delete';
  postId: string;
  data?: any;
  timestamp: string;
  retryCount: number;
}

export interface OfflineState {
  isOnline: boolean;
  lastSync: Date | null;
  cachedPostsCount: number;
  pendingActionsCount: number;
}

export class OfflineService {
  private static instance: OfflineService;
  private isOnline: boolean = true;
  private listeners: Array<(state: OfflineState) => void> = [];

  private constructor() {
    this.initializeNetworkListener();
  }

  public static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  private initializeNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      // If we just came back online, sync pending actions
      if (!wasOnline && this.isOnline) {
        this.syncPendingActions();
      }
      
      this.notifyListeners();
    });
  }

  /**
   * Add a listener for offline state changes
   */
  addListener(listener: (state: OfflineState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Get current offline state
   */
  async getOfflineState(): Promise<OfflineState> {
    const lastSync = await this.getLastSyncTime();
    const cachedPosts = await this.getCachedPosts();
    const pendingActions = await this.getPendingActions();
    
    return {
      isOnline: this.isOnline,
      lastSync,
      cachedPostsCount: cachedPosts.length,
      pendingActionsCount: pendingActions.length,
    };
  }

  /**
   * Cache posts for offline viewing
   */
  async cachePosts(posts: Post[]): Promise<void> {
    try {
      const cachedPosts: CachedPost[] = posts.map(post => ({
        ...post,
        cachedAt: new Date().toISOString(),
        isOffline: true,
      }));

      await AsyncStorage.setItem(
        CACHE_KEYS.POSTS,
        JSON.stringify(cachedPosts)
      );

      await this.updateLastSyncTime();
    } catch (error) {
      console.error('Error caching posts:', error);
    }
  }

  /**
   * Get cached posts
   */
  async getCachedPosts(): Promise<CachedPost[]> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.POSTS);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error getting cached posts:', error);
      return [];
    }
  }

  /**
   * Get cached posts with filtering
   */
  async getCachedPostsWithFilter(filter: {
    postType?: string;
    search?: string;
    limit?: number;
  }): Promise<CachedPost[]> {
    try {
      const allPosts = await this.getCachedPosts();
      let filteredPosts = allPosts;

      // Apply filters
      if (filter.postType) {
        filteredPosts = filteredPosts.filter(post => post.postType === filter.postType);
      }

      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredPosts = filteredPosts.filter(post =>
          post.title?.toLowerCase().includes(searchLower) ||
          post.content.toLowerCase().includes(searchLower)
        );
      }

      // Apply limit
      if (filter.limit) {
        filteredPosts = filteredPosts.slice(0, filter.limit);
      }

      return filteredPosts;
    } catch (error) {
      console.error('Error filtering cached posts:', error);
      return [];
    }
  }

  /**
   * Add a pending action for when online
   */
  async addPendingAction(action: Omit<PendingAction, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    try {
      const pendingActions = await this.getPendingActions();
      const newAction: PendingAction = {
        ...action,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        retryCount: 0,
      };

      pendingActions.push(newAction);
      await AsyncStorage.setItem(
        CACHE_KEYS.PENDING_ACTIONS,
        JSON.stringify(pendingActions)
      );

      this.notifyListeners();
    } catch (error) {
      console.error('Error adding pending action:', error);
    }
  }

  /**
   * Get pending actions
   */
  async getPendingActions(): Promise<PendingAction[]> {
    try {
      const pending = await AsyncStorage.getItem(CACHE_KEYS.PENDING_ACTIONS);
      return pending ? JSON.parse(pending) : [];
    } catch (error) {
      console.error('Error getting pending actions:', error);
      return [];
    }
  }

  /**
   * Sync pending actions when online
   */
  async syncPendingActions(): Promise<void> {
    if (!this.isOnline) return;

    try {
      const pendingActions = await this.getPendingActions();
      const successfulActions: string[] = [];
      const failedActions: PendingAction[] = [];

      for (const action of pendingActions) {
        try {
          await this.executePendingAction(action);
          successfulActions.push(action.id);
        } catch (error) {
          console.error('Error executing pending action:', error);
          action.retryCount++;
          
          // Remove action if it has failed too many times
          if (action.retryCount < 3) {
            failedActions.push(action);
          }
        }
      }

      // Update pending actions list
      await AsyncStorage.setItem(
        CACHE_KEYS.PENDING_ACTIONS,
        JSON.stringify(failedActions)
      );

      this.notifyListeners();
    } catch (error) {
      console.error('Error syncing pending actions:', error);
    }
  }

  /**
   * Execute a pending action
   */
  private async executePendingAction(action: PendingAction): Promise<void> {
    // This would integrate with the actual API services
    // For now, we'll just simulate the execution
    console.log('Executing pending action:', action);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Clear cached data
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        CACHE_KEYS.POSTS,
        CACHE_KEYS.LAST_SYNC,
        CACHE_KEYS.PENDING_ACTIONS,
      ]);
      
      this.notifyListeners();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Get last sync time
   */
  private async getLastSyncTime(): Promise<Date | null> {
    try {
      const lastSync = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC);
      return lastSync ? new Date(lastSync) : null;
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return null;
    }
  }

  /**
   * Update last sync time
   */
  private async updateLastSyncTime(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        CACHE_KEYS.LAST_SYNC,
        new Date().toISOString()
      );
    } catch (error) {
      console.error('Error updating last sync time:', error);
    }
  }

  /**
   * Notify listeners of state changes
   */
  private async notifyListeners() {
    const state = await this.getOfflineState();
    this.listeners.forEach(listener => listener(state));
  }

  /**
   * Check if we should use cached data
   */
  shouldUseCache(): boolean {
    return !this.isOnline;
  }

  /**
   * Check if cache is stale (older than 1 hour)
   */
  async isCacheStale(): Promise<boolean> {
    const lastSync = await this.getLastSyncTime();
    if (!lastSync) return true;
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return lastSync < oneHourAgo;
  }

  /**
   * Get cache size in MB
   */
  async getCacheSize(): Promise<number> {
    try {
      const posts = await AsyncStorage.getItem(CACHE_KEYS.POSTS);
      const pending = await AsyncStorage.getItem(CACHE_KEYS.PENDING_ACTIONS);
      
      const postsSize = posts ? new Blob([posts]).size : 0;
      const pendingSize = pending ? new Blob([pending]).size : 0;
      
      return (postsSize + pendingSize) / (1024 * 1024); // Convert to MB
    } catch (error) {
      console.error('Error calculating cache size:', error);
      return 0;
    }
  }
}

export default OfflineService;
