// Location API Tests
// Test API integration for location services

import { locationApi } from '../../services/api/locationApi';
import { offlineLocationApi } from '../../services/api/offlineLocationApi';

// Mock the location API
jest.mock('../../services/api/locationApi', () => ({
  locationApi: {
    getStates: jest.fn(),
    getLGAsByState: jest.fn(),
    getWardsByLGA: jest.fn(),
    getNeighborhoodsByWard: jest.fn(),
    getNearbyLandmarks: jest.fn(),
    getUserLocations: jest.fn(),
    createUserLocation: jest.fn(),
    updateUserLocation: jest.fn(),
    deleteUserLocation: jest.fn(),
  },
}));

// Mock the offline location API
jest.mock('../../services/api/offlineLocationApi', () => ({
  offlineLocationApi: {
    getStates: jest.fn(),
    getLGAsByState: jest.fn(),
    getWardsByLGA: jest.fn(),
    getNeighborhoodsByWard: jest.fn(),
    getNearbyLandmarks: jest.fn(),
    getUserLocations: jest.fn(),
    createUserLocation: jest.fn(),
    updateUserLocation: jest.fn(),
    deleteUserLocation: jest.fn(),
    syncOfflineData: jest.fn(),
    clearCache: jest.fn(),
    getCacheInfo: jest.fn(),
  },
}));

