// Offline-Aware Location API Service
// Handles location API calls with offline support

import { locationApi } from './locationApi';
import { offlineStorage } from '../../utils/offlineStorage';
import { networkStatus } from '../../utils/networkStatus';
import {
  State,
  LGA,
  Ward,
  Neighborhood,
  Landmark,
  UserLocation,
} from '../../types/location.types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class OfflineLocationApiService {
  // States
  async getStates(): Promise<ApiResponse<State[]>> {
    try {
      // Try to get from cache first
      const cachedStates = await offlineStorage.getCachedStates();
      if (cachedStates) {
        return {
          success: true,
          data: cachedStates,
          message: 'Data loaded from cache',
        };
      }

      // If online, fetch from API and cache
      if (networkStatus.isOnline()) {
        const response = await locationApi.getStates();
        if (response.success && response.data) {
          await offlineStorage.cacheStates(response.data);
          await offlineStorage.updateLastSyncTime();
          return response;
        }
      }

      // Fallback to empty array if offline and no cache
      return {
        success: false,
        data: [],
        message: 'No cached data available and offline',
      };
    } catch (error) {
      console.error('Error getting states:', error);
      return {
        success: false,
        data: [],
        message: 'Error loading states',
      };
    }
  }

  // LGAs
  async getLGAsByState(stateId: string, type?: 'LGA' | 'LCDA'): Promise<ApiResponse<LGA[]>> {
    try {
      // Try to get from cache first
      const cachedLGAs = await offlineStorage.getCachedLGAs();
      if (cachedLGAs) {
        const filteredLGAs = cachedLGAs.filter(lga => lga.stateId === stateId);
        if (type) {
          const typeFiltered = filteredLGAs.filter(lga => lga.type === type);
          return {
            success: true,
            data: typeFiltered,
            message: 'Data loaded from cache',
          };
        }
        return {
          success: true,
          data: filteredLGAs,
          message: 'Data loaded from cache',
        };
      }

      // If online, fetch from API and cache
      if (networkStatus.isOnline()) {
        const response = await locationApi.getLGAsByState(stateId, type);
        if (response.success && response.data) {
          // Cache all LGAs (we might need them later)
          await offlineStorage.cacheLGAs(response.data);
          await offlineStorage.updateLastSyncTime();
          return response;
        }
      }

      return {
        success: false,
        data: [],
        message: 'No cached data available and offline',
      };
    } catch (error) {
      console.error('Error getting LGAs:', error);
      return {
        success: false,
        data: [],
        message: 'Error loading LGAs',
      };
    }
  }

  // Wards
  async getWardsByLGA(lgaId: string): Promise<ApiResponse<Ward[]>> {
    try {
      // Try to get from cache first
      const cachedWards = await offlineStorage.getCachedWards();
      if (cachedWards) {
        const filteredWards = cachedWards.filter(ward => ward.lgaId === lgaId);
        return {
          success: true,
          data: filteredWards,
          message: 'Data loaded from cache',
        };
      }

      // If online, fetch from API and cache
      if (networkStatus.isOnline()) {
        const response = await locationApi.getWardsByLGA(lgaId);
        if (response.success && response.data) {
          await offlineStorage.cacheWards(response.data);
          await offlineStorage.updateLastSyncTime();
          return response;
        }
      }

      return {
        success: false,
        data: [],
        message: 'No cached data available and offline',
      };
    } catch (error) {
      console.error('Error getting wards:', error);
      return {
        success: false,
        data: [],
        message: 'Error loading wards',
      };
    }
  }

  // Neighborhoods
  async getNeighborhoodsByWard(wardId: string): Promise<ApiResponse<Neighborhood[]>> {
    try {
      // Try to get from cache first
      const cachedNeighborhoods = await offlineStorage.getCachedNeighborhoods();
      if (cachedNeighborhoods) {
        const filteredNeighborhoods = cachedNeighborhoods.filter(neighborhood => neighborhood.wardId === wardId);
        return {
          success: true,
          data: filteredNeighborhoods,
          message: 'Data loaded from cache',
        };
      }

      // If online, fetch from API and cache
      if (networkStatus.isOnline()) {
        const response = await locationApi.getNeighborhoodsByWard(wardId);
        if (response.success && response.data) {
          await offlineStorage.cacheNeighborhoods(response.data);
          await offlineStorage.updateLastSyncTime();
          return response;
        }
      }

      return {
        success: false,
        data: [],
        message: 'No cached data available and offline',
      };
    } catch (error) {
      console.error('Error getting neighborhoods:', error);
      return {
        success: false,
        data: [],
        message: 'Error loading neighborhoods',
      };
    }
  }

  // Landmarks
  async getNearbyLandmarks(neighborhoodId: string): Promise<ApiResponse<Landmark[]>> {
    try {
      // Try to get from cache first
      const cachedLandmarks = await offlineStorage.getCachedLandmarks();
      if (cachedLandmarks) {
        const filteredLandmarks = cachedLandmarks.filter(landmark => landmark.neighborhoodId === neighborhoodId);
        return {
          success: true,
          data: filteredLandmarks,
          message: 'Data loaded from cache',
        };
      }

      // If online, fetch from API and cache
      if (networkStatus.isOnline()) {
        const response = await locationApi.getNearbyLandmarks(neighborhoodId);
        if (response.success && response.data) {
          await offlineStorage.cacheLandmarks(response.data);
          await offlineStorage.updateLastSyncTime();
          return response;
        }
      }

      return {
        success: false,
        data: [],
        message: 'No cached data available and offline',
      };
    } catch (error) {
      console.error('Error getting landmarks:', error);
      return {
        success: false,
        data: [],
        message: 'Error loading landmarks',
      };
    }
  }

  // User locations
  async getUserLocations(): Promise<ApiResponse<UserLocation[]>> {
    try {
      // Try to get from cache first
      const cachedUserLocations = await offlineStorage.getCachedUserLocations();
      if (cachedUserLocations) {
        return {
          success: true,
          data: cachedUserLocations,
          message: 'Data loaded from cache',
        };
      }

      // If online, fetch from API and cache
      if (networkStatus.isOnline()) {
        const response = await locationApi.getUserLocations();
        if (response.success && response.data) {
          await offlineStorage.cacheUserLocations(response.data);
          await offlineStorage.updateLastSyncTime();
          return response;
        }
      }

      return {
        success: false,
        data: [],
        message: 'No cached data available and offline',
      };
    } catch (error) {
      console.error('Error getting user locations:', error);
      return {
        success: false,
        data: [],
        message: 'Error loading user locations',
      };
    }
  }

  // Create user location (with offline queue)
  async createUserLocation(locationData: any): Promise<ApiResponse<UserLocation>> {
    try {
      if (networkStatus.isOnline()) {
        const response = await locationApi.createUserLocation(locationData);
        if (response.success && response.data) {
          // Update cache
          const cachedLocations = await offlineStorage.getCachedUserLocations() || [];
          await offlineStorage.cacheUserLocations([...cachedLocations, response.data]);
          return response;
        }
        return response;
      } else {
        // Queue for offline processing
        await offlineStorage.addToOfflineQueue({
          type: 'CREATE_LOCATION',
          data: locationData,
        });

        return {
          success: true,
          data: locationData as UserLocation,
          message: 'Queued for sync when online',
        };
      }
    } catch (error) {
      console.error('Error creating user location:', error);
      return {
        success: false,
        data: locationData as UserLocation,
        message: 'Error creating location',
      };
    }
  }

  // Update user location (with offline queue)
  async updateUserLocation(locationId: string, updates: any): Promise<ApiResponse<UserLocation>> {
    try {
      if (networkStatus.isOnline()) {
        const response = await locationApi.updateUserLocation(locationId, updates);
        if (response.success && response.data) {
          // Update cache
          const cachedLocations = await offlineStorage.getCachedUserLocations() || [];
          const updatedLocations = cachedLocations.map(loc =>
            loc.id === locationId ? { ...loc, ...updates } : loc
          );
          await offlineStorage.cacheUserLocations(updatedLocations);
          return response;
        }
        return response;
      } else {
        // Queue for offline processing
        await offlineStorage.addToOfflineQueue({
          type: 'UPDATE_LOCATION',
          data: { locationId, updates },
        });

        return {
          success: true,
          data: updates as UserLocation,
          message: 'Queued for sync when online',
        };
      }
    } catch (error) {
      console.error('Error updating user location:', error);
      return {
        success: false,
        data: updates as UserLocation,
        message: 'Error updating location',
      };
    }
  }

  // Delete user location (with offline queue)
  async deleteUserLocation(locationId: string): Promise<ApiResponse<void>> {
    try {
      if (networkStatus.isOnline()) {
        const response = await locationApi.deleteUserLocation(locationId);
        if (response.success) {
          // Update cache
          const cachedLocations = await offlineStorage.getCachedUserLocations() || [];
          const filteredLocations = cachedLocations.filter(loc => loc.id !== locationId);
          await offlineStorage.cacheUserLocations(filteredLocations);
          return response;
        }
        return response;
      } else {
        // Queue for offline processing
        await offlineStorage.addToOfflineQueue({
          type: 'DELETE_LOCATION',
          data: { locationId },
        });

        return {
          success: true,
          data: undefined,
          message: 'Queued for sync when online',
        };
      }
    } catch (error) {
      console.error('Error deleting user location:', error);
      return {
        success: false,
        data: undefined,
        message: 'Error deleting location',
      };
    }
  }

  // Sync operations
  async syncOfflineData(): Promise<void> {
    if (!networkStatus.isOnline()) {
      console.log('Cannot sync: offline');
      return;
    }

    try {
      // Process offline queue
      const queueLength = offlineStorage.getOfflineQueueLength();
      if (queueLength > 0) {
        console.log(`Syncing ${queueLength} offline actions...`);
        // The offline storage service will handle the actual sync
      }

      // Refresh cache with latest data
      await this.refreshCache();
    } catch (error) {
      console.error('Error syncing offline data:', error);
    }
  }

  private async refreshCache(): Promise<void> {
    try {
      // This would refresh all cached data
      // For now, we'll just update the sync timestamp
      await offlineStorage.updateLastSyncTime();
    } catch (error) {
      console.error('Error refreshing cache:', error);
    }
  }

  // Cache management
  async clearCache(): Promise<void> {
    await offlineStorage.clearCache();
  }

  async getCacheInfo(): Promise<{
    hasOfflineData: boolean;
    lastSyncTime: Date | null;
    queueLength: number;
    cacheSize: number;
  }> {
    return {
      hasOfflineData: await offlineStorage.hasOfflineData(),
      lastSyncTime: await offlineStorage.getLastSyncTime(),
      queueLength: offlineStorage.getOfflineQueueLength(),
      cacheSize: await offlineStorage.getCacheSize(),
    };
  }
}

// Export singleton instance
export const offlineLocationApi = new OfflineLocationApiService();
export default offlineLocationApi;




