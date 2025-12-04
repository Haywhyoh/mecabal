import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native';
import { colors, typography, spacing, shadows, MARKETPLACE_CATEGORIES } from '../constants';
import { MarketplaceListingCard } from '../components/business';
import { EmptyState } from '../components/ui';

interface CategoryBrowseScreenProps {
  route?: {
    params?: {
      categoryId: string;
      categoryName: string;
    };
  };
  navigation?: any;
}

export default function CategoryBrowseScreen({ route, navigation }: CategoryBrowseScreenProps) {
  const categoryId = route?.params?.categoryId || 'all';
  const categoryName = route?.params?.categoryName || 'All Items';
  
  const [sortBy, setSortBy] = useState('newest');
  
  // Expanded dummy data for category browsing
  const allItems = [
    // Electronics
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
      postedDate: '2 hours ago',
      imageUrl: 'https://via.placeholder.com/300x200/00A651/FFFFFF?text=iPhone+12'
    },
    { 
      id: '8', 
      title: 'MacBook Air M1 2021', 
      price: '₦850,000', 
      category: 'electronics', 
      categoryName: 'Electronics', 
      seller: 'MacStore Lagos', 
      location: 'Victoria Island, Lagos',
      condition: 'Brand New',
      isVerified: true,
      postedDate: '1 day ago',
      imageUrl: 'https://via.placeholder.com/300x200/00A651/FFFFFF?text=MacBook+Air'
    },
    { 
      id: '9', 
      title: 'Samsung 65" Smart TV', 
      price: '₦320,000', 
      category: 'electronics', 
      categoryName: 'Electronics', 
      seller: 'ElectroMart NG', 
      location: 'Surulere, Lagos',
      condition: 'Brand New',
      isVerified: true,
      isFeatured: true,
      postedDate: '3 days ago',
      imageUrl: 'https://via.placeholder.com/300x200/00A651/FFFFFF?text=Samsung+TV'
    },
    // Services
    { 
      id: '2', 
      title: 'Professional Plumbing Service', 
      price: '₦12,000/visit', 
      category: 'services', 
      categoryName: 'Services', 
      seller: 'AquaFix Solutions', 
      location: 'Victoria Island, Lagos',
      isVerified: true,
      postedDate: '1 day ago',
      imageUrl: 'https://via.placeholder.com/300x200/228B22/FFFFFF?text=Plumbing+Service'
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
      postedDate: '1 week ago',
      imageUrl: 'https://via.placeholder.com/300x200/228B22/FFFFFF?text=Generator+Repair'
    },
    // Furniture
    { 
      id: '3', 
      title: '7-Seater Sofa Set with Center Table', 
      price: '₦180,000', 
      category: 'furniture', 
      categoryName: 'Furniture', 
      seller: 'Sarah\'s Furniture', 
      location: 'Lekki Phase 1, Lagos',
      condition: 'Brand New',
      postedDate: '3 days ago',
      imageUrl: 'https://via.placeholder.com/300x200/8B4513/FFFFFF?text=Sofa+Set'
    },
    // Vehicles
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
      postedDate: '2 days ago',
      imageUrl: 'https://via.placeholder.com/300x200/FF4500/FFFFFF?text=Toyota+Corolla'
    },
    // Fashion
    { 
      id: '6', 
      title: 'Designer Wedding Gown (Size 12)', 
      price: '₦95,000', 
      category: 'fashion', 
      categoryName: 'Fashion', 
      seller: 'Bella\'s Bridal Collection', 
      location: 'Ajah, Lagos',
      condition: 'Used Once',
      postedDate: '5 days ago',
      imageUrl: 'https://via.placeholder.com/300x200/FF69B4/FFFFFF?text=Wedding+Gown'
    },
  ];

  const filteredItems = categoryId === 'all' 
    ? allItems 
    : allItems.filter(item => item.category === categoryId);

  const sortedItems = filteredItems.sort((a, b) => {
    switch (sortBy) {
      case 'price_low':
        return parseFloat(a.price.replace(/[₦,]/g, '')) - parseFloat(b.price.replace(/[₦,]/g, ''));
      case 'price_high':
        return parseFloat(b.price.replace(/[₦,]/g, '')) - parseFloat(a.price.replace(/[₦,]/g, ''));
      case 'location':
        return a.location.localeCompare(b.location);
      case 'newest':
      default:
        return 0;
    }
  });

  const renderGridItem = ({ item }: { item: any }) => (
    <View style={styles.gridItemContainer}>
      <MarketplaceListingCard 
        item={item}
        onPress={() => {
          console.log('Navigate to listing detail:', item.id);
          // navigation?.navigate('ListingDetail', { listingId: item.id });
        }}
      />
    </View>
  );

  const renderSortOption = (sort: { key: string; label: string }) => (
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
  );

  const categoryData = MARKETPLACE_CATEGORIES.find(cat => cat.id === categoryId);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.categoryIcon}>{categoryData?.icon || '🏪'}</Text>
          <Text style={styles.title}>{categoryName}</Text>
          <Text style={styles.subtitle}>{sortedItems.length} items available</Text>
        </View>
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <View style={styles.sortOptions}>
          {[
            { key: 'newest', label: '🕒 Newest' },
            { key: 'price_low', label: '⬆️ Price Low' },
            { key: 'price_high', label: '⬇️ Price High' },
            { key: 'location', label: '📍 Location' },
          ].map(renderSortOption)}
        </View>
      </View>

      {/* Grid Content */}
      {sortedItems.length === 0 ? (
        <EmptyState
          icon={categoryData?.icon || "🛍️"}
          title={`No ${categoryName.toLowerCase()} found`}
          subtitle={`No items in ${categoryName.toLowerCase()} category right now. Check back later or browse other categories.`}
          actionText="Browse All Items"
          onActionPress={() => navigation?.goBack()}
        />
      ) : (
        <FlatList
          data={sortedItems}
          renderItem={renderGridItem}
          keyExtractor={(item) => item.id}
          numColumns={1} // Can be changed to 2 for smaller cards
          style={styles.gridList}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.small,
  },
  backButton: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  backButtonText: {
    fontSize: typography.sizes.xl,
    color: colors.white,
    fontWeight: typography.weights.bold,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.white,
    marginBottom: spacing.xs / 2,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.lightGreen,
  },
  sortContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  sortLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.dark,
    marginBottom: spacing.xs,
  },
  sortOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sortButton: {
    backgroundColor: colors.neutral.lightGray,
    borderRadius: 20,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
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
  gridList: {
    flex: 1,
  },
  gridContent: {
    padding: spacing.md,
    paddingBottom: spacing['2xl'],
  },
  gridItemContainer: {
    flex: 1,
    marginBottom: spacing.sm,
  },
});