// Neighborhood Discovery Screen
// Browse neighborhoods and community activity

import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshControl,
  Alert,
} from 'react-native';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import { NeighborhoodCard } from '../components/location';
import { locationApi } from '../services/api/locationApi';
import {
  State,
  LGA,
  Ward,
  Neighborhood,
  Landmark,
  LocationCoordinates,
} from '../types/location.types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// MeCabal brand colors
const MECABAL_GREEN = '#00A651';
const MECABAL_GREEN_LIGHT = '#E8F5E8';

interface NeighborhoodDiscoveryScreenProps {
  navigation: any;
}

interface CommunityActivity {
  id: string;
  type: 'post' | 'event' | 'help_request' | 'marketplace';
  title: string;
  content: string;
  author: string;
  timestamp: Date;
  likes: number;
  comments: number;
}

interface NeighborhoodWithActivity extends Neighborhood {
  memberCount: number;
  recentActivity: CommunityActivity[];
  landmarks: Landmark[];
  isJoined: boolean;
}

export default function NeighborhoodDiscoveryScreen({ navigation }: NeighborhoodDiscoveryScreenProps) {
  // Context
  const { user, getCurrentLocation } = useAuth();
  const { primaryUserLocation } = useLocation();

  // Local state
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodWithActivity[]>([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<NeighborhoodWithActivity | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'nearby' | 'gated' | 'open'>('all');
  const [sortBy, setSortBy] = useState<'distance' | 'activity' | 'members'>('distance');

  // Initialize component
  useEffect(() => {
    loadNeighborhoods();
  }, [primaryUserLocation]);

  // Load neighborhoods when filter or sort changes
  useEffect(() => {
    loadNeighborhoods();
  }, [filter, sortBy]);

  const loadNeighborhoods = async () => {
    if (!primaryUserLocation?.lgaId) return;

    try {
      setIsLoading(true);
      
      // Get neighborhoods in the same LGA
      const response = await locationApi.getNeighborhoodsByWard(primaryUserLocation.wardId || '');
      const neighborhoodsData = response.data || [];

      // Enrich with additional data
      const enrichedNeighborhoods: NeighborhoodWithActivity[] = await Promise.all(
        neighborhoodsData.map(async (neighborhood) => {
          try {
            // Get landmarks for this neighborhood
            const landmarks = await locationApi.getNearbyLandmarks(neighborhood.id);
            
            // Simulate community activity (in a real app, this would come from the API)
            const recentActivity: CommunityActivity[] = [
              {
                id: '1',
                type: 'post',
                title: 'Community Update',
                content: 'New playground equipment installed!',
                author: 'Estate Manager',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
                likes: 12,
                comments: 3,
              },
              {
                id: '2',
                type: 'event',
                title: 'Neighborhood Meeting',
                content: 'Monthly community meeting this Saturday',
                author: 'Community Admin',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
                likes: 8,
                comments: 5,
              },
            ];

            return {
              ...neighborhood,
              memberCount: Math.floor(Math.random() * 500) + 50, // Simulate member count
              recentActivity,
              landmarks: landmarks.slice(0, 5), // Limit to 5 landmarks
              isJoined: neighborhood.id === primaryUserLocation.neighborhoodId,
            };
          } catch (error) {
            console.error('Error enriching neighborhood data:', error);
            return {
              ...neighborhood,
              memberCount: 0,
              recentActivity: [],
              landmarks: [],
              isJoined: neighborhood.id === primaryUserLocation.neighborhoodId,
            };
          }
        })
      );

      // Apply filters
      let filteredNeighborhoods = enrichedNeighborhoods;
      
      if (filter === 'nearby') {
        // Filter by distance (simplified)
        filteredNeighborhoods = enrichedNeighborhoods.slice(0, 5);
      } else if (filter === 'gated') {
        filteredNeighborhoods = enrichedNeighborhoods.filter(n => n.isGated);
      } else if (filter === 'open') {
        filteredNeighborhoods = enrichedNeighborhoods.filter(n => !n.isGated);
      }

      // Apply sorting
      filteredNeighborhoods.sort((a, b) => {
        switch (sortBy) {
          case 'activity':
            return b.recentActivity.length - a.recentActivity.length;
          case 'members':
            return b.memberCount - a.memberCount;
          case 'distance':
          default:
            return 0; // In a real app, sort by actual distance
        }
      });

      setNeighborhoods(filteredNeighborhoods);
    } catch (error) {
      console.error('Error loading neighborhoods:', error);
      Alert.alert('Error', 'Failed to load neighborhoods. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadNeighborhoods();
    setIsRefreshing(false);
  }, []);

  const handleNeighborhoodSelect = (neighborhood: NeighborhoodWithActivity) => {
    setSelectedNeighborhood(neighborhood);
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleJoinNeighborhood = async (neighborhood: NeighborhoodWithActivity) => {
    try {
      // TODO: Implement join neighborhood functionality
      Alert.alert(
        'Join Neighborhood',
        `Would you like to join ${neighborhood.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Join',
            onPress: () => {
              // Update neighborhood as joined
              setNeighborhoods(prev =>
                prev.map(n =>
                  n.id === neighborhood.id ? { ...n, isJoined: true } : n
                )
              );
              
              // Haptic feedback
              if (Platform.OS === 'ios') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error joining neighborhood:', error);
      Alert.alert('Error', 'Failed to join neighborhood. Please try again.');
    }
  };

  const handleViewMap = () => {
    setShowMap(true);
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
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
      <Text style={styles.headerTitle}>Discover Neighborhoods</Text>
      <TouchableOpacity
        style={styles.mapButton}
        onPress={handleViewMap}
        accessibilityLabel="View map"
        accessibilityRole="button"
      >
        <Ionicons name="map" size={24} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          { key: 'all', label: 'All' },
          { key: 'nearby', label: 'Nearby' },
          { key: 'gated', label: 'Gated' },
          { key: 'open', label: 'Open' },
        ].map((filterOption) => (
          <TouchableOpacity
            key={filterOption.key}
            style={[
              styles.filterButton,
              filter === filterOption.key && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(filterOption.key as any)}
            accessibilityLabel={`Filter by ${filterOption.label}`}
            accessibilityRole="button"
          >
            <Text style={[
              styles.filterButtonText,
              filter === filterOption.key && styles.filterButtonTextActive,
            ]}>
              {filterOption.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSortOptions = () => (
    <View style={styles.sortContainer}>
      <Text style={styles.sortLabel}>Sort by:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          { key: 'distance', label: 'Distance' },
          { key: 'activity', label: 'Activity' },
          { key: 'members', label: 'Members' },
        ].map((sortOption) => (
          <TouchableOpacity
            key={sortOption.key}
            style={[
              styles.sortButton,
              sortBy === sortOption.key && styles.sortButtonActive,
            ]}
            onPress={() => setSortBy(sortOption.key as any)}
            accessibilityLabel={`Sort by ${sortOption.label}`}
            accessibilityRole="button"
          >
            <Text style={[
              styles.sortButtonText,
              sortBy === sortOption.key && styles.sortButtonTextActive,
            ]}>
              {sortOption.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderNeighborhoodCard = (neighborhood: NeighborhoodWithActivity) => (
    <View key={neighborhood.id} style={styles.neighborhoodCard}>
      <View style={styles.neighborhoodHeader}>
        <View style={styles.neighborhoodInfo}>
          <Text style={styles.neighborhoodName}>{neighborhood.name}</Text>
          <Text style={styles.neighborhoodType}>
            {neighborhood.type} • {neighborhood.memberCount} members
          </Text>
          {neighborhood.isGated && (
            <View style={styles.gatedIndicator}>
              <Ionicons name="lock-closed" size={12} color="#FF3B30" />
              <Text style={styles.gatedText}>Gated Community</Text>
            </View>
          )}
        </View>
        <View style={styles.neighborhoodActions}>
          {neighborhood.isJoined ? (
            <View style={styles.joinedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={MECABAL_GREEN} />
              <Text style={styles.joinedText}>Joined</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.joinButton}
              onPress={() => handleJoinNeighborhood(neighborhood)}
              accessibilityLabel={`Join ${neighborhood.name}`}
              accessibilityRole="button"
            >
              <Text style={styles.joinButtonText}>Join</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {neighborhood.landmarks.length > 0 && (
        <View style={styles.landmarksSection}>
          <Text style={styles.landmarksTitle}>Nearby Landmarks</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {neighborhood.landmarks.map((landmark) => (
              <View key={landmark.id} style={styles.landmarkChip}>
                <Ionicons name="location" size={12} color={MECABAL_GREEN} />
                <Text style={styles.landmarkText}>{landmark.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {neighborhood.recentActivity.length > 0 && (
        <View style={styles.activitySection}>
          <Text style={styles.activityTitle}>Recent Activity</Text>
          {neighborhood.recentActivity.slice(0, 2).map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons
                  name={
                    activity.type === 'post' ? 'document-text' :
                    activity.type === 'event' ? 'calendar' :
                    activity.type === 'help_request' ? 'help-circle' : 'storefront'
                  }
                  size={16}
                  color={MECABAL_GREEN}
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityMeta}>
                  {activity.author} • {formatTimeAgo(activity.timestamp)} • {activity.likes} likes
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderMapModal = () => (
    <View style={styles.mapModal}>
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
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {neighborhoods.map((neighborhood) => (
          <Marker
            key={neighborhood.id}
            coordinate={{
              latitude: neighborhood.coordinates?.latitude || 6.5244,
              longitude: neighborhood.coordinates?.longitude || 3.3792,
            }}
            title={neighborhood.name}
            description={`${neighborhood.type} • ${neighborhood.memberCount} members`}
            onPress={() => handleNeighborhoodSelect(neighborhood)}
            pinColor={neighborhood.isGated ? "#FF3B30" : MECABAL_GREEN}
          />
        ))}
      </MapView>
    </View>
  );

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={MECABAL_GREEN} />
          <Text style={styles.loadingText}>Loading neighborhoods...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={MECABAL_GREEN}
          />
        }
      >
        {renderFilters()}
        {renderSortOptions()}
        
        <View style={styles.neighborhoodsContainer}>
          <Text style={styles.sectionTitle}>
            Neighborhoods ({neighborhoods.length})
          </Text>
          {neighborhoods.map(renderNeighborhoodCard)}
        </View>
      </ScrollView>
      
      {showMap && renderMapModal()}
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
  mapButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  filtersContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  filterButtonActive: {
    backgroundColor: MECABAL_GREEN,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginRight: 12,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
  },
  sortButtonActive: {
    backgroundColor: MECABAL_GREEN_LIGHT,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },
  sortButtonTextActive: {
    color: MECABAL_GREEN,
  },
  neighborhoodsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  neighborhoodCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  neighborhoodHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  neighborhoodInfo: {
    flex: 1,
  },
  neighborhoodName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  neighborhoodType: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  gatedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  gatedText: {
    fontSize: 12,
    color: '#FF3B30',
    marginLeft: 4,
    fontWeight: '500',
  },
  neighborhoodActions: {
    marginLeft: 12,
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MECABAL_GREEN_LIGHT,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  joinedText: {
    fontSize: 12,
    color: MECABAL_GREEN,
    marginLeft: 4,
    fontWeight: '500',
  },
  joinButton: {
    backgroundColor: MECABAL_GREEN,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  landmarksSection: {
    marginBottom: 12,
  },
  landmarksTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  landmarkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  landmarkText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  activitySection: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 12,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  activityIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: MECABAL_GREEN_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  activityContent: {
    flex: 1,
  },
  activityMeta: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 12,
  },
  mapModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
  },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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





