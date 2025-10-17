// Neighborhood Card Component
// Display neighborhood info with landmarks and selection

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { locationApi } from '../../services/api/locationApi';
import {
  Neighborhood,
  Landmark,
  LandmarkType,
} from '../../types/location.types';

interface NeighborhoodCardProps {
  neighborhood: Neighborhood;
  isSelected?: boolean;
  onSelect?: (neighborhood: Neighborhood) => void;
  showDistance?: boolean;
  userCoordinates?: {
    latitude: number;
    longitude: number;
  };
  showLandmarks?: boolean;
  maxLandmarks?: number;
  style?: any;
}

export const NeighborhoodCard: React.FC<NeighborhoodCardProps> = ({
  neighborhood,
  isSelected = false,
  onSelect,
  showDistance = true,
  userCoordinates,
  showLandmarks = true,
  maxLandmarks = 3,
  style,
}) => {
  // Local state
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [isLoadingLandmarks, setIsLoadingLandmarks] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);

  // Load landmarks when component mounts
  useEffect(() => {
    if (showLandmarks) {
      loadLandmarks();
    }
  }, [neighborhood.id, showLandmarks]);

  // Calculate distance when user coordinates are available
  useEffect(() => {
    if (showDistance && userCoordinates && neighborhood.coordinates) {
      calculateDistance();
    }
  }, [userCoordinates, neighborhood.coordinates, showDistance]);

  const loadLandmarks = async () => {
    try {
      setIsLoadingLandmarks(true);
      const nearbyLandmarks = await locationApi.getNearbyLandmarks(neighborhood.id);
      setLandmarks(nearbyLandmarks.slice(0, maxLandmarks));
    } catch (error) {
      console.error('Error loading landmarks:', error);
    } finally {
      setIsLoadingLandmarks(false);
    }
  };

  const calculateDistance = () => {
    if (!userCoordinates || !neighborhood.coordinates) return;

    const R = 6371e3; // Earth's radius in meters
    const φ1 = (userCoordinates.latitude * Math.PI) / 180;
    const φ2 = (neighborhood.coordinates.latitude * Math.PI) / 180;
    const Δφ = ((neighborhood.coordinates.latitude - userCoordinates.latitude) * Math.PI) / 180;
    const Δλ = ((neighborhood.coordinates.longitude - userCoordinates.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distanceInMeters = R * c;
    setDistance(distanceInMeters);
  };

  const handlePress = () => {
    if (onSelect) {
      // Haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onSelect(neighborhood);
    }
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  };

  const getNeighborhoodTypeColor = (type: string): string => {
    switch (type) {
      case 'ESTATE': return '#FF9500';
      case 'COMMUNITY': return '#34C759';
      case 'AREA': return '#007AFF';
      default: return '#8E8E93';
    }
  };

  const getLandmarkIcon = (type: LandmarkType): string => {
    switch (type) {
      case LandmarkType.MARKET: return 'storefront';
      case LandmarkType.SCHOOL: return 'school';
      case LandmarkType.HOSPITAL: return 'medical';
      case LandmarkType.CHURCH: return 'church';
      case LandmarkType.MOSQUE: return 'mosque';
      case LandmarkType.BANK: return 'card';
      case LandmarkType.ATM: return 'card-outline';
      case LandmarkType.RESTAURANT: return 'restaurant';
      case LandmarkType.SHOPPING_MALL: return 'storefront';
      case LandmarkType.BUS_STOP: return 'bus';
      case LandmarkType.TRAIN_STATION: return 'train';
      case LandmarkType.AIRPORT: return 'airplane';
      case LandmarkType.POLICE_STATION: return 'shield';
      case LandmarkType.FIRE_STATION: return 'flame';
      case LandmarkType.GOVERNMENT_OFFICE: return 'business';
      case LandmarkType.PARK: return 'leaf';
      case LandmarkType.SPORTS_CENTER: return 'fitness';
      case LandmarkType.CINEMA: return 'film';
      case LandmarkType.HOTEL: return 'bed';
      case LandmarkType.PHARMACY: return 'medical';
      case LandmarkType.FUEL_STATION: return 'car';
      default: return 'location';
    }
  };

  const renderTypeBadge = () => (
    <View style={[
      styles.typeBadge,
      { backgroundColor: getNeighborhoodTypeColor(neighborhood.type) }
    ]}>
      <Text style={styles.typeBadgeText}>{neighborhood.type}</Text>
    </View>
  );

  const renderGatedIndicator = () => {
    if (!neighborhood.isGated) return null;

    return (
      <View style={styles.gatedIndicator}>
        <Ionicons name="lock-closed" size={12} color="white" />
      </View>
    );
  };

  const renderDistance = () => {
    if (!showDistance || distance === null) return null;

    return (
      <View style={styles.distanceContainer}>
        <Ionicons name="location" size={12} color="#8E8E93" />
        <Text style={styles.distanceText}>{formatDistance(distance)}</Text>
      </View>
    );
  };

  const renderMemberCount = () => {
    if (!neighborhood.memberCount) return null;

    return (
      <View style={styles.memberCountContainer}>
        <Ionicons name="people" size={12} color="#8E8E93" />
        <Text style={styles.memberCountText}>{neighborhood.memberCount} members</Text>
      </View>
    );
  };

  const renderLandmarks = () => {
    if (!showLandmarks) return null;

    if (isLoadingLandmarks) {
      return (
        <View style={styles.landmarksContainer}>
          <ActivityIndicator size="small" color="#8E8E93" />
          <Text style={styles.landmarksLoadingText}>Loading landmarks...</Text>
        </View>
      );
    }

    if (landmarks.length === 0) return null;

    return (
      <View style={styles.landmarksContainer}>
        <Text style={styles.landmarksTitle}>Nearby landmarks:</Text>
        <View style={styles.landmarksList}>
          {landmarks.map((landmark, index) => (
            <View key={landmark.id} style={styles.landmarkItem}>
              <Ionicons
                name={getLandmarkIcon(landmark.type) as any}
                size={12}
                color="#8E8E93"
              />
              <Text style={styles.landmarkText} numberOfLines={1}>
                {landmark.name}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderSelectionIndicator = () => {
    if (!isSelected) return null;

    return (
      <View style={styles.selectionIndicator}>
        <Ionicons name="checkmark" size={16} color="white" />
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.selectedContainer,
        style,
      ]}
      onPress={handlePress}
      disabled={!onSelect}
      accessibilityLabel={`${neighborhood.name} neighborhood`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.neighborhoodName} numberOfLines={1}>
            {neighborhood.name}
          </Text>
          <View style={styles.badgesContainer}>
            {renderTypeBadge()}
            {renderGatedIndicator()}
          </View>
        </View>
        {renderSelectionIndicator()}
      </View>

      <View style={styles.metaContainer}>
        {renderDistance()}
        {renderMemberCount()}
      </View>

      {renderLandmarks()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  selectedContainer: {
    borderColor: '#007AFF',
    borderWidth: 2,
    backgroundColor: '#F0F8FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  neighborhoodName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  gatedIndicator: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    padding: 4,
  },
  selectionIndicator: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  distanceText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  memberCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberCountText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  landmarksContainer: {
    marginTop: 8,
  },
  landmarksTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 6,
  },
  landmarksList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  landmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
    maxWidth: 120,
  },
  landmarkText: {
    fontSize: 11,
    color: '#8E8E93',
    marginLeft: 4,
  },
  landmarksLoadingText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 8,
  },
});

export default NeighborhoodCard;
