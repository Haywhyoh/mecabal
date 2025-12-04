import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Modal } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ScreenHeader } from '../../components/ui';
import { BUSINESS_CATEGORIES, SERVICE_AREAS } from '../../constants/businessData';
import { ServiceArea, PricingModel, Availability } from '../../services/types/business.types';

interface AdvancedSearchFiltersScreenProps {
  navigation?: any;
  route?: {
    params: {
      onApplyFilters: (filters: SearchFilters) => void;
      currentFilters?: SearchFilters;
    };
  };
}

export interface SearchFilters {
  category?: string;
  subcategory?: string;
  serviceArea?: ServiceArea;
  pricingModel?: PricingModel;
  availability?: Availability;
  minRating?: number;
  hasInsurance?: boolean;
  isVerified?: boolean;
  sortBy?: 'rating' | 'distance' | 'price';
  sortOrder?: 'ASC' | 'DESC';
}

export default function AdvancedSearchFiltersScreen({ navigation, route }: AdvancedSearchFiltersScreenProps) {
  const currentFilters = route?.params?.currentFilters || {};
  const onApplyFilters = route?.params?.onApplyFilters;

  const [filters, setFilters] = useState<SearchFilters>(currentFilters);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showServiceAreaModal, setShowServiceAreaModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);

  const serviceAreas: ServiceArea[] = [
    ServiceArea.NEIGHBORHOOD,
    ServiceArea.TWO_KM,
    ServiceArea.FIVE_KM,
    ServiceArea.TEN_KM,
    ServiceArea.CITY_WIDE,
    ServiceArea.STATE_WIDE,
    ServiceArea.NATIONWIDE,
  ];

  const pricingModels: PricingModel[] = [
    PricingModel.FIXED_RATE,
    PricingModel.HOURLY,
    PricingModel.PER_ITEM,
    PricingModel.PROJECT_BASED,
    PricingModel.CUSTOM_QUOTE,
  ];

  const availabilityOptions: Availability[] = [
    Availability.BUSINESS_HOURS,
    Availability.EXTENDED_HOURS,
    Availability.WEEKENDS,
    Availability.TWENTY_FOUR_SEVEN,
    Availability.FLEXIBLE,
    Availability.BY_APPOINTMENT,
  ];

  const ratingOptions = [
    { value: 4.5, label: '4.5+ Stars' },
    { value: 4.0, label: '4.0+ Stars' },
    { value: 3.5, label: '3.5+ Stars' },
    { value: 3.0, label: '3.0+ Stars' },
  ];

  const handleApplyFilters = () => {
    if (onApplyFilters) {
      onApplyFilters(filters);
    }
    navigation?.goBack();
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const getActiveFilterCount = () => {
    return Object.keys(filters).filter(key => filters[key as keyof SearchFilters] !== undefined).length;
  };

  const formatLabel = (value: string) => {
    return value.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Advanced Filters"
        navigation={navigation}
        rightComponent={
          getActiveFilterCount() > 0 ? (
            <TouchableOpacity onPress={handleClearFilters}>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Category Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Business Category</Text>
          <TouchableOpacity
            style={styles.filterOption}
            onPress={() => setShowCategoryModal(true)}
          >
            <View style={styles.filterOptionContent}>
              <MaterialCommunityIcons name="shape" size={20} color="#8E8E8E" />
              <Text style={styles.filterOptionLabel}>Category</Text>
              <Text style={styles.filterOptionValue}>
                {filters.category
                  ? BUSINESS_CATEGORIES.find(c => c.id === filters.category)?.name || filters.category
                  : 'Any'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E8E" />
          </TouchableOpacity>
        </View>

        {/* Service Area Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Service Area</Text>
          <TouchableOpacity
            style={styles.filterOption}
            onPress={() => setShowServiceAreaModal(true)}
          >
            <View style={styles.filterOptionContent}>
              <MaterialCommunityIcons name="map-marker-radius" size={20} color="#8E8E8E" />
              <Text style={styles.filterOptionLabel}>Service Area</Text>
              <Text style={styles.filterOptionValue}>
                {filters.serviceArea ? formatLabel(filters.serviceArea) : 'Any'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E8E" />
          </TouchableOpacity>
        </View>

        {/* Pricing Model Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Pricing Model</Text>
          <TouchableOpacity
            style={styles.filterOption}
            onPress={() => setShowPricingModal(true)}
          >
            <View style={styles.filterOptionContent}>
              <MaterialCommunityIcons name="currency-ngn" size={20} color="#8E8E8E" />
              <Text style={styles.filterOptionLabel}>Pricing</Text>
              <Text style={styles.filterOptionValue}>
                {filters.pricingModel ? formatLabel(filters.pricingModel) : 'Any'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E8E" />
          </TouchableOpacity>
        </View>

        {/* Availability Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Availability</Text>
          <TouchableOpacity
            style={styles.filterOption}
            onPress={() => setShowAvailabilityModal(true)}
          >
            <View style={styles.filterOptionContent}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#8E8E8E" />
              <Text style={styles.filterOptionLabel}>Availability</Text>
              <Text style={styles.filterOptionValue}>
                {filters.availability ? formatLabel(filters.availability) : 'Any'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E8E" />
          </TouchableOpacity>
        </View>

        {/* Minimum Rating Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
          <View style={styles.ratingOptions}>
            {ratingOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.ratingChip,
                  filters.minRating === option.value && styles.ratingChipActive
                ]}
                onPress={() => setFilters({ ...filters, minRating: filters.minRating === option.value ? undefined : option.value })}
              >
                <MaterialCommunityIcons
                  name="star"
                  size={16}
                  color={filters.minRating === option.value ? '#FFFFFF' : '#FFC107'}
                />
                <Text style={[
                  styles.ratingChipText,
                  filters.minRating === option.value && styles.ratingChipTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Additional Filters */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Additional Options</Text>

          <TouchableOpacity
            style={styles.toggleOption}
            onPress={() => setFilters({ ...filters, isVerified: !filters.isVerified })}
          >
            <View style={styles.toggleContent}>
              <MaterialCommunityIcons name="shield-check" size={20} color="#00A651" />
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleLabel}>Verified Businesses Only</Text>
                <Text style={styles.toggleDescription}>Show only verified businesses</Text>
              </View>
            </View>
            <View style={[styles.toggleSwitch, filters.isVerified && styles.toggleSwitchActive]}>
              <View style={[styles.toggleThumb, filters.isVerified && styles.toggleThumbActive]} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleOption}
            onPress={() => setFilters({ ...filters, hasInsurance: !filters.hasInsurance })}
          >
            <View style={styles.toggleContent}>
              <MaterialCommunityIcons name="shield-star" size={20} color="#0066CC" />
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleLabel}>Insured Businesses Only</Text>
                <Text style={styles.toggleDescription}>Show businesses with insurance</Text>
              </View>
            </View>
            <View style={[styles.toggleSwitch, filters.hasInsurance && styles.toggleSwitchActive]}>
              <View style={[styles.toggleThumb, filters.hasInsurance && styles.toggleThumbActive]} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Apply Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
          <Text style={styles.applyButtonText}>
            Apply Filters {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#2C2C2C" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setFilters({ ...filters, category: undefined, subcategory: undefined });
                  setShowCategoryModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>Any Category</Text>
                {!filters.category && (
                  <MaterialCommunityIcons name="check" size={20} color="#00A651" />
                )}
              </TouchableOpacity>
              {BUSINESS_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.modalOption}
                  onPress={() => {
                    setFilters({ ...filters, category: category.id, subcategory: undefined });
                    setShowCategoryModal(false);
                  }}
                >
                  <View style={styles.modalOptionContent}>
                    <MaterialCommunityIcons name={category.icon as any} size={20} color={category.color} />
                    <Text style={styles.modalOptionText}>{category.name}</Text>
                  </View>
                  {filters.category === category.id && (
                    <MaterialCommunityIcons name="check" size={20} color="#00A651" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Service Area Modal */}
      <Modal visible={showServiceAreaModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Service Area</Text>
              <TouchableOpacity onPress={() => setShowServiceAreaModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#2C2C2C" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setFilters({ ...filters, serviceArea: undefined });
                  setShowServiceAreaModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>Any Area</Text>
                {!filters.serviceArea && (
                  <MaterialCommunityIcons name="check" size={20} color="#00A651" />
                )}
              </TouchableOpacity>
              {serviceAreas.map((area) => (
                <TouchableOpacity
                  key={area}
                  style={styles.modalOption}
                  onPress={() => {
                    setFilters({ ...filters, serviceArea: area });
                    setShowServiceAreaModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{formatLabel(area)}</Text>
                  {filters.serviceArea === area && (
                    <MaterialCommunityIcons name="check" size={20} color="#00A651" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Pricing Model Modal */}
      <Modal visible={showPricingModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Pricing Model</Text>
              <TouchableOpacity onPress={() => setShowPricingModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#2C2C2C" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setFilters({ ...filters, pricingModel: undefined });
                  setShowPricingModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>Any Pricing</Text>
                {!filters.pricingModel && (
                  <MaterialCommunityIcons name="check" size={20} color="#00A651" />
                )}
              </TouchableOpacity>
              {pricingModels.map((model) => (
                <TouchableOpacity
                  key={model}
                  style={styles.modalOption}
                  onPress={() => {
                    setFilters({ ...filters, pricingModel: model });
                    setShowPricingModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{formatLabel(model)}</Text>
                  {filters.pricingModel === model && (
                    <MaterialCommunityIcons name="check" size={20} color="#00A651" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Availability Modal */}
      <Modal visible={showAvailabilityModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Availability</Text>
              <TouchableOpacity onPress={() => setShowAvailabilityModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#2C2C2C" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setFilters({ ...filters, availability: undefined });
                  setShowAvailabilityModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>Any Availability</Text>
                {!filters.availability && (
                  <MaterialCommunityIcons name="check" size={20} color="#00A651" />
                )}
              </TouchableOpacity>
              {availabilityOptions.map((availability) => (
                <TouchableOpacity
                  key={availability}
                  style={styles.modalOption}
                  onPress={() => {
                    setFilters({ ...filters, availability });
                    setShowAvailabilityModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{formatLabel(availability)}</Text>
                  {filters.availability === availability && (
                    <MaterialCommunityIcons name="check" size={20} color="#00A651" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingTop: 100,
  },
  scrollView: {
    flex: 1,
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E8E',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  filterOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  filterOptionLabel: {
    fontSize: 16,
    color: '#2C2C2C',
    marginLeft: 12,
    flex: 1,
  },
  filterOptionValue: {
    fontSize: 14,
    color: '#00A651',
    fontWeight: '500',
    marginRight: 8,
  },
  ratingOptions: {
    gap: 8,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  ratingChipActive: {
    backgroundColor: '#00A651',
    borderColor: '#00A651',
  },
  ratingChipText: {
    fontSize: 14,
    color: '#2C2C2C',
    marginLeft: 8,
    fontWeight: '500',
  },
  ratingChipTextActive: {
    color: '#FFFFFF',
  },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#2C2C2C',
    fontWeight: '500',
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: '#00A651',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  applyButton: {
    backgroundColor: '#00A651',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  clearText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  modalOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#2C2C2C',
    marginLeft: 12,
  },
});
