import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants';
import { MeCabalAuth } from '../../services';
import { useLocation } from '../../contexts/LocationContext';
import { useAuth } from '../../contexts/AuthContext';
import { contextAwareGoBack } from '../../utils/navigationUtils';
import { locationApi } from '../../services/api/locationApi';
import type { State } from '../../types/location.types';

interface ProfileSetupScreenProps {
  navigation: any;
  route: any;
}

interface CulturalBackground {
  id: string;
  name: string;
  region?: string;
}

interface ProfessionalCategory {
  id: string;
  category: string;
  titles: string[];
}

export default function ProfileSetupScreen({ navigation, route }: ProfileSetupScreenProps) {
  const { selectedState, selectedLGA, currentCoordinates } = useLocation();
  const { setUser } = useAuth();
  const { estateId, estateName, locationData } = route.params || {};

  const [formData, setFormData] = useState({
    stateOfOriginId: '',
    culturalBackgroundId: '',
    professionalCategoryId: '',
    professionalTitle: '',
    occupation: '',
  });

  const [states, setStates] = useState<State[]>([]);
  const [culturalBackgrounds, setCulturalBackgrounds] = useState<CulturalBackground[]>([]);
  const [professionalCategories, setProfessionalCategories] = useState<ProfessionalCategory[]>([]);
  const [selectedCategoryTitles, setSelectedCategoryTitles] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showStateModal, setShowStateModal] = useState(false);
  const [showCulturalModal, setShowCulturalModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTitleModal, setShowTitleModal] = useState(false);

  // Load reference data on mount
  useEffect(() => {
    loadReferenceData();
  }, []);

  // Update titles when professional category changes
  useEffect(() => {
    if (formData.professionalCategoryId) {
      const category = professionalCategories.find(c => c.id === formData.professionalCategoryId);
      if (category) {
        setSelectedCategoryTitles(category.titles || []);
        // Clear professional title if it's not in the new category's titles
        if (formData.professionalTitle && !category.titles.includes(formData.professionalTitle)) {
          setFormData(prev => ({ ...prev, professionalTitle: '' }));
        }
      }
    } else {
      setSelectedCategoryTitles([]);
    }
  }, [formData.professionalCategoryId, professionalCategories]);

  const loadReferenceData = async () => {
    try {
      setIsLoadingData(true);
      const [statesResponse, referenceDataResponse] = await Promise.all([
        locationApi.getStates(),
        MeCabalAuth.getReferenceData(),
      ]);

      if (statesResponse) {
        setStates(statesResponse);
      }

      if (referenceDataResponse.success && referenceDataResponse.data) {
        setCulturalBackgrounds(referenceDataResponse.data.culturalBackgrounds || []);
        setProfessionalCategories(referenceDataResponse.data.professionalCategories || []);
      }
    } catch (err) {
      console.error('Error loading reference data:', err);
      setError('Failed to load profile options. Please refresh the page.');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    // Validate required fields
    if (!formData.stateOfOriginId || !formData.culturalBackgroundId || !formData.professionalCategoryId) {
      setError('Please fill in all required fields (State of Origin, Cultural Background, and Professional Category).');
      return;
    }

    if (!estateId) {
      setError('Estate selection is missing. Please go back and select your estate.');
      return;
    }

    if (!selectedState?.id || !selectedLGA?.id) {
      setError('Location information is missing. Please go back and set your location.');
      return;
    }

    setIsLoading(true);

    try {
      // Complete registration with all data
      // Use locationData from route params if available, otherwise use context
      const finalStateId = locationData?.stateId || selectedState.id;
      const finalLgaId = locationData?.lgaId || selectedLGA.id;
      const finalCityTown = locationData?.cityTown;
      const finalStreet = locationData?.street;
      const finalCoordinates = locationData?.coordinates || currentCoordinates;

      // Build address string from street if available
      const addressString = finalStreet ? finalStreet : undefined;

      const response = await MeCabalAuth.setupLocation({
        stateId: finalStateId,
        lgaId: finalLgaId,
        neighborhoodId: estateId, // estateId is the neighborhoodId for the estate
        cityTown: finalCityTown,
        address: addressString,
        street: finalStreet,
        latitude: finalCoordinates?.latitude,
        longitude: finalCoordinates?.longitude,
        completeRegistration: true,
        stateOfOriginId: formData.stateOfOriginId,
        culturalBackgroundId: formData.culturalBackgroundId,
        professionalCategoryId: formData.professionalCategoryId,
        professionalTitle: formData.professionalTitle || undefined,
        occupation: formData.occupation || undefined,
      });

      if (response.success && response.data) {
        const userData = response.data.user;

        if (userData) {
          setUser({
            id: userData.id,
            email: userData.email,
            firstName: userData.firstName || userData.first_name,
            lastName: userData.lastName || userData.last_name,
            isVerified: userData.isVerified,
          });
        }

        Alert.alert(
          'Registration Complete!',
          'Welcome to MeCabal! Your account has been created successfully.',
          [
            {
              text: 'Get Started',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'MainTabs' }],
                });
              },
            },
          ]
        );
      } else {
        setError(response.error || 'Failed to complete registration');
      }
    } catch (err) {
      console.error('Registration completion error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    formData.stateOfOriginId &&
    formData.culturalBackgroundId &&
    formData.professionalCategoryId;

  if (isLoadingData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading profile options...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => contextAwareGoBack(navigation, 'onboarding')}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Complete Your Profile</Text>
              <Text style={styles.subtitle}>Tell us a bit about yourself</Text>
            </View>
          </View>

          {/* State of Origin */}
          <View style={styles.formSection}>
            <Text style={styles.label}>State of Origin *</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowStateModal(true)}
            >
              <Text style={[styles.selectButtonText, !formData.stateOfOriginId && styles.selectButtonPlaceholder]}>
                {formData.stateOfOriginId
                  ? states.find(s => s.id === formData.stateOfOriginId)?.name
                  : 'Select your state of origin'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Cultural Background */}
          <View style={styles.formSection}>
            <Text style={styles.label}>Cultural Background *</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowCulturalModal(true)}
            >
              <Text style={[styles.selectButtonText, !formData.culturalBackgroundId && styles.selectButtonPlaceholder]}>
                {formData.culturalBackgroundId
                  ? culturalBackgrounds.find(c => c.id === formData.culturalBackgroundId)?.name
                  : 'Select your cultural background'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Professional Category */}
          <View style={styles.formSection}>
            <Text style={styles.label}>Professional Category *</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={[styles.selectButtonText, !formData.professionalCategoryId && styles.selectButtonPlaceholder]}>
                {formData.professionalCategoryId
                  ? professionalCategories.find(c => c.id === formData.professionalCategoryId)?.category
                  : 'Select your professional category'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Professional Title */}
          {formData.professionalCategoryId && selectedCategoryTitles.length > 0 && (
            <View style={styles.formSection}>
              <Text style={styles.label}>Professional Title (Optional)</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowTitleModal(true)}
              >
                <Text style={[styles.selectButtonText, !formData.professionalTitle && styles.selectButtonPlaceholder]}>
                  {formData.professionalTitle || 'Select your professional title (optional)'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Occupation */}
          <View style={styles.formSection}>
            <Text style={styles.label}>Occupation (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Software Engineer, Doctor, Teacher"
              value={formData.occupation}
              onChangeText={(value) => setFormData({ ...formData, occupation: value })}
              autoCapitalize="words"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle" size={20} color={COLORS.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, (!isFormValid || isLoading) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <>
                <ActivityIndicator size="small" color={COLORS.white} />
                <Text style={styles.submitButtonText}>Completing Registration...</Text>
              </>
            ) : (
              <>
                <Text style={styles.submitButtonText}>Complete Registration</Text>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* State Modal */}
      <Modal visible={showStateModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowStateModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>State of Origin</Text>
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
                  formData.stateOfOriginId === item.id && styles.modalItemSelected,
                ]}
                onPress={() => {
                  setFormData({ ...formData, stateOfOriginId: item.id });
                  setShowStateModal(false);
                }}
              >
                <Text style={styles.modalItemText}>{item.name}</Text>
                {formData.stateOfOriginId === item.id && (
                  <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* Cultural Background Modal */}
      <Modal visible={showCulturalModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCulturalModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Cultural Background</Text>
            <TouchableOpacity onPress={() => setShowCulturalModal(false)}>
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={culturalBackgrounds}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  formData.culturalBackgroundId === item.id && styles.modalItemSelected,
                ]}
                onPress={() => {
                  setFormData({ ...formData, culturalBackgroundId: item.id });
                  setShowCulturalModal(false);
                }}
              >
                <View style={styles.modalItemContent}>
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  {item.region && <Text style={styles.modalItemSubtext}>{item.region}</Text>}
                </View>
                {formData.culturalBackgroundId === item.id && (
                  <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* Professional Category Modal */}
      <Modal visible={showCategoryModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Professional Category</Text>
            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={professionalCategories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  formData.professionalCategoryId === item.id && styles.modalItemSelected,
                ]}
                onPress={() => {
                  setFormData({ ...formData, professionalCategoryId: item.id, professionalTitle: '' });
                  setShowCategoryModal(false);
                }}
              >
                <Text style={styles.modalItemText}>{item.category}</Text>
                {formData.professionalCategoryId === item.id && (
                  <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* Professional Title Modal */}
      {formData.professionalCategoryId && selectedCategoryTitles.length > 0 && (
        <Modal visible={showTitleModal} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowTitleModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Professional Title</Text>
              <TouchableOpacity onPress={() => setShowTitleModal(false)}>
                <Text style={styles.modalDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={selectedCategoryTitles}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    formData.professionalTitle === item && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, professionalTitle: item });
                    setShowTitleModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                  {formData.professionalTitle === item && (
                    <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSizes.md || 16,
    color: COLORS.textSecondary,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  backButton: {
    marginBottom: SPACING.md,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizes['2xl'] || 28,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSizes.md || 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  formSection: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSizes.sm || 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
    minHeight: 50,
  },
  selectButtonText: {
    fontSize: TYPOGRAPHY.fontSizes.md || 16,
    color: COLORS.text,
    flex: 1,
  },
  selectButtonPlaceholder: {
    color: COLORS.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalCancelText: {
    fontSize: TYPOGRAPHY.fontSizes.md || 16,
    color: COLORS.textSecondary,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg || 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalDoneText: {
    fontSize: TYPOGRAPHY.fontSizes.md || 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalItemSelected: {
    backgroundColor: COLORS.lightGreen,
  },
  modalItemContent: {
    flex: 1,
  },
  modalItemText: {
    fontSize: TYPOGRAPHY.fontSizes.md || 16,
    color: COLORS.text,
  },
  modalItemSubtext: {
    fontSize: TYPOGRAPHY.fontSizes.sm || 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSizes.md || 16,
    color: COLORS.text,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSizes.sm || 14,
    color: COLORS.danger,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.md,
    ...SHADOWS.medium,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.lightGray,
    opacity: 0.5,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.md || 16,
    fontWeight: '600',
    marginRight: SPACING.sm,
  },
});

