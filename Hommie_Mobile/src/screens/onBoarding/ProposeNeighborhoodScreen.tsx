import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { colors, spacing, typography } from '../../constants';
import { MeCabalLocation } from '../../services/location';
import { NeighborhoodProposalsService, CreateProposalData } from '../../services/neighborhoodProposals';
import { GooglePlacesService } from '../../services/googlePlaces';

interface ProposeNeighborhoodScreenProps {
  navigation: any;
  route: any;
}

const { width, height } = Dimensions.get('window');

const ProposeNeighborhoodScreen: React.FC<ProposeNeighborhoodScreenProps> = ({ navigation, route }) => {
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 6.5244,
    longitude: 3.3792,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nearbyLandmarks, setNearbyLandmarks] = useState<any[]>([]);
  const [nearbyBusinesses, setNearbyBusinesses] = useState<any[]>([]);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    state_name: 'Lagos',
    lga: '',
    proposed_radius_km: 2.0,
    neighborhood_type: 'traditional_area' as const,
  });

  const neighborhoodTypes = [
    { value: 'estate', label: 'Estate/Compound' },
    { value: 'traditional_area', label: 'Traditional Area' },
    { value: 'road_based', label: 'Road-based Community' },
    { value: 'landmark_based', label: 'Landmark-based Area' },
    { value: 'transport_hub', label: 'Transport Hub Area' },
    { value: 'market_based', label: 'Market Area' },
  ];

  useEffect(() => {
    // Get initial location
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const location = await MeCabalLocation.getCurrentLocation();
      if (location && location.success && location.data) {
        const newRegion = {
          latitude: location.data.latitude,
          longitude: location.data.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        };
        setMapRegion(newRegion);
        setSelectedLocation({
          latitude: location.data.latitude,
          longitude: location.data.longitude,
        });
        await discoverNearbyPlaces(location.data.latitude, location.data.longitude);
      }
    } catch (error) {
      console.warn('Could not get current location:', error);
    }
  };

  const discoverNearbyPlaces = async (latitude: number, longitude: number) => {
    setIsLoading(true);
    try {
      const result = await MeCabalLocation.discoverNearbyLandmarks(latitude, longitude, 2000);
      if (result.success && result.data) {
        setNearbyLandmarks(result.data.landmarks);
        setNearbyBusinesses(result.data.businesses);
      }
    } catch (error) {
      console.error('Error discovering nearby places:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapPress = async (event: any) => {
    const { coordinate } = event.nativeEvent;
    setSelectedLocation({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    });
    await discoverNearbyPlaces(coordinate.latitude, coordinate.longitude);
  };

  const handleSubmit = async () => {
    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a location on the map');
      return;
    }

    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a neighborhood name');
      return;
    }

    setIsSubmitting(true);
    try {
      const proposalData: CreateProposalData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        state_name: formData.state_name,
        lga: formData.lga.trim(),
        center_latitude: selectedLocation.latitude,
        center_longitude: selectedLocation.longitude,
        proposed_radius_km: formData.proposed_radius_km,
        neighborhood_type: formData.neighborhood_type,
        landmarks: nearbyLandmarks.slice(0, 10), // Limit to top 10 landmarks
        businesses: nearbyBusinesses.slice(0, 10), // Limit to top 10 businesses
      };

      const result = await NeighborhoodProposalsService.createProposal(
        proposalData,
        route.params?.userId || 'temp-user'
      );

      if (result.success) {
        Alert.alert(
          'Proposal Submitted',
          'Your neighborhood proposal has been submitted for review. You will be notified when it is approved.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to submit proposal');
      }
    } catch (error) {
      console.error('Error submitting proposal:', error);
      Alert.alert('Error', 'Failed to submit proposal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Propose New Community</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Map Section */}
        <View style={styles.mapContainer}>
          <Text style={styles.sectionTitle}>Select Location</Text>
          <Text style={styles.sectionDescription}>
            Tap on the map to select the center of your proposed community
          </Text>
          
          <View style={styles.mapWrapper}>
            <MapView
              style={styles.map}
              region={mapRegion}
              onRegionChange={setMapRegion}
              onPress={handleMapPress}
              showsUserLocation={true}
              showsMyLocationButton={true}
            >
              {selectedLocation && (
                <>
                  <Marker
                    coordinate={selectedLocation}
                    title="Proposed Community Center"
                    description="Tap to select this location"
                  />
                  <Circle
                    center={selectedLocation}
                    radius={formData.proposed_radius_km * 1000}
                    fillColor={`${colors.primary}20`}
                    strokeColor={colors.primary}
                    strokeWidth={2}
                  />
                </>
              )}
            </MapView>
            
            {isLoading && (
              <View style={styles.mapLoadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.mapLoadingText}>Discovering nearby places...</Text>
              </View>
            )}
          </View>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Community Details</Text>
          
          {/* Community Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Community Name *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="e.g., Abesan Estate, New GRA Phase 2"
              placeholderTextColor={colors.neutral.friendlyGray}
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Describe your community, its features, and why it should be added..."
              placeholderTextColor={colors.neutral.friendlyGray}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* State */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>State *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.state_name}
              onChangeText={(text) => setFormData({ ...formData, state_name: text })}
              placeholder="Lagos"
            />
          </View>

          {/* LGA */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Local Government Area (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={formData.lga}
              onChangeText={(text) => setFormData({ ...formData, lga: text })}
              placeholder="e.g., Alimosho, Ikeja, Surulere"
            />
          </View>

          {/* Community Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Community Type *</Text>
            <View style={styles.typeSelector}>
              {neighborhoodTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeOption,
                    formData.neighborhood_type === type.value && styles.typeOptionSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, neighborhood_type: type.value as any })}
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      formData.neighborhood_type === type.value && styles.typeOptionTextSelected,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Radius */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Community Radius (km) *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.proposed_radius_km.toString()}
              onChangeText={(text) => {
                const radius = parseFloat(text);
                if (!isNaN(radius) && radius > 0 && radius <= 50) {
                  setFormData({ ...formData, proposed_radius_km: radius });
                }
              }}
              placeholder="2.0"
              keyboardType="numeric"
            />
            <Text style={styles.inputHelpText}>
              Suggested radius: 1-3km for estates, 2-5km for traditional areas
            </Text>
          </View>
        </View>

        {/* Nearby Places Section */}
        {(nearbyLandmarks.length > 0 || nearbyBusinesses.length > 0) && (
          <View style={styles.placesContainer}>
            <Text style={styles.sectionTitle}>Nearby Places Found</Text>
            <Text style={styles.sectionDescription}>
              These places will help verify your community location
            </Text>
            
            {nearbyLandmarks.length > 0 && (
              <View style={styles.placesGroup}>
                <Text style={styles.placesGroupTitle}>Landmarks ({nearbyLandmarks.length})</Text>
                {nearbyLandmarks.slice(0, 5).map((landmark, index) => (
                  <View key={index} style={styles.placeItem}>
                    <Text style={styles.placeName}>{landmark.name}</Text>
                    <Text style={styles.placeAddress}>{landmark.address}</Text>
                  </View>
                ))}
              </View>
            )}
            
            {nearbyBusinesses.length > 0 && (
              <View style={styles.placesGroup}>
                <Text style={styles.placesGroupTitle}>Businesses ({nearbyBusinesses.length})</Text>
                {nearbyBusinesses.slice(0, 5).map((business, index) => (
                  <View key={index} style={styles.placeItem}>
                    <Text style={styles.placeName}>{business.name}</Text>
                    <Text style={styles.placeAddress}>{business.address}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting || !selectedLocation || !formData.name.trim()}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.neutral.pureWhite} />
          ) : (
            <Text style={styles.submitButtonText}>Submit Proposal</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  content: {
    flex: 1,
  },
  mapContainer: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.neutral.richCharcoal,
    marginBottom: spacing.sm,
  },
  sectionDescription: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.friendlyGray,
    marginBottom: spacing.md,
  },
  mapWrapper: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapLoadingText: {
    marginTop: spacing.sm,
    fontSize: typography.sizes.sm,
    color: colors.neutral.richCharcoal,
  },
  formContainer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.softGray,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.neutral.richCharcoal,
    marginBottom: spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.neutral.softGray,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.base,
    color: colors.neutral.richCharcoal,
    backgroundColor: colors.neutral.pureWhite,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputHelpText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.friendlyGray,
    marginTop: spacing.xs,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.neutral.softGray,
    backgroundColor: colors.neutral.pureWhite,
  },
  typeOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeOptionText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.richCharcoal,
  },
  typeOptionTextSelected: {
    color: colors.neutral.pureWhite,
    fontWeight: '600',
  },
  placesContainer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.softGray,
  },
  placesGroup: {
    marginBottom: spacing.lg,
  },
  placesGroupTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.neutral.richCharcoal,
    marginBottom: spacing.sm,
  },
  placeItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.softGray,
  },
  placeName: {
    fontSize: typography.sizes.sm,
    fontWeight: '500',
    color: colors.neutral.richCharcoal,
  },
  placeAddress: {
    fontSize: typography.sizes.xs,
    color: colors.neutral.friendlyGray,
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    margin: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.neutral.softGray,
  },
  submitButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.neutral.pureWhite,
  },
});

export default ProposeNeighborhoodScreen;

