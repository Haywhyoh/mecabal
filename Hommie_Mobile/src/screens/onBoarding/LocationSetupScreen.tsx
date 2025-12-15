import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
    icon: 'location' as keyof typeof Ionicons.glyphMap,
    color: COLORS.primary,
    recommended: true,
  },
  {
    id: 'map',
    title: 'Pick on Map',
    subtitle: 'Select location visually',
    icon: 'map' as keyof typeof Ionicons.glyphMap,
    color: COLORS.secondary,
    recommended: false,
  },
];

export default function LocationSetupScreen({ navigation, route }: any) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

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
                  `We detected your location (${location.data.address || 'coordinates found'}) but couldn't match it to a registered neighborhood.\n\nPlease try selecting your location on the map instead.`,
                  [
                    { text: 'Use Map', onPress: () => handleMapLocation() },
                    { text: 'Cancel', style: 'cancel' }
                  ]
                );
              }
            } else {
              Alert.alert(
                'Location Error', 
                (location && location.error) || 'Unable to get your current location. Please try selecting your location on the map instead.',
                [
                  { text: 'Use Map', onPress: () => handleMapLocation() },
                  { text: 'Try Again', onPress: () => handleGPSLocation(), style: 'cancel' }
                ]
              );
            }
          } catch (error) {
            console.error('Location error:', error);
            Alert.alert(
              'Location Error', 
              'Failed to access your location. Please try selecting your location on the map instead.',
              [{ text: 'Use Map', onPress: () => handleMapLocation() }]
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
                      <Ionicons name={option.icon} size={24} color={option.color} />
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
