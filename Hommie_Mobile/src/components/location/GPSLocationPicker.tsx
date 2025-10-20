// GPS Location Picker Component
// Map-based location selection with GPS and landmarks

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocation } from '../../contexts/LocationContext';
import { locationApi } from '../../services/api/locationApi';
import {
  Neighborhood,
  Landmark,
  GPSLocationPickerProps,
  LocationPermissionStatus,
  LocationError,
  LocationErrorCode,
} from '../../types/location.types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MapMarker {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title: string;
  type: 'neighborhood' | 'landmark';
  data: Neighborhood | Landmark;
}

export const GPSLocationPicker: React.FC<GPSLocationPickerProps> = ({
  onLocationSelected,
  initialCoordinates,
  showMap = true,
  allowManualInput = true,
  onCancel,
}) => {
  // Context
  const {
    currentCoordinates,
    recommendedNeighborhoods,
    isLoadingLocation,
    locationError,
    getCurrentLocation,
    getRecommendations,
  } = useLocation();

  // Local state
  const [region, setRegion] = useState<Region>({
    latitude: initialCoordinates?.latitude || 6.5244, // Lagos coordinates as default
    longitude: initialCoordinates?.longitude || 3.3792,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [selectedCoordinate, setSelectedCoordinate] = useState<{
    latitude: number;
    longitude: number;
  } | null>(initialCoordinates || null);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus>({
    granted: false,
    canAskAgain: true,
    status: 'undetermined',
  });
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [isLoadingLandmarks, setIsLoadingLandmarks] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood | null>(null);

  // Refs
  const mapRef = useRef<MapView>(null);
  const manualInputRef = useRef<TextInput>(null);

  // Initialize component
  useEffect(() => {
    console.log('📍 GPSLocationPicker: Component mounted');
    initializeComponent();
  }, []);

  // Load recommendations when coordinates change
  useEffect(() => {
    if (selectedCoordinate) {
      loadRecommendations();
      loadLandmarks();
    }
  }, [selectedCoordinate]);

  const initializeComponent = async () => {
    try {
      console.log('📍 GPSLocationPicker: Initializing component...');
      console.log('📍 Initial coordinates:', initialCoordinates);

      // Check location permissions
      await checkLocationPermissions();

      // If we have initial coordinates, use them
      if (initialCoordinates) {
        console.log('📍 Using initial coordinates');
        setSelectedCoordinate(initialCoordinates);
        setRegion({
          ...initialCoordinates,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } else if (permissionStatus.granted) {
        console.log('📍 Permission granted, getting current location');
        // Try to get current location
        await getCurrentLocationFromGPS();
      } else {
        console.log('📍 No initial coordinates and permission not granted');
      }
    } catch (error) {
      console.error('❌ Error initializing GPS location picker:', error);
    }
  };

  const checkLocationPermissions = async () => {
    try {
      console.log('📍 Checking location permissions...');
      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
      console.log('📍 Permission status:', status, 'canAskAgain:', canAskAgain);

      setPermissionStatus({
        granted: status === 'granted',
        canAskAgain,
        status: status as 'granted' | 'denied' | 'restricted' | 'undetermined',
      });

      if (status === 'denied' && !canAskAgain) {
        console.log('⚠️ Location permission permanently denied');
        Alert.alert(
          'Location Permission Required',
          'Location access is required to show your current location and nearby neighborhoods. Please enable location access in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Location.openSettingsAsync() },
          ]
        );
      }
    } catch (error) {
      console.error('❌ Error checking location permissions:', error);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      setPermissionStatus({
        granted: status === 'granted',
        canAskAgain: true,
        status: status as 'granted' | 'denied' | 'restricted' | 'undetermined',
      });

      if (status === 'granted') {
        await getCurrentLocationFromGPS();
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocationFromGPS = async () => {
    try {
      setIsLoadingRecommendations(true);
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setSelectedCoordinate(coordinates);
      setRegion({
        ...coordinates,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      // Center map on current location
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          ...coordinates,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }

      // Haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please try again or use manual input.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const loadRecommendations = async () => {
    console.log('📍 GPSLocationPicker.loadRecommendations called');
    console.log('📍 selectedCoordinate:', selectedCoordinate);

    if (!selectedCoordinate) {
      console.log('📍 No selected coordinate, skipping recommendations');
      return;
    }

    try {
      setIsLoadingRecommendations(true);
      console.log('📍 GPSLocationPicker: Loading neighborhood recommendations...');

      const response = await locationApi.recommendNeighborhoods({
        latitude: selectedCoordinate.latitude,
        longitude: selectedCoordinate.longitude,
        radius: 2000, // 2km radius
        limit: 10,
      });

      console.log('📍 GPSLocationPicker: Recommendations loaded:', response.recommendations?.length || 0);
      console.log('📍 GPSLocationPicker: Full response:', JSON.stringify(response, null, 2));

      // Create markers for neighborhoods
      const neighborhoodMarkers: MapMarker[] = (response.recommendations || []).map((rec, index) => ({
        id: `neighborhood-${rec.neighborhood.id}`,
        coordinate: {
          latitude: rec.neighborhood.centerLatitude ? parseFloat(rec.neighborhood.centerLatitude) : selectedCoordinate.latitude + (index * 0.001),
          longitude: rec.neighborhood.centerLongitude ? parseFloat(rec.neighborhood.centerLongitude) : selectedCoordinate.longitude + (index * 0.001),
        },
        title: rec.neighborhood.name,
        type: 'neighborhood',
        data: rec.neighborhood,
      }));

      console.log('📍 GPSLocationPicker: Created markers:', neighborhoodMarkers.length);
      setMarkers(neighborhoodMarkers);
      console.log('📍 GPSLocationPicker: Clearing loading state');
    } catch (error) {
      console.error('❌ GPSLocationPicker: Error loading recommendations:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    } finally {
      setIsLoadingRecommendations(false);
      console.log('📍 GPSLocationPicker: Loading state cleared');
    }
  };

  const loadLandmarks = async () => {
    if (!selectedCoordinate) return;

    try {
      setIsLoadingLandmarks(true);
      
      // Find the nearest neighborhood to get landmarks
      const response = await locationApi.recommendNeighborhoods({
        latitude: selectedCoordinate.latitude,
        longitude: selectedCoordinate.longitude,
        radius: 1000, // 1km radius
        limit: 1,
      });

      if (response.recommendations?.length > 0) {
        const nearestNeighborhood = response.recommendations[0].neighborhood;
        const landmarks = await locationApi.getNearbyLandmarks(nearestNeighborhood.id);
        setLandmarks(landmarks);

        // Create markers for landmarks
        const landmarkMarkers: MapMarker[] = landmarks.slice(0, 5).map(landmark => ({
          id: `landmark-${landmark.id}`,
          coordinate: {
            latitude: landmark.location.latitude,
            longitude: landmark.location.longitude,
          },
          title: landmark.name,
          type: 'landmark',
          data: landmark,
        }));

        setMarkers(prev => [...prev, ...landmarkMarkers]);
      }
    } catch (error) {
      console.error('Error loading landmarks:', error);
    } finally {
      setIsLoadingLandmarks(false);
    }
  };

  const handleMapPress = (event: any) => {
    const coordinate = event.nativeEvent.coordinate;
    setSelectedCoordinate(coordinate);
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleMarkerPress = (marker: MapMarker) => {
    if (marker.type === 'neighborhood') {
      setSelectedNeighborhood(marker.data as Neighborhood);
      
      // Haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  };

  const handleUseMyLocation = () => {
    if (permissionStatus.granted) {
      getCurrentLocationFromGPS();
    } else {
      requestLocationPermission();
    }
  };

  const handleManualAddressSubmit = async () => {
    if (!manualAddress.trim()) return;

    try {
      setIsLoadingRecommendations(true);
      
      // This would typically use a geocoding service
      // For now, we'll show an alert
      Alert.alert(
        'Manual Address',
        'Manual address input will be implemented with geocoding service integration.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error processing manual address:', error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const handleLocationSelect = () => {
    if (selectedNeighborhood && selectedCoordinate) {
      onLocationSelected({
        coordinates: selectedCoordinate,
        neighborhood: selectedNeighborhood,
        address: manualAddress || undefined,
      });
    } else if (selectedCoordinate) {
      onLocationSelected({
        coordinates: selectedCoordinate,
        address: manualAddress || undefined,
      });
    }
  };

  const renderPermissionDeniedUI = () => (
    <View style={styles.permissionDeniedContainer}>
      <Ionicons name="location-outline" size={64} color="#8E8E93" />
      <Text style={styles.permissionDeniedTitle}>Location Access Required</Text>
      <Text style={styles.permissionDeniedDescription}>
        To show your current location and nearby neighborhoods, please enable location access.
      </Text>
      <TouchableOpacity
        style={styles.permissionButton}
        onPress={requestLocationPermission}
        accessibilityLabel="Request location permission"
        accessibilityRole="button"
      >
        <Text style={styles.permissionButtonText}>Enable Location</Text>
      </TouchableOpacity>
      {allowManualInput && (
        <TouchableOpacity
          style={styles.manualInputButton}
          onPress={() => setShowManualInput(true)}
          accessibilityLabel="Enter address manually"
          accessibilityRole="button"
        >
          <Text style={styles.manualInputButtonText}>Enter Address Manually</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderMap = () => {
    console.log('📍 Rendering map with region:', region);
    console.log('📍 Permission granted:', permissionStatus.granted);
    console.log('📍 Selected coordinate:', selectedCoordinate);

    return (
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={region}
          onPress={handleMapPress}
          showsUserLocation={permissionStatus.granted}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
          mapType="standard"
          onMapReady={() => console.log('📍 Map is ready')}
          onError={(error) => console.error('❌ Map error:', error)}
        >
        {/* User location marker */}
        {selectedCoordinate && (
          <Marker
            coordinate={selectedCoordinate}
            title="Selected Location"
            description="Tap to select this location"
            pinColor="#007AFF"
          />
        )}

        {/* Neighborhood markers */}
        {markers
          .filter(marker => marker.type === 'neighborhood')
          .map(marker => (
            <Marker
              key={marker.id}
              coordinate={marker.coordinate}
              title={marker.title}
              description={`${(marker.data as Neighborhood).type} • ${(marker.data as Neighborhood).isGated ? 'Gated' : 'Open'}`}
              onPress={() => handleMarkerPress(marker)}
              pinColor="#34C759"
            />
          ))}

        {/* Landmark markers */}
        {markers
          .filter(marker => marker.type === 'landmark')
          .map(marker => (
            <Marker
              key={marker.id}
              coordinate={marker.coordinate}
              title={marker.title}
              description={(marker.data as Landmark).type}
              onPress={() => handleMarkerPress(marker)}
              pinColor="#FF9500"
            />
          ))}
      </MapView>

      {/* Map controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity
          style={styles.mapControlButton}
          onPress={handleUseMyLocation}
          accessibilityLabel="Use my current location"
          accessibilityRole="button"
        >
          <Ionicons name="locate" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </View>
    );
  };

  const renderRecommendations = () => {
    console.log('📍 renderRecommendations called');
    console.log('📍 isLoadingRecommendations:', isLoadingRecommendations);
    console.log('📍 markers length:', markers.length);
    console.log('📍 markers:', markers);

    if (isLoadingRecommendations) {
      console.log('📍 Showing loading indicator');
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Finding nearby neighborhoods...</Text>
        </View>
      );
    }

    // Use markers instead of recommendedNeighborhoods from context
    const neighborhoodMarkers = markers.filter(m => m.type === 'neighborhood');
    console.log('📍 neighborhoodMarkers:', neighborhoodMarkers.length);

    if (neighborhoodMarkers.length === 0) {
      console.log('📍 No neighborhoods to show');
      return null;
    }

    return (
      <View style={styles.recommendationsContainer}>
        <Text style={styles.recommendationsTitle}>Nearby Neighborhoods</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {neighborhoodMarkers.slice(0, 5).map((marker) => {
            const neighborhood = marker.data as Neighborhood;
            return (
              <TouchableOpacity
                key={marker.id}
                style={[
                  styles.recommendationCard,
                  selectedNeighborhood?.id === neighborhood.id && styles.selectedRecommendationCard,
                ]}
                onPress={() => setSelectedNeighborhood(neighborhood)}
                accessibilityLabel={`Select ${neighborhood.name} neighborhood`}
                accessibilityRole="button"
              >
                <Text style={styles.recommendationName}>{neighborhood.name}</Text>
                <Text style={styles.recommendationType}>{neighborhood.type}</Text>
                {neighborhood.isGated && (
                  <Ionicons name="lock-closed" size={12} color="#FF3B30" />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderManualInputModal = () => (
    <Modal
      visible={showManualInput}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer} edges={['top', 'left', 'right']}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setShowManualInput(false)}
            accessibilityLabel="Close manual input"
            accessibilityRole="button"
          >
            <Text style={styles.modalButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Enter Address</Text>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={handleManualAddressSubmit}
            accessibilityLabel="Submit address"
            accessibilityRole="button"
          >
            <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>Done</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.modalContent}>
          <Text style={styles.inputLabel}>Enter your address</Text>
          <TextInput
            ref={manualInputRef}
            style={styles.addressInput}
            placeholder="e.g., 123 Victoria Island, Lagos"
            value={manualAddress}
            onChangeText={setManualAddress}
            multiline
            returnKeyType="done"
            onSubmitEditing={handleManualAddressSubmit}
            accessibilityLabel="Enter your address"
          />
        </View>
      </SafeAreaView>
    </Modal>
  );

  // Always show the full UI with header and controls
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={onCancel}
          accessibilityLabel="Cancel location selection"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={24} color="#007AFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Select Location</Text>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleLocationSelect}
          disabled={!selectedCoordinate}
          accessibilityLabel="Confirm location selection"
          accessibilityRole="button"
        >
          <Text style={[styles.confirmText, !selectedCoordinate && styles.confirmTextDisabled]}>
            Done
          </Text>
        </TouchableOpacity>
      </View>

      {/* Show permission UI if not granted, otherwise show map */}
      {!permissionStatus.granted && !showManualInput ? (
        renderPermissionDeniedUI()
      ) : (
        <>
          {showMap && renderMap()}
          {renderRecommendations()}
        </>
      )}

      {renderManualInputModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  confirmText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '600',
  },
  confirmTextDisabled: {
    color: '#8E8E93',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  mapControlButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  permissionDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  permissionDeniedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionDeniedDescription: {
    fontSize: 17,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  permissionButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: 'white',
  },
  manualInputButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  manualInputButtonText: {
    fontSize: 17,
    color: '#007AFF',
  },
  recommendationsContainer: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  recommendationsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  recommendationCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginLeft: 16,
    width: 140,
    alignItems: 'center',
  },
  selectedRecommendationCard: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  recommendationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 4,
  },
  recommendationType: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 17,
    color: '#8E8E93',
  },
  modalButtonTextPrimary: {
    color: '#007AFF',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  addressInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 17,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    minHeight: 100,
    textAlignVertical: 'top',
  },
});

export default GPSLocationPicker;
