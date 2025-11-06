// Neighborhood Recommendation Screen
// Map showing user location and neighborhood boundaries with recommendations

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Platform,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocation } from '../../contexts/LocationContext';
import { NeighborhoodCard } from '../../components/location';
import {
  Neighborhood,
  NeighborhoodType,
  LocationCoordinates,
} from '../../types/location.types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// MeCabal brand colors
const MECABAL_GREEN = '#00A651';
const MECABAL_GREEN_LIGHT = '#E8F5E8';

interface NeighborhoodRecommendationScreenProps {
  navigation: any;
  route: any;
}

interface FilterOptions {
  distance: 'all' | 'nearby' | 'walking' | 'driving';
  type: 'all' | NeighborhoodType;
  gated: 'all' | 'gated' | 'open';
}

interface RecommendationInfo {
  neighborhood: Neighborhood;
  distance: number;
  score: number;
}

export default function NeighborhoodRecommendationScreen({ navigation, route }: NeighborhoodRecommendationScreenProps) {
  // Context
  const {
    currentCoordinates,
    recommendedNeighborhoods,
    isLoadingLocation,
    locationError,
    getRecommendations,
  } = useLocation();

  // Local state
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood | null>(null);
  const [filteredRecommendations, setFilteredRecommendations] = useState<RecommendationInfo[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    distance: 'all',
    type: 'all',
    gated: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showVerificationInfo, setShowVerificationInfo] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  // Refs
  const mapRef = useRef<MapView>(null);

  // Initialize component
  useEffect(() => {
    loadRecommendations();
  }, []);

  // Filter recommendations when filters change
  useEffect(() => {
    filterRecommendations();
  }, [filters, recommendedNeighborhoods]);

  const loadRecommendations = async () => {
    if (!currentCoordinates) return;

    try {
      setIsLoadingRecommendations(true);
      await getRecommendations(
        currentCoordinates.latitude,
        currentCoordinates.longitude,
        5000, // 5km radius
        20 // Limit to 20 recommendations
      );
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const filterRecommendations = () => {
    if (!recommendedNeighborhoods.length) {
      setFilteredRecommendations([]);
      return;
    }

    let filtered = recommendedNeighborhoods.map(neighborhood => ({
      neighborhood,
      distance: calculateDistance(neighborhood),
      score: calculateScore(neighborhood),
    }));

    // Apply distance filter
    if (filters.distance !== 'all') {
      const maxDistance = getMaxDistance(filters.distance);
      filtered = filtered.filter(item => item.distance <= maxDistance);
    }

    // Apply type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(item => item.neighborhood.type === filters.type);
    }

    // Apply gated filter
    if (filters.gated !== 'all') {
      const isGated = filters.gated === 'gated';
      filtered = filtered.filter(item => item.neighborhood.isGated === isGated);
    }

    // Sort by score (distance + other factors)
    filtered.sort((a, b) => a.score - b.score);

    setFilteredRecommendations(filtered);
  };

  const calculateDistance = (neighborhood: Neighborhood): number => {
    if (!currentCoordinates || !neighborhood.coordinates) return 0;

    const R = 6371e3; // Earth's radius in meters
    const φ1 = (currentCoordinates.latitude * Math.PI) / 180;
    const φ2 = (neighborhood.coordinates.latitude * Math.PI) / 180;
    const Δφ = ((neighborhood.coordinates.latitude - currentCoordinates.latitude) * Math.PI) / 180;
    const Δλ = ((neighborhood.coordinates.longitude - currentCoordinates.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const calculateScore = (neighborhood: Neighborhood): number => {
    const distance = calculateDistance(neighborhood);
    let score = distance;

    // Prefer closer neighborhoods
    if (distance < 1000) score *= 0.8;
    else if (distance < 2000) score *= 0.9;

    // Prefer certain types
    if (neighborhood.type === NeighborhoodType.ESTATE) score *= 0.9;
    else if (neighborhood.type === NeighborhoodType.COMMUNITY) score *= 0.95;

    return score;
  };

  const getMaxDistance = (distance: string): number => {
    switch (distance) {
      case 'nearby': return 1000; // 1km
      case 'walking': return 2000; // 2km
      case 'driving': return 10000; // 10km
      default: return Infinity;
    }
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  };

  const handleNeighborhoodSelect = (neighborhood: Neighborhood) => {
    setSelectedNeighborhood(neighborhood);
    
    // Center map on selected neighborhood
    if (neighborhood.coordinates && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: neighborhood.coordinates.latitude,
        longitude: neighborhood.coordinates.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }

    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleContinue = () => {
    if (!selectedNeighborhood) return;

    // Navigate to estate verification if it's a gated estate
    if (selectedNeighborhood.isGated && selectedNeighborhood.requiresVerification) {
      navigation.navigate('EstateVerificationScreen', {
        neighborhood: selectedNeighborhood,
      });
    } else {
      // Navigate to next onboarding step
      navigation.navigate('ProfileSetupScreen');
    }
  };

  const handleSearchDifferentArea = () => {
    navigation.navigate('LocationSetupScreen');
  };

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      distance: 'all',
      type: 'all',
      gated: 'all',
    });
  };

  const renderMap = () => (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: currentCoordinates?.latitude || 6.5244,
          longitude: currentCoordinates?.longitude || 3.3792,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        mapType="standard"
      >
        {/* User location marker */}
        {currentCoordinates && (
          <Marker
            coordinate={currentCoordinates}
            title="Your Location"
            pinColor="#007AFF"
          />
        )}

        {/* Neighborhood markers */}
        {filteredRecommendations.map((rec, index) => (
          <Marker
            key={rec.neighborhood.id}
            coordinate={{
              latitude: rec.neighborhood.coordinates?.latitude || currentCoordinates?.latitude || 0,
              longitude: rec.neighborhood.coordinates?.longitude || currentCoordinates?.longitude || 0,
            }}
            title={rec.neighborhood.name}
            description={`${rec.neighborhood.type} • ${formatDistance(rec.distance)}`}
            onPress={() => handleNeighborhoodSelect(rec.neighborhood)}
            pinColor={rec.neighborhood.isGated ? "#FF3B30" : "#34C759"}
          />
        ))}

        {/* Neighborhood boundaries (if available) */}
        {selectedNeighborhood?.boundaries && (
          <Polygon
            coordinates={selectedNeighborhood.boundaries.coordinates[0].map(coord => ({
              latitude: coord[1],
              longitude: coord[0],
            }))}
            fillColor="rgba(0, 166, 81, 0.2)"
            strokeColor={MECABAL_GREEN}
            strokeWidth={2}
          />
        )}
      </MapView>

      {/* Map controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity
          style={styles.mapControlButton}
          onPress={() => setShowFilters(true)}
          accessibilityLabel="Open filters"
          accessibilityRole="button"
        >
          <Ionicons name="options" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRecommendations = () => (
    <View style={styles.recommendationsContainer}>
      <View style={styles.recommendationsHeader}>
        <Text style={styles.recommendationsTitle}>
          Recommended Neighborhoods ({filteredRecommendations.length})
        </Text>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearchDifferentArea}
          accessibilityLabel="Search different area"
          accessibilityRole="button"
        >
          <Ionicons name="search" size={16} color="#007AFF" />
          <Text style={styles.searchButtonText}>Search Different Area</Text>
        </TouchableOpacity>
      </View>

      {isLoadingRecommendations ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={MECABAL_GREEN} />
          <Text style={styles.loadingText}>Finding neighborhoods...</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recommendationsList}
        >
          {filteredRecommendations.map((rec) => (
            <NeighborhoodCard
              key={rec.neighborhood.id}
              neighborhood={rec.neighborhood}
              isSelected={selectedNeighborhood?.id === rec.neighborhood.id}
              onSelect={handleNeighborhoodSelect}
              showDistance={true}
              userCoordinates={currentCoordinates || undefined}
              showLandmarks={true}
              maxLandmarks={2}
              style={styles.recommendationCard}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderFilters = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setShowFilters(false)}
            accessibilityLabel="Close filters"
            accessibilityRole="button"
          >
            <Text style={styles.modalButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Filters</Text>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={resetFilters}
            accessibilityLabel="Reset filters"
            accessibilityRole="button"
          >
            <Text style={styles.modalButtonTextPrimary}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Distance Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Distance</Text>
            <View style={styles.filterOptions}>
              {[
                { key: 'all', label: 'All Distances' },
                { key: 'nearby', label: 'Nearby (1km)' },
                { key: 'walking', label: 'Walking (2km)' },
                { key: 'driving', label: 'Driving (10km)' },
              ].map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterOption,
                    filters.distance === option.key && styles.filterOptionSelected,
                  ]}
                  onPress={() => handleFilterChange('distance', option.key)}
                  accessibilityLabel={`Filter by ${option.label}`}
                  accessibilityRole="button"
                >
                  <Text style={[
                    styles.filterOptionText,
                    filters.distance === option.key && styles.filterOptionTextSelected,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Type Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Type</Text>
            <View style={styles.filterOptions}>
              {[
                { key: 'all', label: 'All Types' },
                { key: NeighborhoodType.ESTATE, label: 'Estates' },
                { key: NeighborhoodType.COMMUNITY, label: 'Communities' },
                { key: NeighborhoodType.AREA, label: 'Areas' },
              ].map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterOption,
                    filters.type === option.key && styles.filterOptionSelected,
                  ]}
                  onPress={() => handleFilterChange('type', option.key)}
                  accessibilityLabel={`Filter by ${option.label}`}
                  accessibilityRole="button"
                >
                  <Text style={[
                    styles.filterOptionText,
                    filters.type === option.key && styles.filterOptionTextSelected,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Gated Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Access</Text>
            <View style={styles.filterOptions}>
              {[
                { key: 'all', label: 'All Access' },
                { key: 'gated', label: 'Gated Only' },
                { key: 'open', label: 'Open Only' },
              ].map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterOption,
                    filters.gated === option.key && styles.filterOptionSelected,
                  ]}
                  onPress={() => handleFilterChange('gated', option.key)}
                  accessibilityLabel={`Filter by ${option.label}`}
                  accessibilityRole="button"
                >
                  <Text style={[
                    styles.filterOptionText,
                    filters.gated === option.key && styles.filterOptionTextSelected,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderVerificationInfo = () => (
    <Modal
      visible={showVerificationInfo}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setShowVerificationInfo(false)}
            accessibilityLabel="Close verification info"
            accessibilityRole="button"
          >
            <Text style={styles.modalButtonText}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Estate Verification</Text>
          <View style={styles.modalButton} />
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.infoContainer}>
            <Ionicons name="shield-checkmark" size={64} color={MECABAL_GREEN} />
            <Text style={styles.infoTitle}>Why Verification?</Text>
            <Text style={styles.infoDescription}>
              Gated estates require verification to ensure you're a legitimate resident. 
              This helps maintain security and community standards.
            </Text>

            <Text style={styles.infoSubtitle}>Verification Options:</Text>
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <Ionicons name="document-text" size={20} color={MECABAL_GREEN} />
                <Text style={styles.infoItemText}>Upload proof of residence</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="person" size={20} color={MECABAL_GREEN} />
                <Text style={styles.infoItemText}>Request from estate admin</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="camera" size={20} color={MECABAL_GREEN} />
                <Text style={styles.infoItemText}>Take photo at estate</Text>
              </View>
            </View>

            <Text style={styles.infoNote}>
              Verification typically takes 1-3 business days. You can continue with limited access while waiting.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderContinueButton = () => (
    <View style={styles.continueContainer}>
      <TouchableOpacity
        style={[
          styles.continueButton,
          !selectedNeighborhood && styles.continueButtonDisabled,
        ]}
        onPress={handleContinue}
        disabled={!selectedNeighborhood}
        accessibilityLabel="Continue to next step"
        accessibilityRole="button"
      >
        <Text style={[
          styles.continueButtonText,
          !selectedNeighborhood && styles.continueButtonTextDisabled,
        ]}>
          {selectedNeighborhood?.isGated ? 'Continue to Verification' : 'Continue'}
        </Text>
        <Ionicons 
          name="arrow-forward" 
          size={20} 
          color={selectedNeighborhood ? "white" : "#8E8E93"} 
        />
      </TouchableOpacity>

      {selectedNeighborhood?.isGated && (
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => setShowVerificationInfo(true)}
          accessibilityLabel="Learn about verification"
          accessibilityRole="button"
        >
          <Ionicons name="information-circle" size={16} color="#007AFF" />
          <Text style={styles.infoButtonText}>Learn about verification</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderMap()}
      {renderRecommendations()}
      {renderContinueButton()}
      {renderFilters()}
      {renderVerificationInfo()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  mapContainer: {
    height: screenHeight * 0.4,
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
  recommendationsContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingTop: 20,
  },
  recommendationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 8,
  },
  recommendationsList: {
    paddingHorizontal: 16,
  },
  recommendationCard: {
    width: 280,
    marginRight: 12,
  },
  continueContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MECABAL_GREEN,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: 'white',
    marginRight: 8,
  },
  continueButtonTextDisabled: {
    color: '#8E8E93',
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  infoButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
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
  filterSection: {
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterOption: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  filterOptionSelected: {
    backgroundColor: MECABAL_GREEN_LIGHT,
    borderColor: MECABAL_GREEN,
  },
  filterOptionText: {
    fontSize: 14,
    color: '#000',
  },
  filterOptionTextSelected: {
    color: MECABAL_GREEN,
    fontWeight: '600',
  },
  infoContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  infoTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  infoDescription: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  infoSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  infoList: {
    width: '100%',
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
  },
  infoItemText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 12,
  },
  infoNote: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});



















