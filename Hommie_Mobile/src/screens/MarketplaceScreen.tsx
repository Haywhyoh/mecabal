import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../constants';
import { ListingCard } from '../components/ListingCard';
import { EmptyState } from '../components/EmptyState';
import { ListingsService, Listing, ListingFilter } from '../services/listingsService';
import { BusinessService, BusinessProfile } from '../services/businessService';

interface MarketplaceScreenProps {
  navigation?: any;
}

export default function MarketplaceScreen({ navigation }: MarketplaceScreenProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<ListingFilter>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });
  const [businessProfiles, setBusinessProfiles] = useState<Map<string, BusinessProfile>>(new Map());

  const listingsService = ListingsService.getInstance();
  const businessService = BusinessService.getInstance();

  // Fetch business profiles for service listings
  const fetchBusinessProfiles = useCallback(async (serviceListings: Listing[]) => {
    try {
      const businessIds = serviceListings
        .filter(listing => listing.listingType === 'service' && listing.businessId)
        .map(listing => listing.businessId!);

      if (businessIds.length === 0) return;

      const profiles = new Map<string, BusinessProfile>();
      
      // Fetch business profiles in parallel
      const profilePromises = businessIds.map(async (businessId) => {
        try {
          const profile = await businessService.getBusiness(businessId);
          profiles.set(businessId, profile);
        } catch (error) {
          console.error(`Error fetching business profile for ${businessId}:`, error);
        }
      });

      await Promise.all(profilePromises);
      setBusinessProfiles(profiles);
    } catch (error) {
      console.error('Error fetching business profiles:', error);
    }
  }, [businessService]);

  // Fetch listings
  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      const result = await listingsService.getListings({
        ...filter,
        categoryId: selectedCategory || undefined,
        search: searchQuery || undefined,
      });
      setListings(result.data);
      
      // Fetch business profiles for service listings
      await fetchBusinessProfiles(result.data);
    } catch (error: any) {
      console.error('Error fetching listings:', error);
      
      // Show user-friendly error message
      const errorMessage = error.message || 'Failed to load listings';
      Alert.alert(
        'Connection Error', 
        errorMessage,
        [
          {
            text: 'Retry',
            onPress: () => fetchListings(),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  }, [filter, selectedCategory, searchQuery, fetchBusinessProfiles]);

  // Refresh listings
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchListings();
    } finally {
      setRefreshing(false);
    }
  }, [fetchListings]);

  // Handle save listing
  const handleSaveListing = useCallback(async (listingId: string) => {
    try {
      const listing = listings.find(l => l.id === listingId);
      if (!listing) return;

      if (listing.isSaved) {
        await listingsService.unsaveListing(listingId);
      } else {
        await listingsService.saveListing(listingId);
      }

      // Update local state
      setListings(prevListings =>
        prevListings.map(l =>
          l.id === listingId ? { ...l, isSaved: !l.isSaved } : l
        )
      );
    } catch (error: any) {
      console.error('Error saving listing:', error);
      
      // Show user-friendly error message
      const errorMessage = error.message || 'Failed to save listing';
      Alert.alert(
        'Save Error', 
        errorMessage,
        [
          {
            text: 'Retry',
            onPress: () => handleSaveListing(listingId),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  }, [listings, listingsService]);

  // Handle category selection
  const handleCategorySelect = useCallback((categoryId: number | null) => {
    setSelectedCategory(categoryId);
  }, []);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Fetch on mount and filter changes
  useEffect(() => {
    fetchListings();
  }, [filter, selectedCategory, searchQuery]);

  // Categories following iOS design
  const categories = [
    { id: null, label: 'All', icon: 'apps-outline' },
    { id: 5, label: 'Electronics', icon: 'phone-portrait-outline' },
    { id: 6, label: 'Furniture', icon: 'bed-outline' },
    { id: 7, label: 'Vehicles', icon: 'car-outline' },
    { id: 10, label: 'Services', icon: 'construct-outline' },
    { id: 1, label: 'Property', icon: 'home-outline' },
  ];

  const renderCategoryItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.id && styles.categoryItemActive
      ]}
      onPress={() => handleCategorySelect(item.id)}
      activeOpacity={0.7}
    >
      <Ionicons
        name={item.icon as any}
        size={20}
        color={selectedCategory === item.id ? colors.white : colors.text.light}
        style={styles.categoryIcon}
      />
      <Text style={[
        styles.categoryText,
        selectedCategory === item.id && styles.categoryTextActive
      ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: Listing }) => {
    const businessProfile = item.businessId ? businessProfiles.get(item.businessId) : undefined;
    
    return (
      <View style={viewMode === 'grid' ? styles.gridItem : styles.listItem}>
        <ListingCard
          listing={item}
          onPress={() => navigation?.navigate('ListingDetail', { listingId: item.id })}
          onSave={() => handleSaveListing(item.id)}
          viewMode={viewMode}
          businessProfile={businessProfile}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Large Title Header - iOS Style */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          {/* Back Button - Universal for both platforms */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation?.goBack()}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons 
              name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} 
              size={24} 
              color={colors.primary} 
            />
          </TouchableOpacity>
          
          <Text style={styles.largeTitle}>Marketplace</Text>
          
          <TouchableOpacity
            style={styles.viewModeButton}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            activeOpacity={0.6}
            accessibilityLabel={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
            accessibilityRole="button"
          >
            <Ionicons
              name={viewMode === 'grid' ? 'list-outline' : 'grid-outline'}
              size={22}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Search Bar - iOS Style */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={colors.text.light} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search items, services..."
              placeholderTextColor={colors.text.tertiary}
              value={searchQuery}
              onChangeText={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.6}>
                <Ionicons name="close-circle" size={18} color={colors.text.light} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Categories - iOS Segmented Control Style */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((item) => (
            <TouchableOpacity
              key={item.id?.toString() || 'all'}
              style={[
                styles.categoryChip,
                selectedCategory === item.id && styles.categoryChipActive
              ]}
              onPress={() => handleCategorySelect(item.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.icon as any}
                size={18}
                color={selectedCategory === item.id ? colors.white : colors.text.dark}
                style={styles.categoryChipIcon}
              />
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === item.id && styles.categoryChipTextActive
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sort Options - iOS Style */}
      <View style={styles.sortContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortContent}
        >
          {[
            { key: 'createdAt', order: 'DESC', label: 'Newest', icon: 'time-outline' },
            { key: 'price', order: 'ASC', label: 'Price: Low', icon: 'arrow-up-outline' },
            { key: 'price', order: 'DESC', label: 'Price: High', icon: 'arrow-down-outline' },
            { key: 'viewsCount', order: 'DESC', label: 'Popular', icon: 'eye-outline' },
          ].map((sort, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.sortChip,
                filter.sortBy === sort.key && filter.sortOrder === sort.order && styles.sortChipActive
              ]}
              onPress={() => setFilter({ ...filter, sortBy: sort.key as any, sortOrder: sort.order as any })}
              activeOpacity={0.7}
            >
              <Ionicons
                name={sort.icon as any}
                size={16}
                color={
                  filter.sortBy === sort.key && filter.sortOrder === sort.order
                    ? colors.primary
                    : colors.text.light
                }
              />
              <Text
                style={[
                  styles.sortChipText,
                  filter.sortBy === sort.key && filter.sortOrder === sort.order && styles.sortChipTextActive
                ]}
              >
                {sort.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading listings...</Text>
        </View>
      ) : listings.length === 0 ? (
        <EmptyState
          icon="🛍️"
          title={searchQuery ? "No items found" : "No listings available"}
          subtitle={
            searchQuery
              ? `No listings match "${searchQuery}". Try adjusting your search or browse categories.`
              : "Be the first to list something in your community!"
          }
          actionText={searchQuery ? "Clear Search" : "Create Listing"}
          onActionPress={() => {
            if (searchQuery) {
              setSearchQuery('');
            } else {
              navigation?.navigate('CreateListing');
            }
          }}
        />
      ) : (
        <FlatList
          data={listings}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          style={styles.marketplaceList}
          contentContainerStyle={styles.listContent}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}


      {/* Floating Action Button - iOS Style */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation?.navigate('CreateListing')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.offWhite,
  },
  // Header - iOS Large Title Style
  headerContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral.lightGray,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? spacing.xs : spacing.md,
    paddingBottom: spacing.xs,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.neutral.offWhite,
  },
  largeTitle: {
    ...typography.styles.largeTitle,
    color: colors.text.dark,
  },
  viewModeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Search Bar - iOS Style
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.lightGray,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    height: 36,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    ...typography.styles.body,
    color: colors.text.dark,
    paddingVertical: 0,
  },
  // Categories - iOS Chip Style
  categoriesContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral.lightGray,
    paddingVertical: spacing.sm,
  },
  categoriesContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.neutral.lightGray,
    marginRight: spacing.xs,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
  },
  categoryChipIcon: {
    marginRight: 6,
  },
  categoryChipText: {
    ...typography.styles.subhead,
    color: colors.text.dark,
    fontWeight: typography.weights.medium,
  },
  categoryChipTextActive: {
    color: colors.white,
  },
  // Sort - iOS Style
  sortContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral.lightGray,
    paddingVertical: spacing.sm,
  },
  sortContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.neutral.offWhite,
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
    marginRight: spacing.xs,
    gap: 4,
  },
  sortChipActive: {
    backgroundColor: colors.lightGreen,
    borderColor: colors.primary,
  },
  sortChipText: {
    ...typography.styles.caption1,
    color: colors.text.light,
    fontWeight: typography.weights.medium,
  },
  sortChipTextActive: {
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  // List
  marketplaceList: {
    flex: 1,
  },
  listContent: {
    padding: spacing.sm,
    paddingBottom: spacing['3xl'],
  },
  gridItem: {
    width: '50%',
    padding: spacing.xs,
  },
  listItem: {
    width: '100%',
    paddingHorizontal: spacing.xs,
  },
  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.styles.body,
    color: colors.text.light,
    marginTop: spacing.md,
  },
  // FAB - iOS Style
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.large,
    elevation: 8,
  },
});
