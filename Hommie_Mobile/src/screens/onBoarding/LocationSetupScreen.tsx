import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Alert, Animated, TextInput, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants';
import { contextAwareGoBack } from '../../utils/navigationUtils';
import { MeCabalLocation, MeCabalAuth } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';
import { locationApi } from '../../services/api/locationApi';
import type { State, LGA } from '../../types/location.types';
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
  const [states, setStates] = useState<State[]>([]);
  const [lgas, setLGAs] = useState<LGA[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [selectedLgaId, setSelectedLgaId] = useState<string>('');
  const [cityTown, setCityTown] = useState<string>('');
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);
  const [showLGAModal, setShowLGAModal] = useState(false);

  const { register, setUser } = useAuth();
  const { setSelectedState, setSelectedLGA, setCurrentCoordinates } = useLocation();

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

  // Load states on mount
  useEffect(() => {
    loadStates();
  }, []);

  // Load LGAs when state changes
  useEffect(() => {
    if (selectedStateId) {
      loadLGAs(selectedStateId);
    } else {
      setLGAs([]);
      setSelectedLgaId('');
    }
  }, [selectedStateId]);

  const loadStates = async () => {
    try {
      setIsLoadingStates(true);
      const statesData = await locationApi.getStates();
      setStates(statesData);
    } catch (error) {
      console.error('Error loading states:', error);
      Alert.alert('Error', 'Failed to load states. Please try again.');
    } finally {
      setIsLoadingStates(false);
    }
  };

  const loadLGAs = async (stateId: string) => {
    try {
      const lgasData = await locationApi.getLGAsByState(stateId);
      setLGAs(lgasData);
    } catch (error) {
      console.error('Error loading LGAs:', error);
      Alert.alert('Error', 'Failed to load LGAs. Please try again.');
    }
  };

  // Reverse geocode coordinates to get state/LGA
  const reverseGeocodeLocation = async (latitude: number, longitude: number) => {
    try {
      const result = await locationApi.reverseGeocode({ latitude, longitude });
      if (result.success && result.data) {
        const { state, lga, city } = result.data;
        
        // Find matching state
        if (state) {
          const matchingState = states.find(s => 
            s.name.toLowerCase() === state.toLowerCase() ||
            state.toLowerCase().includes(s.name.toLowerCase())
          );
          if (matchingState) {
            setSelectedStateId(matchingState.id);
            setSelectedState(matchingState);
            
            // Load LGAs and find matching LGA
            const lgasData = await locationApi.getLGAsByState(matchingState.id);
            setLGAs(lgasData);
            
            if (lga) {
              const matchingLGA = lgasData.find((l: LGA) =>
                l.name.toLowerCase().includes(lga.toLowerCase()) ||
                lga.toLowerCase().includes(l.name.toLowerCase())
              );
              if (matchingLGA) {
                setSelectedLgaId(matchingLGA.id);
                setSelectedLGA(matchingLGA);
              }
            }
          }
        }
        
        if (city) {
          setCityTown(city);
        }
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  // Navigate to EstateSelection with location data
  const navigateToEstateSelection = () => {
    if (!selectedStateId || !selectedLgaId) {
      Alert.alert('Incomplete Location', 'Please select both state and LGA to continue.');
      return;
    }

    const selectedStateObj = states.find(s => s.id === selectedStateId);
    const selectedLgaObj = lgas.find(l => l.id === selectedLgaId);

    // Set in LocationContext for EstateSelectionScreen to use
    if (selectedStateObj) {
      setSelectedState(selectedStateObj);
    }
    if (selectedLgaObj) {
      setSelectedLGA(selectedLgaObj);
    }
    if (coordinates) {
      setCurrentCoordinates(coordinates);
    }

    // Navigate to EstateSelection with location data
    navigation.navigate('EstateSelection', {
      locationData: {
        stateId: selectedStateId,
        stateName: selectedStateObj?.name,
        lgaId: selectedLgaId,
        lgaName: selectedLgaObj?.name,
        cityTown: cityTown,
        coordinates: coordinates,
        userId: userId,
        userDetails: userDetails,
      },
    });
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
              
              const lat = location.data.latitude;
              const lng = location.data.longitude;
              
              // Store coordinates
              setCoordinates({ latitude: lat, longitude: lng });
              setCurrentCoordinates({ latitude: lat, longitude: lng });
              
              // Reverse geocode to get state/LGA
              await reverseGeocodeLocation(lat, lng);
              
              // Show confirmation with state/LGA selection
              Alert.alert(
                'Location Detected',
                `We found your location: ${location.data?.address || 'Coordinates detected'}\n\nPlease confirm your state and LGA below, then continue to select your estate.`,
                [{ text: 'Continue', onPress: () => {
                  // User will select state/LGA in the UI, then click continue button
                }}]
              );
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
      onLocationSelected: async (result: any) => {
        const lat = result.latitude;
        const lng = result.longitude;
        
        // Store coordinates
        setCoordinates({ latitude: lat, longitude: lng });
        setCurrentCoordinates({ latitude: lat, longitude: lng });
        
        // Reverse geocode to get state/LGA
        await reverseGeocodeLocation(lat, lng);
        
        // Show confirmation
        Alert.alert(
          'Location Selected',
          `Location: ${result.address || 'Coordinates selected'}\n\nPlease confirm your state and LGA below, then continue to select your estate.`,
          [{ text: 'Continue' }]
        );
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

          {/* State/LGA Selection - Show after location is detected */}
          {(selectedOption === 'gps' || selectedOption === 'map') && coordinates && (
            <View style={styles.locationFormSection}>
              <Text style={styles.formSectionTitle}>Confirm Your Location</Text>
              
              {/* State Selection */}
              <View style={styles.formField}>
                <Text style={styles.formLabel}>State *</Text>
                {isLoadingStates ? (
                  <Text style={styles.loadingText}>Loading states...</Text>
                ) : (
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => setShowStateModal(true)}
                  >
                    <Text style={[styles.selectButtonText, !selectedStateId && styles.selectButtonPlaceholder]}>
                      {selectedStateId
                        ? states.find(s => s.id === selectedStateId)?.name
                        : 'Select your state'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* LGA Selection */}
              {selectedStateId && (
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>LGA (Local Government Area) *</Text>
                  {lgas.length === 0 ? (
                    <Text style={styles.loadingText}>Loading LGAs...</Text>
                  ) : (
                    <TouchableOpacity
                      style={styles.selectButton}
                      onPress={() => setShowLGAModal(true)}
                    >
                      <Text style={[styles.selectButtonText, !selectedLgaId && styles.selectButtonPlaceholder]}>
                        {selectedLgaId
                          ? lgas.find(l => l.id === selectedLgaId)?.name
                          : 'Select your LGA'}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* City/Town (Optional) */}
              {selectedStateId && selectedLgaId && (
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>City/Town (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter city or town"
                    value={cityTown}
                    onChangeText={setCityTown}
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>
              )}

              {/* Continue Button */}
              {selectedStateId && selectedLgaId && (
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={navigateToEstateSelection}
                >
                  <Text style={styles.continueButtonText}>Continue to Estate Selection</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

        </View>
      </View>

      {/* State Selection Modal */}
      <Modal visible={showStateModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowStateModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select State</Text>
            <TouchableOpacity onPress={() => setShowStateModal(false)}>
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={states}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  selectedStateId === item.id && styles.modalItemSelected,
                ]}
                onPress={() => {
                  setSelectedStateId(item.id);
                  const stateObj = states.find(s => s.id === item.id);
                  if (stateObj) {
                    setSelectedState(stateObj);
                  }
                  setShowStateModal(false);
                }}
              >
                <Text style={styles.modalItemText}>{item.name}</Text>
                {selectedStateId === item.id && (
                  <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* LGA Selection Modal */}
      <Modal visible={showLGAModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowLGAModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select LGA</Text>
            <TouchableOpacity onPress={() => setShowLGAModal(false)}>
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={lgas}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  selectedLgaId === item.id && styles.modalItemSelected,
                ]}
                onPress={() => {
                  setSelectedLgaId(item.id);
                  const lgaObj = lgas.find(l => l.id === item.id);
                  if (lgaObj) {
                    setSelectedLGA(lgaObj);
                  }
                  setShowLGAModal(false);
                }}
              >
                <Text style={styles.modalItemText}>
                  {item.name} {item.type === 'LCDA' ? '(LCDA)' : ''}
                </Text>
                {selectedLgaId === item.id && (
                  <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

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
  locationFormSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  formField: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    minHeight: 48,
  },
  selectButtonText: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  selectButtonPlaceholder: {
    color: COLORS.textSecondary,
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 48,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalCancelText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalDoneText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  modalItemSelected: {
    backgroundColor: COLORS.lightGreen,
  },
  modalItemText: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
});
