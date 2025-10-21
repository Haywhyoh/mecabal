// Location Permissions Utility
// Platform-specific permission handling for location services

import { Platform, Alert, Linking } from 'react-native';
import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';

export interface PermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined' | 'restricted';
  message?: string;
}

export interface PermissionRequestResult {
  success: boolean;
  status: PermissionStatus;
  fallbackRequired: boolean;
}

class LocationPermissionsService {
  private static instance: LocationPermissionsService;
  private permissionStatus: PermissionStatus | null = null;

  private constructor() {}

  static getInstance(): LocationPermissionsService {
    if (!LocationPermissionsService.instance) {
      LocationPermissionsService.instance = new LocationPermissionsService();
    }
    return LocationPermissionsService.instance;
  }

  // Check current location permission status
  async checkLocationPermission(): Promise<PermissionStatus> {
    try {
      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
      
      const permissionStatus: PermissionStatus = {
        granted: status === 'granted',
        canAskAgain: canAskAgain,
        status: status as 'granted' | 'denied' | 'undetermined' | 'restricted',
        message: this.getStatusMessage(status, canAskAgain),
      };

      this.permissionStatus = permissionStatus;
      return permissionStatus;
    } catch (error) {
      console.error('Error checking location permission:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied',
        message: 'Error checking location permission',
      };
    }
  }

