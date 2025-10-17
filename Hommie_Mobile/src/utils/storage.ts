// MeCabal Storage Utility
// Centralized AsyncStorage operations for authentication and user data
// Supports both local and OAuth authentication data

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys constants
export const STORAGE_KEYS = {
  // Authentication tokens
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  
  // User data
  USER_DATA: 'user_data',
  USER_PROFILE: 'user_profile',
  
  // OAuth data
  AUTH_PROVIDER: 'auth_provider',
  GOOGLE_ID: 'google_id',
  FACEBOOK_ID: 'facebook_id',
  APPLE_ID: 'apple_id',
  
  // User preferences
  USER_PREFERENCES: 'user_preferences',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  LOCATION_DATA: 'location_data',
  
  // App state
  APP_STATE: 'app_state',
  LAST_LOGIN: 'last_login',
} as const;

// User data interface
export interface StoredUserData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  authProvider: 'local' | 'google' | 'facebook' | 'apple';
  googleId?: string;
  facebookId?: string;
  appleId?: string;
  isEmailVerified: boolean;
  isVerified: boolean;
  phoneVerified: boolean;
  identityVerified: boolean;
  addressVerified: boolean;
  trustScore?: number;
  verificationLevel?: string;
  verificationBadge?: string;
  bio?: string;
  occupation?: string;
  professionalSkills?: string[];
  culturalBackground?: string;
  nativeLanguages?: string[];
  preferredLanguage?: string;
  state?: string;
  city?: string;
  estate?: string;
  locationString?: string;
  landmark?: string;
  address?: string;
  isActive: boolean;
  memberSince?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
  joinDate?: string;
  profileCompleteness?: number;
}

// OAuth data interface
export interface OAuthData {
  provider: 'google' | 'facebook' | 'apple';
  providerId: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
}

// User preferences interface
export interface UserPreferences {
  language: string;
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    locationSharing: boolean;
  };
  theme: 'light' | 'dark' | 'auto';
}

