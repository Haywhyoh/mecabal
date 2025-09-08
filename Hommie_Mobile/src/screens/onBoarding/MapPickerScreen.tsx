import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import MapView, { Marker, Circle, Region } from 'react-native-maps';
import { colors, spacing, typography } from '../../constants';
import { MeCabalLocation } from '../../services/location';

interface MapPickerScreenProps {
  navigation: any;
  route: any;
}

interface SelectedLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

interface NearbyNeighborhood {
  id: string;
  name: string;
  type: string;
  distance: number;
  confidence: number;
}

const { width, height } = Dimensions.get('window');

const MapPickerScreen: React.FC<MapPickerScreenProps> = ({ navigation, route }) => {
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [nearbyNeighborhoods, setNearbyNeighborhoods] = useState<NearbyNeighborhood[]>([]);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 6.5244, // Center of Lagos
    longitude: 3.3792,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  const mapRef = useRef<MapView>(null);
  const { onLocationSelected } = route.params || {};

  // Nigerian neighborhood centers for map visualization
  const neighborhoodCenters = [
    // Lagos Traditional Areas
    { id: 'surulere', name: 'Surulere', lat: 6.495, lng: 3.348, type: 'traditional_area', color: colors.accent.neighborPurple },
    { id: 'yaba', name: 'Yaba', lat: 6.515, lng: 3.378, type: 'traditional_area', color: colors.accent.neighborPurple },
    { id: 'ikeja', name: 'Ikeja', lat: 6.595, lng: 3.337, type: 'traditional_area', color: colors.accent.neighborPurple },
    { id: 'mushin', name: 'Mushin', lat: 6.527, lng: 3.347, type: 'traditional_area', color: colors.accent.neighborPurple },
    
    // Lagos Estates
    { id: 'vi', name: 'Victoria Island', lat: 6.430, lng: 3.415, type: 'estate', color: colors.primary },
    { id: 'lekki', name: 'Lekki Phase 1', lat: 6.450, lng: 3.505, type: 'estate', color: colors.primary },
    { id: 'ikeja-gra', name: 'Ikeja GRA', lat: 6.605, lng: 3.355, type: 'estate', color: colors.primary },
    
    // Lagos Landmarks
    { id: 'computer-village', name: 'Computer Village Area', lat: 6.600, lng: 3.348, type: 'landmark_based', color: colors.accent.warmGold },
    { id: 'unilag', name: 'UNILAG Area', lat: 6.515, lng: 3.397, type: 'landmark_based', color: colors.accent.warmGold },
    
    // Transport & Commercial
    { id: 'ojota', name: 'Ojota Area', lat: 6.573, lng: 3.384, type: 'transport_hub', color: colors.accent.lagosOrange },
    { id: 'alaba', name: 'Alaba Market Area', lat: 6.447, lng: 3.180, type: 'market_based', color: colors.accent.marketGreen },
  ];

  useEffect(() => {
    // Try to get user's current location and center map there
    getCurrentLocationForMap();
  }, []);

  const getCurrentLocationForMap = async () => {
    try {
      const location = await MeCabalLocation.getCurrentLocation();
      if (location && location.success && location.data) {
        const newRegion = {
          latitude: location.data.latitude,
          longitude: location.data.longitude,
          latitudeDelta: 0.02, // Closer zoom for user location
          longitudeDelta: 0.02,
        };
        setMapRegion(newRegion);
        
        // Animate to user's location
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }
      }
    } catch (error) {
      console.warn('Could not get current location for map:', error);
      // Keep default Lagos center
    }
  };

  const handleMapPress = async (event: any) => {
    const { coordinate } = event.nativeEvent;
    setSelectedLocation({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    });
    
    // Start verification process
    setIsVerifying(true);
    setVerificationResult(null);
    
    try {
      const result = await MeCabalLocation.verifyLocation(
        route.params?.userId || 'temp-user',
        coordinate.latitude,
        coordinate.longitude
      );
      
      setVerificationResult(result);
      
      if (result.verified) {
        // Success - show verification result
        setNearbyNeighborhoods([{
          id: result.neighborhood.id,
          name: result.neighborhood.name,
          type: result.neighborhood.type,
          distance: 0,
          confidence: result.confidence || 1
        }]);
      } else if (result.suggestions && result.suggestions.length > 0) {
        // Show nearby suggestions
        setNearbyNeighborhoods(result.suggestions.map((suggestion: any) => ({
          id: suggestion.name.toLowerCase().replace(/\s+/g, '-'),
          name: suggestion.name,
          type: suggestion.type || 'area',
          distance: suggestion.distance || 0,
          confidence: 0.5
        })));
      }
    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert('Error', 'Could not verify location. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirmLocation = () => {
    if (!selectedLocation) return;
    
    if (verificationResult?.verified) {
      Alert.alert(
        'Location Confirmed!',
        `You've selected ${verificationResult.neighborhood.name}. This will be your community on MeCabal.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: () => {
              if (onLocationSelected) {
                onLocationSelected({
                  location: selectedLocation,
                  neighborhood: verificationResult.neighborhood,
                  verified: true
                });
              }
              navigation.goBack();
            }
          }
        ]
      );
    } else {
      Alert.alert(
        'Location Not in Registered Community',
        'This location is not in a registered MeCabal community. You can still proceed but may have limited community features.',
        [
          { text: 'Choose Different Location', style: 'cancel' },
          {
            text: 'Proceed Anyway',
            onPress: () => {
              if (onLocationSelected) {
                onLocationSelected({
                  location: selectedLocation,
                  neighborhood: null,
                  verified: false
                });
              }
              navigation.goBack();
            }
          }
        ]
      );
    }
  };

  const jumpToNeighborhood = (neighborhood: any) => {
    const region = {
      latitude: neighborhood.lat,
      longitude: neighborhood.lng,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
    
    if (mapRef.current) {
      mapRef.current.animateToRegion(region, 1000);
    }
    setMapRegion(region);
  };

  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'estate': return colors.primary;
      case 'traditional_area': return colors.accent.neighborPurple;
      case 'landmark_based': return colors.accent.warmGold;
      case 'transport_hub': return colors.accent.lagosOrange;
      case 'market_based': return colors.accent.marketGreen;
      case 'road_based': return colors.accent.trustBlue;
      default: return colors.neutral.friendlyGray;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Choose Your Location</Text>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          Tap on the map to select your location. We'll check if it's in a registered community.
        </Text>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={mapRegion}
          onRegionChange={setMapRegion}
          onPress={handleMapPress}
          showsUserLocation={true}
          showsMyLocationButton={true}
          toolbarEnabled={false}
        >
          {/* Neighborhood center markers */}
          {neighborhoodCenters.map((neighborhood) => (
            <Marker
              key={neighborhood.id}
              coordinate={{
                latitude: neighborhood.lat,
                longitude: neighborhood.lng
              }}
              title={neighborhood.name}
              description={`${neighborhood.type.replace('_', ' ')} community`}
              pinColor={getMarkerColor(neighborhood.type)}
            />
          ))}

          {/* Selected location marker */}
          {selectedLocation && (
            <Marker
              coordinate={selectedLocation}
              title="Selected Location"
              description="Your chosen location"
              pinColor={verificationResult?.verified ? colors.primary : colors.accent.safetyRed}
            />
          )}

          {/* Community area circles for verified neighborhoods */}
          {verificationResult?.verified && selectedLocation && (
            <Circle
              center={selectedLocation}
              radius={1000} // 1km radius
              fillColor={`${colors.primary}20`}
              strokeColor={colors.primary}
              strokeWidth={2}
            />
          )}
        </MapView>

        {/* Loading overlay */}
        {isVerifying && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Verifying location...</Text>
          </View>
        )}
      </View>

      {/* Quick Jump to Popular Areas */}
      <View style={styles.quickJumpContainer}>
        <Text style={styles.quickJumpTitle}>Popular Areas:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {neighborhoodCenters.slice(0, 6).map((neighborhood) => (
            <TouchableOpacity
              key={neighborhood.id}
              style={[styles.quickJumpButton, { borderColor: getMarkerColor(neighborhood.type) }]}
              onPress={() => jumpToNeighborhood(neighborhood)}
            >
              <Text style={[styles.quickJumpButtonText, { color: getMarkerColor(neighborhood.type) }]}>
                {neighborhood.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Location Status */}
      {selectedLocation && (
        <View style={styles.statusContainer}>
          {verificationResult?.verified ? (
            <View style={styles.verifiedStatus}>
              <Text style={styles.verifiedTitle}>✅ Location Verified!</Text>
              <Text style={styles.verifiedSubtitle}>
                {verificationResult.neighborhood.name}, {verificationResult.neighborhood.state_name}
              </Text>
              <Text style={styles.verifiedDetails}>
                Community Type: {verificationResult.neighborhood.type.replace('_', ' ')}
              </Text>
            </View>
          ) : verificationResult ? (
            <View style={styles.unverifiedStatus}>
              <Text style={styles.unverifiedTitle}>⚠️ Location Not Registered</Text>
              <Text style={styles.unverifiedSubtitle}>
                {verificationResult.error || 'This location is not in a registered community.'}
              </Text>
              {nearbyNeighborhoods.length > 0 && (
                <Text style={styles.suggestionsText}>
                  Nearby: {nearbyNeighborhoods.map(n => n.name).join(', ')}
                </Text>
              )}
            </View>
          ) : null}

          {/* Confirm Button */}
          <TouchableOpacity 
            style={[
              styles.confirmButton,
              !selectedLocation && styles.confirmButtonDisabled
            ]}
            onPress={handleConfirmLocation}
            disabled={!selectedLocation}
          >
            <Text style={styles.confirmButtonText}>
              {verificationResult?.verified ? 'Join This Community' : 'Use This Location'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.pureWhite,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.softGray,
  },
  backButton: {
    marginRight: spacing.md,
  },
  backButtonText: {
    fontSize: typography.sizes.lg,
    color: colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    color: colors.neutral.richCharcoal,
  },
  instructionsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.neutral.warmOffWhite,
  },
  instructionsText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.friendlyGray,
    textAlign: 'center',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: width,
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: typography.sizes.base,
    color: colors.neutral.richCharcoal,
  },
  quickJumpContainer: {
    paddingVertical: spacing.md,
    paddingLeft: spacing.lg,
    backgroundColor: colors.neutral.warmOffWhite,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.softGray,
  },
  quickJumpTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.neutral.richCharcoal,
    marginBottom: spacing.sm,
  },
  quickJumpButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderRadius: 20,
    backgroundColor: colors.neutral.pureWhite,
  },
  quickJumpButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: '500',
  },
  statusContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.neutral.pureWhite,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.softGray,
  },
  verifiedStatus: {
    padding: spacing.md,
    backgroundColor: colors.accent.sage + '20',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: spacing.md,
  },
  verifiedTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  verifiedSubtitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '500',
    color: colors.neutral.richCharcoal,
    marginBottom: spacing.xs,
  },
  verifiedDetails: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.friendlyGray,
    textTransform: 'capitalize',
  },
  unverifiedStatus: {
    padding: spacing.md,
    backgroundColor: colors.accent.safetyRed + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent.safetyRed,
    marginBottom: spacing.md,
  },
  unverifiedTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.accent.safetyRed,
    marginBottom: spacing.xs,
  },
  unverifiedSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.richCharcoal,
    marginBottom: spacing.xs,
  },
  suggestionsText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.friendlyGray,
    fontStyle: 'italic',
  },
  confirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: colors.neutral.friendlyGray,
  },
  confirmButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.neutral.pureWhite,
  },
});

export default MapPickerScreen;