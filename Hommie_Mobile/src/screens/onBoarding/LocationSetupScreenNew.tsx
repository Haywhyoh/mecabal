// Redesigned Location Setup Screen
// New flow with GPS and manual options following 8dp grid system

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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocation } from '../../contexts/LocationContext';
import { HierarchicalLocationSelector, GPSLocationPicker } from '../../components/location';
import {
  State,
  LGA,
  Ward,
  Neighborhood,
  LocationHierarchy,
} from '../../types/location.types';

const { width: screenWidth } = Dimensions.get('window');

// MeCabal brand colors
const MECABAL_GREEN = '#00A651';
const MECABAL_GREEN_LIGHT = '#E8F5E8';

interface LocationSetupScreenProps {
  navigation: any;
  route: {
    params?: {
      isSignup?: boolean;
      userDetails?: any;
      userId?: string;
      existingUser?: any;
      onSetupComplete?: () => void;
    };
  };
}

type SetupStep = 'welcome' | 'method-selection' | 'gps-picker' | 'manual-selector' | 'confirmation';

export default function LocationSetupScreenNew({ navigation, route }: LocationSetupScreenProps) {
  // Route params
  const { isSignup = false, userDetails, userId, existingUser, onSetupComplete } = route.params || {};

  // Context
  const {
    selectedState,
    selectedLGA,
    selectedWard,
    selectedNeighborhood,
    currentCoordinates,
    isLoadingLocation,
    locationError,
    clearLocationSelection,
    saveUserLocation,
  } = useLocation();

  // Local state
  const [currentStep, setCurrentStep] = useState<SetupStep>('welcome');
  const [selectedMethod, setSelectedMethod] = useState<'gps' | 'manual' | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationHierarchy | null>(null);
  const [cityTown, setCityTown] = useState('');
  const [showSkipWarning, setShowSkipWarning] = useState(false);

  // Progress calculation
  const getProgress = () => {
    switch (currentStep) {
      case 'welcome': return 0.2;
      case 'method-selection': return 0.4;
      case 'gps-picker':
      case 'manual-selector': return 0.6;
      case 'confirmation': return 0.8;
      default: return 1.0;
    }
  };

  // Initialize component
  useEffect(() => {
    // Clear any existing location selection
    clearLocationSelection();
  }, []);

  // Handle location selection from GPS picker
  const handleGPSLocationSelected = useCallback((location: {
    coordinates: { latitude: number; longitude: number };
    neighborhood?: Neighborhood;
    address?: string;
  }) => {
    if (location.neighborhood && selectedState && selectedLGA) {
      setSelectedLocation({
        state: selectedState,
        lga: selectedLGA,
        ward: selectedWard || undefined,
        neighborhood: location.neighborhood,
      });
      setCityTown(location.address || '');
      setCurrentStep('confirmation');
    }
  }, [selectedState, selectedLGA, selectedWard]);

  // Handle location selection from manual selector
  const handleManualLocationSelected = useCallback((location: {
    state: State;
    lga: LGA;
    ward?: Ward;
    neighborhood: Neighborhood;
  }) => {
    setSelectedLocation(location);
    setCurrentStep('confirmation');
  }, []);

  // Handle skip with warning
  const handleSkip = () => {
    // During registration, location is required
    if (isSignup) {
      Alert.alert(
        'Location Required',
        'Location is required to complete your registration. This helps us connect you with your neighborhood community.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!showSkipWarning) {
      setShowSkipWarning(true);
      return;
    }

    Alert.alert(
      'Skip Location Setup',
      'You can add your location later in settings, but this will limit your access to neighborhood features and local recommendations.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Skip Anyway', 
          style: 'destructive',
          onPress: () => {
            // Navigate to next onboarding step
            if (onSetupComplete) {
              onSetupComplete();
            } else {
              navigation.navigate('ProfileSetupScreen');
            }
          }
        },
      ]
    );
  };

  // Handle continue to next step
  const handleContinue = async () => {
    if (!selectedLocation) return;

    try {
      // Save location to user profile
      await saveUserLocation({
        stateId: selectedLocation.state.id,
        lgaId: selectedLocation.lga.id,
        wardId: selectedLocation.ward?.id,
        neighborhoodId: selectedLocation.neighborhood.id,
        cityTown: cityTown || undefined,
        coordinates: currentCoordinates || {
          latitude: selectedLocation.neighborhood.coordinates?.latitude || 0,
          longitude: selectedLocation.neighborhood.coordinates?.longitude || 0,
        },
        isPrimary: true,
        verificationStatus: 'UNVERIFIED' as any,
      });

      // Haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Navigate to next step based on context
      if (isSignup) {
        // During registration, go to neighborhood recommendation
        navigation.navigate('NeighborhoodRecommendation');
      } else if (onSetupComplete) {
        // If there's a completion callback, use it
        onSetupComplete();
      } else {
        // Default to profile setup
        navigation.navigate('ProfileSetupScreen');
      }
    } catch (error) {
      console.error('Error saving location:', error);
      Alert.alert('Error', 'Failed to save your location. Please try again.');
    }
  };

  // Render progress indicator
  const renderProgressIndicator = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${getProgress() * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>
        Step {currentStep === 'welcome' ? 1 : currentStep === 'method-selection' ? 2 : 
              currentStep === 'gps-picker' || currentStep === 'manual-selector' ? 3 : 4} of 4
      </Text>
    </View>
  );

  // Render welcome step
  const renderWelcomeStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="location" size={64} color={MECABAL_GREEN} />
      </View>
      
      <Text style={styles.title}>Let's Find Your Neighborhood</Text>
      <Text style={styles.subtitle}>
        Your location helps us connect you with neighbors, local events, and nearby services in your area.
      </Text>

      <View style={styles.benefitsContainer}>
        <View style={styles.benefitItem}>
          <Ionicons name="people" size={20} color={MECABAL_GREEN} />
          <Text style={styles.benefitText}>Connect with neighbors</Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="calendar" size={20} color={MECABAL_GREEN} />
          <Text style={styles.benefitText}>Discover local events</Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="storefront" size={20} color={MECABAL_GREEN} />
          <Text style={styles.benefitText}>Find nearby services</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setCurrentStep('method-selection')}
        accessibilityLabel="Continue to location selection"
        accessibilityRole="button"
      >
        <Text style={styles.primaryButtonText}>Get Started</Text>
        <Ionicons name="arrow-forward" size={20} color="white" />
      </TouchableOpacity>

      {!isSignup && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          accessibilityLabel="Skip location setup"
          accessibilityRole="button"
        >
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render method selection step
  const renderMethodSelectionStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>How would you like to set your location?</Text>
      <Text style={styles.subtitle}>
        Choose the method that works best for you
      </Text>

      <View style={styles.methodOptionsContainer}>
        <TouchableOpacity
          style={styles.methodOption}
          onPress={() => {
            setSelectedMethod('gps');
            setCurrentStep('gps-picker');
          }}
          accessibilityLabel="Use GPS to detect location"
          accessibilityRole="button"
        >
          <View style={styles.methodOptionIcon}>
            <Ionicons name="locate" size={32} color={MECABAL_GREEN} />
          </View>
          <View style={styles.methodOptionContent}>
            <Text style={styles.methodOptionTitle}>Use GPS</Text>
            <Text style={styles.methodOptionSubtitle}>
              Automatically detect your location and show nearby neighborhoods
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.methodOption}
          onPress={() => {
            setSelectedMethod('manual');
            setCurrentStep('manual-selector');
          }}
          accessibilityLabel="Select location manually"
          accessibilityRole="button"
        >
          <View style={styles.methodOptionIcon}>
            <Ionicons name="list" size={32} color={MECABAL_GREEN} />
          </View>
          <View style={styles.methodOptionContent}>
            <Text style={styles.methodOptionTitle}>Select Manually</Text>
            <Text style={styles.methodOptionSubtitle}>
              Choose your state, LGA, and neighborhood step by step
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setCurrentStep('welcome')}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Ionicons name="arrow-back" size={20} color="#8E8E93" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );

  // Render confirmation step
  const renderConfirmationStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.confirmationIcon}>
        <Ionicons name="checkmark-circle" size={64} color={MECABAL_GREEN} />
      </View>

      <Text style={styles.title}>Location Confirmed!</Text>
      <Text style={styles.subtitle}>
        We've found your neighborhood
      </Text>

      {selectedLocation && (
        <View style={styles.locationCard}>
          <Text style={styles.locationName}>{selectedLocation.neighborhood.name}</Text>
          <Text style={styles.locationDetails}>
            {selectedLocation.neighborhood.type} • {selectedLocation.lga.name}, {selectedLocation.state.name}
          </Text>
          {selectedLocation.neighborhood.isGated && (
            <View style={styles.gatedIndicator}>
              <Ionicons name="lock-closed" size={16} color="#FF3B30" />
              <Text style={styles.gatedText}>Gated Community</Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleContinue}
        accessibilityLabel="Continue to next step"
        accessibilityRole="button"
      >
        <Text style={styles.primaryButtonText}>Continue</Text>
        <Ionicons name="arrow-forward" size={20} color="white" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setCurrentStep(selectedMethod === 'gps' ? 'gps-picker' : 'manual-selector')}
        accessibilityLabel="Go back to location selection"
        accessibilityRole="button"
      >
        <Ionicons name="arrow-back" size={20} color="#8E8E93" />
        <Text style={styles.backButtonText}>Change Location</Text>
      </TouchableOpacity>
    </View>
  );

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcomeStep();
      case 'method-selection':
        return renderMethodSelectionStep();
      case 'gps-picker':
        return (
          <GPSLocationPicker
            onLocationSelected={handleGPSLocationSelected}
            initialCoordinates={currentCoordinates || undefined}
            showMap={true}
            allowManualInput={true}
            onCancel={() => setCurrentStep('method-selection')}
          />
        );
      case 'manual-selector':
        return (
          <HierarchicalLocationSelector
            onLocationSelected={handleManualLocationSelected}
            showProgress={false}
            allowSkip={false}
            onCancel={() => setCurrentStep('method-selection')}
          />
        );
      case 'confirmation':
        return renderConfirmationStep();
      default:
        return renderWelcomeStep();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderProgressIndicator()}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: MECABAL_GREEN,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 17,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  benefitsContainer: {
    marginBottom: 32,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MECABAL_GREEN,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: 'white',
    marginRight: 8,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 17,
    color: '#8E8E93',
  },
  methodOptionsContainer: {
    marginBottom: 32,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
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
  methodOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: MECABAL_GREEN_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodOptionContent: {
    flex: 1,
    marginRight: 12,
  },
  methodOptionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  methodOptionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 17,
    color: '#8E8E93',
    marginLeft: 8,
  },
  confirmationIcon: {
    alignItems: 'center',
    marginBottom: 24,
  },
  locationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  locationDetails: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 12,
  },
  gatedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  gatedText: {
    fontSize: 14,
    color: '#FF3B30',
    marginLeft: 8,
    fontWeight: '500',
  },
});
