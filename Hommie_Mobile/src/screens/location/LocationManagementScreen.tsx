// Location Management Screen
// Profile screen for managing user locations

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
  Dimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import { HierarchicalLocationSelector, GPSLocationPicker } from '../components/location';
import { locationApi } from '../services/api/locationApi';
import {
  State,
  LGA,
  Ward,
  Neighborhood,
  Landmark,
  UserLocation,
} from '../types/location.types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// MeCabal brand colors
const MECABAL_GREEN = '#00A651';
const MECABAL_GREEN_LIGHT = '#E8F5E8';

interface LocationManagementScreenProps {
  navigation: any;
}

export default function LocationManagementScreen({ navigation }: LocationManagementScreenProps) {
  // Context
  const { user, updateUserLocation, getCurrentLocation, isLocationVerified } = useAuth();
  const {
    userLocations,
    primaryUserLocation,
    saveUserLocation,
  } = useLocation();

  // Local state
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [showGPSPicker, setShowGPSPicker] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [isLoadingLandmarks, setIsLoadingLandmarks] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<UserLocation | null>(null);

  // Initialize component
  useEffect(() => {
    // User locations will be loaded from context
  }, []);

  // Load landmarks when primary location changes
  useEffect(() => {
    if (primaryUserLocation?.neighborhoodId) {
      loadLandmarks();
    }
  }, [primaryUserLocation?.neighborhoodId]);

  const loadLandmarks = async () => {
    if (!primaryUserLocation?.neighborhoodId) return;

    try {
      setIsLoadingLandmarks(true);
      const nearbyLandmarks = await locationApi.getNearbyLandmarks(primaryUserLocation.neighborhoodId);
      setLandmarks(nearbyLandmarks.slice(0, 10)); // Limit to 10 landmarks
    } catch (error) {
      console.error('Error loading landmarks:', error);
    } finally {
      setIsLoadingLandmarks(false);
    }
  };

  const handleAddLocation = () => {
    Alert.alert(
      'Add Location',
      'How would you like to add a new location?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Use GPS', onPress: () => setShowGPSPicker(true) },
        { text: 'Select Manually', onPress: () => setShowLocationSelector(true) },
      ]
    );
  };

  const handleLocationSelected = async (location: {
    state: State;
    lga: LGA;
    ward?: Ward;
    neighborhood: Neighborhood;
    coordinates?: LocationCoordinates;
  }) => {
    try {
      const locationData = {
        state: {
          id: location.state.id,
          name: location.state.name,
          code: location.state.code,
        },
        lga: {
          id: location.lga.id,
          name: location.lga.name,
          code: location.lga.code,
          type: location.lga.type as 'LGA' | 'LCDA',
        },
        ward: location.ward ? {
          id: location.ward.id,
          name: location.ward.name,
          code: location.ward.code,
        } : undefined,
        neighborhood: {
          id: location.neighborhood.id,
          name: location.neighborhood.name,
          type: location.neighborhood.type as 'AREA' | 'ESTATE' | 'COMMUNITY',
          isGated: location.neighborhood.isGated,
          requiresVerification: location.neighborhood.requiresVerification,
        },
        cityTown: location.coordinates ? 'Current Location' : undefined,
        coordinates: location.coordinates || {
          latitude: location.neighborhood.coordinates?.latitude || 0,
          longitude: location.neighborhood.coordinates?.longitude || 0,
        },
        verificationStatus: 'UNVERIFIED' as const,
      };

      await saveUserLocation({
        stateId: location.state.id,
        lgaId: location.lga.id,
        wardId: location.ward?.id,
        neighborhoodId: location.neighborhood.id,
        cityTown: location.coordinates ? 'Current Location' : undefined,
        latitude: location.coordinates?.latitude,
        longitude: location.coordinates?.longitude,
      }); // Add as secondary location

      setShowLocationSelector(false);
      setShowGPSPicker(false);
      // User locations will be updated automatically
    } catch (error) {
      console.error('Error saving location:', error);
      Alert.alert('Error', 'Failed to save location. Please try again.');
    }
  };

  const handleSetPrimary = async (locationId: string) => {
    try {
      // TODO: Implement setLocationAsPrimary in LocationContext
      // await setLocationAsPrimary(locationId);
      
      // Haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.error('Error setting primary location:', error);
      Alert.alert('Error', 'Failed to set primary location. Please try again.');
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    Alert.alert(
      'Delete Location',
      'Are you sure you want to delete this location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implement deleteUserLocation in LocationContext
              // await deleteUserLocation(locationId);
              console.log('Delete location:', locationId);
            } catch (error) {
              console.error('Error deleting location:', error);
              Alert.alert('Error', 'Failed to delete location. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleEditLocation = (location: UserLocation) => {
    setSelectedLocation(location);
    setShowLocationSelector(true);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Ionicons name="arrow-back" size={24} color="#007AFF" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Location Management</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddLocation}
        accessibilityLabel="Add new location"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={24} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );

  const renderPrimaryLocation = () => {
    if (!primaryUserLocation) return null;

    return (
      <View style={styles.primaryLocationCard}>
        <View style={styles.primaryLocationHeader}>
          <View style={styles.primaryLocationIcon}>
            <Ionicons name="home" size={24} color={MECABAL_GREEN} />
          </View>
          <View style={styles.primaryLocationInfo}>
            <Text style={styles.primaryLocationLabel}>Primary Location</Text>
            <Text style={styles.primaryLocationName}>{primaryUserLocation.neighborhoodId}</Text>
            <Text style={styles.primaryLocationDetails}>
              {primaryUserLocation.lgaId}, {primaryUserLocation.stateId}
            </Text>
          </View>
          <View style={styles.primaryLocationActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowMap(true)}
              accessibilityLabel="View on map"
              accessibilityRole="button"
            >
              <Ionicons name="map" size={20} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditLocation(primaryUserLocation)}
              accessibilityLabel="Edit location"
              accessibilityRole="button"
            >
              <Ionicons name="create" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.verificationStatus}>
          <Ionicons
            name={primaryUserLocation.verificationStatus === 'VERIFIED' ? 'checkmark-circle' : 'time'}
            size={16}
            color={primaryUserLocation.verificationStatus === 'VERIFIED' ? MECABAL_GREEN : '#FF9500'}
          />
          <Text style={styles.verificationText}>
            {primaryUserLocation.verificationStatus === 'VERIFIED' ? 'Verified' : 'Pending Verification'}
          </Text>
        </View>
      </View>
    );
  };

  const renderSecondaryLocations = () => {
    const secondaryLocations = userLocations.filter(loc => !loc.isPrimary);
    
    if (secondaryLocations.length === 0) return null;

    return (
      <View style={styles.secondaryLocationsSection}>
        <Text style={styles.sectionTitle}>Other Locations ({secondaryLocations.length})</Text>
        {secondaryLocations.map((location) => (
          <View key={location.id} style={styles.secondaryLocationCard}>
            <View style={styles.secondaryLocationInfo}>
              <Text style={styles.secondaryLocationName}>{location.neighborhoodId}</Text>
              <Text style={styles.secondaryLocationDetails}>
                {location.lgaId}, {location.stateId}
              </Text>
            </View>
            <View style={styles.secondaryLocationActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleSetPrimary(location.id)}
                accessibilityLabel="Set as primary"
                accessibilityRole="button"
              >
                <Ionicons name="star-outline" size={20} color="#FF9500" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEditLocation(location)}
                accessibilityLabel="Edit location"
                accessibilityRole="button"
              >
                <Ionicons name="create" size={20} color="#8E8E93" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteLocation(location.id)}
                accessibilityLabel="Delete location"
                accessibilityRole="button"
              >
                <Ionicons name="trash" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderLandmarks = () => {
    if (landmarks.length === 0) return null;

    return (
      <View style={styles.landmarksSection}>
        <Text style={styles.sectionTitle}>Nearby Landmarks ({landmarks.length})</Text>
        {isLoadingLandmarks ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={MECABAL_GREEN} />
            <Text style={styles.loadingText}>Loading landmarks...</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {landmarks.map((landmark) => (
              <View key={landmark.id} style={styles.landmarkCard}>
                <Ionicons name="location" size={20} color={MECABAL_GREEN} />
                <Text style={styles.landmarkName}>{landmark.name}</Text>
                <Text style={styles.landmarkType}>{landmark.type}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  const renderMapModal = () => (
    <Modal
      visible={showMap}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.mapModalContainer}>
        <View style={styles.mapModalHeader}>
          <TouchableOpacity
            style={styles.mapModalButton}
            onPress={() => setShowMap(false)}
            accessibilityLabel="Close map"
            accessibilityRole="button"
          >
            <Text style={styles.mapModalButtonText}>Done</Text>
          </TouchableOpacity>
          <Text style={styles.mapModalTitle}>Neighborhood Map</Text>
          <View style={styles.mapModalButton} />
        </View>
        
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: primaryUserLocation?.coordinates?.latitude || 6.5244,
            longitude: primaryUserLocation?.coordinates?.longitude || 3.3792,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
        >
          {primaryUserLocation?.coordinates && (
            <Marker
              coordinate={{
                latitude: primaryUserLocation.coordinates.latitude,
                longitude: primaryUserLocation.coordinates.longitude,
              }}
              title={primaryUserLocation.neighborhood?.name}
              description={`${primaryUserLocation.lga?.name}, ${primaryUserLocation.state?.name}`}
              pinColor={MECABAL_GREEN}
            />
          )}
        </MapView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderPrimaryLocation()}
        {renderSecondaryLocations()}
        {renderLandmarks()}
      </ScrollView>
      {renderMapModal()}
      
      {/* Location Selector Modal */}
      <Modal
        visible={showLocationSelector}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <HierarchicalLocationSelector
          onLocationSelected={handleLocationSelected}
          onClose={() => setShowLocationSelector(false)}
        />
      </Modal>

      {/* GPS Picker Modal */}
      <Modal
        visible={showGPSPicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <GPSLocationPicker
          onLocationSelected={handleLocationSelected}
          onCancel={() => setShowGPSPicker(false)}
          showMap={true}
          allowManualInput={true}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  primaryLocationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: MECABAL_GREEN,
  },
  primaryLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryLocationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: MECABAL_GREEN_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  primaryLocationInfo: {
    flex: 1,
  },
  primaryLocationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: MECABAL_GREEN,
    marginBottom: 4,
  },
  primaryLocationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  primaryLocationDetails: {
    fontSize: 14,
    color: '#8E8E93',
  },
  primaryLocationActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  verificationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 4,
  },
  secondaryLocationsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  secondaryLocationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryLocationInfo: {
    flex: 1,
  },
  secondaryLocationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  secondaryLocationDetails: {
    fontSize: 14,
    color: '#8E8E93',
  },
  secondaryLocationActions: {
    flexDirection: 'row',
  },
  landmarksSection: {
    marginBottom: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 8,
  },
  landmarkCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    width: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  landmarkName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 2,
  },
  landmarkType: {
    fontSize: 10,
    color: '#8E8E93',
    textAlign: 'center',
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  mapModalButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapModalButtonText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '600',
  },
  mapModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  map: {
    flex: 1,
  },
});
