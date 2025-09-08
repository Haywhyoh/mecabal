import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Alert } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants';
import { contextAwareGoBack } from '../../utils/navigationUtils';
import { MeCabalLocation } from '../../services';

const LOCATION_OPTIONS = [
  {
    id: 'gps',
    title: 'Auto-detect',
    subtitle: 'Use my current location',
    description: 'Most accurate and fastest',
    icon: '📍',
    color: COLORS.primary,
    recommended: true,
  },
  {
    id: 'map',
    title: 'Pick on Map',
    subtitle: 'Select location visually',
    description: 'Choose exactly where you are',
    icon: '🗺️',
    color: COLORS.secondary,
    recommended: false,
  },
  {
    id: 'landmark',
    title: 'Nearby Landmark',
    subtitle: 'Find me by a landmark',
    description: 'School, church, or market',
    icon: '🏛️',
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

  const language = route.params?.language || 'en';
  const phoneNumber = route.params?.phoneNumber || '';
  const firstName = route.params?.firstName || '';
  const communications = route.params?.communications || {};
  const onSetupComplete = route.params?.onSetupComplete;

  const handleOptionSelect = (optionId: string) => {
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
          location.data.longitude,
          2, // 2km radius
          10 // max 10 landmarks
        );
        
        if (landmarkResult && landmarkResult.success && landmarkResult.landmarks && Array.isArray(landmarkResult.landmarks)) {
          setLandmarks(landmarkResult.landmarks.map(landmark => ({
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
      'Location Access',
      'MeCabal needs access to your location to show you relevant community updates.',
      [
        { text: 'Cancel', style: 'cancel' },
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
                  `Welcome to ${verification.neighborhood.name}!\n\nAddress: ${location.data.address || 'Location detected'}\nAccuracy: ${Math.round(location.data.accuracy)}m`,
                  [{ text: 'Continue', onPress: () => {
                    if (onSetupComplete) onSetupComplete();
                  }}]
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
                onPress: () => {
                  if (onSetupComplete) onSetupComplete();
                }
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
                onPress: () => {
                  if (onSetupComplete) onSetupComplete();
                }
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
          [{ text: 'Continue', onPress: () => {
            if (onSetupComplete) onSetupComplete();
          }}]
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
      Alert.alert('Location Set', `You've selected ${selectedLandmark.name}. Welcome to MeCabal!`);
      if (onSetupComplete) onSetupComplete();
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
        { text: 'Continue', onPress: () => {
          // TODO: Navigate to manual address input
          if (onSetupComplete) onSetupComplete();
        }}
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
          <Text style={styles.title}>Where are you?</Text>
          <Text style={styles.subtitle}>Help us connect you with your neighbors</Text>
        </View>


        {/* Main Content */}
        <View style={[styles.mainContent, {
        
        }]} >
          
          {/* Location Options */}
          <View style={styles.optionsContainer}>
            {LOCATION_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  selectedOption === option.id && styles.optionCardSelected
                ]}
                onPress={() => handleOptionSelect(option.id)}
              >
                <View style={styles.optionContent}>
                  <View style={styles.optionIconContainer}>
                    <Text style={styles.optionIcon}>{option.icon}</Text>
                  </View>
                  <View style={styles.optionInfo}>
                    <View style={styles.optionHeader}>
                      <Text style={styles.optionTitle}>{option.title}</Text>
                      {option.recommended && (
                        <View style={styles.recommendedBadge}>
                          <Text style={styles.recommendedText}>✓</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                </View>
              </TouchableOpacity>
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
                <>
                  {landmarks.map((landmark) => (
                    <TouchableOpacity
                      key={landmark.id}
                      style={[
                        styles.landmarkItem,
                        selectedLandmark?.id === landmark.id && styles.landmarkItemSelected
                      ]}
                      onPress={() => handleLandmarkSelect(landmark)}
                    >
                      <View style={styles.landmarkInfo}>
                        <Text style={styles.landmarkName}>{landmark.name}</Text>
                        <Text style={styles.landmarkType}>{landmark.type}</Text>
                      </View>
                      <Text style={styles.landmarkDistance}>{landmark.distance}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              ) : (
                <View style={styles.noLandmarksContainer}>
                  <Text style={styles.noLandmarksText}>No landmarks found nearby</Text>
                </View>
              )}

              <TouchableOpacity style={styles.manualAddressButton} onPress={handleManualAddress}>
                <Text style={styles.manualAddressText}>Enter address manually</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Continue Button */}
          {selectedOption && (
            <TouchableOpacity 
              style={[
                styles.continueButton,
                selectedOption === 'landmark' && !selectedLandmark && styles.continueButtonDisabled
              ]} 
              onPress={handleContinue}
              disabled={selectedOption === 'landmark' && !selectedLandmark}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  backButton: {
    marginBottom: SPACING.md,
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.text,
    fontWeight: '600',
  },
  heroSection: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizes.xxl,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  mainContent: {
    flex: 1,
  },
  optionsContainer: {
    marginBottom: SPACING.xl,
  },
  optionCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  optionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.lightGreen,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  optionIcon: {
    fontSize: 24,
  },
  optionInfo: {
    flex: 1,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  optionTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  optionSubtitle: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
  },
  recommendedBadge: {
    backgroundColor: COLORS.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendedText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.xs,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  landmarksSection: {
    marginBottom: SPACING.xl,
  },
  landmarksTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  landmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.offWhite,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  landmarkItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.lightGreen,
  },
  landmarkInfo: {
    flex: 1,
  },
  landmarkName: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  landmarkType: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
  },
  landmarkDistance: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  manualAddressButton: {
    alignItems: 'center',
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  manualAddressText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.primary,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.medium,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.lightGray,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  noLandmarksContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  noLandmarksText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