// Storage utility class
export class StorageService {
  // Generic storage methods
  static async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error storing ${key}:`, error);
      throw error;
    }
  }

  static async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Error retrieving ${key}:`, error);
      return null;
    }
  }

  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      throw error;
    }
  }

  static async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  // Authentication token methods
  static async setAuthTokens(accessToken: string, refreshToken?: string): Promise<void> {
    await Promise.all([
      this.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken),
      refreshToken ? this.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken) : Promise.resolve(),
    ]);
  }

  static async getAuthTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.getItem<string>(STORAGE_KEYS.AUTH_TOKEN),
      this.getItem<string>(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
    return { accessToken, refreshToken };
  }

  static async clearAuthTokens(): Promise<void> {
    await Promise.all([
      this.removeItem(STORAGE_KEYS.AUTH_TOKEN),
      this.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
  }

  // User data methods
  static async setUserData(userData: StoredUserData): Promise<void> {
    await this.setItem(STORAGE_KEYS.USER_DATA, userData);
  }

  static async getUserData(): Promise<StoredUserData | null> {
    return this.getItem<StoredUserData>(STORAGE_KEYS.USER_DATA);
  }

  static async updateUserData(updates: Partial<StoredUserData>): Promise<void> {
    const currentData = await this.getUserData();
    if (currentData) {
      const updatedData = { ...currentData, ...updates };
      await this.setUserData(updatedData);
    }
  }

  static async clearUserData(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.USER_DATA);
  }

  // OAuth data methods
  static async setOAuthData(provider: 'google' | 'facebook' | 'apple', oauthData: OAuthData): Promise<void> {
    const key = provider === 'google' ? STORAGE_KEYS.GOOGLE_ID : 
                provider === 'facebook' ? STORAGE_KEYS.FACEBOOK_ID : 
                STORAGE_KEYS.APPLE_ID;
    await this.setItem(key, oauthData);
  }

  static async getOAuthData(provider: 'google' | 'facebook' | 'apple'): Promise<OAuthData | null> {
    const key = provider === 'google' ? STORAGE_KEYS.GOOGLE_ID : 
                provider === 'facebook' ? STORAGE_KEYS.FACEBOOK_ID : 
                STORAGE_KEYS.APPLE_ID;
    return this.getItem<OAuthData>(key);
  }

  static async clearOAuthData(provider: 'google' | 'facebook' | 'apple'): Promise<void> {
    const key = provider === 'google' ? STORAGE_KEYS.GOOGLE_ID : 
                provider === 'facebook' ? STORAGE_KEYS.FACEBOOK_ID : 
                STORAGE_KEYS.APPLE_ID;
    await this.removeItem(key);
  }

  // Auth provider methods
  static async setAuthProvider(provider: 'local' | 'google' | 'facebook' | 'apple'): Promise<void> {
    await this.setItem(STORAGE_KEYS.AUTH_PROVIDER, provider);
  }

  static async getAuthProvider(): Promise<'local' | 'google' | 'facebook' | 'apple' | null> {
    return this.getItem<'local' | 'google' | 'facebook' | 'apple'>(STORAGE_KEYS.AUTH_PROVIDER);
  }

  static async clearAuthProvider(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.AUTH_PROVIDER);
  }

  // User preferences methods
  static async setUserPreferences(preferences: UserPreferences): Promise<void> {
    await this.setItem(STORAGE_KEYS.USER_PREFERENCES, preferences);
  }

  static async getUserPreferences(): Promise<UserPreferences | null> {
    return this.getItem<UserPreferences>(STORAGE_KEYS.USER_PREFERENCES);
  }

  static async updateUserPreferences(updates: Partial<UserPreferences>): Promise<void> {
    const currentPrefs = await this.getUserPreferences();
    if (currentPrefs) {
      const updatedPrefs = { ...currentPrefs, ...updates };
      await this.setUserPreferences(updatedPrefs);
    }
  }

  // Onboarding methods
  static async setOnboardingCompleted(completed: boolean): Promise<void> {
    await this.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, completed);
  }

  static async isOnboardingCompleted(): Promise<boolean> {
    const completed = await this.getItem<boolean>(STORAGE_KEYS.ONBOARDING_COMPLETED);
    return completed || false;
  }

  // Location data methods
  static async setLocationData(locationData: any): Promise<void> {
    await this.setItem(STORAGE_KEYS.LOCATION_DATA, locationData);
  }

  static async getLocationData(): Promise<any | null> {
    return this.getItem(STORAGE_KEYS.LOCATION_DATA);
  }

  static async clearLocationData(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.LOCATION_DATA);
  }

  // App state methods
  static async setAppState(state: any): Promise<void> {
    await this.setItem(STORAGE_KEYS.APP_STATE, state);
  }

  static async getAppState(): Promise<any | null> {
    return this.getItem(STORAGE_KEYS.APP_STATE);
  }

  static async setLastLogin(timestamp: string): Promise<void> {
    await this.setItem(STORAGE_KEYS.LAST_LOGIN, timestamp);
  }

  static async getLastLogin(): Promise<string | null> {
    return this.getItem<string>(STORAGE_KEYS.LAST_LOGIN);
  }

  // Complete logout method
  static async clearAllAuthData(): Promise<void> {
    await Promise.all([
      this.clearAuthTokens(),
      this.clearUserData(),
      this.clearAuthProvider(),
      this.clearOAuthData('google'),
      this.clearOAuthData('facebook'),
      this.clearOAuthData('apple'),
    ]);
  }

  // Migration methods for existing data
  static async migrateToNewStorageFormat(): Promise<void> {
    try {
      // Check if migration is needed
      const hasOldFormat = await this.getItem('user');
      if (hasOldFormat) {
        console.log('Migrating user data to new storage format...');
        
        // Migrate old user data to new format
        const oldUserData = await this.getItem('user');
        if (oldUserData) {
          const newUserData: StoredUserData = {
            id: oldUserData.id || '',
            email: oldUserData.email || '',
            firstName: oldUserData.firstName || oldUserData.first_name,
            lastName: oldUserData.lastName || oldUserData.last_name,
            phoneNumber: oldUserData.phoneNumber || oldUserData.phone_number,
            profilePictureUrl: oldUserData.profilePictureUrl || oldUserData.profile_picture_url,
            authProvider: oldUserData.authProvider || 'local',
            googleId: oldUserData.googleId || oldUserData.google_id,
            facebookId: oldUserData.facebookId || oldUserData.facebook_id,
            appleId: oldUserData.appleId || oldUserData.apple_id,
            isEmailVerified: oldUserData.isEmailVerified || oldUserData.is_email_verified || false,
            isVerified: oldUserData.isVerified || oldUserData.is_verified || false,
            phoneVerified: oldUserData.phoneVerified || oldUserData.phone_verified || false,
            identityVerified: oldUserData.identityVerified || oldUserData.identity_verified || false,
            addressVerified: oldUserData.addressVerified || oldUserData.address_verified || false,
            trustScore: oldUserData.trustScore || oldUserData.trust_score,
            verificationLevel: oldUserData.verificationLevel || oldUserData.verification_level,
            verificationBadge: oldUserData.verificationBadge || oldUserData.verification_badge,
            bio: oldUserData.bio,
            occupation: oldUserData.occupation,
            professionalSkills: oldUserData.professionalSkills || oldUserData.professional_skills,
            culturalBackground: oldUserData.culturalBackground || oldUserData.cultural_background,
            nativeLanguages: oldUserData.nativeLanguages || oldUserData.native_languages,
            preferredLanguage: oldUserData.preferredLanguage || oldUserData.preferred_language,
            state: oldUserData.state,
            city: oldUserData.city,
            estate: oldUserData.estate,
            locationString: oldUserData.locationString || oldUserData.location_string,
            landmark: oldUserData.landmark,
            address: oldUserData.address,
            isActive: oldUserData.isActive || oldUserData.is_active || true,
            memberSince: oldUserData.memberSince || oldUserData.member_since,
            lastLoginAt: oldUserData.lastLoginAt || oldUserData.last_login_at,
            createdAt: oldUserData.createdAt || oldUserData.created_at,
            updatedAt: oldUserData.updatedAt || oldUserData.updated_at,
            joinDate: oldUserData.joinDate || oldUserData.join_date,
            profileCompleteness: oldUserData.profileCompleteness || oldUserData.profile_completeness,
          };
          
          await this.setUserData(newUserData);
          
          // Set auth provider if available
          if (oldUserData.authProvider) {
            await this.setAuthProvider(oldUserData.authProvider);
          }
          
          // Clear old data
          await this.removeItem('user');
          
          console.log('User data migration completed successfully');
        }
      }
    } catch (error) {
      console.error('Error during storage migration:', error);
    }
  }

  // Debug methods
  static async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }

  static async getStorageInfo(): Promise<{
    keys: string[];
    userData: StoredUserData | null;
    authProvider: string | null;
    hasAuthTokens: boolean;
  }> {
    const [keys, userData, authProvider, authTokens] = await Promise.all([
      this.getAllKeys(),
      this.getUserData(),
      this.getAuthProvider(),
      this.getAuthTokens(),
    ]);

    return {
      keys,
      userData,
      authProvider,
      hasAuthTokens: !!(authTokens.accessToken || authTokens.refreshToken),
    };
  }
}

export default StorageService;
