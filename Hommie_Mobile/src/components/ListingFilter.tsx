import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Note: Slider component would need to be installed separately
// import Slider from '@react-native-community/slider';
import { ListingFilter as ListingFilterType } from '../services/listingsService';

interface ListingFilterProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filter: ListingFilterType) => void;
  currentFilter: ListingFilterType;
}

export const ListingFilter: React.FC<ListingFilterProps> = ({
  visible,
  onClose,
  onApply,
  currentFilter,
}) => {
  const [filter, setFilter] = useState<ListingFilterType>(currentFilter);

  const listingTypes = [
    { id: 'property', label: 'Property', icon: 'home-outline' },
    { id: 'item', label: 'Items', icon: 'cube-outline' },
    { id: 'service', label: 'Services', icon: 'construct-outline' },
  ];

  const conditions = [
    { id: 'new', label: 'New' },
    { id: 'like_new', label: 'Like New' },
    { id: 'good', label: 'Good' },
    { id: 'fair', label: 'Fair' },
  ];

  const priceRanges = [
    { id: '0-50000', label: 'Under ₦50k', min: 0, max: 50000 },
    { id: '50000-200000', label: '₦50k - ₦200k', min: 50000, max: 200000 },
    { id: '200000-500000', label: '₦200k - ₦500k', min: 200000, max: 500000 },
    { id: '500000-1000000', label: '₦500k - ₦1M', min: 500000, max: 1000000 },
    { id: '1000000+', label: 'Above ₦1M', min: 1000000, max: undefined },
  ];

  const sortOptions = [
    { id: 'createdAt', label: 'Date Posted' },
    { id: 'price', label: 'Price' },
    { id: 'viewsCount', label: 'Most Viewed' },
  ];

  const sortOrders = [
    { id: 'DESC', label: 'Newest First' },
    { id: 'ASC', label: 'Oldest First' },
  ];

  const handleApply = () => {
    onApply(filter);
    onClose();
  };

  const handleReset = () => {
    const resetFilter: ListingFilterType = {
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
      status: 'active',
      radius: 5,
    };
    setFilter(resetFilter);
  };

  const updateFilter = (key: keyof ListingFilterType, value: any) => {
    setFilter(prev => ({ ...prev, [key]: value }));
  };

  const getListingTypeLabel = (type: string) => {
    return listingTypes.find(t => t.id === type)?.label || 'All Types';
  };

  const getSortLabel = (sort: string) => {
    return sortOptions.find(s => s.id === sort)?.label || 'Date Posted';
  };

  const getSortOrderLabel = (order: string) => {
    return sortOrders.find(o => o.id === order)?.label || 'Newest First';
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `₦${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `₦${(price / 1000).toFixed(0)}k`;
    }
    return `₦${price.toLocaleString()}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Filters</Text>
          <TouchableOpacity onPress={handleApply}>
            <Text style={styles.applyButton}>Apply</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Listing Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Listing Type</Text>
            <View style={styles.optionsContainer}>
              {listingTypes.map(type => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.option,
                    filter.listingType === type.id && styles.selectedOption
                  ]}
                  onPress={() => updateFilter('listingType', type.id)}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={20}
                    color={filter.listingType === type.id ? '#00A651' : '#8E8E8E'}
                  />
                  <Text style={[
                    styles.optionLabel,
                    filter.listingType === type.id && styles.selectedOptionLabel
                  ]}>
                    {type.label}
                  </Text>
                  {filter.listingType === type.id && (
                    <Ionicons name="checkmark" size={20} color="#00A651" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Price Range */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Range</Text>
            <View style={styles.priceRangeContainer}>
              <TextInput
                style={styles.priceInput}
                placeholder="Min"
                keyboardType="numeric"
                value={filter.minPrice?.toString() || ''}
                onChangeText={(text) => updateFilter('minPrice', text ? parseInt(text) : undefined)}
                placeholderTextColor="#8E8E8E"
              />
              <Text style={styles.priceSeparator}>-</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Max"
                keyboardType="numeric"
                value={filter.maxPrice?.toString() || ''}
                onChangeText={(text) => updateFilter('maxPrice', text ? parseInt(text) : undefined)}
                placeholderTextColor="#8E8E8E"
              />
            </View>
            
            {/* Quick Price Ranges */}
            <View style={styles.pills}>
              {priceRanges.map(range => (
                <TouchableOpacity
                  key={range.id}
                  style={[
                    styles.pill,
                    filter.minPrice === range.min && filter.maxPrice === range.max && styles.activePill
                  ]}
                  onPress={() => {
                    updateFilter('minPrice', range.min);
                    updateFilter('maxPrice', range.max);
                  }}
                >
                  <Text style={[
                    styles.pillText,
                    filter.minPrice === range.min && filter.maxPrice === range.max && styles.activePillText
                  ]}>
                    {range.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Location Radius */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Distance: {filter.radius} km</Text>
            <View style={styles.radiusContainer}>
              <Text style={styles.radiusLabel}>1 km</Text>
              <View style={styles.radiusSlider}>
                <TouchableOpacity
                  style={styles.radiusButton}
                  onPress={() => updateFilter('radius', 5)}
                >
                  <Text style={[styles.radiusButtonText, filter.radius === 5 && styles.activeRadiusButton]}>5km</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.radiusButton}
                  onPress={() => updateFilter('radius', 10)}
                >
                  <Text style={[styles.radiusButtonText, filter.radius === 10 && styles.activeRadiusButton]}>10km</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.radiusButton}
                  onPress={() => updateFilter('radius', 25)}
                >
                  <Text style={[styles.radiusButtonText, filter.radius === 25 && styles.activeRadiusButton]}>25km</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.radiusButton}
                  onPress={() => updateFilter('radius', 50)}
                >
                  <Text style={[styles.radiusButtonText, filter.radius === 50 && styles.activeRadiusButton]}>50km</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.radiusLabel}>50 km</Text>
            </View>
          </View>

          {/* Additional filters can be added here when the backend supports them */}

          {/* Sort Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sort By</Text>
            <View style={styles.sortContainer}>
              <View style={styles.sortRow}>
                <Text style={styles.sortLabel}>Field:</Text>
                <TouchableOpacity style={styles.sortButton}>
                  <Text style={styles.sortButtonText}>
                    {getSortLabel(filter.sortBy || 'createdAt')}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#8E8E8E" />
                </TouchableOpacity>
              </View>
              <View style={styles.sortRow}>
                <Text style={styles.sortLabel}>Order:</Text>
                <TouchableOpacity style={styles.sortButton}>
                  <Text style={styles.sortButtonText}>
                    {getSortOrderLabel(filter.sortOrder || 'DESC')}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#8E8E8E" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Status Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status</Text>
            <View style={styles.pills}>
              {['active', 'sold', 'expired'].map(status => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.pill,
                    filter.status === status && styles.activePill
                  ]}
                  onPress={() => updateFilter('status', status)}
                >
                  <Text style={[
                    styles.pillText,
                    filter.status === status && styles.activePillText
                  ]}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Reset Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Ionicons name="refresh-outline" size={20} color="#8E8E8E" />
            <Text style={styles.resetButtonText}>Reset All Filters</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cancelButton: {
    fontSize: 16,
    color: '#8E8E8E',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  applyButton: {
    fontSize: 16,
    color: '#00A651',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 12,
  },
  optionsContainer: {
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  selectedOption: {
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#00A651',
  },
  optionLabel: {
    fontSize: 14,
    color: '#2C2C2C',
    marginLeft: 12,
    flex: 1,
  },
  selectedOptionLabel: {
    color: '#00A651',
    fontWeight: '500',
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2C2C2C',
  },
  priceSeparator: {
    marginHorizontal: 12,
    fontSize: 16,
    color: '#8E8E8E',
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activePill: {
    backgroundColor: '#00A651',
    borderColor: '#00A651',
  },
  pillText: {
    fontSize: 12,
    color: '#2C2C2C',
    fontWeight: '500',
  },
  activePillText: {
    color: '#FFFFFF',
  },
  radiusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  radiusLabel: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  radiusSlider: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
  },
  radiusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  radiusButtonText: {
    fontSize: 12,
    color: '#2C2C2C',
    fontWeight: '500',
  },
  activeRadiusButton: {
    color: '#00A651',
    fontWeight: '600',
  },
  sortContainer: {
    gap: 12,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortLabel: {
    fontSize: 14,
    color: '#2C2C2C',
    fontWeight: '500',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#2C2C2C',
    marginRight: 4,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  resetButtonText: {
    fontSize: 14,
    color: '#8E8E8E',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default ListingFilter;
