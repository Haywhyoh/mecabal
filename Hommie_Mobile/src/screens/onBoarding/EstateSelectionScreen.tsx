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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants';
import { MeCabalAuth } from '../../services';
import { useLocation } from '../../contexts/LocationContext';
import { contextAwareGoBack } from '../../utils/navigationUtils';
import type { Neighborhood } from '../../types/location.types';

interface EstateSelectionScreenProps {
  navigation: any;
  route: any;
}

export default function EstateSelectionScreen({ navigation, route }: EstateSelectionScreenProps) {
  const { selectedState, selectedLGA } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [estates, setEstates] = useState<Neighborhood[]>([]);
  const [selectedEstate, setSelectedEstate] = useState<Neighborhood | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setEstates([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchEstates();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const searchEstates = async () => {
    if (!searchQuery || searchQuery.length < 2) {
      setEstates([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await MeCabalAuth.searchEstates({
        query: searchQuery,
        stateId: selectedState?.id,
        lgaId: selectedLGA?.id,
        limit: 50,
      });

      if (result.success && result.data) {
        // Filter to only show gated estates
        const gatedEstates = result.data.filter(
          (estate: Neighborhood) => estate.type === 'ESTATE' && estate.isGated
        );
        setEstates(gatedEstates);

        if (gatedEstates.length === 0) {
          setError('No gated estates found. Please try a different search term.');
        }
      } else {
        setError(result.error || 'Failed to search estates. Please try again.');
      }
    } catch (err) {
      console.error('Estate search error:', err);
      setError('Failed to search estates. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEstateSelect = (estate: Neighborhood) => {
    // Validate that it's a gated estate
    if (estate.type !== 'ESTATE' || !estate.isGated) {
      setError('Please select a gated estate. This location is not a gated estate.');
      return;
    }

    setSelectedEstate(estate);
    setSearchQuery(estate.name);
    setError(null);
  };

  const handleContinue = () => {
    if (!selectedEstate) {
      setError('Please select a gated estate to continue.');
      return;
    }

    // Validate estate is gated
    if (selectedEstate.type !== 'ESTATE' || !selectedEstate.isGated) {
      setError('Please select a gated estate. This location is not a gated estate.');
      return;
    }

    // Navigate to profile setup with estate ID
    navigation.navigate('ProfileSetup', {
      estateId: selectedEstate.id,
      estateName: selectedEstate.name,
    });
  };

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
              <View style={styles.iconContainer}>
                <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.title}>Select Your Gated Estate</Text>
              <Text style={styles.subtitle}>
                Search and select your gated estate (required)
              </Text>
              {selectedState && selectedLGA && (
                <Text style={styles.locationText}>
                  📍 {selectedLGA.name}, {selectedState.name}
                </Text>
              )}
            </View>
          </View>

          {/* Search Input */}
          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Type at least 2 characters to search..."
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  setSelectedEstate(null);
                  setError(null);
                }}
                autoCapitalize="words"
                placeholderTextColor={COLORS.textSecondary}
              />
              {isLoading && (
                <ActivityIndicator size="small" color={COLORS.primary} style={styles.loadingIndicator} />
              )}
            </View>

            {!searchQuery && (
              <Text style={styles.hintText}>
                Type at least 2 characters to search for your gated estate
              </Text>
            )}

            {searchQuery && searchQuery.length < 2 && (
              <Text style={styles.hintText}>
                Type {2 - searchQuery.length} more character{2 - searchQuery.length > 1 ? 's' : ''} to search...
              </Text>
            )}
          </View>

          {/* Estate Dropdown */}
          {!isLoading && estates.length > 0 && (
            <View style={styles.estateListSection}>
              <Text style={styles.sectionLabel}>Select Gated Estate *</Text>
              <View style={styles.estateList}>
                {estates.map((estate) => (
                  <TouchableOpacity
                    key={estate.id}
                    style={[
                      styles.estateItem,
                      selectedEstate?.id === estate.id && styles.estateItemSelected,
                    ]}
                    onPress={() => handleEstateSelect(estate)}
                  >
                    <View style={styles.estateItemContent}>
                      <Text style={styles.estateName}>{estate.name}</Text>
                      <Text style={styles.estateType}>
                        {estate.type} {estate.isGated ? '🔒 Gated' : ''}
                      </Text>
                      {estate.description && (
                        <Text style={styles.estateDescription} numberOfLines={2}>
                          {estate.description}
                        </Text>
                      )}
                    </View>
                    {selectedEstate?.id === estate.id && (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Selected Estate Display */}
          {selectedEstate && (
            <View style={styles.selectedEstateCard}>
              <View style={styles.selectedEstateHeader}>
                <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
                <Text style={styles.selectedEstateTitle}>Selected Estate</Text>
              </View>
              <Text style={styles.selectedEstateName}>{selectedEstate.name}</Text>
              <Text style={styles.selectedEstateDetails}>
                {selectedEstate.type} • {selectedEstate.isGated ? 'Gated Estate' : 'Not Gated'}
              </Text>
              {selectedEstate.description && (
                <Text style={styles.selectedEstateDescription}>
                  {selectedEstate.description}
                </Text>
              )}
            </View>
          )}

          {/* No Results */}
          {!isLoading && searchQuery && searchQuery.length >= 2 && estates.length === 0 && !error && (
            <View style={styles.noResultsCard}>
              <Text style={styles.noResultsText}>
                No gated estates found matching "{searchQuery}"
              </Text>
              <Text style={styles.noResultsHint}>
                Try a different search term or check your location settings
              </Text>
            </View>
          )}

          {/* Error Message */}
          {error && (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle" size={20} color={COLORS.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Continue Button */}
          <TouchableOpacity
            style={[styles.continueButton, (!selectedEstate || isLoading) && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={!selectedEstate || isLoading}
          >
            <Text style={styles.continueButtonText}>Continue to Profile Setup</Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
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
    marginBottom: SPACING.xs,
  },
  locationText: {
    fontSize: TYPOGRAPHY.fontSizes.sm || 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  searchSection: {
    marginBottom: SPACING.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.small,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSizes.md || 16,
    color: COLORS.text,
  },
  loadingIndicator: {
    marginLeft: SPACING.sm,
  },
  hintText: {
    fontSize: TYPOGRAPHY.fontSizes.sm || 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  estateListSection: {
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm || 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  estateList: {
    gap: SPACING.sm,
  },
  estateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  estateItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.lightGreen,
  },
  estateItemContent: {
    flex: 1,
  },
  estateName: {
    fontSize: TYPOGRAPHY.fontSizes.md || 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  estateType: {
    fontSize: TYPOGRAPHY.fontSizes.sm || 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  estateDescription: {
    fontSize: TYPOGRAPHY.fontSizes.xs || 12,
    color: COLORS.textSecondary,
  },
  selectedEstateCard: {
    backgroundColor: COLORS.lightGreen,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  selectedEstateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  selectedEstateTitle: {
    fontSize: TYPOGRAPHY.fontSizes.sm || 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: SPACING.xs,
  },
  selectedEstateName: {
    fontSize: TYPOGRAPHY.fontSizes.lg || 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  selectedEstateDetails: {
    fontSize: TYPOGRAPHY.fontSizes.sm || 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  selectedEstateDescription: {
    fontSize: TYPOGRAPHY.fontSizes.xs || 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  noResultsCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: TYPOGRAPHY.fontSizes.sm || 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  noResultsHint: {
    fontSize: TYPOGRAPHY.fontSizes.xs || 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
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
  continueButton: {
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
  continueButtonDisabled: {
    backgroundColor: COLORS.lightGray,
    opacity: 0.5,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.md || 16,
    fontWeight: '600',
    marginRight: SPACING.sm,
  },
});

