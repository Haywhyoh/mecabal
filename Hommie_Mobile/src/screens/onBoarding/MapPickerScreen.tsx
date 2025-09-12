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
  TextInput,
  FlatList,
} from 'react-native';
import MapView, { Marker, Circle, Region } from 'react-native-maps';
import { colors, spacing, typography } from '../../constants';
import { MeCabalLocation } from '../../services/location';
import { GooglePlacesService, PlaceResult } from '../../services/googlePlaces';

interface MapPickerScreenProps {
  navigation: any;
  route: any;
}

interface SelectedLocation {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
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
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [nearbyNeighborhoods, setNearbyNeighborhoods] = useState<NearbyNeighborhood[]>([]);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number, accuracy?: number} | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
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
    { id: 'surulere', name: 'Surulere', lat: 6.495, lng: 3.348, type: 'traditional_area', color: colors.accent.neighborPurple, radius_km: 3.5 },
    { id: 'yaba', name: 'Yaba', lat: 6.515, lng: 3.378, type: 'traditional_area', color: colors.accent.neighborPurple, radius_km: 2.8 },
    { id: 'ikeja', name: 'Ikeja', lat: 6.595, lng: 3.337, type: 'traditional_area', color: colors.accent.neighborPurple, radius_km: 4.0 },
    { id: 'mushin', name: 'Mushin', lat: 6.527, lng: 3.347, type: 'traditional_area', color: colors.accent.neighborPurple, radius_km: 3.2 },
    
    // Lagos Estates
    { id: 'vi', name: 'Victoria Island', lat: 6.430, lng: 3.415, type: 'estate', color: colors.primary, radius_km: 2.0 },
    { id: 'lekki', name: 'Lekki Phase 1', lat: 6.450, lng: 3.505, type: 'estate', color: colors.primary, radius_km: 1.5 },
    { id: 'ikeja-gra', name: 'Ikeja GRA', lat: 6.605, lng: 3.355, type: 'estate', color: colors.primary, radius_km: 1.2 },
    
    // Alimosho LGA Areas
    { id: 'abesan-estate', name: 'Abesan Estate', lat: 6.650, lng: 3.250, type: 'estate', color: colors.primary, radius_km: 1.5 },
    { id: 'abule-egba', name: 'Abule Egba', lat: 6.680, lng: 3.280, type: 'traditional_area', color: colors.accent.neighborPurple, radius_km: 3.0 },
    { id: 'ipaja', name: 'Ipaja', lat: 6.620, lng: 3.290, type: 'traditional_area', color: colors.accent.neighborPurple, radius_km: 2.8 },
    { id: 'ayobo', name: 'Ayobo', lat: 6.640, lng: 3.270, type: 'traditional_area', color: colors.accent.neighborPurple, radius_km: 2.5 },
    { id: 'iyana-ipaja', name: 'Iyana Ipaja', lat: 6.610, lng: 3.300, type: 'transport_hub', color: colors.accent.lagosOrange, radius_km: 2.0 },
    { id: 'egbeda', name: 'Egbeda', lat: 6.580, lng: 3.320, type: 'traditional_area', color: colors.accent.neighborPurple, radius_km: 2.2 },
    { id: 'idimu', name: 'Idimu', lat: 6.590, lng: 3.310, type: 'traditional_area', color: colors.accent.neighborPurple, radius_km: 2.0 },
    { id: 'ikotun', name: 'Ikotun', lat: 6.570, lng: 3.290, type: 'traditional_area', color: colors.accent.neighborPurple, radius_km: 2.5 },
    
    // Lagos Landmarks
    { id: 'computer-village', name: 'Computer Village Area', lat: 6.600, lng: 3.348, type: 'landmark_based', color: colors.accent.warmGold, radius_km: 1.8 },
    { id: 'unilag', name: 'UNILAG Area', lat: 6.515, lng: 3.397, type: 'landmark_based', color: colors.accent.warmGold, radius_km: 2.5 },
    
    // Transport & Commercial
    { id: 'ojota', name: 'Ojota Area', lat: 6.573, lng: 3.384, type: 'transport_hub', color: colors.accent.lagosOrange, radius_km: 1.5 },
    { id: 'alaba', name: 'Alaba Market Area', lat: 6.447, lng: 3.180, type: 'market_based', color: colors.accent.marketGreen, radius_km: 2.5 },
    { id: 'oshodi', name: 'Oshodi', lat: 6.550, lng: 3.307, type: 'transport_hub', color: colors.accent.lagosOrange, radius_km: 2.5 },
    
    // Ibeju-Lekki Areas
    { id: 'ajah', name: 'Ajah', lat: 6.460, lng: 3.620, type: 'traditional_area', color: colors.accent.neighborPurple, radius_km: 3.0 },
    { id: 'lekki-phase2', name: 'Lekki Phase 2', lat: 6.440, lng: 3.580, type: 'estate', color: colors.primary, radius_km: 2.0 },
    { id: 'sangotedo', name: 'Sangotedo', lat: 6.480, lng: 3.650, type: 'traditional_area', color: colors.accent.neighborPurple, radius_km: 2.5 },
  ];

  useEffect(() => {
    // Try to get user's current location and center map there
    getCurrentLocationForMap();
  }, []);

  // Handle map animation when map becomes ready and we have user location
  useEffect(() => {
    if (isMapReady && userLocation && mapRef.current) {
      console.log('🗺️ [MAP DEBUG] Map became ready, animating to user location:', userLocation);
      const region = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.005, // Closer zoom for better visibility
        longitudeDelta: 0.005,
      };
      
      // Use a timeout to ensure the map is fully rendered before animation
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.animateToRegion(region, 1500);
          setMapRegion(region);
        }
      }, 500);
    }
  }, [isMapReady, userLocation]);

  const getCurrentLocationForMap = async () => {
    try {
      setIsLoadingLocation(true);
      console.log('🗺️ [MAP DEBUG] Getting current location for map...');
      const location = await MeCabalLocation.getCurrentLocation();
      console.log('🗺️ [MAP DEBUG] Location result:', location);
      
      if (location && location.success && location.data) {
        console.log('🗺️ [MAP DEBUG] Setting map region to user location:', {
          latitude: location.data.latitude,
          longitude: location.data.longitude,
          accuracy: location.data.accuracy
        });
        
        // Store user location for debug display and marker
        setUserLocation({
          latitude: location.data.latitude,
          longitude: location.data.longitude,
          accuracy: location.data.accuracy
        });
        
        const newRegion = {
          latitude: location.data.latitude,
          longitude: location.data.longitude,
          latitudeDelta: 0.005, // Closer zoom for better visibility
          longitudeDelta: 0.005,
        };
        
        // Only set region state, let the useEffect handle animation when map is ready
        setMapRegion(newRegion);
        
        console.log('🗺️ [MAP DEBUG] User location set, will animate when map is ready');
        
      } else {
        console.log('🗺️ [MAP DEBUG] Location failed or no data, keeping default Lagos center');
      }
    } catch (error) {
      console.warn('🗺️ [MAP DEBUG] Could not get current location for map:', error);
      // Keep default Lagos center
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleMapPress = async (event: any) => {
    const { coordinate } = event.nativeEvent;
    console.log('🗺️ [MAP DEBUG] Map pressed at coordinates:', {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude
    });
    
    setSelectedLocation({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    });
    
    // Start verification process
    setIsVerifying(true);
    setVerificationResult(null);
    
    try {
      console.log('🗺️ [MAP DEBUG] Starting verification process...');
      
      // Start location verification immediately (don't wait for landmarks)
      const verificationPromise = MeCabalLocation.verifyLocation(
        route.params?.userId || 'temp-user',
        coordinate.latitude,
        coordinate.longitude
      );
      
      // Try to discover landmarks in parallel (with timeout)
      let landmarksResult = null;
      try {
        console.log('🗺️ [MAP DEBUG] Discovering nearby landmarks...');
        landmarksResult = await MeCabalLocation.discoverNearbyLandmarks(
          coordinate.latitude,
          coordinate.longitude,
          2000 // 2km radius for landmark discovery
        );
        console.log('🗺️ [MAP DEBUG] Landmarks result:', landmarksResult.success ? 'Success' : 'Failed');
      } catch (landmarkError) {
        console.warn('🗺️ [MAP DEBUG] Landmark discovery failed:', landmarkError);
        // Continue without landmarks - not critical for location verification
      }
      
      // Wait for location verification to complete
      const result = await verificationPromise;
      
      console.log('🗺️ [MAP DEBUG] Verification result:', result);
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

        // If landmarks were found, try to find neighborhood from landmarks
        if (landmarksResult && landmarksResult.success && landmarksResult.data?.landmarks && landmarksResult.data.landmarks.length > 0) {
          try {
            console.log('🗺️ [MAP DEBUG] Finding neighborhood from landmarks...');
            const landmarkNeighborhoodResult = await MeCabalLocation.findNeighborhoodFromLandmarks(
              coordinate.latitude,
              coordinate.longitude,
              landmarksResult.data.landmarks
            );

            if (landmarkNeighborhoodResult.success) {
              console.log('🗺️ [MAP DEBUG] Found neighborhood from landmarks:', landmarkNeighborhoodResult.data);
              // You can use this to enhance the verification result
            }
          } catch (landmarkNeighborhoodError) {
            console.warn('🗺️ [MAP DEBUG] Finding neighborhood from landmarks failed:', landmarkNeighborhoodError);
            // Continue - this is optional enhancement
          }
        } else {
          console.log('🗺️ [MAP DEBUG] No landmarks found or landmarks discovery failed, using fallback verification only');
        }
      } else if (result.suggestions && result.suggestions.length > 0) {
        // Show nearby suggestions
        setNearbyNeighborhoods(result.suggestions.map((suggestion: any) => ({
          id: suggestion.name.toLowerCase().replace(/\s+/g, '-'),
          name: suggestion.name,
          type: suggestion.type || 'area',
          distance: suggestion.distance || 0,
          confidence: 0.5
        })));
      } else {
        // No nearby neighborhoods found - show fallback options
        setNearbyNeighborhoods([
          {
            id: 'propose-new',
            name: 'Propose New Community',
            type: 'proposal',
            distance: 0,
            confidence: 1
          },
          {
            id: 'join-nearby',
            name: 'Join Nearby Community',
            type: 'nearby',
            distance: 0,
            confidence: 1
          },
          {
            id: 'set-custom',
            name: 'Set Custom Area Name',
            type: 'custom',
            distance: 0,
            confidence: 1
          }
        ]);
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


  const handleFallbackOption = (option: any) => {
    if (!selectedLocation) return;

    switch (option.id) {
      case 'propose-new':
        navigation.navigate('ProposeNeighborhood', {
          initialLocation: selectedLocation,
          userId: route.params?.userId
        });
        break;
      case 'join-nearby':
        // Find nearby proposals
        findNearbyProposals();
        break;
      case 'set-custom':
        // Show custom area name input
        showCustomAreaInput();
        break;
    }
  };

  const findNearbyProposals = async () => {
    if (!selectedLocation) return;
    
    try {
      // This would integrate with the neighborhood proposals service
      Alert.alert(
        'Nearby Communities',
        'Searching for nearby community proposals...',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error finding nearby proposals:', error);
    }
  };

  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setShowSearchResults(true);
    setSearchError(null);

    try {
      console.log('🔍 [SEARCH] Starting search for:', query);
      
      // Use improved Google Places service with Nigerian location variations
      const result = await GooglePlacesService.searchNigerianLocationVariations(
        query,
        userLocation?.latitude,
        userLocation?.longitude
      );

      console.log('🔍 [SEARCH] Search result:', result);

      if (result.success && result.data) {
        setSearchResults(result.data);
        if (result.data.length === 0 && result.error) {
          setSearchError(result.error);
        }
      } else {
        setSearchResults([]);
        setSearchError(result.error || 'Search failed. Please try again.');
      }
    } catch (error) {
      console.error('🔍 [SEARCH ERROR]:', error);
      setSearchResults([]);
      setSearchError('Network error. Please check your internet connection.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (place: PlaceResult) => {
    const { lat, lng } = place.geometry.location;
    const location = {
      latitude: lat,
      longitude: lng,
      address: place.formatted_address
    };

    setSelectedLocation(location);
    setSearchQuery(place.name);
    setShowSearchResults(false);

    // Animate to the selected location
    const region = {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };

    if (mapRef.current) {
      mapRef.current.animateToRegion(region, 1000);
    }
    setMapRegion(region);

    // Start verification process
    setIsVerifying(true);
    setVerificationResult(null);
    
    // Verify the selected location
    setTimeout(() => {
      MeCabalLocation.verifyLocation(
        route.params?.userId || 'temp-user',
        lat,
        lng
      ).then(result => {
        setVerificationResult(result);
        setIsVerifying(false);
      }).catch(error => {
        console.error('Verification error:', error);
        setIsVerifying(false);
      });
    }, 1000);
  };

  const handleGoToCurrentLocation = () => {
    if (userLocation && mapRef.current) {
      const region = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      mapRef.current.animateToRegion(region, 1000);
      setMapRegion(region);
      
      // Set as selected location
      setSelectedLocation({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        address: 'Your current location'
      });
      setSearchQuery('Current Location');
    } else {
      // Try to get location again
      getCurrentLocationForMap();
    }
  };

  const showCustomAreaInput = () => {
    Alert.prompt(
      'Custom Area Name',
      'Enter a name for this area:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set',
          onPress: (areaName) => {
            if (areaName && areaName.trim()) {
              // Create a custom area entry
              if (onLocationSelected) {
                onLocationSelected({
                  location: selectedLocation,
                  neighborhood: {
                    id: 'custom-area',
                    name: areaName.trim(),
                    type: 'custom',
                    center: selectedLocation,
                    radius_km: 1.0,
                    member_count: 1,
                    recent_posts_count: 0
                  },
                  verified: true
                });
              }
              navigation.goBack();
            }
          }
        }
      ],
      'plain-text',
      '',
      'default'
    );
  };

  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'estate': return colors.primary;
      case 'traditional_area': return colors.accent.neighborPurple;
      case 'landmark_based': return colors.accent.warmGold;
      case 'transport_hub': return colors.accent.lagosOrange;
      case 'market_based': return colors.accent.marketGreen;
      case 'road_based': return colors.accent.trustBlue;
      default: return '#8E8E8E';
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

      {/* Search and Location Input - Uber Style */}
      <View style={styles.locationInputContainer}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search estates, areas, or landmarks..."
              placeholderTextColor={colors.friendlyGray}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                handleSearch(text);
              }}
              onFocus={() => setShowSearchResults(searchQuery.length >= 2)}
              onBlur={() => {
                // Delay closing to allow selection
                setTimeout(() => {
                  setShowSearchResults(false);
                  setSearchError(null);
                }, 150);
              }}
              returnKeyType="search"
              onSubmitEditing={() => {
                if (searchResults.length > 0) {
                  handleSelectSearchResult(searchResults[0]);
                }
              }}
              autoCorrect={false}
              autoCapitalize="words"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowSearchResults(false);
                  setSearchError(null);
                }}
              >
                <Text style={styles.clearSearchText}>✖</Text>
              </TouchableOpacity>
            )}
          </View>
          {isSearching && (
            <ActivityIndicator size="small" color={colors.primary} style={styles.searchLoader} />
          )}
        </View>

        {/* Location Coordinates Display */}
        <View style={styles.locationDisplay}>
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Selected Location:</Text>
            {selectedLocation ? (
              <View style={styles.coordinatesContainer}>
                <Text style={styles.coordinatesText}>
                  {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                </Text>
                {selectedLocation.address && (
                  <Text style={styles.addressText} numberOfLines={1}>
                    {selectedLocation.address}
                  </Text>
                )}
              </View>
            ) : userLocation ? (
              <View style={styles.coordinatesContainer}>
                <Text style={styles.coordinatesText}>
                  {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
                </Text>
                <Text style={styles.addressText}>Current location detected</Text>
              </View>
            ) : (
              <Text style={styles.noLocationText}>
                {isLoadingLocation ? 'Getting location...' : 'Tap map or search to select location'}
              </Text>
            )}
          </View>
          
          {/* Go Button */}
          {userLocation && (
            <TouchableOpacity
              style={styles.goButton}
              onPress={handleGoToCurrentLocation}
            >
              <Text style={styles.goButtonText}>Go</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Results */}
        {showSearchResults && (
          <View style={styles.searchResults}>
            {isSearching ? (
              <View style={styles.searchLoadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.searchLoadingText}>Searching Nigerian locations...</Text>
              </View>
            ) : searchError ? (
              <View style={styles.searchErrorContainer}>
                <Text style={styles.searchErrorIcon}>⚠️</Text>
                <Text style={styles.searchErrorText}>{searchError}</Text>
                <Text style={styles.searchErrorHint}>
                  Try searching for: "Ikeja", "Victoria Island", or "Lekki"
                </Text>
              </View>
            ) : searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.place_id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.searchResultItem}
                    onPress={() => handleSelectSearchResult(item)}
                  >
                    <View style={styles.searchResultContent}>
                      <Text style={styles.searchResultName}>{item.name}</Text>
                      <Text style={styles.searchResultAddress} numberOfLines={2}>
                        {item.formatted_address}
                      </Text>
                      {item.types && item.types.length > 0 && (
                        <Text style={styles.searchResultType}>
                          {item.types[0].replace(/_/g, ' ')}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.searchResultArrow}>→</Text>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
                style={styles.searchResultsList}
              />
            ) : (
              <View style={styles.searchEmptyContainer}>
                <Text style={styles.searchEmptyIcon}>📍</Text>
                <Text style={styles.searchEmptyText}>No locations found</Text>
                <Text style={styles.searchEmptyHint}>
                  Try different keywords or check spelling
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Debug Panel */}
      <View style={styles.debugPanel}>
        <Text style={styles.debugTitle}>Debug Info:</Text>
        {userLocation && (
          <Text style={styles.debugText}>
            User Location: {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
          </Text>
        )}
        {selectedLocation && (
          <Text style={styles.debugText}>
            Selected: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
          </Text>
        )}
        {verificationResult && (
          <Text style={styles.debugText}>
            Verified: {verificationResult.verified ? 'Yes' : 'No'}
            {verificationResult.verified && verificationResult.neighborhood && (
              <Text> - {verificationResult.neighborhood.name}</Text>
            )}
          </Text>
        )}
        {searchError && (
          <Text style={[styles.debugText, { color: colors.accent.safetyRed }]}>
            Search Error: {searchError}
          </Text>
        )}
        <Text style={styles.debugText}>
          API Key: {process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Configured' : 'Missing'}
        </Text>
        
        {/* Test Search Buttons */}
        <View style={styles.testButtonsContainer}>
          <Text style={styles.testButtonsTitle}>Quick Test:</Text>
          <View style={styles.testButtonsRow}>
            {['Abesan Estate', 'Victoria Island', 'Lekki Phase 1', 'Ikeja GRA'].map((testQuery) => (
              <TouchableOpacity
                key={testQuery}
                style={styles.testButton}
                onPress={() => {
                  setSearchQuery(testQuery);
                  handleSearch(testQuery);
                }}
              >
                <Text style={styles.testButtonText}>{testQuery}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={mapRegion}
          onRegionChange={setMapRegion}
          onPress={(event) => {
            // Close search results when tapping on map
            setShowSearchResults(false);
            handleMapPress(event);
          }}
          onMapReady={() => {
            console.log('🗺️ [MAP DEBUG] Map is ready');
            setIsMapReady(true);
          }}
          showsUserLocation={false}
          showsMyLocationButton={false}
          toolbarEnabled={false}
        >
          {/* User location marker */}
          {userLocation && (
            <Marker
              coordinate={userLocation}
              title="Your Current Location"
              description={`GPS location (Accuracy: ${userLocation.accuracy || 'Unknown'}m)`}
              pinColor={colors.primary}
            >
              <View style={styles.currentLocationMarker}>
                <View style={styles.currentLocationDot} />
              </View>
            </Marker>
          )}

          {/* Selected location marker */}
          {selectedLocation && (
            <Marker
              coordinate={selectedLocation}
              title="Selected Location"
              description={selectedLocation.address || "Your chosen location"}
              pinColor={verificationResult?.verified ? colors.primary : colors.accent.safetyRed}
            />
          )}

          {/* Show only nearby neighborhoods (within 5km of selected location) */}
          {selectedLocation && neighborhoodCenters
            .map(neighborhood => ({
              ...neighborhood,
              distance: MeCabalLocation.calculateDistance(
                selectedLocation.latitude,
                selectedLocation.longitude,
                neighborhood.lat,
                neighborhood.lng
              )
            }))
            .filter(neighborhood => neighborhood.distance <= 5) // Only show within 5km
            .sort((a, b) => a.distance - b.distance) // Sort by distance
            .slice(0, 3) // Show only top 3 closest
            .map((neighborhood) => (
              <React.Fragment key={neighborhood.id}>
                {/* Neighborhood marker */}
                <Marker
                  coordinate={{
                    latitude: neighborhood.lat,
                    longitude: neighborhood.lng
                  }}
                  title={neighborhood.name}
                  description={`${neighborhood.type.replace('_', ' ')} community (${neighborhood.distance.toFixed(1)}km away)`}
                  pinColor={getMarkerColor(neighborhood.type)}
                />
                {/* Single circle for the neighborhood */}
                <Circle
                  center={{
                    latitude: neighborhood.lat,
                    longitude: neighborhood.lng
                  }}
                  radius={neighborhood.radius_km * 1000}
                  fillColor={`${neighborhood.color}15`}
                  strokeColor={neighborhood.color}
                  strokeWidth={2}
                />
              </React.Fragment>
            ))}

          {/* Community area circle for verified neighborhoods */}
          {verificationResult?.verified && selectedLocation && verificationResult.neighborhood && (
            <Circle
              center={selectedLocation}
              radius={verificationResult.neighborhood.radius_km * 1000} // Dynamic radius from neighborhood data
              fillColor={`${colors.primary}20`}
              strokeColor={colors.primary}
              strokeWidth={3}
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
                <View style={styles.suggestionsContainer}>
                  {nearbyNeighborhoods.map((neighborhood, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.suggestionItem,
                        neighborhood.type === 'proposal' && styles.suggestionItemProposal,
                        neighborhood.type === 'nearby' && styles.suggestionItemNearby,
                        neighborhood.type === 'custom' && styles.suggestionItemCustom,
                      ]}
                      onPress={() => {
                        if (neighborhood.type === 'proposal' || neighborhood.type === 'nearby' || neighborhood.type === 'custom') {
                          handleFallbackOption(neighborhood);
                        }
                      }}
                    >
                      <Text style={[
                        styles.suggestionText,
                        (neighborhood.type === 'proposal' || neighborhood.type === 'nearby' || neighborhood.type === 'custom') && styles.suggestionTextAction
                      ]}>
                        {neighborhood.name}
                      </Text>
                      {(neighborhood.type === 'proposal' || neighborhood.type === 'nearby' || neighborhood.type === 'custom') && (
                        <Text style={styles.suggestionArrow}>→</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
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
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
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
    color: '#2C2C2C',
  },
  instructionsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.neutral.offWhite,
  },
  instructionsText: {
    fontSize: typography.sizes.sm,
    color: '#8E8E8E',
    textAlign: 'center',
  },
  debugPanel: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  debugTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: spacing.xs,
  },
  debugText: {
    fontSize: typography.sizes.xs,
    color: '#666666',
    fontFamily: 'monospace',
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
    color: '#2C2C2C',
  },
  statusContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.lightGray,
  },
  verifiedStatus: {
    padding: spacing.md,
    backgroundColor: colors.mintGreen,
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
    color: '#2C2C2C',
    marginBottom: spacing.xs,
  },
  verifiedDetails: {
    fontSize: typography.sizes.sm,
    color: '#8E8E8E',
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
    color: '#2C2C2C',
    marginBottom: spacing.xs,
  },
  suggestionsText: {
    fontSize: typography.sizes.sm,
    color: '#8E8E8E',
    fontStyle: 'italic',
  },
  suggestionsContainer: {
    marginTop: spacing.md,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: 8,
    backgroundColor: colors.neutral.offWhite,
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
  },
  suggestionItemProposal: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  suggestionItemNearby: {
    backgroundColor: colors.accent.neighborPurple + '10',
    borderColor: colors.accent.neighborPurple,
  },
  suggestionItemCustom: {
    backgroundColor: colors.accent.warmGold + '10',
    borderColor: colors.accent.warmGold,
  },
  suggestionText: {
    fontSize: typography.sizes.sm,
    color: '#2C2C2C',
    flex: 1,
  },
  suggestionTextAction: {
    fontWeight: '600',
  },
  suggestionArrow: {
    fontSize: typography.sizes.lg,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#8E8E8E',
  },
  confirmButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  currentLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  // Location Input Container - Uber Style
  locationInputContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
    zIndex: 1000, // Ensure it's above the map
  },
  searchContainer: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.offWhite,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
    color: colors.friendlyGray,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.base,
    color: colors.richCharcoal,
  },
  clearSearchButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  clearSearchText: {
    fontSize: 14,
    color: colors.friendlyGray,
  },
  searchLoader: {
    position: 'absolute',
    right: spacing.md,
    top: '50%',
    marginTop: -10,
  },
  locationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral.offWhite,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
  },
  locationInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  locationLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: '500',
    color: colors.friendlyGray,
    marginBottom: spacing.xs,
  },
  coordinatesContainer: {
    flexDirection: 'column',
  },
  coordinatesText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.richCharcoal,
    fontFamily: 'monospace',
  },
  addressText: {
    fontSize: typography.sizes.xs,
    color: colors.friendlyGray,
    marginTop: 2,
  },
  noLocationText: {
    fontSize: typography.sizes.sm,
    color: colors.friendlyGray,
    fontStyle: 'italic',
  },
  goButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.white,
  },
  searchResults: {
    position: 'absolute',
    top: '100%',
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: 200,
    zIndex: 2000,
  },
  searchResultsList: {
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultName: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.richCharcoal,
    marginBottom: spacing.xs,
  },
  searchResultAddress: {
    fontSize: typography.sizes.sm,
    color: colors.friendlyGray,
    marginBottom: 2,
  },
  searchResultType: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  searchResultArrow: {
    fontSize: typography.sizes.lg,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  searchLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  searchLoadingText: {
    fontSize: typography.sizes.sm,
    color: colors.friendlyGray,
    marginLeft: spacing.sm,
  },
  searchErrorContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  searchErrorIcon: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  searchErrorText: {
    fontSize: typography.sizes.sm,
    color: colors.accent.safetyRed,
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  searchErrorHint: {
    fontSize: typography.sizes.xs,
    color: colors.friendlyGray,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  searchEmptyContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  searchEmptyIcon: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  searchEmptyText: {
    fontSize: typography.sizes.sm,
    color: colors.friendlyGray,
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  searchEmptyHint: {
    fontSize: typography.sizes.xs,
    color: colors.friendlyGray,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  testButtonsContainer: {
    marginTop: spacing.sm,
  },
  testButtonsTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: spacing.xs,
  },
  testButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  testButton: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  testButtonText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: '500',
  },
});

export default MapPickerScreen;