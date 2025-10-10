import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Alert, Animated } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants';
import { contextAwareGoBack } from '../../utils/navigationUtils';
import { MeCabalLocation, MeCabalAuth } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import * as Haptics from 'expo-haptics';

const LOCATION_OPTIONS = [
  {
    id: 'gps',
    title: 'Auto-detect',
    subtitle: 'Fastest and most accurate',
    icon: 'location.fill',
    color: COLORS.primary,
    recommended: true,
  },
  {
    id: 'map',
    title: 'Pick on Map',
    subtitle: 'Select location visually',
    icon: 'map.fill',
    color: COLORS.secondary,
    recommended: false,
  },
  {
    id: 'landmark',
    title: 'Nearby Landmark',
    subtitle: 'Find me by a landmark',
    icon: 'building.2.fill',
    color: COLORS.orange,
    recommended: false,
  },
];

export default function LocationSetupScreen({ navigation, route }: any) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showLandmarks, setShowLandmarks] = useState(false);
  const [selectedLandmark, setSelectedLandmark] = useState<any>(null);
  const [landmarks, setLandmarks] = useState<any[]>([]);
  const [landmarksLoading, setLandmarksLoading] = useState(false);

  const { register, setUser } = useAuth();

  // Animation values
  const scaleAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;

  // Get or create scale animation for option
  const getScaleAnimation = (optionId: string) => {
    if (!scaleAnimations[optionId]) {
      scaleAnimations[optionId] = new Animated.Value(1);
    }
    return scaleAnimations[optionId];
  };

  const language = route.params?.language || 'en';
  const phoneNumber = route.params?.phoneNumber || '';
  const firstName = route.params?.firstName || '';
  const communications = route.params?.communications || {};
  const onSetupComplete = route.params?.onSetupComplete;
  const userId = route.params?.userId;
  const userDetails = route.params?.userDetails;

  // Function to complete location setup and authenticate user
  const completeLocationSetup = async (locationData?: {
    state?: string;
    city?: string;
    estate?: string;
    location?: string;
    landmark?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  }) => {
    try {
      // Save location data to backend if provided
      if (locationData) {
        console.log('Saving location data for authenticated user');

        // First test if JWT authentication works with a simpler endpoint
        console.log('Testing JWT authentication with /auth/me endpoint...');
        const testAuthResult = await MeCabalAuth.getCurrentUser();
        console.log('Auth test result:', testAuthResult ? 'Success' : 'Failed');

        const locationResult = await MeCabalAuth.setupLocation({
          ...locationData,
          completeRegistration: true
        });

        if (!locationResult.success) {
          Alert.alert('Error', locationResult.error || 'Failed to save location');
          return;
        }

        console.log('Location saved successfully to backend');
      }

      if (userDetails) {
        // Now set user as fully authenticated after location setup is complete
        setUser(userDetails);
        console.log('✅ Location setup completed - user now fully authenticated:', userDetails.id);
      } else if (onSetupComplete) {
        // Fallback to callback if no userDetails
        onSetupComplete();
      } else {
        // Fallback: navigate to main app
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      }
    } catch (error) {
      console.error('Failed to complete authentication:', error);
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
    }
  };

  const handleOptionSelect = (optionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Selection animation
    const scaleAnim = getScaleAnimation(optionId);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.02,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setSelectedOption(optionId);
    
    if (optionId === 'gps') {
      handleGPSLocation();
    } else if (optionId === 'map') {
      handleMapLocation();
    } else if (optionId === 'landmark') {
      loadNearbyLandmarks();
    }
  };

  const loadNearbyLandmarks = async () => {
    setShowLandmarks(true);
    setLandmarksLoading(true);
    
    try {
      // Try to get user's current location first to find nearby landmarks
      const location = await MeCabalLocation.getCurrentLocation();
      
      // Comprehensive null safety checks
      if (location && typeof location === 'object' && location.success === true && 
          location.data && typeof location.data === 'object' && 
          typeof location.data.latitude === 'number' && typeof location.data.longitude === 'number') {
        
        // Use real coordinates to find landmarks
        const landmarkResult = await MeCabalLocation.discoverNearbyLandmarks(
          location.data.latitude,
          location.data.longitude
        );
        
        if (landmarkResult && landmarkResult.success && landmarkResult.data?.landmarks && Array.isArray(landmarkResult.data.landmarks)) {
          setLandmarks(landmarkResult.data.landmarks.map((landmark: any) => ({
            id: landmark.id || String(Math.random()),
            name: landmark.name || 'Unknown Landmark',
            type: landmark.type || 'Location',
            distance: `${landmark.distance || 0} km`
          })));
        } else {
          // Fallback to default landmarks if discovery fails
          console.warn('Landmark discovery failed, using fallback landmarks:', landmarkResult?.error);
          setLandmarks([
            { id: 1, name: 'Ikeja City Mall', type: 'Shopping Center', distance: '0.2 km' },
            { id: 2, name: 'St. Mary\'s Catholic Church', type: 'Church', distance: '0.5 km' },
            { id: 3, name: 'Ikeja Grammar School', type: 'School', distance: '0.8 km' },
            { id: 4, name: 'Ikeja Market', type: 'Market', distance: '1.0 km' },
            { id: 5, name: 'Allen Avenue', type: 'Major Road', distance: '0.3 km' },
          ]);
        }
      } else {
        // Fallback to default landmarks if location access fails
        setLandmarks([
          { id: 1, name: 'Ikeja City Mall', type: 'Shopping Center', distance: '0.2 km' },
          { id: 2, name: 'St. Mary\'s Catholic Church', type: 'Church', distance: '0.5 km' },
          { id: 3, name: 'Ikeja Grammar School', type: 'School', distance: '0.8 km' },
          { id: 4, name: 'Ikeja Market', type: 'Market', distance: '1.0 km' },
          { id: 5, name: 'Allen Avenue', type: 'Major Road', distance: '0.3 km' },
        ]);
      }
    } catch (error) {
      console.error('Error loading landmarks:', error);
      // Use fallback landmarks
      setLandmarks([
        { id: 1, name: 'Ikeja City Mall', type: 'Shopping Center', distance: '0.2 km' },
        { id: 2, name: 'St. Mary\'s Catholic Church', type: 'Church', distance: '0.5 km' },
        { id: 3, name: 'Ikeja Grammar School', type: 'School', distance: '0.8 km' },
        { id: 4, name: 'Ikeja Market', type: 'Market', distance: '1.0 km' },
        { id: 5, name: 'Allen Avenue', type: 'Major Road', distance: '0.3 km' },
      ]);
    } finally {
      setLandmarksLoading(false);
    }
  };

  const handleGPSLocation = async () => {
    Alert.alert(
      'Allow "MeCabal" to access your location?',
      'This helps us connect you with your neighbors and show relevant community updates.',
      [
        { text: 'Don\'t Allow', style: 'cancel' },
        { text: 'Allow', onPress: async () => {
          try {
            // Get user's current location using the enhanced service
            const location = await MeCabalLocation.getCurrentLocation();
            
            // Comprehensive null safety checks
            if (location && typeof location === 'object' && location.success === true && 
                location.data && typeof location.data === 'object' && 
                typeof location.data.latitude === 'number' && typeof location.data.longitude === 'number') {
              
              // Verify location with Supabase
              const verification = await MeCabalLocation.verifyLocation(
                route.params?.userId || 'temp-user',
                location.data.latitude,
                location.data.longitude,
                location.data.address
              );
              
              if (verification && verification.verified && verification.neighborhood) {
                Alert.alert(
                  'Location Verified!',
                  `Welcome to ${verification.neighborhood.name}!\n\nAddress: ${location.data?.address || 'Location detected'}\nAccuracy: ${Math.round(location.data?.accuracy || 0)}m`,
                  [{ text: 'Continue', onPress: () => completeLocationSetup({
                    state: (verification.neighborhood as any)?.state || '',
                    city: (verification.neighborhood as any)?.city || '',
                    estate: verification.neighborhood?.name || '',
                    latitude: location.data?.latitude,
                    longitude: location.data?.longitude,
                    address: location.data?.address
                  }) }]
                );
              } else {
                Alert.alert(
                  'Location Not Recognized',
                  `We detected your location (${location.data.address || 'coordinates found'}) but couldn't match it to a registered neighborhood.\n\nWould you like to try selecting a landmark nearby?`,
                  [
                    { text: 'Try Landmark', onPress: () => setSelectedOption('landmark') },
                    { text: 'Manual Entry', onPress: () => handleManualAddress() }
                  ]
                );
              }
            } else {
              Alert.alert(
                'Location Error', 
                (location && location.error) || 'Unable to get your current location. Please try again or select a landmark.',
                [
                  { text: 'Try Again', onPress: () => handleGPSLocation() },
                  { text: 'Use Landmark', onPress: () => setSelectedOption('landmark') }
                ]
              );
            }
          } catch (error) {
            console.error('Location error:', error);
            Alert.alert(
              'Location Error', 
              'Failed to access your location. Please try selecting a landmark instead.',
              [{ text: 'OK', onPress: () => setSelectedOption('landmark') }]
            );
          }
        }}
      ]
    );
  };

  const handleMapLocation = () => {
    navigation.navigate('MapPicker', {
      userId: route.params?.userId,
      onLocationSelected: (result: any) => {
        if (result.verified) {
          Alert.alert(
            'Location Confirmed!',
            `Welcome to ${result.neighborhood.name}! You're now part of this MeCabal community.`,
            [
              {
                text: 'Continue',
                onPress: () => completeLocationSetup({
                  state: result.neighborhood.state,
                  city: result.neighborhood.city,
                  estate: result.neighborhood.name,
                  latitude: result.latitude,
                  longitude: result.longitude,
                  address: result.address
                })
              }
            ]
          );
        } else {
          Alert.alert(
            'Location Selected',
            'Your location has been set, but it\'s not in a registered community yet. You can still use MeCabal with limited community features.',
            [
              {
                text: 'Continue',
                onPress: () => completeLocationSetup({
                  latitude: result.latitude,
                  longitude: result.longitude,
                  address: result.address
                })
              }
            ]
          );
        }
      }
    });
  };

  const handleLandmarkSelect = async (landmark: any) => {
    setSelectedLandmark(landmark);
    setShowLandmarks(false);
    
    try {
      // Verify landmark-based location
      const verification = await MeCabalLocation.verifyLandmarkLocation(
        route.params?.userId || 'temp-user',
        landmark.name,
        landmark.type
      );
      
      if (verification.verified && verification.neighborhood) {
        Alert.alert(
          'Location Verified!',
          `Welcome to ${verification.neighborhood.name}! Your location has been verified based on ${landmark.name}.`,
          [{ text: 'Continue', onPress: () => completeLocationSetup({
            state: (verification.neighborhood as any)?.state || '',
            city: (verification.neighborhood as any)?.city || '',
            estate: verification.neighborhood?.name || '',
            landmark: landmark.name,
            latitude: landmark.latitude,
            longitude: landmark.longitude
          }) }]
        );
      } else {
        Alert.alert(
          'Location Not Found',
          'We couldn\'t verify your location based on this landmark. Please try another landmark or enter your address manually.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Landmark verification error:', error);
      Alert.alert('Verification Error', 'Failed to verify your location. Please try again.');
    }
  };

  const handleContinue = () => {
    if (selectedOption === 'landmark' && selectedLandmark) {
      // TODO: Save landmark selection and proceed
      Alert.alert('Location Set', `You've selected ${selectedLandmark.name}. Welcome to MeCabal!`, [
        { text: 'Continue', onPress: () => completeLocationSetup({
          landmark: selectedLandmark.name,
          latitude: selectedLandmark.latitude,
          longitude: selectedLandmark.longitude,
          address: selectedLandmark.address
        }) }
      ]);
    } else if (selectedOption === 'gps') {
      // GPS already handled
    } else if (selectedOption === 'map') {
      // Map already handled
    }
  };

  const handleManualAddress = () => {
    Alert.alert(
      'Manual Address',
      'Enter your address manually. If your estate/compound doesn\'t exist, we\'ll create a pending place for review.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => completeLocationSetup({
          address: 'Manual entry - pending verification'
        }) }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden={true} />
      
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => contextAwareGoBack(navigation, 'onboarding')}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          
        </View>

        <View style={styles.heroSection}>
          <Text style={styles.title}>Where do you live?</Text>
          <Text style={styles.subtitle}>This helps us connect you with your neighbors</Text>
        </View>


        {/* Main Content */}
        <View style={[styles.mainContent, {
        
        }]} >
          
          {/* Location Options */}
          <View style={styles.optionsContainer}>
            {LOCATION_OPTIONS.map((option) => (
              <Animated.View
                key={option.id}
                style={[
                  {
                    transform: [{ scale: getScaleAnimation(option.id) }]
                  }
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.optionCard,
                    option.recommended && styles.optionCardRecommended,
                    selectedOption === option.id && styles.optionCardSelected
                  ]}
                  onPress={() => handleOptionSelect(option.id)}
                  accessibilityLabel={option.title}
                  accessibilityHint={option.subtitle}
                  accessibilityRole="button"
                >
                  <View style={styles.optionContent}>
                    <View style={[
                      styles.optionIconContainer,
                      option.recommended && styles.optionIconContainerRecommended
                    ]}>
                      <Text style={styles.optionIcon}>{option.icon}</Text>
                    </View>
                    <View style={styles.optionInfo}>
                      <View style={styles.optionHeader}>
                        <Text style={[
                          styles.optionTitle,
                          option.recommended && styles.optionTitleRecommended
                        ]}>
                          {option.title}
                        </Text>
                        {option.recommended && (
                          <View style={styles.recommendedBadge}>
                            <Text style={styles.recommendedText}>✓</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[
                        styles.optionSubtitle,
                        option.recommended && styles.optionSubtitleRecommended
                      ]}>
                        {option.subtitle}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {/* Landmarks List */}
          {showLandmarks && (
            <View style={styles.landmarksSection}>
              <Text style={styles.landmarksTitle}>Choose a landmark nearby</Text>
              
              {landmarksLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Finding landmarks near you...</Text>
                </View>
              ) : landmarks.length > 0 ? (
                <View style={styles.landmarksList}>
                  {landmarks.map((landmark) => (
                    <TouchableOpacity
                      key={landmark.id}
                      style={[
                        styles.landmarkItem,
                        selectedLandmark?.id === landmark.id && styles.landmarkItemSelected
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        handleLandmarkSelect(landmark);
                      }}
                      accessibilityLabel={`${landmark.name}, ${landmark.type}`}
                      accessibilityHint={`${landmark.distance} away`}
                      accessibilityRole="button"
                    >
                      <View style={styles.landmarkIcon}>
                        <Text style={styles.landmarkIconText}>📍</Text>
                      </View>
                      <View style={styles.landmarkInfo}>
                        <Text style={styles.landmarkName}>{landmark.name}</Text>
                        <Text style={styles.landmarkType}>{landmark.type}</Text>
                      </View>
                      <Text style={styles.landmarkDistance}>{landmark.distance}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.noLandmarksContainer}>
                  <Text style={styles.noLandmarksText}>No landmarks found nearby</Text>
                </View>
              )}

              <TouchableOpacity 
                style={styles.manualAddressButton} 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handleManualAddress();
                }}
                accessibilityLabel="Enter address manually"
                accessibilityRole="button"
              >
                <Text style={styles.manualAddressText}>Enter address manually</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Fixed Bottom Continue Button */}
      {selectedOption && (
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity 
            style={[
              styles.continueButton,
              selectedOption === 'landmark' && !selectedLandmark && styles.continueButtonDisabled
            ]} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleContinue();
            }}
            disabled={selectedOption === 'landmark' && !selectedLandmark}
            accessibilityLabel="Continue with location setup"
            accessibilityRole="button"
          >
            <Text style={[
              styles.continueButtonText,
              selectedOption === 'landmark' && !selectedLandmark && styles.continueButtonTextDisabled
            ]}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100, // Space for fixed button
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonText: {
    fontSize: 17,
    color: COLORS.primary,
    fontWeight: '400',
  },
  heroSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 41,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    color: COLORS.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  mainContent: {
    flex: 1,
  },
  optionsContainer: {
    marginBottom: 32,
    gap: 12,
  },
  optionCard: {
    backgroundColor: COLORS.white,
    height: 64,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  optionCardRecommended: {
    height: 80,
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.small,
  },
  optionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.lightGreen,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionIconContainerRecommended: {
    backgroundColor: COLORS.primary + '20',
  },
  optionIcon: {
    fontSize: 20,
    color: COLORS.primary,
  },
  optionInfo: {
    flex: 1,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
  optionTitleRecommended: {
    fontSize: 18,
    fontWeight: '700',
  },
  optionSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  optionSubtitleRecommended: {
    fontSize: 16,
    fontWeight: '500',
  },
  recommendedBadge: {
    backgroundColor: COLORS.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendedText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  landmarksSection: {
    marginBottom: 32,
  },
  landmarksTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  landmarksList: {
    gap: 8,
  },
  landmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    height: 56,
  },
  landmarkItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.lightGreen,
  },
  landmarkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  landmarkIconText: {
    fontSize: 16,
  },
  landmarkInfo: {
    flex: 1,
  },
  landmarkName: {
    fontSize: 17,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 2,
  },
  landmarkType: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  landmarkDistance: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '500',
  },
  manualAddressButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 16,
  },
  manualAddressText: {
    fontSize: 17,
    color: COLORS.primary,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  bottomButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 34, // Safe area bottom
    backgroundColor: COLORS.white,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5E5',
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.neutral.lightGray,
    opacity: 0.4,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '600',
  },
  continueButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 17,
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  noLandmarksContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noLandmarksText: {
    fontSize: 17,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '400',
  },
});
