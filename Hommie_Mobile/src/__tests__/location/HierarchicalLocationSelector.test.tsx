// Hierarchical Location Selector Tests
// Test component behavior and user interactions

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import HierarchicalLocationSelector from '../../components/location/HierarchicalLocationSelector';
import { useLocation } from '../../contexts/LocationContext';

// Mock the LocationContext
jest.mock('../../contexts/LocationContext', () => ({
  useLocation: jest.fn(),
}));

// Mock the location API
jest.mock('../../services/api/locationApi', () => ({
  locationApi: {
    getStates: jest.fn(),
    getLGAsByState: jest.fn(),
    getWardsByLGA: jest.fn(),
    getNeighborhoodsByWard: jest.fn(),
  },
}));

const mockUseLocation = useLocation as jest.MockedFunction<typeof useLocation>;

describe('HierarchicalLocationSelector Tests', () => {
  const mockOnLocationSelected = jest.fn();
  const mockOnClose = jest.fn();

  const defaultMockLocation = {
    selectedState: null,
    selectedLGA: null,
    selectedWard: null,
    selectedNeighborhood: null,
    isLoadingLocation: false,
    locationError: null,
    setSelectedState: jest.fn(),
    setSelectedLGA: jest.fn(),
    setSelectedWard: jest.fn(),
    setSelectedNeighborhood: jest.fn(),
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
        <HierarchicalLocationSelector
          onLocationSelected={mockOnLocationSelected}
          onClose={mockOnClose}
        />
      );

      expect(getByText('Select Your Location')).toBeTruthy();
      expect(getByText('Choose your state to get started')).toBeTruthy();
    });

    it('should render close button', () => {
      const { getByTestId } = render(
        <HierarchicalLocationSelector
          onLocationSelected={mockOnLocationSelected}
          onClose={mockOnClose}
        />
      );

      const closeButton = getByTestId('close-button');
      expect(closeButton).toBeTruthy();
    });

    it('should call onClose when close button is pressed', () => {
      const { getByTestId } = render(
        <HierarchicalLocationSelector
          onLocationSelected={mockOnLocationSelected}
          onClose={mockOnClose}
        />
      );

      const closeButton = getByTestId('close-button');
      fireEvent.press(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('State Selection', () => {
    it('should display states when loaded', async () => {
      const mockStates = [
        { id: '1', name: 'Lagos', code: 'LA' },
        { id: '2', name: 'Abuja', code: 'FCT' },
      ];

      mockUseLocation.mockReturnValue({
        ...defaultMockLocation,
        selectedState: null,
        isLoadingLocation: false,
      });

      const { getByText } = render(
        <HierarchicalLocationSelector
          onLocationSelected={mockOnLocationSelected}
          onClose={mockOnClose}
        />
      );

      // Mock the API call
      const { locationApi } = require('../../services/api/locationApi');
      locationApi.getStates.mockResolvedValue({
        success: true,
        data: mockStates,
      });

      // Wait for states to load
      await waitFor(() => {
        expect(getByText('Lagos')).toBeTruthy();
        expect(getByText('Abuja')).toBeTruthy();
      });
    });

    it('should handle state selection', async () => {
      const mockStates = [
        { id: '1', name: 'Lagos', code: 'LA' },
        { id: '2', name: 'Abuja', code: 'FCT' },
      ];

      mockUseLocation.mockReturnValue({
        ...defaultMockLocation,
        selectedState: null,
        isLoadingLocation: false,
      });

      const { getByText } = render(
        <HierarchicalLocationSelector
          onLocationSelected={mockOnLocationSelected}
          onClose={mockOnClose}
        />
      );

      // Mock the API call
      const { locationApi } = require('../../services/api/locationApi');
      locationApi.getStates.mockResolvedValue({
        success: true,
        data: mockStates,
      });

      // Wait for states to load and select Lagos
      await waitFor(() => {
        const lagosButton = getByText('Lagos');
        fireEvent.press(lagosButton);
      });

      expect(defaultMockLocation.setSelectedState).toHaveBeenCalledWith(mockStates[0]);
    });
  });

  describe('LGA Selection', () => {
    it('should display LGAs when state is selected', async () => {
      const mockState = { id: '1', name: 'Lagos', code: 'LA' };
      const mockLGAs = [
        { id: '1', name: 'Ikeja', code: 'IKE', stateId: '1', type: 'LGA' },
        { id: '2', name: 'Victoria Island', code: 'VI', stateId: '1', type: 'LGA' },
      ];

      mockUseLocation.mockReturnValue({
        ...defaultMockLocation,
        selectedState: mockState,
        selectedLGA: null,
        isLoadingLocation: false,
      });

      const { getByText } = render(
        <HierarchicalLocationSelector
          onLocationSelected={mockOnLocationSelected}
          onClose={mockOnClose}
        />
      );

      // Mock the API call
      const { locationApi } = require('../../services/api/locationApi');
      locationApi.getLGAsByState.mockResolvedValue({
        success: true,
        data: mockLGAs,
      });

      // Wait for LGAs to load
      await waitFor(() => {
        expect(getByText('Ikeja')).toBeTruthy();
        expect(getByText('Victoria Island')).toBeTruthy();
      });
    });

    it('should handle LGA selection', async () => {
      const mockState = { id: '1', name: 'Lagos', code: 'LA' };
      const mockLGAs = [
        { id: '1', name: 'Ikeja', code: 'IKE', stateId: '1', type: 'LGA' },
        { id: '2', name: 'Victoria Island', code: 'VI', stateId: '1', type: 'LGA' },
      ];

      mockUseLocation.mockReturnValue({
        ...defaultMockLocation,
        selectedState: mockState,
        selectedLGA: null,
        isLoadingLocation: false,
      });

      const { getByText } = render(
        <HierarchicalLocationSelector
          onLocationSelected={mockOnLocationSelected}
          onClose={mockOnClose}
        />
      );

      // Mock the API call
      const { locationApi } = require('../../services/api/locationApi');
      locationApi.getLGAsByState.mockResolvedValue({
        success: true,
        data: mockLGAs,
      });

      // Wait for LGAs to load and select Ikeja
      await waitFor(() => {
        const ikejaButton = getByText('Ikeja');
        fireEvent.press(ikejaButton);
      });

      expect(defaultMockLocation.setSelectedLGA).toHaveBeenCalledWith(mockLGAs[0]);
    });
  });

  describe('Ward Selection', () => {
    it('should display wards when LGA is selected', async () => {
      const mockState = { id: '1', name: 'Lagos', code: 'LA' };
      const mockLGA = { id: '1', name: 'Ikeja', code: 'IKE', stateId: '1', type: 'LGA' };
      const mockWards = [
        { id: '1', name: 'Ward 1', code: 'W1', lgaId: '1' },
        { id: '2', name: 'Ward 2', code: 'W2', lgaId: '1' },
      ];

      mockUseLocation.mockReturnValue({
        ...defaultMockLocation,
        selectedState: mockState,
        selectedLGA: mockLGA,
        selectedWard: null,
        isLoadingLocation: false,
      });

      const { getByText } = render(
        <HierarchicalLocationSelector
          onLocationSelected={mockOnLocationSelected}
          onClose={mockOnClose}
        />
      );

      // Mock the API call
      const { locationApi } = require('../../services/api/locationApi');
      locationApi.getWardsByLGA.mockResolvedValue({
        success: true,
        data: mockWards,
      });

      // Wait for wards to load
      await waitFor(() => {
        expect(getByText('Ward 1')).toBeTruthy();
        expect(getByText('Ward 2')).toBeTruthy();
      });
    });
  });

  describe('Neighborhood Selection', () => {
    it('should display neighborhoods when ward is selected', async () => {
      const mockState = { id: '1', name: 'Lagos', code: 'LA' };
      const mockLGA = { id: '1', name: 'Ikeja', code: 'IKE', stateId: '1', type: 'LGA' };
      const mockWard = { id: '1', name: 'Ward 1', code: 'W1', lgaId: '1' };
      const mockNeighborhoods = [
        { id: '1', name: 'Victoria Island', type: 'AREA', wardId: '1' },
        { id: '2', name: 'Ikoyi', type: 'AREA', wardId: '1' },
      ];

      mockUseLocation.mockReturnValue({
        ...defaultMockLocation,
        selectedState: mockState,
        selectedLGA: mockLGA,
        selectedWard: mockWard,
        selectedNeighborhood: null,
        isLoadingLocation: false,
      });

      const { getByText } = render(
        <HierarchicalLocationSelector
          onLocationSelected={mockOnLocationSelected}
          onClose={mockOnClose}
        />
      );

      // Mock the API call
      const { locationApi } = require('../../services/api/locationApi');
      locationApi.getNeighborhoodsByWard.mockResolvedValue({
        success: true,
        data: mockNeighborhoods,
      });

      // Wait for neighborhoods to load
      await waitFor(() => {
        expect(getByText('Victoria Island')).toBeTruthy();
        expect(getByText('Ikoyi')).toBeTruthy();
      });
    });

    it('should call onLocationSelected when neighborhood is selected', async () => {
      const mockState = { id: '1', name: 'Lagos', code: 'LA' };
      const mockLGA = { id: '1', name: 'Ikeja', code: 'IKE', stateId: '1', type: 'LGA' };
      const mockWard = { id: '1', name: 'Ward 1', code: 'W1', lgaId: '1' };
      const mockNeighborhood = { id: '1', name: 'Victoria Island', type: 'AREA', wardId: '1' };

      mockUseLocation.mockReturnValue({
        ...defaultMockLocation,
        selectedState: mockState,
        selectedLGA: mockLGA,
        selectedWard: mockWard,
        selectedNeighborhood: null,
        isLoadingLocation: false,
      });

      const { getByText } = render(
        <HierarchicalLocationSelector
          onLocationSelected={mockOnLocationSelected}
          onClose={mockOnClose}
        />
      );

      // Mock the API call
      const { locationApi } = require('../../services/api/locationApi');
      locationApi.getNeighborhoodsByWard.mockResolvedValue({
        success: true,
        data: [mockNeighborhood],
      });

      // Wait for neighborhoods to load and select one
      await waitFor(() => {
        const neighborhoodButton = getByText('Victoria Island');
        fireEvent.press(neighborhoodButton);
      });

      expect(mockOnLocationSelected).toHaveBeenCalledWith({
        state: mockState,
        lga: mockLGA,
        ward: mockWard,
        neighborhood: mockNeighborhood,
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator when loading', () => {
      mockUseLocation.mockReturnValue({
        ...defaultMockLocation,
        isLoadingLocation: true,
      });

      const { getByTestId } = render(
        <HierarchicalLocationSelector
          onLocationSelected={mockOnLocationSelected}
          onClose={mockOnClose}
        />
      );

      expect(getByTestId('loading-indicator')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when there is an error', () => {
      mockUseLocation.mockReturnValue({
        ...defaultMockLocation,
        locationError: 'Failed to load locations',
      });

      const { getByText } = render(
        <HierarchicalLocationSelector
          onLocationSelected={mockOnLocationSelected}
          onClose={mockOnClose}
        />
      );

      expect(getByText('Failed to load locations')).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should allow going back to previous step', async () => {
      const mockState = { id: '1', name: 'Lagos', code: 'LA' };
      const mockLGA = { id: '1', name: 'Ikeja', code: 'IKE', stateId: '1', type: 'LGA' };

      mockUseLocation.mockReturnValue({
        ...defaultMockLocation,
        selectedState: mockState,
        selectedLGA: mockLGA,
        selectedWard: null,
        isLoadingLocation: false,
      });

      const { getByTestId } = render(
        <HierarchicalLocationSelector
          onLocationSelected={mockOnLocationSelected}
          onClose={mockOnClose}
        />
      );

      const backButton = getByTestId('back-button');
      fireEvent.press(backButton);

      expect(defaultMockLocation.setSelectedLGA).toHaveBeenCalledWith(null);
    });
  });
});









