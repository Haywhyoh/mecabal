import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows, MARKETPLACE_CATEGORIES } from '../constants';
import { ListingCard } from '../components/ListingCard';
import { EmptyState } from '../components/EmptyState';
import { ListingsService, Listing, ListingFilter } from '../services/listingsService';
import { ListingCategoriesService } from '../services/listingCategoriesService';

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
  const [showFilters, setShowFilters] = useState(false);
  const [filter, setFilter] = useState<ListingFilter>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });
  
  const listingsService = ListingsService.getInstance();

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
    } catch (error) {
      console.error('Error fetching listings:', error);
      Alert.alert('Error', 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, [filter, selectedCategory, searchQuery]);

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
    } catch (error) {
      Alert.alert('Error', 'Failed to save listing');
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

  // Categories for pills
  const categories = [
    { id: null, label: 'All', icon: 'apps' },
    { id: 1, label: 'Property', icon: 'home' },
    { id: 10, label: 'Electronics', icon: 'laptop' },
    { id: 11, label: 'Furniture', icon: 'bed' },
    { id: 20, label: 'Services', icon: 'construct' },
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

  const renderItem = ({ item }: { item: Listing }) => (
    <View style={viewMode === 'grid' ? styles.gridItem : styles.listItem}>
      <ListingCard
        listing={item}
        onPress={() => navigation?.navigate('ListingDetail', { listingId: item.id })}
        onSave={() => handleSaveListing(item.id)}
        viewMode={viewMode}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Marketplace</Text>
          <Text style={styles.subtitle}>Buy, sell & find services in your community</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            <Ionicons
              name={viewMode === 'grid' ? 'list' : 'grid'}
              size={24}
              color={colors.white}
              style={styles.headerIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowFilters(true)}>
            <Ionicons name="options-outline" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search items, services, or areas (e.g. Ikeja, Lagos)"
          placeholderTextColor={colors.text.light}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterButtonText}>⚙️ Filters</Text>
        </TouchableOpacity>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortContainer}>
          {[
            { key: 'createdAt', order: 'DESC', label: '🕒 Newest' },
            { key: 'price', order: 'ASC', label: '⬆️ Price Low' },
            { key: 'price', order: 'DESC', label: '⬇️ Price High' },
            { key: 'viewsCount', order: 'DESC', label: '👁️ Most Viewed' },
          ].map((sort, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.sortButton,
                filter.sortBy === sort.key && filter.sortOrder === sort.order && styles.sortButtonActive
              ]}
              onPress={() => setFilter({ ...filter, sortBy: sort.key as any, sortOrder: sort.order as any })}
            >
              <Text style={[
                styles.sortButtonText,
                filter.sortBy === sort.key && filter.sortOrder === sort.order && styles.sortButtonTextActive
              ]}>
                {sort.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id?.toString() || 'all'}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        />
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
      
      <TouchableOpacity 
        style={styles.fabButton}
        onPress={() => {
          // Navigate to create listing screen
          navigation?.navigate('CreateListing');
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
        <Text style={styles.fabText}>Sell</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.offWhite,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    ...shadows.small,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  headerIcon: {
    marginRight: spacing.sm,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.regular,
    color: colors.lightGreen,
    textAlign: 'center',
  },
  marketplaceList: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing['2xl'],
  },
  searchContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.neutral.lightGray,
    borderRadius: 25,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.base,
    color: colors.text.dark,
    marginRight: spacing.sm,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    fontSize: 18,
  },
  filterContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    backgroundColor: colors.neutral.lightGray,
    borderRadius: 20,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
  },
  filterButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.dark,
  },
  sortContainer: {
    flex: 1,
  },
  sortButton: {
    backgroundColor: colors.neutral.lightGray,
    borderRadius: 20,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
  },
  sortButtonActive: {
    backgroundColor: colors.primary,
  },
  sortButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.dark,
  },
  sortButtonTextActive: {
    color: colors.white,
  },
  categoriesContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
    ...shadows.small,
  },
  categoriesContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.neutral.lightGray,
    minWidth: 70,
  },
  categoryItemActive: {
    backgroundColor: colors.primary,
  },
  categoryIcon: {
    marginBottom: spacing.xs / 2,
  },
  categoryText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.text.light,
    textAlign: 'center',
  },
  categoryTextActive: {
    color: colors.white,
  },
  fabButton: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 28,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.large,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 24,
    fontWeight: typography.weights.bold,
    color: colors.white,
    lineHeight: 24,
  },
  fabText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.white,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.base,
    color: colors.text.light,
  },
  gridItem: {
    width: '50%',
    padding: spacing.xs,
  },
  listItem: {
    width: '100%',
  },
});