describe('Location API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('States API', () => {
    it('should fetch states successfully', async () => {
      const mockStates = [
        { id: '1', name: 'Lagos', code: 'LA' },
        { id: '2', name: 'Abuja', code: 'FCT' },
      ];

      (locationApi.getStates as jest.Mock).mockResolvedValue({
        success: true,
        data: mockStates,
      });

      const result = await locationApi.getStates();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStates);
      expect(locationApi.getStates).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors gracefully', async () => {
      (locationApi.getStates as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(locationApi.getStates()).rejects.toThrow('Network error');
    });
  });

  describe('LGAs API', () => {
    it('should fetch LGAs by state successfully', async () => {
      const mockLGAs = [
        { id: '1', name: 'Ikeja', code: 'IKE', stateId: '1', type: 'LGA' },
        { id: '2', name: 'Victoria Island', code: 'VI', stateId: '1', type: 'LGA' },
      ];

      (locationApi.getLGAsByState as jest.Mock).mockResolvedValue({
        success: true,
        data: mockLGAs,
      });

      const result = await locationApi.getLGAsByState('1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockLGAs);
      expect(locationApi.getLGAsByState).toHaveBeenCalledWith('1');
    });

    it('should filter LGAs by type', async () => {
      const mockLGAs = [
        { id: '1', name: 'Ikeja', code: 'IKE', stateId: '1', type: 'LGA' },
        { id: '2', name: 'Victoria Island', code: 'VI', stateId: '1', type: 'LCDA' },
      ];

      (locationApi.getLGAsByState as jest.Mock).mockResolvedValue({
        success: true,
        data: mockLGAs,
      });

      const result = await locationApi.getLGAsByState('1', 'LGA');

      expect(result.success).toBe(true);
      expect(locationApi.getLGAsByState).toHaveBeenCalledWith('1', 'LGA');
    });
  });

  describe('Wards API', () => {
    it('should fetch wards by LGA successfully', async () => {
      const mockWards = [
        { id: '1', name: 'Ward 1', code: 'W1', lgaId: '1' },
        { id: '2', name: 'Ward 2', code: 'W2', lgaId: '1' },
      ];

      (locationApi.getWardsByLGA as jest.Mock).mockResolvedValue({
        success: true,
        data: mockWards,
      });

      const result = await locationApi.getWardsByLGA('1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockWards);
      expect(locationApi.getWardsByLGA).toHaveBeenCalledWith('1');
    });
  });

  describe('Neighborhoods API', () => {
    it('should fetch neighborhoods by ward successfully', async () => {
      const mockNeighborhoods = [
        { id: '1', name: 'Victoria Island', type: 'AREA', wardId: '1' },
        { id: '2', name: 'Ikoyi', type: 'AREA', wardId: '1' },
      ];

      (locationApi.getNeighborhoodsByWard as jest.Mock).mockResolvedValue({
        success: true,
        data: mockNeighborhoods,
      });

      const result = await locationApi.getNeighborhoodsByWard('1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockNeighborhoods);
      expect(locationApi.getNeighborhoodsByWard).toHaveBeenCalledWith('1');
    });
  });

  describe('Landmarks API', () => {
    it('should fetch nearby landmarks successfully', async () => {
      const mockLandmarks = [
        { id: '1', name: 'Lagos Mall', type: 'SHOPPING', neighborhoodId: '1' },
        { id: '2', name: 'Central Park', type: 'PARK', neighborhoodId: '1' },
      ];

      (locationApi.getNearbyLandmarks as jest.Mock).mockResolvedValue({
        success: true,
        data: mockLandmarks,
      });

      const result = await locationApi.getNearbyLandmarks('1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockLandmarks);
      expect(locationApi.getNearbyLandmarks).toHaveBeenCalledWith('1');
    });
  });

  describe('User Locations API', () => {
    it('should fetch user locations successfully', async () => {
      const mockUserLocations = [
        { id: '1', userId: 'user1', neighborhoodId: '1', isPrimary: true },
        { id: '2', userId: 'user1', neighborhoodId: '2', isPrimary: false },
      ];

      (locationApi.getUserLocations as jest.Mock).mockResolvedValue({
        success: true,
        data: mockUserLocations,
      });

      const result = await locationApi.getUserLocations();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUserLocations);
      expect(locationApi.getUserLocations).toHaveBeenCalledTimes(1);
    });

    it('should create user location successfully', async () => {
      const mockLocationData = {
        stateId: '1',
        lgaId: '1',
        neighborhoodId: '1',
        isPrimary: true,
      };

      const mockCreatedLocation = {
        id: '1',
        userId: 'user1',
        ...mockLocationData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (locationApi.createUserLocation as jest.Mock).mockResolvedValue({
        success: true,
        data: mockCreatedLocation,
      });

      const result = await locationApi.createUserLocation(mockLocationData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCreatedLocation);
      expect(locationApi.createUserLocation).toHaveBeenCalledWith(mockLocationData);
    });

    it('should update user location successfully', async () => {
      const mockUpdates = { isPrimary: false };
      const mockUpdatedLocation = {
        id: '1',
        userId: 'user1',
        neighborhoodId: '1',
        isPrimary: false,
      };

      (locationApi.updateUserLocation as jest.Mock).mockResolvedValue({
        success: true,
        data: mockUpdatedLocation,
      });

      const result = await locationApi.updateUserLocation('1', mockUpdates);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUpdatedLocation);
      expect(locationApi.updateUserLocation).toHaveBeenCalledWith('1', mockUpdates);
    });

    it('should delete user location successfully', async () => {
      (locationApi.deleteUserLocation as jest.Mock).mockResolvedValue({
        success: true,
      });

      const result = await locationApi.deleteUserLocation('1');

      expect(result.success).toBe(true);
      expect(locationApi.deleteUserLocation).toHaveBeenCalledWith('1');
    });
  });
});

describe('Offline Location API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Offline States API', () => {
    it('should return cached data when offline', async () => {
      const mockCachedStates = [
        { id: '1', name: 'Lagos', code: 'LA' },
        { id: '2', name: 'Abuja', code: 'FCT' },
      ];

      (offlineLocationApi.getStates as jest.Mock).mockResolvedValue({
        success: true,
        data: mockCachedStates,
        message: 'Data loaded from cache',
      });

      const result = await offlineLocationApi.getStates();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCachedStates);
      expect(result.message).toBe('Data loaded from cache');
    });

    it('should return empty data when offline and no cache', async () => {
      (offlineLocationApi.getStates as jest.Mock).mockResolvedValue({
        success: false,
        data: [],
        message: 'No cached data available and offline',
      });

      const result = await offlineLocationApi.getStates();

      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
      expect(result.message).toBe('No cached data available and offline');
    });
  });

  describe('Offline User Locations API', () => {
    it('should queue operations when offline', async () => {
      const mockLocationData = {
        stateId: '1',
        lgaId: '1',
        neighborhoodId: '1',
        isPrimary: true,
      };

      (offlineLocationApi.createUserLocation as jest.Mock).mockResolvedValue({
        success: true,
        data: mockLocationData,
        message: 'Queued for sync when online',
      });

      const result = await offlineLocationApi.createUserLocation(mockLocationData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Queued for sync when online');
    });
  });

  describe('Cache Management', () => {
    it('should clear cache successfully', async () => {
      (offlineLocationApi.clearCache as jest.Mock).mockResolvedValue(undefined);

      await offlineLocationApi.clearCache();

      expect(offlineLocationApi.clearCache).toHaveBeenCalledTimes(1);
    });

    it('should get cache info successfully', async () => {
      const mockCacheInfo = {
        hasOfflineData: true,
        lastSyncTime: new Date(),
        queueLength: 2,
        cacheSize: 5,
      };

      (offlineLocationApi.getCacheInfo as jest.Mock).mockResolvedValue(mockCacheInfo);

      const result = await offlineLocationApi.getCacheInfo();

      expect(result).toEqual(mockCacheInfo);
    });
  });
});


