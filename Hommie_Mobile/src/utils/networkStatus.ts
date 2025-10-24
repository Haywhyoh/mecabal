// Network Status Utility
// Handle connectivity and offline scenarios

import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string | null;
  isWifi: boolean;
  isCellular: boolean;
  isOnline: boolean;
}

class NetworkStatusService {
  private listeners: ((status: NetworkStatus) => void)[] = [];
  private currentStatus: NetworkStatus = {
    isConnected: false,
    isInternetReachable: false,
    type: null,
    isWifi: false,
    isCellular: false,
    isOnline: false,
  };

  constructor() {
    this.initializeNetworkListener();
  }

  private initializeNetworkListener() {
    NetInfo.addEventListener(state => {
      const isConnected = state.isConnected ?? false;
      const isInternetReachable = state.isInternetReachable ?? false;
      const newStatus: NetworkStatus = {
        isConnected,
        isInternetReachable,
        type: state.type,
        isWifi: state.type === 'wifi',
        isCellular: state.type === 'cellular',
        isOnline: isConnected && isInternetReachable,
      };

      this.currentStatus = newStatus;
      this.notifyListeners(newStatus);
    });
  }

  private notifyListeners(status: NetworkStatus) {
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }

  // Public methods
  getCurrentStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  async getNetworkStatus(): Promise<NetworkStatus> {
    const state = await NetInfo.fetch();
    const isConnected = state.isConnected ?? false;
    const isInternetReachable = state.isInternetReachable ?? false;
    return {
      isConnected,
      isInternetReachable,
      type: state.type,
      isWifi: state.type === 'wifi',
      isCellular: state.type === 'cellular',
      isOnline: isConnected && isInternetReachable,
    };
  }

  addListener(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  isOnline(): boolean {
    return this.currentStatus?.isConnected === true && this.currentStatus?.isInternetReachable === true;
  }

  isOffline(): boolean {
    return !this.isOnline();
  }

  isWifiConnected(): boolean {
    return this.currentStatus.isWifi;
  }

  isCellularConnected(): boolean {
    return this.currentStatus.isCellular;
  }

  // Offline handling
  showOfflineAlert(): void {
    Alert.alert(
      'No Internet Connection',
      'You\'re currently offline. Some features may be limited. Your data will sync when you\'re back online.',
      [{ text: 'OK' }]
    );
  }

  showConnectionRestoredAlert(): void {
    Alert.alert(
      'Connection Restored',
      'You\'re back online! Syncing your data...',
      [{ text: 'OK' }]
    );
  }

  // Data usage warnings
  showCellularWarning(): void {
    Alert.alert(
      'Cellular Data Usage',
      'You\'re using cellular data. Large downloads may use significant data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => {} },
      ]
    );
  }

  // Connection quality
  getConnectionQuality(): 'excellent' | 'good' | 'fair' | 'poor' | 'unknown' {
    if (!this.currentStatus.isConnected) return 'unknown';
    
    if (this.currentStatus.isWifi) return 'excellent';
    if (this.currentStatus.isCellular) return 'good';
    
    return 'fair';
  }

  // Retry logic
  async waitForConnection(timeout: number = 30000): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isOnline()) {
        resolve(true);
        return;
      }

      const unsubscribe = this.addListener((status) => {
        if (status.isConnected && status.isInternetReachable) {
          unsubscribe();
          resolve(true);
        }
      });

      // Timeout after specified time
      setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeout);
    });
  }

  // Batch operations
  async executeWhenOnline<T>(
    operation: () => Promise<T>,
    fallback?: () => T,
    timeout: number = 30000
  ): Promise<T> {
    if (this.isOnline()) {
      try {
        return await operation();
      } catch (error) {
        console.error('Error executing online operation:', error);
        if (fallback) {
          return fallback();
        }
        throw error;
      }
    }

    // Wait for connection
    const connected = await this.waitForConnection(timeout);
    
    if (connected) {
      try {
        return await operation();
      } catch (error) {
        console.error('Error executing operation after reconnection:', error);
        if (fallback) {
          return fallback();
        }
        throw error;
      }
    } else {
      if (fallback) {
        return fallback();
      }
      throw new Error('Operation timed out waiting for connection');
    }
  }

  // Sync operations
  async syncWhenOnline(syncFunction: () => Promise<void>): Promise<void> {
    if (this.isOnline()) {
      try {
        await syncFunction();
      } catch (error) {
        console.error('Error syncing data:', error);
        // Could implement retry logic here
      }
    } else {
      // Queue for later sync
      console.log('Queuing sync operation for when online');
    }
  }
}

// Export singleton instance
export const networkStatus = new NetworkStatusService();
export default networkStatus;