  // Request location permission
  async requestLocationPermission(): Promise<PermissionRequestResult> {
    try {
      // Check if permission is already granted
      const currentStatus = await this.checkLocationPermission();
      if (currentStatus.granted) {
        return {
          success: true,
          status: currentStatus,
          fallbackRequired: false,
        };
      }

      // Request permission
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      
      const permissionStatus: PermissionStatus = {
        granted: status === 'granted',
        canAskAgain: canAskAgain,
        status: status as 'granted' | 'denied' | 'undetermined' | 'restricted',
        message: this.getStatusMessage(status, canAskAgain),
      };

      this.permissionStatus = permissionStatus;

      if (status === 'granted') {
        return {
          success: true,
          status: permissionStatus,
          fallbackRequired: false,
        };
      } else {
        return {
          success: false,
          status: permissionStatus,
          fallbackRequired: true,
        };
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return {
        success: false,
        status: {
          granted: false,
          canAskAgain: false,
          status: 'denied',
          message: 'Error requesting location permission',
        },
        fallbackRequired: true,
      };
    }
  }

  // Handle permission denied scenario
  async handlePermissionDenied(): Promise<void> {
    const status = this.permissionStatus || await this.checkLocationPermission();
    
    if (status.canAskAgain) {
      // Can ask again, show explanation
      this.showPermissionExplanation();
    } else {
      // Cannot ask again, show settings dialog
      this.showSettingsDialog();
    }
  }

  // Show permission explanation dialog
  private showPermissionExplanation(): void {
    Alert.alert(
      'Location Permission Required',
      'MeCabal needs access to your location to help you connect with your neighborhood community. This helps us show you relevant local content and recommendations.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Try Again', 
          onPress: () => this.requestLocationPermission() 
        },
      ]
    );
  }

  // Show settings dialog for denied permissions
  private showSettingsDialog(): void {
    Alert.alert(
      'Location Permission Denied',
      'Location access is required for MeCabal to work properly. Please enable location permissions in your device settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: () => this.openSettings() 
        },
        { 
          text: 'Use Manual Entry', 
          onPress: () => this.handleManualEntryFallback() 
        },
      ]
    );
  }

  // Open device settings
  async openSettings(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('Error opening settings:', error);
      Alert.alert(
        'Error',
        'Unable to open settings. Please manually enable location permissions in your device settings.',
        [{ text: 'OK' }]
      );
    }
  }

  // Handle manual entry fallback
  private handleManualEntryFallback(): void {
    Alert.alert(
      'Manual Location Entry',
      'You can still use MeCabal by manually selecting your location. Some features may be limited without GPS access.',
      [{ text: 'OK' }]
    );
  }

  // Get status message based on permission status
  private getStatusMessage(status: string, canAskAgain: boolean): string {
    switch (status) {
      case 'granted':
        return 'Location permission granted';
      case 'denied':
        return canAskAgain 
          ? 'Location permission denied. You can try again.' 
          : 'Location permission denied. Please enable in settings.';
      case 'undetermined':
        return 'Location permission not yet requested';
      case 'restricted':
        return 'Location permission restricted by device policy';
      default:
        return 'Unknown permission status';
    }
  }

  // Check if location services are enabled
  async isLocationEnabled(): Promise<boolean> {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      return enabled;
    } catch (error) {
      console.error('Error checking location services:', error);
      return false;
    }
  }

  // Get current permission status (cached)
  getCurrentPermissionStatus(): PermissionStatus | null {
    return this.permissionStatus;
  }

  // Reset permission status (useful for testing)
  resetPermissionStatus(): void {
    this.permissionStatus = null;
  }

  // Check if we can request permission
  canRequestPermission(): boolean {
    return this.permissionStatus?.canAskAgain ?? true;
  }

  // Get platform-specific permission info
  getPlatformInfo(): {
    platform: 'ios' | 'android';
    permissionType: string;
    settingsPath: string;
  } {
    return {
      platform: Platform.OS as 'ios' | 'android',
      permissionType: Platform.OS === 'ios' ? 'When In Use' : 'FINE_LOCATION',
      settingsPath: Platform.OS === 'ios' 
        ? 'Settings > Privacy & Security > Location Services > MeCabal'
        : 'Settings > Apps > MeCabal > Permissions > Location',
    };
  }

  // Comprehensive permission check with fallback
  async checkPermissionWithFallback(): Promise<{
    hasPermission: boolean;
    canRequest: boolean;
    needsSettings: boolean;
    fallbackRequired: boolean;
    message: string;
  }> {
    try {
      // Check if location services are enabled
      const locationEnabled = await this.isLocationEnabled();
      if (!locationEnabled) {
        return {
          hasPermission: false,
          canRequest: false,
          needsSettings: true,
          fallbackRequired: true,
          message: 'Location services are disabled on your device. Please enable them in settings.',
        };
      }

      // Check current permission status
      const status = await this.checkLocationPermission();
      
      return {
        hasPermission: status.granted,
        canRequest: status.canAskAgain,
        needsSettings: !status.canAskAgain && !status.granted,
        fallbackRequired: !status.granted,
        message: status.message || 'Permission status unknown',
      };
    } catch (error) {
      console.error('Error checking permission with fallback:', error);
      return {
        hasPermission: false,
        canRequest: false,
        needsSettings: true,
        fallbackRequired: true,
        message: 'Error checking location permission',
      };
    }
  }

  // Request permission with comprehensive handling
  async requestPermissionWithHandling(): Promise<{
    success: boolean;
    hasPermission: boolean;
    fallbackRequired: boolean;
    message: string;
  }> {
    try {
      const result = await this.requestLocationPermission();
      
      if (result.success) {
        return {
          success: true,
          hasPermission: true,
          fallbackRequired: false,
          message: 'Location permission granted successfully',
        };
      }

      // Handle different failure scenarios
      if (result.status.canAskAgain) {
        return {
          success: false,
          hasPermission: false,
          fallbackRequired: true,
          message: 'Permission denied. You can try again.',
        };
      } else {
        return {
          success: false,
          hasPermission: false,
          fallbackRequired: true,
          message: 'Permission denied. Please enable in settings or use manual entry.',
        };
      }
    } catch (error) {
      console.error('Error requesting permission with handling:', error);
      return {
        success: false,
        hasPermission: false,
        fallbackRequired: true,
        message: 'Error requesting location permission',
      };
    }
  }
}

// Export singleton instance
export const locationPermissions = LocationPermissionsService.getInstance();
export default locationPermissions;




