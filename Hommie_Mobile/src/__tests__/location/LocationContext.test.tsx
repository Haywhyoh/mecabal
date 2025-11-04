// Location Context Tests
// Test LocationContext logic and state management

import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { LocationProvider, useLocation } from '../../contexts/LocationContext';
import { offlineLocationApi } from '../../services/api/offlineLocationApi';
import { networkStatus } from '../../utils/networkStatus';

// Mock the offline location API
jest.mock('../../services/api/offlineLocationApi', () => ({
  offlineLocationApi: {
    getUserLocations: jest.fn(),
    syncOfflineData: jest.fn(),
    getCacheInfo: jest.fn(),
    clearCache: jest.fn(),
  },
}));

// Mock the network status
jest.mock('../../utils/networkStatus', () => ({
  networkStatus: {
    isOnline: jest.fn(),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock expo-location
jest.mock('expo-location', () => ({
  getCurrentPositionAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(),
}));

// Test component that uses the context
const TestComponent = () => {
  const location = useLocation();
  return null;
};

describe('LocationContext Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Context Provider', () => {
    it('should provide location context to children', () => {
      const { getByTestId } = render(
        <LocationProvider>
          <TestComponent />
        </LocationProvider>
      );

      expect(getByTestId).toBeDefined();
    });

    it('should initialize with default state', () => {
      let contextValue: any;
      
      const TestComponentWithContext = () => {
        contextValue = useLocation();
        return null;
      };

      render(
        <LocationProvider>
          <TestComponentWithContext />
        </LocationProvider>
      );

      expect(contextValue.selectedState).toBeNull();
      expect(contextValue.selectedLGA).toBeNull();
      expect(contextValue.selectedWard).toBeNull();
      expect(contextValue.selectedNeighborhood).toBeNull();
      expect(contextValue.currentCoordinates).toBeNull();
      expect(contextValue.recommendedNeighborhoods).toEqual([]);
      expect(contextValue.isLoadingLocation).toBe(false);
      expect(contextValue.locationError).toBeNull();
      expect(contextValue.userLocations).toEqual([]);
      expect(contextValue.primaryLocation).toBeNull();
    });
  });

  describe('State Management', () => {
    it('should update selected state', () => {
      let contextValue: any;
      
      const TestComponentWithContext = () => {
        contextValue = useLocation();
        return null;
      };

      render(
        <LocationProvider>
          <TestComponentWithContext />
        </LocationProvider>
      );

      const mockState = { id: '1', name: 'Lagos', code: 'LA' };
      
      act(() => {
        contextValue.setSelectedState(mockState);
      });

      expect(contextValue.selectedState).toEqual(mockState);
    });

    it('should clear dependent selections when state changes', () => {
      let contextValue: any;
      
      const TestComponentWithContext = () => {
        contextValue = useLocation();
        return null;
      };

      render(
        <LocationProvider>
          <TestComponentWithContext />
        </LocationProvider>
      );

      const mockLGA = { id: '1', name: 'Ikeja', code: 'IKE', stateId: '1', type: 'LGA' };
      const mockWard = { id: '1', name: 'Ward 1', code: 'W1', lgaId: '1' };
      const mockNeighborhood = { id: '1', name: 'Victoria Island', type: 'AREA', wardId: '1' };

      // Set up initial selections
      act(() => {
        contextValue.setSelectedLGA(mockLGA);
        contextValue.setSelectedWard(mockWard);
        contextValue.setSelectedNeighborhood(mockNeighborhood);
      });

      // Change state
      const newState = { id: '2', name: 'Abuja', code: 'FCT' };
      
      act(() => {
        contextValue.setSelectedState(newState);
      });

      expect(contextValue.selectedState).toEqual(newState);
      expect(contextValue.selectedLGA).toBeNull();
      expect(contextValue.selectedWard).toBeNull();
      expect(contextValue.selectedNeighborhood).toBeNull();
    });

    it('should update current coordinates', () => {
      let contextValue: any;
      
      const TestComponentWithContext = () => {
        contextValue = useLocation();
        return null;
      };

      render(
        <LocationProvider>
          <TestComponentWithContext />
        </LocationProvider>
      );

      const mockCoordinates = { latitude: 6.5244, longitude: 3.3792 };
      
      act(() => {
        contextValue.setCurrentCoordinates(mockCoordinates);
      });

      expect(contextValue.currentCoordinates).toEqual(mockCoordinates);
    });
  });

  describe('User Locations Management', () => {
    it('should load user locations', async () => {
      const mockUserLocations = [
        { id: '1', userId: 'user1', neighborhoodId: '1', isPrimary: true },
        { id: '2', userId: 'user1', neighborhoodId: '2', isPrimary: false },
      ];

      (offlineLocationApi.getUserLocations as jest.Mock).mockResolvedValue({
        success: true,
        data: mockUserLocations,
      });

      let contextValue: any;
      
      const TestComponentWithContext = () => {
        contextValue = useLocation();
        return null;
      };

      render(
        <LocationProvider>
          <TestComponentWithContext />
        </LocationProvider>
      );

      await act(async () => {
        await contextValue.getUserLocations();
      });

      expect(contextValue.userLocations).toEqual(mockUserLocations);
      expect(contextValue.primaryLocation).toEqual(mockUserLocations[0]);
    });

    it('should handle user locations loading error', async () => {
      (offlineLocationApi.getUserLocations as jest.Mock).mockRejectedValue(new Error('API Error'));

      let contextValue: any;
      
      const TestComponentWithContext = () => {
        contextValue = useLocation();
        return null;
      };

      render(
        <LocationProvider>
          <TestComponentWithContext />
        </LocationProvider>
      );

      await act(async () => {
        await contextValue.getUserLocations();
      });

      expect(contextValue.locationError).toBe('Failed to load user locations');
    });
  });

  describe('Offline Support', () => {
    it('should sync offline data', async () => {
      (offlineLocationApi.syncOfflineData as jest.Mock).mockResolvedValue(undefined);
      (offlineLocationApi.getUserLocations as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      let contextValue: any;
      
      const TestComponentWithContext = () => {
        contextValue = useLocation();
        return null;
      };

      render(
        <LocationProvider>
          <TestComponentWithContext />
        </LocationProvider>
      );

      await act(async () => {
        await contextValue.syncOfflineData();
      });

      expect(offlineLocationApi.syncOfflineData).toHaveBeenCalledTimes(1);
      expect(offlineLocationApi.getUserLocations).toHaveBeenCalledTimes(1);
    });

    it('should get offline status', async () => {
      (networkStatus.isOnline as jest.Mock).mockReturnValue(true);
      (offlineLocationApi.getCacheInfo as jest.Mock).mockResolvedValue({
        hasOfflineData: true,
        queueLength: 2,
        lastSyncTime: new Date(),
      });

      let contextValue: any;
      
      const TestComponentWithContext = () => {
        contextValue = useLocation();
        return null;
      };

      render(
        <LocationProvider>
          <TestComponentWithContext />
        </LocationProvider>
      );

      const status = await contextValue.getOfflineStatus();

      expect(status.isOnline).toBe(true);
      expect(status.hasOfflineData).toBe(true);
      expect(status.queueLength).toBe(2);
      expect(status.lastSyncTime).toBeInstanceOf(Date);
    });

    it('should clear offline cache', async () => {
      (offlineLocationApi.clearCache as jest.Mock).mockResolvedValue(undefined);
      (offlineLocationApi.getUserLocations as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      let contextValue: any;
      
      const TestComponentWithContext = () => {
        contextValue = useLocation();
        return null;
      };

      render(
        <LocationProvider>
          <TestComponentWithContext />
        </LocationProvider>
      );

      await act(async () => {
        await contextValue.clearOfflineCache();
      });

      expect(offlineLocationApi.clearCache).toHaveBeenCalledTimes(1);
      expect(offlineLocationApi.getUserLocations).toHaveBeenCalledTimes(1);
    });
  });

  describe('Location Selection', () => {
    it('should clear location selection', () => {
      let contextValue: any;
      
      const TestComponentWithContext = () => {
        contextValue = useLocation();
        return null;
      };

      render(
        <LocationProvider>
          <TestComponentWithContext />
        </LocationProvider>
      );

      // Set up some selections
      act(() => {
        contextValue.setSelectedState({ id: '1', name: 'Lagos', code: 'LA' });
        contextValue.setSelectedLGA({ id: '1', name: 'Ikeja', code: 'IKE', stateId: '1', type: 'LGA' });
        contextValue.setCurrentCoordinates({ latitude: 6.5244, longitude: 3.3792 });
      });

      // Clear selection
      act(() => {
        contextValue.clearLocationSelection();
      });

      expect(contextValue.selectedState).toBeNull();
      expect(contextValue.selectedLGA).toBeNull();
      expect(contextValue.selectedWard).toBeNull();
      expect(contextValue.selectedNeighborhood).toBeNull();
      expect(contextValue.currentCoordinates).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle context usage outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useLocation must be used within a LocationProvider');

      console.error = originalError;
    });
  });
});
















