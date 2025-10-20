// Hierarchical Location Selector Component
// Multi-step location selection with progress indicator following Apple HIG + Material Design

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  AccessibilityInfo,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../../contexts/LocationContext';
import { locationApi } from '../../services/api/locationApi';
import {
  State,
  LGA,
  Ward,
  Neighborhood,
  HierarchicalLocationSelectorProps,
  LocationError,
  LocationErrorCode,
} from '../../types/location.types';

const { width: screenWidth } = Dimensions.get('window');

// Step definitions
const STEPS = {
  STATE: 0,
  LGA: 1,
  CITY_TOWN: 2,
  WARD: 3,
  NEIGHBORHOOD: 4,
} as const;

type Step = typeof STEPS[keyof typeof STEPS];

interface StepData {
  states: State[];
  lgas: LGA[];
  wards: Ward[];
  neighborhoods: Neighborhood[];
  cityTown: string;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
}

export const HierarchicalLocationSelector: React.FC<HierarchicalLocationSelectorProps> = ({
  onLocationSelected,
  initialLocation,
  showProgress = true,
  allowSkip = false,
  onSkip,
  onCancel,
}) => {
  // Safe area insets as fallback
  const insets = useSafeAreaInsets();
  
  // Context
  const {
    selectedState,
    selectedLGA,
    selectedWard,
    selectedNeighborhood,
    currentCoordinates,
    recommendedNeighborhoods,
    isLoadingLocation,
    locationError,
    setSelectedState,
    setSelectedLGA,
    setSelectedWard,
    setSelectedNeighborhood,
    getCurrentLocation,
    getRecommendations,
    clearLocationSelection,
  } = useLocation();

  // Local state
  const [currentStep, setCurrentStep] = useState<Step>(STEPS.STATE);
  const [stepData, setStepData] = useState<StepData>({
    states: [],
    lgas: [],
    wards: [],
    neighborhoods: [],
    cityTown: '',
    searchQuery: '',
    isLoading: false,
    error: null,
  });

  // Refs for accessibility
  const stepRefs = useRef<{ [key: number]: View | null }>({});
  const searchInputRef = useRef<TextInput>(null);

  // Initialize component
  useEffect(() => {
    initializeComponent();
  }, []);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [currentStep]);

  // Focus management for accessibility
  useEffect(() => {
    if (Platform.OS === 'ios') {
      const ref = stepRefs.current[currentStep];
      if (ref) {
        // Focus will be handled by the component itself
        // AccessibilityInfo.setAccessibilityFocus requires a native tag
      }
    }
  }, [currentStep]);

  const initializeComponent = async () => {
    try {
      // Set initial location if provided
      if (initialLocation) {
        if (initialLocation.state) {
          setSelectedState(initialLocation.state);
          setCurrentStep(STEPS.LGA);
        }
        if (initialLocation.lga) {
          setSelectedLGA(initialLocation.lga);
          setCurrentStep(STEPS.CITY_TOWN);
        }
        if (initialLocation.ward) {
          setSelectedWard(initialLocation.ward);
          setCurrentStep(STEPS.NEIGHBORHOOD);
        }
        if (initialLocation.neighborhood) {
          setSelectedNeighborhood(initialLocation.neighborhood);
        }
      }

      // Try to get current location for recommendations
      if (currentCoordinates) {
        await getRecommendations(currentCoordinates.latitude, currentCoordinates.longitude);
      } else {
        await getCurrentLocation();
      }
    } catch (error) {
      console.error('Error initializing component:', error);
    }
  };

  const loadInitialData = async () => {
    try {
      setStepData(prev => ({ ...prev, isLoading: true, error: null }));

      // Add data validation to prevent JSI errors
      if (typeof currentStep !== 'number' || currentStep < 0 || currentStep > 4) {
        throw new Error('Invalid current step');
      }

      switch (currentStep) {
        case STEPS.STATE:
          await loadStates();
          break;
        case STEPS.LGA:
          if (selectedState && selectedState.id && typeof selectedState.id === 'string') {
            await loadLGAs(selectedState.id);
          }
          break;
        case STEPS.WARD:
          if (selectedLGA && selectedLGA.id && typeof selectedLGA.id === 'string') {
            await loadWards(selectedLGA.id);
          }
          break;
        case STEPS.NEIGHBORHOOD:
          if (selectedWard && selectedWard.id && typeof selectedWard.id === 'string') {
            await loadNeighborhoods(selectedWard.id);
          } else if (selectedLGA && selectedLGA.id && typeof selectedLGA.id === 'string') {
            await loadNeighborhoodsByLGA(selectedLGA.id);
          }
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setStepData(prev => ({ 
        ...prev, 
        error: 'Failed to load data. Please try again.',
        isLoading: false 
      }));
    }
  };

  const loadStates = async () => {
    try {
      const states = await locationApi.getStates();
      // Ensure states is always an array
      const validStates = Array.isArray(states) ? states : [];
      setStepData(prev => ({ ...prev, states: validStates, isLoading: false }));
    } catch (error) {
      console.error('Error loading states:', error);
      setStepData(prev => ({ 
        ...prev, 
        states: [], 
        isLoading: false, 
        error: 'Failed to load states. Please try again.' 
      }));
    }
  };

  const loadLGAs = async (stateId: string) => {
    try {
      const lgas = await locationApi.getLGAsByState(stateId);
      // Ensure lgas is always an array
      const validLGAs = Array.isArray(lgas) ? lgas : [];
      setStepData(prev => ({ ...prev, lgas: validLGAs, isLoading: false }));
    } catch (error) {
      console.error('Error loading LGAs:', error);
      setStepData(prev => ({ 
        ...prev, 
        lgas: [], 
        isLoading: false, 
        error: 'Failed to load LGAs. Please try again.' 
      }));
    }
  };

  const loadWards = async (lgaId: string) => {
    try {
      const wards = await locationApi.getWardsByLGA(lgaId);
      // Ensure wards is always an array
      const validWards = Array.isArray(wards) ? wards : [];
      setStepData(prev => ({ ...prev, wards: validWards, isLoading: false }));
    } catch (error) {
      console.error('Error loading wards:', error);
      setStepData(prev => ({ 
        ...prev, 
        wards: [], 
        isLoading: false, 
        error: 'Failed to load wards. Please try again.' 
      }));
    }
  };

  const loadNeighborhoods = async (wardId: string) => {
    try {
      const neighborhoods = await locationApi.getNeighborhoodsByWard(wardId);
      // Ensure neighborhoods is always an array
      const validNeighborhoods = Array.isArray(neighborhoods) ? neighborhoods : [];
      setStepData(prev => ({ ...prev, neighborhoods: validNeighborhoods, isLoading: false }));
    } catch (error) {
      console.error('Error loading neighborhoods:', error);
      setStepData(prev => ({ 
        ...prev, 
        neighborhoods: [], 
        isLoading: false, 
        error: 'Failed to load neighborhoods. Please try again.' 
      }));
    }
  };

  const loadNeighborhoodsByLGA = async (lgaId: string) => {
    try {
      // Search for neighborhoods in the LGA
      const response = await locationApi.searchNeighborhoods({
        lgaId,
        limit: 50,
      });
      // Ensure neighborhoods is always an array
      const validNeighborhoods = Array.isArray(response.data) ? response.data : [];
      setStepData(prev => ({ ...prev, neighborhoods: validNeighborhoods, isLoading: false }));
    } catch (error) {
      console.error('Error loading neighborhoods by LGA:', error);
      setStepData(prev => ({ 
        ...prev, 
        neighborhoods: [], 
        isLoading: false, 
        error: 'Failed to load neighborhoods. Please try again.' 
      }));
    }
  };

  const handleStateSelect = (state: State) => {
    setSelectedState(state);
    setCurrentStep(STEPS.LGA);
  };

  const handleLGASelect = (lga: LGA) => {
    setSelectedLGA(lga);
    setCurrentStep(STEPS.CITY_TOWN);
  };

  const handleWardSelect = (ward: Ward) => {
    setSelectedWard(ward);
    setCurrentStep(STEPS.NEIGHBORHOOD);
  };

  const handleNeighborhoodSelect = (neighborhood: Neighborhood) => {
    setSelectedNeighborhood(neighborhood);
    
    // Complete selection
    if (selectedState && selectedLGA) {
      onLocationSelected({
        state: selectedState,
        lga: selectedLGA,
        ward: selectedWard || undefined,
        neighborhood,
      });
    }
  };

  const handleCityTownChange = (text: string) => {
    setStepData(prev => ({ ...prev, cityTown: text }));
  };

  const handleCityTownNext = () => {
    if (selectedLGA) {
      // Try to find wards first, if not available, go to neighborhoods
      setCurrentStep(STEPS.WARD);
    }
  };

  const handleBack = () => {
    if (currentStep > STEPS.STATE) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  const handleCancel = () => {
    clearLocationSelection();
    if (onCancel) {
      onCancel();
    }
  };

  const handleSearch = (query: string) => {
    setStepData(prev => ({ ...prev, searchQuery: query }));
  };

  const getFilteredData = () => {
    // Ensure stepData exists to prevent JSI errors
    if (!stepData) {
      return {
        states: [],
        lgas: [],
        wards: [],
        neighborhoods: [],
        cityTown: '',
        searchQuery: '',
        isLoading: false,
        error: null,
      };
    }
    
    const { searchQuery } = stepData;
    
    // Add data validation to prevent JSI errors
    if (!searchQuery || typeof searchQuery !== 'string') {
      return {
        states: Array.isArray(stepData.states) ? stepData.states : [],
        lgas: Array.isArray(stepData.lgas) ? stepData.lgas : [],
        wards: Array.isArray(stepData.wards) ? stepData.wards : [],
        neighborhoods: Array.isArray(stepData.neighborhoods) ? stepData.neighborhoods : [],
        cityTown: stepData.cityTown || '',
        searchQuery: stepData.searchQuery || '',
        isLoading: stepData.isLoading || false,
        error: stepData.error || null,
      };
    }
    if (!searchQuery.trim()) return stepData;

    switch (currentStep) {
      case STEPS.STATE:
        return {
          ...stepData,
          states: (stepData.states || []).filter(state =>
            state.name.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        };
      case STEPS.LGA:
        return {
          ...stepData,
          lgas: (stepData.lgas || []).filter(lga =>
            lga.name.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        };
      case STEPS.WARD:
        return {
          ...stepData,
          wards: (stepData.wards || []).filter(ward =>
            ward.name.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        };
      case STEPS.NEIGHBORHOOD:
        return {
          ...stepData,
          neighborhoods: (stepData.neighborhoods || []).filter(neighborhood =>
            neighborhood.name.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        };
      default:
        return stepData;
    }
  };

  const renderProgressIndicator = () => {
    if (!showProgress) return null;

    const totalSteps = 5;
    const progress = (currentStep + 1) / totalSteps;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Step {currentStep + 1} of {totalSteps}
        </Text>
      </View>
    );
  };

  const renderBreadcrumb = () => {
    const breadcrumb = [];
    if (selectedState) breadcrumb.push(selectedState.name);
    if (selectedLGA) breadcrumb.push(selectedLGA.name);
    if (selectedWard) breadcrumb.push(selectedWard.name);
    if (selectedNeighborhood) breadcrumb.push(selectedNeighborhood.name);

    if (breadcrumb.length === 0) return null;

    return (
      <View style={styles.breadcrumbContainer}>
        <Text style={styles.breadcrumbText}>
          {breadcrumb.join(' → ')}
        </Text>
      </View>
    );
  };

  const renderSearchInput = () => {
    const placeholders = {
      [STEPS.STATE]: 'Search states...',
      [STEPS.LGA]: 'Search LGAs...',
      [STEPS.CITY_TOWN]: 'Search city/town...',
      [STEPS.WARD]: 'Search wards...',
      [STEPS.NEIGHBORHOOD]: 'Search neighborhoods...',
    };

    return (
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder={placeholders[currentStep]}
          value={stepData.searchQuery}
          onChangeText={handleSearch}
          returnKeyType="search"
          accessibilityLabel={`Search ${placeholders[currentStep]}`}
        />
      </View>
    );
  };

  const renderStateStep = () => {
    const filteredData = getFilteredData();
    const { states } = filteredData || { states: [] };

    return (
      <View style={styles.stepContainer} ref={ref => { stepRefs.current[STEPS.STATE] = ref; }}>
        <Text style={styles.stepTitle}>Select Your State</Text>
        <Text style={styles.stepDescription}>
          Choose the state where you live or work
        </Text>
        
        {renderSearchInput()}
        
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {(states || []).map((state) => (
            <TouchableOpacity
              key={state.id}
              style={styles.listItem}
              onPress={() => handleStateSelect(state)}
              accessibilityLabel={`Select ${state.name} state`}
              accessibilityRole="button"
            >
              <Text style={styles.listItemText}>{state.name}</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderLGAStep = () => {
    const filteredData = getFilteredData();
    const { lgas } = filteredData || { lgas: [] };

    return (
      <View style={styles.stepContainer} ref={ref => { stepRefs.current[STEPS.LGA] = ref; }}>
        <Text style={styles.stepTitle}>Select Your LGA</Text>
        <Text style={styles.stepDescription}>
          Choose your Local Government Area in {selectedState?.name}
        </Text>
        
        {renderSearchInput()}
        
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {(lgas || []).map((lga) => (
            <TouchableOpacity
              key={lga.id}
              style={styles.listItem}
              onPress={() => handleLGASelect(lga)}
              accessibilityLabel={`Select ${lga.name} LGA`}
              accessibilityRole="button"
            >
              <View style={styles.lgaItem}>
                <Text style={styles.listItemText}>{lga.name}</Text>
                <View style={[styles.typeBadge, { 
                  backgroundColor: lga.type === 'LGA' ? '#007AFF' : '#34C759' 
                }]}>
                  <Text style={styles.typeBadgeText}>{lga.type}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderCityTownStep = () => {
    return (
      <View style={styles.stepContainer} ref={ref => { stepRefs.current[STEPS.CITY_TOWN] = ref; }}>
        <Text style={styles.stepTitle}>Enter City/Town</Text>
        <Text style={styles.stepDescription}>
          Enter your city or town name (optional)
        </Text>
        
        <TextInput
          style={styles.textInput}
          placeholder="e.g., Ikeja, Victoria Island"
          value={stepData.cityTown}
          onChangeText={handleCityTownChange}
          returnKeyType="next"
          onSubmitEditing={handleCityTownNext}
          accessibilityLabel="Enter city or town name"
        />
        
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleCityTownNext}
          accessibilityLabel="Continue to next step"
          accessibilityRole="button"
        >
          <Text style={styles.nextButtonText}>Continue</Text>
          <Ionicons name="chevron-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderWardStep = () => {
    const filteredData = getFilteredData();
    const { wards } = filteredData || { wards: [] };

    return (
      <View style={styles.stepContainer} ref={ref => { stepRefs.current[STEPS.WARD] = ref; }}>
        <Text style={styles.stepTitle}>Select Your Ward (Optional)</Text>
        <Text style={styles.stepDescription}>
          Choose your ward in {selectedLGA?.name}
        </Text>
        
        {renderSearchInput()}
        
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {(wards || []).map((ward) => (
            <TouchableOpacity
              key={ward.id}
              style={styles.listItem}
              onPress={() => handleWardSelect(ward)}
              accessibilityLabel={`Select ${ward.name} ward`}
              accessibilityRole="button"
            >
              <Text style={styles.listItemText}>{ward.name}</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => setCurrentStep(STEPS.NEIGHBORHOOD)}
          accessibilityLabel="Skip ward selection"
          accessibilityRole="button"
        >
          <Text style={styles.skipButtonText}>Skip Ward Selection</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderNeighborhoodStep = () => {
    const filteredData = getFilteredData();
    const { neighborhoods } = filteredData || { neighborhoods: [] };
    const hasRecommendations = (recommendedNeighborhoods || []).length > 0;

    return (
      <View style={styles.stepContainer} ref={ref => { stepRefs.current[STEPS.NEIGHBORHOOD] = ref; }}>
        <Text style={styles.stepTitle}>Select Your Neighborhood</Text>
        <Text style={styles.stepDescription}>
          Choose your neighborhood or estate
        </Text>
        
        {renderSearchInput()}
        
        {hasRecommendations && (
          <View style={styles.recommendationsContainer}>
            <Text style={styles.recommendationsTitle}>Recommended for you</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {(recommendedNeighborhoods || []).slice(0, 3).map((neighborhood) => (
                <TouchableOpacity
                  key={neighborhood.id}
                  style={styles.recommendationCard}
                  onPress={() => handleNeighborhoodSelect(neighborhood)}
                  accessibilityLabel={`Select recommended ${neighborhood.name}`}
                  accessibilityRole="button"
                >
                  <Text style={styles.recommendationText}>{neighborhood.name}</Text>
                  <Text style={styles.recommendationType}>{neighborhood.type}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {(neighborhoods || []).map((neighborhood) => (
            <TouchableOpacity
              key={neighborhood.id}
              style={styles.listItem}
              onPress={() => handleNeighborhoodSelect(neighborhood)}
              accessibilityLabel={`Select ${neighborhood.name} neighborhood`}
              accessibilityRole="button"
            >
              <View style={styles.neighborhoodItem}>
                <Text style={styles.listItemText}>{neighborhood.name}</Text>
                <View style={styles.neighborhoodBadges}>
                  <View style={[styles.typeBadge, { 
                    backgroundColor: getNeighborhoodTypeColor(neighborhood.type) 
                  }]}>
                    <Text style={styles.typeBadgeText}>{neighborhood.type}</Text>
                  </View>
                  {neighborhood.isGated && (
                    <View style={styles.gatedBadge}>
                      <Ionicons name="lock-closed" size={12} color="white" />
                    </View>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const getNeighborhoodTypeColor = (type: string) => {
    switch (type) {
      case 'ESTATE': return '#FF9500';
      case 'COMMUNITY': return '#34C759';
      case 'AREA': return '#007AFF';
      default: return '#8E8E93';
    }
  };

  const renderCurrentStep = () => {
    if (stepData.isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    if (stepData.error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>{stepData.error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadInitialData}
            accessibilityLabel="Retry loading data"
            accessibilityRole="button"
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    switch (currentStep) {
      case STEPS.STATE:
        return renderStateStep();
      case STEPS.LGA:
        return renderLGAStep();
      case STEPS.CITY_TOWN:
        return renderCityTownStep();
      case STEPS.WARD:
        return renderWardStep();
      case STEPS.NEIGHBORHOOD:
        return renderNeighborhoodStep();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={currentStep > STEPS.STATE ? handleBack : handleCancel}
          accessibilityLabel={currentStep > STEPS.STATE ? "Go back" : "Cancel"}
          accessibilityRole="button"
        >
          <Ionicons 
            name={currentStep > STEPS.STATE ? "chevron-back" : "close"} 
            size={24} 
            color="#007AFF" 
          />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Select Location</Text>
        
        {allowSkip && (
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleSkip}
            accessibilityLabel="Skip location selection"
            accessibilityRole="button"
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {renderProgressIndicator()}
      {renderBreadcrumb()}
      {renderCurrentStep()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  skipText: {
    fontSize: 17,
    color: '#007AFF',
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
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
  breadcrumbContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  breadcrumbText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginTop: 24,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 17,
    color: '#8E8E93',
    marginBottom: 24,
    lineHeight: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: '#000',
  },
  listContainer: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 1,
    minHeight: 44,
  },
  listItemText: {
    fontSize: 17,
    color: '#000',
    flex: 1,
  },
  lgaItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  neighborhoodItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  neighborhoodBadges: {
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
  gatedBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    padding: 4,
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 17,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 24,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: 'white',
    marginRight: 8,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  skipButtonText: {
    fontSize: 17,
    color: '#007AFF',
  },
  recommendationsContainer: {
    marginBottom: 16,
  },
  recommendationsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  recommendationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 120,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  recommendationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 4,
  },
  recommendationType: {
    fontSize: 12,
    color: '#8E8E93',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 17,
    color: '#8E8E93',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 17,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: 'white',
  },
});

export default HierarchicalLocationSelector;
