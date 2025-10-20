// MeCabal Location Context
// Global location state management for hierarchical location selection

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { locationApi } from '../services/api/locationApi';
import { offlineLocationApi } from '../services/api/offlineLocationApi';
import { networkStatus } from '../utils/networkStatus';
import {
  State,
  LGA,
  Ward,
  Neighborhood,
  UserLocation,
  LocationContextState,
  LocationContextActions,
  LocationHierarchy,
  LocationError,
  LocationErrorCode
} from '../types/location.types';

interface LocationContextType extends LocationContextState, LocationContextActions {}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

// Storage keys for persisting location state
const STORAGE_KEYS = {
  SELECTED_STATE: 'location_selected_state',
  SELECTED_LGA: 'location_selected_lga',
  SELECTED_WARD: 'location_selected_ward',
  SELECTED_NEIGHBORHOOD: 'location_selected_neighborhood',
  CURRENT_COORDINATES: 'location_current_coordinates',
  USER_LOCATIONS: 'location_user_locations',
  PRIMARY_LOCATION: 'location_primary_location',
} as const;

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  // State
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const [selectedLGA, setSelectedLGA] = useState<LGA | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood | null>(null);
  const [currentCoordinates, setCurrentCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [recommendedNeighborhoods, setRecommendedNeighborhoods] = useState<Neighborhood[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userLocations, setUserLocations] = useState<UserLocation[]>([]);
  const [primaryLocation, setPrimaryLocation] = useState<UserLocation | null>(null);

  // Initialize location state from storage
  useEffect(() => {
    initializeLocationState();
  }, []);

  const initializeLocationState = async () => {
    try {
      setIsLoadingLocation(true);
      
      // Load persisted state from storage
      const [
        storedState,
        storedLGA,
        storedWard,
        storedNeighborhood,
        storedCoordinates,
        storedUserLocations,
        storedPrimaryLocation
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SELECTED_STATE),
        AsyncStorage.getItem(STORAGE_KEYS.SELECTED_LGA),
        AsyncStorage.getItem(STORAGE_KEYS.SELECTED_WARD),
        AsyncStorage.getItem(STORAGE_KEYS.SELECTED_NEIGHBORHOOD),
        AsyncStorage.getItem(STORAGE_KEYS.CURRENT_COORDINATES),
        AsyncStorage.getItem(STORAGE_KEYS.USER_LOCATIONS),
        AsyncStorage.getItem(STORAGE_KEYS.PRIMARY_LOCATION),
      ]);

      // Restore state from storage
      if (storedState) setSelectedState(JSON.parse(storedState));
      if (storedLGA) setSelectedLGA(JSON.parse(storedLGA));
      if (storedWard) setSelectedWard(JSON.parse(storedWard));
      if (storedNeighborhood) setSelectedNeighborhood(JSON.parse(storedNeighborhood));
      if (storedCoordinates) setCurrentCoordinates(JSON.parse(storedCoordinates));
      if (storedUserLocations) setUserLocations(JSON.parse(storedUserLocations));
      if (storedPrimaryLocation) setPrimaryLocation(JSON.parse(storedPrimaryLocation));

      // Load user locations from API
      await getUserLocations();
      
    } catch (error) {
      console.error('Error initializing location state:', error);
      setLocationError('Failed to initialize location data');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Persist state to storage
  const persistState = useCallback(async (key: string, value: any) => {
    try {
      if (value === null) {
        await AsyncStorage.removeItem(key);
      } else {
        await AsyncStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error(`Error persisting ${key}:`, error);
    }
  }, []);

  // State setters with persistence
  const handleSetSelectedState = useCallback((state: State | null) => {
    setSelectedState(state);
    persistState(STORAGE_KEYS.SELECTED_STATE, state);
    
    // Clear dependent selections when state changes
    if (state !== selectedState) {
      setSelectedLGA(null);
      setSelectedWard(null);
      setSelectedNeighborhood(null);
      persistState(STORAGE_KEYS.SELECTED_LGA, null);
      persistState(STORAGE_KEYS.SELECTED_WARD, null);
      persistState(STORAGE_KEYS.SELECTED_NEIGHBORHOOD, null);
    }
  }, [selectedState, persistState]);

  const handleSetSelectedLGA = useCallback((lga: LGA | null) => {
    setSelectedLGA(lga);
    persistState(STORAGE_KEYS.SELECTED_LGA, lga);
    
    // Clear dependent selections when LGA changes
    if (lga !== selectedLGA) {
      setSelectedWard(null);
      setSelectedNeighborhood(null);
      persistState(STORAGE_KEYS.SELECTED_WARD, null);
      persistState(STORAGE_KEYS.SELECTED_NEIGHBORHOOD, null);
    }
  }, [selectedLGA, persistState]);

  const handleSetSelectedWard = useCallback((ward: Ward | null) => {
    setSelectedWard(ward);
    persistState(STORAGE_KEYS.SELECTED_WARD, ward);
    
    // Clear dependent selections when ward changes
    if (ward !== selectedWard) {
      setSelectedNeighborhood(null);
      persistState(STORAGE_KEYS.SELECTED_NEIGHBORHOOD, null);
    }
  }, [selectedWard, persistState]);

  const handleSetSelectedNeighborhood = useCallback((neighborhood: Neighborhood | null) => {
    setSelectedNeighborhood(neighborhood);
    persistState(STORAGE_KEYS.SELECTED_NEIGHBORHOOD, neighborhood);
  }, [persistState]);

  const handleSetCurrentCoordinates = useCallback((coordinates: { latitude: number; longitude: number } | null) => {
    setCurrentCoordinates(coordinates);
    persistState(STORAGE_KEYS.CURRENT_COORDINATES, coordinates);
  }, [persistState]);

  const handleSetRecommendedNeighborhoods = useCallback((neighborhoods: Neighborhood[]) => {
    setRecommendedNeighborhoods(neighborhoods);
  }, []);

  const handleSetLoadingLocation = useCallback((loading: boolean) => {
    setIsLoadingLocation(loading);
  }, []);

  const handleSetLocationError = useCallback((error: string | null) => {
    setLocationError(error);
  }, []);

  // API Methods
  const getUserLocations = useCallback(async () => {
    try {
      setIsLoadingLocation(true);
      setLocationError(null);
      
      const locations = await locationApi.getUserLocations();
      setUserLocations(locations);
      
      // Find primary location
      const primary = locations.find(loc => loc.isPrimary) || null;
      setPrimaryLocation(primary);
      
      // Persist to storage
      await persistState(STORAGE_KEYS.USER_LOCATIONS, locations);
      await persistState(STORAGE_KEYS.PRIMARY_LOCATION, primary);
      
    } catch (error) {
      console.error('Error fetching user locations:', error);
      setLocationError('Failed to load your locations');
    } finally {
      setIsLoadingLocation(false);
    }
  }, [persistState]);

  const setLocationAsPrimary = useCallback(async (location: UserLocation) => {
    try {
      setIsLoadingLocation(true);
      setLocationError(null);
      
      const updatedLocation = await locationApi.setLocationAsPrimary(location.id);
      
      // Update local state
      setPrimaryLocation(updatedLocation);
      await persistState(STORAGE_KEYS.PRIMARY_LOCATION, updatedLocation);
      
      // Refresh all locations
      await getUserLocations();
      
    } catch (error) {
      console.error('Error setting primary location:', error);
      setLocationError('Failed to set primary location');
    } finally {
      setIsLoadingLocation(false);
    }
  }, [getUserLocations, persistState]);

  const addUserLocation = useCallback(async (location: Omit<UserLocation, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      setIsLoadingLocation(true);
      setLocationError(null);
      
      const newLocation = await locationApi.addSecondaryLocation(location);
      
      // Update local state
      setUserLocations(prev => [...prev, newLocation]);
      await persistState(STORAGE_KEYS.USER_LOCATIONS, [...userLocations, newLocation]);
      
    } catch (error) {
      console.error('Error adding location:', error);
      setLocationError('Failed to add location');
    } finally {
      setIsLoadingLocation(false);
    }
  }, [userLocations, persistState]);

  const updateUserLocation = useCallback(async (locationId: string, updates: Partial<UserLocation>) => {
    try {
      setIsLoadingLocation(true);
      setLocationError(null);
      
      const updatedLocation = await locationApi.updateUserLocation(locationId, updates);
      
      // Update local state
      setUserLocations(prev => 
        prev.map(loc => loc.id === locationId ? updatedLocation : loc)
      );
      
      // Update primary location if it was updated
      if (primaryLocation?.id === locationId) {
        setPrimaryLocation(updatedLocation);
        await persistState(STORAGE_KEYS.PRIMARY_LOCATION, updatedLocation);
      }
      
      await persistState(STORAGE_KEYS.USER_LOCATIONS, userLocations.map(loc => 
        loc.id === locationId ? updatedLocation : loc
      ));
      
    } catch (error) {
      console.error('Error updating location:', error);
      setLocationError('Failed to update location');
    } finally {
      setIsLoadingLocation(false);
    }
  }, [primaryLocation, userLocations, persistState]);

  const deleteUserLocation = useCallback(async (locationId: string) => {
    try {
      setIsLoadingLocation(true);
      setLocationError(null);
      
      await locationApi.deleteUserLocation(locationId);
      
      // Update local state
      const updatedLocations = userLocations.filter(loc => loc.id !== locationId);
      setUserLocations(updatedLocations);
      
      // Clear primary location if it was deleted
      if (primaryLocation?.id === locationId) {
        setPrimaryLocation(null);
        await persistState(STORAGE_KEYS.PRIMARY_LOCATION, null);
      }
      
      await persistState(STORAGE_KEYS.USER_LOCATIONS, updatedLocations);
      
    } catch (error) {
      console.error('Error deleting location:', error);
      setLocationError('Failed to delete location');
    } finally {
      setIsLoadingLocation(false);
    }
  }, [userLocations, primaryLocation, persistState]);

  const getCurrentLocation = useCallback(async () => {
    try {
      setIsLoadingLocation(true);
      setLocationError(null);
      
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }
      
      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setCurrentCoordinates(coordinates);
      await persistState(STORAGE_KEYS.CURRENT_COORDINATES, coordinates);
      
      // Get recommendations based on current location
      await getRecommendations(coordinates.latitude, coordinates.longitude);
      
    } catch (error) {
      console.error('Error getting current location:', error);
      setLocationError('Failed to get your current location');
    } finally {
      setIsLoadingLocation(false);
    }
  }, [persistState]);

  const getRecommendations = useCallback(async (latitude: number, longitude: number) => {
    try {
      setIsLoadingLocation(true);
      setLocationError(null);

      console.log('📍 LocationContext: Getting recommendations for:', { latitude, longitude });

      const response = await locationApi.recommendNeighborhoods({
        latitude,
        longitude,
        radius: 5000, // 5km radius
        limit: 10,
      });

      console.log('📍 LocationContext: Recommendation response:', response);
      console.log('📍 LocationContext: Recommendations count:', response.recommendations?.length || 0);

      setRecommendedNeighborhoods(response.recommendations?.map(rec => rec.neighborhood) || []);

    } catch (error) {
      console.error('❌ LocationContext: Error getting recommendations:', error);
      setLocationError('Failed to get neighborhood recommendations');
    } finally {
      setIsLoadingLocation(false);
    }
  }, []);

  const saveUserLocation = useCallback(async (location: Omit<UserLocation, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      setIsLoadingLocation(true);
      setLocationError(null);
      
      const newLocation = await locationApi.setPrimaryLocation(location);
      
      // Update local state
      setPrimaryLocation(newLocation);
      setUserLocations(prev => [...prev, newLocation]);
      
      // Persist to storage
      await persistState(STORAGE_KEYS.PRIMARY_LOCATION, newLocation);
      await persistState(STORAGE_KEYS.USER_LOCATIONS, [...userLocations, newLocation]);
      
    } catch (error) {
      console.error('Error saving location:', error);
      setLocationError('Failed to save location');
    } finally {
      setIsLoadingLocation(false);
    }
  }, [userLocations, persistState]);

  const clearLocationSelection = useCallback(() => {
    setSelectedState(null);
    setSelectedLGA(null);
    setSelectedWard(null);
    setSelectedNeighborhood(null);
    setCurrentCoordinates(null);
    setRecommendedNeighborhoods([]);
    setLocationError(null);
    
    // Clear from storage
    Promise.all([
      persistState(STORAGE_KEYS.SELECTED_STATE, null),
      persistState(STORAGE_KEYS.SELECTED_LGA, null),
      persistState(STORAGE_KEYS.SELECTED_WARD, null),
      persistState(STORAGE_KEYS.SELECTED_NEIGHBORHOOD, null),
      persistState(STORAGE_KEYS.CURRENT_COORDINATES, null),
    ]);
  }, [persistState]);

  // Offline support methods
  const syncOfflineData = useCallback(async () => {
    try {
      await offlineLocationApi.syncOfflineData();
      // Reload user locations after sync
      await getUserLocations();
    } catch (error) {
      console.error('Error syncing offline data:', error);
    }
  }, [getUserLocations]);

  const getOfflineStatus = useCallback(async () => {
    const cacheInfo = await offlineLocationApi.getCacheInfo();
    return {
      isOnline: networkStatus.isOnline(),
      hasOfflineData: cacheInfo.hasOfflineData,
      queueLength: cacheInfo.queueLength,
      lastSyncTime: cacheInfo.lastSyncTime,
    };
  }, []);

  const clearOfflineCache = useCallback(async () => {
    try {
      await offlineLocationApi.clearCache();
      // Reload data from API
      await getUserLocations();
    } catch (error) {
      console.error('Error clearing offline cache:', error);
    }
  }, [getUserLocations]);

  // Context value
  const contextValue: LocationContextType = {
    // State
    selectedState,
    selectedLGA,
    selectedWard,
    selectedNeighborhood,
    currentCoordinates,
    recommendedNeighborhoods,
    isLoadingLocation,
    locationError,
    userLocations,
    primaryLocation,
    
    // Actions
    setSelectedState: handleSetSelectedState,
    setSelectedLGA: handleSetSelectedLGA,
    setSelectedWard: handleSetSelectedWard,
    setSelectedNeighborhood: handleSetSelectedNeighborhood,
    setCurrentCoordinates: handleSetCurrentCoordinates,
    setRecommendedNeighborhoods: handleSetRecommendedNeighborhoods,
    setLoadingLocation: handleSetLoadingLocation,
    setLocationError: handleSetLocationError,
    getUserLocations,
    setLocationAsPrimary,
    addUserLocation,
    updateUserLocation,
    deleteUserLocation,
    getCurrentLocation,
    getRecommendations,
    saveUserLocation,
    clearLocationSelection,
    
    // Offline support
    syncOfflineData,
    getOfflineStatus,
    clearOfflineCache,
  };

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
};

// Hook to use location context
export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

// Export the context for advanced usage
export { LocationContext };
