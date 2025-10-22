// GPS Location Picker Tests
// Test GPS functionality and location selection

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import GPSLocationPicker from '../../components/location/GPSLocationPicker';
import { useLocation } from '../../contexts/LocationContext';
import { locationPermissions } from '../../utils/permissions';

// Mock the LocationContext
jest.mock('../../contexts/LocationContext', () => ({
  useLocation: jest.fn(),
}));

// Mock the permissions utility
jest.mock('../../utils/permissions', () => ({
  locationPermissions: {
    requestPermissionWithHandling: jest.fn(),
    checkPermissionWithFallback: jest.fn(),
  },
}));

// Mock expo-location
jest.mock('expo-location', () => ({
  getCurrentPositionAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  getForegroundPermissionsAsync: jest.fn(),
}));

// Mock the location API
jest.mock('../../services/api/locationApi', () => ({
  locationApi: {
    getRecommendations: jest.fn(),
  },
}));

const mockUseLocation = useLocation as jest.MockedFunction<typeof useLocation>;
const mockLocationPermissions = locationPermissions as jest.Mocked<typeof locationPermissions>;

describe('GPSLocationPicker Tests', () => {
  const mockOnLocationSelected = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultMockLocation = {
    selectedState: null,
    selectedLGA: null,
    selectedWard: null,
    selectedNeighborhood: null,
    currentCoordinates: null,
    recommendedNeighborhoods: [],
    isLoadingLocation: false,
    locationError: null,
    userLocations: [],
    primaryLocation: null,
    setSelectedState: jest.fn(),
    setSelectedLGA: jest.fn(),
    setSelectedWard: jest.fn(),
    setSelectedNeighborhood: jest.fn(),
    setCurrentCoordinates: jest.fn(),
    setRecommendedNeighborhoods: jest.fn(),
    setLoadingLocation: jest.fn(),
    setLocationError: jest.fn(),
    getUserLocations: jest.fn(),
    setPrimaryLocation: jest.fn(),
    addUserLocation: jest.fn(),
    updateUserLocation: jest.fn(),
    deleteUserLocation: jest.fn(),
    getCurrentLocation: jest.fn(),
    getRecommendations: jest.fn(),
    saveUserLocation: jest.fn(),
    clearLocationSelection: jest.fn(),
    syncOfflineData: jest.fn(),
    getOfflineStatus: jest.fn(),
    clearOfflineCache: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocation.mockReturnValue(defaultMockLocation);
  });

  describe('Component Rendering', () => {
    it('should render with default state', () => {
      const { getByText } = render(
        <GPSLocationPicker
          onLocationSelected={mockOnLocationSelected}
          onCancel={mockOnCancel}
        />
      );

      expect(getByText('Use GPS Location')).toBeTruthy();
      expect(getByText('Tap to get your current location')).toBeTruthy();
    });

    it('should render cancel button', () => {
      const { getByTestId } = render(
        <GPSLocationPicker
          onLocationSelected={mockOnLocationSelected}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = getByTestId('cancel-button');
      expect(cancelButton).toBeTruthy();
    });

    it('should call onCancel when cancel button is pressed', () => {
      const { getByTestId } = render(
        <GPSLocationPicker
          onLocationSelected={mockOnLocationSelected}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = getByTestId('cancel-button');
      fireEvent.press(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('GPS Location Detection', () => {
    it('should request location permission before getting location', async () => {
      mockLocationPermissions.requestPermissionWithHandling.mockResolvedValue({
        success: true,
        hasPermission: true,
        fallbackRequired: false,
        message: 'Permission granted',
      });

      const { getByTestId } = render(
        <GPSLocationPicker
          onLocationSelected={mockOnLocationSelected}
          onCancel={mockOnCancel}
        />
      );

      const gpsButton = getByTestId('gps-button');
      fireEvent.press(gpsButton);

      await waitFor(() => {
        expect(mockLocationPermissions.requestPermissionWithHandling).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle permission denied gracefully', async () => {
      mockLocationPermissions.requestPermissionWithHandling.mockResolvedValue({
        success: false,
        hasPermission: false,
        fallbackRequired: true,
        message: 'Permission denied',
      });

      const { getByText } = render(
        <GPSLocationPicker
          onLocationSelected={mockOnLocationSelected}
          onCancel={mockOnCancel}
        />
      );

      const gpsButton = getByText('Use GPS Location');
      fireEvent.press(gpsButton);

      await waitFor(() => {
        expect(mockLocationPermissions.requestPermissionWithHandling).toHaveBeenCalledTimes(1);
      });
    });

    it('should get current location when permission is granted', async () => {
      const mockCoordinates = { latitude: 6.5244, longitude: 3.3792 };
      const mockPosition = {
        coords: {
          latitude: mockCoordinates.latitude,
          longitude: mockCoordinates.longitude,
          accuracy: 10,
        },
      };

      mockLocationPermissions.requestPermissionWithHandling.mockResolvedValue({
        success: true,
        hasPermission: true,
        fallbackRequired: false,
        message: 'Permission granted',
      });

      const { getCurrentPositionAsync } = require('expo-location');
      getCurrentPositionAsync.mockResolvedValue(mockPosition);

      const { getByTestId } = render(
        <GPSLocationPicker
          onLocationSelected={mockOnLocationSelected}
          onCancel={mockOnCancel}
        />
      );

      const gpsButton = getByTestId('gps-button');
      fireEvent.press(gpsButton);

      await waitFor(() => {
        expect(getCurrentPositionAsync).toHaveBeenCalledTimes(1);
        expect(defaultMockLocation.setCurrentCoordinates).toHaveBeenCalledWith(mockCoordinates);
      });
    });

    it('should handle location detection error', async () => {
      mockLocationPermissions.requestPermissionWithHandling.mockResolvedValue({
        success: true,
        hasPermission: true,
        fallbackRequired: false,
        message: 'Permission granted',
      });

      const { getCurrentPositionAsync } = require('expo-location');
      getCurrentPositionAsync.mockRejectedValue(new Error('Location detection failed'));

      const { getByTestId } = render(
        <GPSLocationPicker
          onLocationSelected={mockOnLocationSelected}
          onCancel={mockOnCancel}
        />
      );

      const gpsButton = getByTestId('gps-button');
      fireEvent.press(gpsButton);

      await waitFor(() => {
        expect(getCurrentPositionAsync).toHaveBeenCalledTimes(1);
        expect(defaultMockLocation.setLocationError).toHaveBeenCalledWith('Failed to get current location');
      });
    });
  });

  describe('Location Recommendations', () => {
    it('should get recommendations when location is detected', async () => {
      const mockCoordinates = { latitude: 6.5244, longitude: 3.3792 };
      const mockRecommendations = [
        { id: '1', name: 'Victoria Island', type: 'AREA', wardId: '1' },
        { id: '2', name: 'Ikoyi', type: 'AREA', wardId: '1' },
      ];

      mockLocationPermissions.requestPermissionWithHandling.mockResolvedValue({
        success: true,
        hasPermission: true,
        fallbackRequired: false,
        message: 'Permission granted',
      });

      const { getCurrentPositionAsync } = require('expo-location');
      getCurrentPositionAsync.mockResolvedValue({
        coords: {
          latitude: mockCoordinates.latitude,
          longitude: mockCoordinates.longitude,
          accuracy: 10,
        },
      });

      const { locationApi } = require('../../services/api/locationApi');
      locationApi.getRecommendations.mockResolvedValue({
        success: true,
        data: mockRecommendations,
      });

      const { getByTestId } = render(
        <GPSLocationPicker
          onLocationSelected={mockOnLocationSelected}
          onCancel={mockOnCancel}
        />
      );

      const gpsButton = getByTestId('gps-button');
      fireEvent.press(gpsButton);

      await waitFor(() => {
        expect(locationApi.getRecommendations).toHaveBeenCalledWith(
          mockCoordinates.latitude,
          mockCoordinates.longitude
        );
        expect(defaultMockLocation.setRecommendedNeighborhoods).toHaveBeenCalledWith(mockRecommendations);
      });
    });

    it('should handle recommendation loading error', async () => {
      const mockCoordinates = { latitude: 6.5244, longitude: 3.3792 };

      mockLocationPermissions.requestPermissionWithHandling.mockResolvedValue({
        success: true,
        hasPermission: true,
        fallbackRequired: false,
        message: 'Permission granted',
      });

      const { getCurrentPositionAsync } = require('expo-location');
      getCurrentPositionAsync.mockResolvedValue({
        coords: {
          latitude: mockCoordinates.latitude,
          longitude: mockCoordinates.longitude,
          accuracy: 10,
        },
      });

      const { locationApi } = require('../../services/api/locationApi');
      locationApi.getRecommendations.mockRejectedValue(new Error('API Error'));

      const { getByTestId } = render(
        <GPSLocationPicker
          onLocationSelected={mockOnLocationSelected}
          onCancel={mockOnCancel}
        />
      );

      const gpsButton = getByTestId('gps-button');
      fireEvent.press(gpsButton);

      await waitFor(() => {
        expect(locationApi.getRecommendations).toHaveBeenCalledTimes(1);
        expect(defaultMockLocation.setLocationError).toHaveBeenCalledWith('Failed to get recommendations');
      });
    });
  });

  describe('Neighborhood Selection', () => {
    it('should display recommended neighborhoods', async () => {
      const mockRecommendations = [
        { id: '1', name: 'Victoria Island', type: 'AREA', wardId: '1' },
        { id: '2', name: 'Ikoyi', type: 'AREA', wardId: '1' },
      ];

      mockUseLocation.mockReturnValue({
        ...defaultMockLocation,
        recommendedNeighborhoods: mockRecommendations,
        currentCoordinates: { latitude: 6.5244, longitude: 3.3792 },
      });

      const { getByText } = render(
        <GPSLocationPicker
          onLocationSelected={mockOnLocationSelected}
          onCancel={mockOnCancel}
        />
      );

      expect(getByText('Victoria Island')).toBeTruthy();
      expect(getByText('Ikoyi')).toBeTruthy();
    });

    it('should call onLocationSelected when neighborhood is selected', async () => {
      const mockRecommendations = [
        { id: '1', name: 'Victoria Island', type: 'AREA', wardId: '1' },
      ];

      mockUseLocation.mockReturnValue({
        ...defaultMockLocation,
        recommendedNeighborhoods: mockRecommendations,
        currentCoordinates: { latitude: 6.5244, longitude: 3.3792 },
      });

      const { getByText } = render(
        <GPSLocationPicker
          onLocationSelected={mockOnLocationSelected}
          onCancel={mockOnCancel}
        />
      );

      const neighborhoodButton = getByText('Victoria Island');
      fireEvent.press(neighborhoodButton);

      expect(mockOnLocationSelected).toHaveBeenCalledWith({
        coordinates: { latitude: 6.5244, longitude: 3.3792 },
        neighborhood: mockRecommendations[0],
      });
    });
  });

  describe('Manual Location Entry', () => {
    it('should show manual entry option when allowManualInput is true', () => {
      const { getByText } = render(
        <GPSLocationPicker
          onLocationSelected={mockOnLocationSelected}
          onCancel={mockOnCancel}
          allowManualInput={true}
        />
      );

      expect(getByText('Enter Manually')).toBeTruthy();
    });

    it('should not show manual entry option when allowManualInput is false', () => {
      const { queryByText } = render(
        <GPSLocationPicker
          onLocationSelected={mockOnLocationSelected}
          onCancel={mockOnCancel}
          allowManualInput={false}
        />
      );

      expect(queryByText('Enter Manually')).toBeNull();
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator when loading', () => {
      mockUseLocation.mockReturnValue({
        ...defaultMockLocation,
        isLoadingLocation: true,
      });

      const { getByTestId } = render(
        <GPSLocationPicker
          onLocationSelected={mockOnLocationSelected}
          onCancel={mockOnCancel}
        />
      );

      expect(getByTestId('loading-indicator')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when there is an error', () => {
      mockUseLocation.mockReturnValue({
        ...defaultMockLocation,
        locationError: 'GPS not available',
      });

      const { getByText } = render(
        <GPSLocationPicker
          onLocationSelected={mockOnLocationSelected}
          onCancel={mockOnCancel}
        />
      );

      expect(getByText('GPS not available')).toBeTruthy();
    });

    it('should show retry button when there is an error', () => {
      mockUseLocation.mockReturnValue({
        ...defaultMockLocation,
        locationError: 'GPS not available',
      });

      const { getByText } = render(
        <GPSLocationPicker
          onLocationSelected={mockOnLocationSelected}
          onCancel={mockOnCancel}
        />
      );

      expect(getByText('Try Again')).toBeTruthy();
    });
  });

  describe('Map Integration', () => {
    it('should show map when showMap is true', () => {
      const { getByTestId } = render(
        <GPSLocationPicker
          onLocationSelected={mockOnLocationSelected}
          onCancel={mockOnCancel}
          showMap={true}
        />
      );

      expect(getByTestId('map-view')).toBeTruthy();
    });

    it('should not show map when showMap is false', () => {
      const { queryByTestId } = render(
        <GPSLocationPicker
          onLocationSelected={mockOnLocationSelected}
          onCancel={mockOnCancel}
          showMap={false}
        />
      );

      expect(queryByTestId('map-view')).toBeNull();
    });
  });
});








