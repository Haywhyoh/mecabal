// Offline Storage Utility
// Cache location data and handle offline scenarios

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {
  State,
  LGA,
  Ward,
  Neighborhood,
  Landmark,
  UserLocation,
} from '../types/location.types';

// Storage keys
const STORAGE_KEYS = {
  STATES: 'mecabal_cached_states',
  LGAS: 'mecabal_cached_lgas',
  WARDS: 'mecabal_cached_wards',
  NEIGHBORHOODS: 'mecabal_cached_neighborhoods',
  LANDMARKS: 'mecabal_cached_landmarks',
  USER_LOCATIONS: 'mecabal_user_locations',
  CACHE_TIMESTAMP: 'mecabal_cache_timestamp',
  OFFLINE_QUEUE: 'mecabal_offline_queue',
};

// Cache expiry time (24 hours)
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;

interface CacheItem<T> {
  data: T;
  timestamp: number;
  version: string;
}

interface OfflineAction {
  id: string;
  type: 'CREATE_LOCATION' | 'UPDATE_LOCATION' | 'DELETE_LOCATION' | 'SET_PRIMARY';
  data: any;
  timestamp: number;
}

class OfflineStorageService {
  private isOnline: boolean = true;
  private offlineQueue: OfflineAction[] = [];

  constructor() {
    this.initializeNetworkListener();
    this.loadOfflineQueue();
  }

  private initializeNetworkListener() {
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected ?? false;
      
      if (this.isOnline && this.offlineQueue.length > 0) {
        this.processOfflineQueue();
      }
    });
  }

  private async loadOfflineQueue() {
    try {
      const queueData = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      if (queueData) {
        this.offlineQueue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
    }
  }

  private async saveOfflineQueue() {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  // Generic cache methods
  private async setCacheItem<T>(key: string, data: T): Promise<void> {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        version: '1.0.0',
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (error) {
      console.error(`Error caching data for key ${key}:`, error);
    }
  }

  private async getCacheItem<T>(key: string): Promise<T | null> {
    try {
      const cacheData = await AsyncStorage.getItem(key);
      if (!cacheData) return null;

      const cacheItem: CacheItem<T> = JSON.parse(cacheData);
      
      // Check if cache is expired
      if (Date.now() - cacheItem.timestamp > CACHE_EXPIRY) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error(`Error retrieving cached data for key ${key}:`, error);
      return null;
    }
  }

  // Location hierarchy caching
  async cacheStates(states: State[]): Promise<void> {
    await this.setCacheItem(STORAGE_KEYS.STATES, states);
  }

  async getCachedStates(): Promise<State[] | null> {
    return this.getCacheItem<State[]>(STORAGE_KEYS.STATES);
  }

  async cacheLGAs(lgas: LGA[]): Promise<void> {
    await this.setCacheItem(STORAGE_KEYS.LGAS, lgas);
  }

  async getCachedLGAs(): Promise<LGA[] | null> {
    return this.getCacheItem<LGA[]>(STORAGE_KEYS.LGAS);
  }

  async cacheWards(wards: Ward[]): Promise<void> {
    await this.setCacheItem(STORAGE_KEYS.WARDS, wards);
  }

  async getCachedWards(): Promise<Ward[] | null> {
    return this.getCacheItem<Ward[]>(STORAGE_KEYS.WARDS);
  }

  async cacheNeighborhoods(neighborhoods: Neighborhood[]): Promise<void> {
    await this.setCacheItem(STORAGE_KEYS.NEIGHBORHOODS, neighborhoods);
  }

  async getCachedNeighborhoods(): Promise<Neighborhood[] | null> {
    return this.getCacheItem<Neighborhood[]>(STORAGE_KEYS.NEIGHBORHOODS);
  }

  async cacheLandmarks(landmarks: Landmark[]): Promise<void> {
    await this.setCacheItem(STORAGE_KEYS.LANDMARKS, landmarks);
  }

  async getCachedLandmarks(): Promise<Landmark[] | null> {
    return this.getCacheItem<Landmark[]>(STORAGE_KEYS.LANDMARKS);
  }

  // User location caching
  async cacheUserLocations(userLocations: UserLocation[]): Promise<void> {
    await this.setCacheItem(STORAGE_KEYS.USER_LOCATIONS, userLocations);
  }

  async getCachedUserLocations(): Promise<UserLocation[] | null> {
    return this.getCacheItem<UserLocation[]>(STORAGE_KEYS.USER_LOCATIONS);
  }

  // Offline queue management
  async addToOfflineQueue(action: Omit<OfflineAction, 'id' | 'timestamp'>): Promise<void> {
    const offlineAction: OfflineAction = {
      ...action,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    this.offlineQueue.push(offlineAction);
    await this.saveOfflineQueue();

    if (this.isOnline) {
      this.processOfflineQueue();
    }
  }

  private async processOfflineQueue(): Promise<void> {
    if (!this.isOnline || this.offlineQueue.length === 0) return;

    const actionsToProcess = [...this.offlineQueue];
    this.offlineQueue = [];
    await this.saveOfflineQueue();

    for (const action of actionsToProcess) {
      try {
        await this.processOfflineAction(action);
      } catch (error) {
        console.error('Error processing offline action:', error);
        // Re-add failed action to queue
        this.offlineQueue.push(action);
      }
    }

    if (this.offlineQueue.length > 0) {
      await this.saveOfflineQueue();
    }
  }

  private async processOfflineAction(action: OfflineAction): Promise<void> {
    // This would integrate with your actual API calls
    // For now, we'll just log the action
    console.log('Processing offline action:', action);
    
    // In a real implementation, you would:
    // 1. Make API calls based on action type
    // 2. Update local cache
    // 3. Handle success/failure
  }

  // Cache management
  async clearCache(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.STATES),
        AsyncStorage.removeItem(STORAGE_KEYS.LGAS),
        AsyncStorage.removeItem(STORAGE_KEYS.WARDS),
        AsyncStorage.removeItem(STORAGE_KEYS.NEIGHBORHOODS),
        AsyncStorage.removeItem(STORAGE_KEYS.LANDMARKS),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_LOCATIONS),
        AsyncStorage.removeItem(STORAGE_KEYS.CACHE_TIMESTAMP),
      ]);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  async getCacheSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const locationKeys = keys.filter(key => key.startsWith('mecabal_'));
      return locationKeys.length;
    } catch (error) {
      console.error('Error getting cache size:', error);
      return 0;
    }
  }

  // Network status
  isConnected(): boolean {
    return this.isOnline;
  }

  async getNetworkStatus(): Promise<boolean> {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected ?? false;
  }

  // Offline data availability
  async hasOfflineData(): Promise<boolean> {
    try {
      const states = await this.getCachedStates();
      const lgas = await this.getCachedLGAs();
      const neighborhoods = await this.getCachedNeighborhoods();
      
      return !!(states && lgas && neighborhoods);
    } catch (error) {
      console.error('Error checking offline data availability:', error);
      return false;
    }
  }

  // Sync status
  getOfflineQueueLength(): number {
    return this.offlineQueue.length;
  }

  async getLastSyncTime(): Promise<Date | null> {
    try {
      const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.CACHE_TIMESTAMP);
      return timestamp ? new Date(parseInt(timestamp)) : null;
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return null;
    }
  }

  async updateLastSyncTime(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
    } catch (error) {
      console.error('Error updating last sync time:', error);
    }
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorageService();
export default offlineStorage;

