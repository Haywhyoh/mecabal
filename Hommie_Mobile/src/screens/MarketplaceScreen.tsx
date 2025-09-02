import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native';
import { colors, typography, spacing, shadows, MARKETPLACE_CATEGORIES } from '../constants';
import { MarketplaceListingCard } from '../components/MarketplaceListingCard';
import { EmptyState } from '../components/EmptyState';

interface MarketplaceScreenProps {
  navigation?: any;
}

export default function MarketplaceScreen({ navigation }: MarketplaceScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, price_low, price_high, location
  const [showFilters, setShowFilters] = useState(false);
  
  const dummyItems = [
    { 
      id: '1', 
      title: 'iPhone 12 Pro Max 256GB', 
      price: '₦450,000', 
      category: 'electronics', 
      categoryName: 'Electronics', 
      seller: 'TechHub NG', 
      location: 'Ikeja, Lagos',
      condition: 'Used - Like New',
      isVerified: true,
      isFeatured: true,
      postedDate: '2 hours ago'
    },
    { 
      id: '2', 
      title: 'Professional Plumbing Service', 
      price: '₦12,000/visit', 
      category: 'services', 
      categoryName: 'Services', 
      seller: 'AquaFix Solutions', 
      location: 'Victoria Island, Lagos',
      isVerified: true,
      postedDate: '1 day ago'
    },
    { 
      id: '3', 
      title: '7-Seater Sofa Set with Center Table', 
      price: '₦180,000', 
      category: 'furniture', 
      categoryName: 'Furniture', 
      seller: 'Sarah\'s Furniture', 
      location: 'Lekki Phase 1, Lagos',
      condition: 'Brand New',
      postedDate: '3 days ago'
    },
    { 
      id: '4', 
      title: 'Generator Repair & Maintenance', 
      price: '₦8,000', 
      category: 'services', 
      categoryName: 'Services', 
      seller: 'PowerTech Engineers', 
      location: 'Surulere, Lagos',
      isVerified: true,
      postedDate: '1 week ago'
    },
    { 
      id: '5', 
      title: 'Toyota Corolla 2018 (Nigerian Used)', 
      price: '₦4,800,000', 
      category: 'vehicles', 
      categoryName: 'Vehicles', 
      seller: 'AutoMart Nigeria', 
      location: 'Berger, Lagos',
      condition: 'Used - Good',
      isVerified: true,
      isFeatured: true,
      postedDate: '2 days ago'
    },
    { 
      id: '6', 
      title: 'Designer Wedding Gown (Size 12)', 
      price: '₦95,000', 
      category: 'fashion', 
      categoryName: 'Fashion', 
      seller: 'Bella\'s Bridal Collection', 
      location: 'Ajah, Lagos',
      condition: 'Used Once',
      postedDate: '5 days ago'
    },
  ];

  const filteredItems = dummyItems
    .filter(item => selectedCategory === 'all' || item.category === selectedCategory)
    .filter(item => 
      searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.seller.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return parseFloat(a.price.replace(/[₦,]/g, '')) - parseFloat(b.price.replace(/[₦,]/g, ''));
        case 'price_high':
          return parseFloat(b.price.replace(/[₦,]/g, '')) - parseFloat(a.price.replace(/[₦,]/g, ''));
        case 'location':
          return a.location.localeCompare(b.location);
        case 'newest':
        default:
          return 0; // Keep original order (newest first in our dummy data)
      }
    });

  const renderCategoryItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.id && styles.categoryItemActive
      ]}
      onPress={() => {
        if (item.id === 'all') {
          setSelectedCategory(item.id);
        } else {
          // Navigate to category browse screen
          navigation?.navigate('CategoryBrowse', {
            categoryId: item.id,
            categoryName: item.name
          });
        }
      }}
      activeOpacity={0.7}
    >
      <Text style={styles.categoryIcon}>{item.icon}</Text>
      <Text style={[
        styles.categoryText,
        selectedCategory === item.id && styles.categoryTextActive
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: any }) => (
    <MarketplaceListingCard 
      item={item}
      onPress={() => {
        // Navigate to listing detail screen
        navigation?.navigate('ListingDetail', { listingId: item.id });
      }}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Estate Marketplace</Text>
          <Text style={styles.subtitle}>Buy, sell & find services in your community</Text>
        </View>
      </View>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search items, services, or areas (e.g. Ikeja, Lagos)"
          placeholderTextColor={colors.text.light}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.searchButton}>
          <Text style={styles.searchButtonText}>🔍</Text>
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
            { key: 'newest', label: '🕒 Newest' },
            { key: 'price_low', label: '⬆️ Price Low' },
            { key: 'price_high', label: '⬇️ Price High' },
            { key: 'location', label: '📍 Location' },
          ].map((sort) => (
            <TouchableOpacity
              key={sort.key}
              style={[
                styles.sortButton,
                sortBy === sort.key && styles.sortButtonActive
              ]}
              onPress={() => setSortBy(sort.key)}
            >
              <Text style={[
                styles.sortButtonText,
                sortBy === sort.key && styles.sortButtonTextActive
              ]}>
                {sort.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <View style={styles.categoriesContainer}>
        <FlatList
          data={MARKETPLACE_CATEGORIES}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        />
      </View>
      
      {filteredItems.length === 0 ? (
        <EmptyState
          icon="🛍️"
          title={searchQuery ? "No items found" : selectedCategory === 'all' ? "Welcome to the Marketplace!" : "No items in this category"}
          subtitle={
            searchQuery 
              ? `No listings match "${searchQuery}". Try adjusting your search or browse categories below.`
              : selectedCategory === 'all'
              ? "Start browsing items and services from your neighbors, or list something to sell!"
              : `No ${MARKETPLACE_CATEGORIES.find(c => c.id === selectedCategory)?.name.toLowerCase()} items available right now. Check back later or try other categories.`
          }
          actionText={searchQuery ? "Clear Search" : "Start Selling"}
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
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          style={styles.marketplaceList}
          contentContainerStyle={styles.listContent}
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
  },
  headerContent: {
    alignItems: 'center',
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
    fontSize: 20,
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
});
