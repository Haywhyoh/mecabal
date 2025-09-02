import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  FlatList,
  Alert,
  Switch,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native';
import { colors, typography, spacing, shadows } from '../constants';
import { MarketplaceListingCard } from '../components/MarketplaceListingCard';
import { EmptyState } from '../components/EmptyState';

interface MyListingsScreenProps {
  navigation?: any;
}

export default function MyListingsScreen({ navigation }: MyListingsScreenProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'sold' | 'inactive'>('active');
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Sample user's listings data
  const userListings = {
    active: [
      {
        id: '1',
        title: 'MacBook Air M1 2021 - Like New',
        price: '₦850,000',
        category: 'electronics',
        categoryName: 'Electronics',
        seller: 'You',
        location: 'Victoria Island, Lagos',
        condition: 'Used - Like New',
        postedDate: '2 days ago',
        views: 127,
        interested: 8,
        messages: 5,
        isFeatured: true,
        isActive: true,
        imageUrl: 'https://via.placeholder.com/300x200/00A651/FFFFFF?text=MacBook+Air'
      },
      {
        id: '2',
        title: 'Professional Plumbing Service',
        price: '₦12,000/visit',
        category: 'services',
        categoryName: 'Services',
        seller: 'You',
        location: 'Lagos Mainland',
        postedDate: '1 week ago',
        views: 89,
        interested: 12,
        messages: 9,
        isActive: true,
        imageUrl: 'https://via.placeholder.com/300x200/228B22/FFFFFF?text=Plumbing+Service'
      },
      {
        id: '3',
        title: 'Toyota Camry 2019 - Nigerian Used',
        price: '₦8,500,000',
        category: 'vehicles',
        categoryName: 'Vehicles',
        seller: 'You',
        location: 'Ikeja, Lagos',
        condition: 'Used - Good',
        postedDate: '3 days ago',
        views: 203,
        interested: 15,
        messages: 11,
        isActive: true,
        imageUrl: 'https://via.placeholder.com/300x200/FF4500/FFFFFF?text=Toyota+Camry'
      }
    ],
    sold: [
      {
        id: '4',
        title: 'iPhone 11 Pro Max - Sold',
        price: '₦320,000',
        category: 'electronics',
        categoryName: 'Electronics',
        seller: 'You',
        location: 'Lekki, Lagos',
        condition: 'Used - Good',
        postedDate: '2 weeks ago',
        soldDate: '5 days ago',
        soldPrice: '₦300,000',
        buyer: 'Adebayo K.',
        views: 156,
        interested: 22,
        messages: 18,
        isActive: false,
        imageUrl: 'https://via.placeholder.com/300x200/666666/FFFFFF?text=iPhone+11+SOLD'
      }
    ],
    inactive: [
      {
        id: '5',
        title: 'Samsung Galaxy Tab - Expired',
        price: '₦180,000',
        category: 'electronics',
        categoryName: 'Electronics',
        seller: 'You',
        location: 'Surulere, Lagos',
        condition: 'Brand New',
        postedDate: '1 month ago',
        expiredDate: '1 week ago',
        views: 45,
        interested: 3,
        messages: 2,
        isActive: false,
        reason: 'Expired - No responses',
        imageUrl: 'https://via.placeholder.com/300x200/999999/FFFFFF?text=Galaxy+Tab'
      }
    ]
  };

  const stats = {
    totalListings: 5,
    activeListings: 3,
    totalViews: 620,
    totalInterested: 60,
    responseRate: 85,
    averageResponseTime: '2 hours',
    totalSold: 1,
    totalEarnings: '₦300,000'
  };

  const handleListingAction = (listingId: string, action: string) => {
    switch (action) {
      case 'edit':
        Alert.alert('Edit Listing', 'Navigate to edit screen');
        break;
      case 'promote':
        Alert.alert('Promote Listing', 'Feature your listing for better visibility?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Promote (₦2,000)', onPress: () => console.log('Promote listing') }
        ]);
        break;
      case 'deactivate':
        Alert.alert('Deactivate Listing', 'This will hide your listing from buyers. Continue?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Deactivate', style: 'destructive', onPress: () => console.log('Deactivate') }
        ]);
        break;
      case 'reactivate':
        Alert.alert('Reactivate Listing', 'Make this listing visible again?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reactivate', onPress: () => console.log('Reactivate') }
        ]);
        break;
      case 'delete':
        Alert.alert('Delete Listing', 'This action cannot be undone. Continue?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => console.log('Delete') }
        ]);
        break;
      case 'duplicate':
        Alert.alert('Duplicate Listing', 'Create a copy of this listing?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Duplicate', onPress: () => console.log('Duplicate') }
        ]);
        break;
      case 'mark_sold':
        Alert.alert('Mark as Sold', 'Mark this item as sold?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Mark Sold', onPress: () => console.log('Mark sold') }
        ]);
        break;
    }
  };

  const renderListingCard = ({ item }: { item: any }) => (
    <View style={styles.listingCardContainer}>
      <MarketplaceListingCard 
        item={item}
        onPress={() => console.log('View listing details')}
      />
      
      {/* Listing Stats */}
      <View style={styles.listingStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{item.views}</Text>
          <Text style={styles.statLabel}>Views</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{item.interested}</Text>
          <Text style={styles.statLabel}>Interested</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{item.messages}</Text>
          <Text style={styles.statLabel}>Messages</Text>
        </View>
        
        {activeTab === 'sold' && (
          <View style={styles.soldInfo}>
            <Text style={styles.soldPrice}>Sold for {item.soldPrice}</Text>
            <Text style={styles.soldDate}>to {item.buyer}</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.listingActions}>
        {activeTab === 'active' && (
          <>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleListingAction(item.id, 'edit')}
            >
              <Text style={styles.actionButtonText}>✏️ Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleListingAction(item.id, 'promote')}
            >
              <Text style={styles.actionButtonText}>🚀 Promote</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleListingAction(item.id, 'mark_sold')}
            >
              <Text style={styles.actionButtonText}>✅ Mark Sold</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.dangerButton]}
              onPress={() => handleListingAction(item.id, 'deactivate')}
            >
              <Text style={[styles.actionButtonText, styles.dangerText]}>⏸️ Pause</Text>
            </TouchableOpacity>
          </>
        )}

        {activeTab === 'inactive' && (
          <>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleListingAction(item.id, 'reactivate')}
            >
              <Text style={styles.actionButtonText}>▶️ Reactivate</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleListingAction(item.id, 'duplicate')}
            >
              <Text style={styles.actionButtonText}>📋 Duplicate</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.dangerButton]}
              onPress={() => handleListingAction(item.id, 'delete')}
            >
              <Text style={[styles.actionButtonText, styles.dangerText]}>🗑️ Delete</Text>
            </TouchableOpacity>
          </>
        )}

        {activeTab === 'sold' && (
          <>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleListingAction(item.id, 'duplicate')}
            >
              <Text style={styles.actionButtonText}>📋 Duplicate</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => Alert.alert('Leave Review', 'Leave a review for the buyer?')}
            >
              <Text style={styles.actionButtonText}>⭐ Review Buyer</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  const renderHeader = () => (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Listings</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => console.log('Navigate to create listing')}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Analytics Toggle */}
      <View style={styles.analyticsToggle}>
        <Text style={styles.toggleLabel}>Show Analytics</Text>
        <Switch
          value={showAnalytics}
          onValueChange={setShowAnalytics}
          trackColor={{ false: colors.neutral.lightGray, true: colors.lightGreen }}
          thumbColor={showAnalytics ? colors.primary : colors.neutral.gray}
        />
      </View>

      {/* Stats Overview */}
      {showAnalytics && (
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statCardNumber}>{stats.totalListings}</Text>
              <Text style={styles.statCardLabel}>Total Listings</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardNumber}>{stats.activeListings}</Text>
              <Text style={styles.statCardLabel}>Active</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardNumber}>{stats.totalViews}</Text>
              <Text style={styles.statCardLabel}>Total Views</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardNumber}>{stats.totalInterested}</Text>
              <Text style={styles.statCardLabel}>Interested</Text>
            </View>
          </View>
          
          <View style={styles.additionalStats}>
            <View style={styles.additionalStat}>
              <Text style={styles.additionalStatLabel}>Response Rate</Text>
              <Text style={styles.additionalStatValue}>{stats.responseRate}%</Text>
            </View>
            <View style={styles.additionalStat}>
              <Text style={styles.additionalStatLabel}>Avg Response Time</Text>
              <Text style={styles.additionalStatValue}>{stats.averageResponseTime}</Text>
            </View>
            <View style={styles.additionalStat}>
              <Text style={styles.additionalStatLabel}>Total Earnings</Text>
              <Text style={[styles.additionalStatValue, styles.earningsValue]}>{stats.totalEarnings}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {[
        { key: 'active', label: 'Active', count: userListings.active.length },
        { key: 'sold', label: 'Sold', count: userListings.sold.length },
        { key: 'inactive', label: 'Inactive', count: userListings.inactive.length },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          onPress={() => setActiveTab(tab.key as any)}
        >
          <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
            {tab.label} ({tab.count})
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const getCurrentListings = () => {
    return userListings[activeTab] || [];
  };

  const getEmptyStateProps = () => {
    switch (activeTab) {
      case 'active':
        return {
          icon: '📦',
          title: 'No Active Listings',
          subtitle: 'Start selling! Create your first listing and reach thousands of buyers in your area.',
          actionText: 'Create Listing',
          onActionPress: () => console.log('Navigate to create listing')
        };
      case 'sold':
        return {
          icon: '🎉',
          title: 'No Sales Yet',
          subtitle: 'Once you sell items, they\'ll appear here. Keep your listings active to attract buyers!',
          actionText: 'View Active Listings',
          onActionPress: () => setActiveTab('active')
        };
      case 'inactive':
        return {
          icon: '⏸️',
          title: 'No Inactive Listings',
          subtitle: 'Paused or expired listings will appear here. You can reactivate them anytime.',
          actionText: 'View Active Listings',
          onActionPress: () => setActiveTab('active')
        };
      default:
        return {
          icon: '📦',
          title: 'No Listings',
          subtitle: 'Create your first listing to get started.',
          actionText: 'Create Listing',
          onActionPress: () => console.log('Navigate to create listing')
        };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderTabBar()}
      
      {getCurrentListings().length === 0 ? (
        <EmptyState {...getEmptyStateProps()} />
      ) : (
        <FlatList
          data={getCurrentListings()}
          renderItem={renderListingCard}
          keyExtractor={(item) => item.id}
          style={styles.listingsContainer}
          contentContainerStyle={styles.listingsContent}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  backButton: {
    padding: spacing.xs,
  },
  backButtonText: {
    fontSize: typography.sizes.xl,
    color: colors.text.dark,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 15,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  addButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
  analyticsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  toggleLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.text.dark,
  },
  statsContainer: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statCardNumber: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  statCardLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.light,
    textAlign: 'center',
  },
  additionalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.lightGray,
  },
  additionalStat: {
    alignItems: 'center',
    flex: 1,
  },
  additionalStatLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.light,
    marginBottom: spacing.xs / 2,
    textAlign: 'center',
  },
  additionalStatValue: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
  },
  earningsValue: {
    color: colors.accent.marketGreen,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.sizes.sm,
    color: colors.text.light,
    fontWeight: typography.weights.medium,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  listingsContainer: {
    flex: 1,
  },
  listingsContent: {
    padding: spacing.md,
    paddingBottom: spacing['2xl'],
  },
  listingCardContainer: {
    backgroundColor: colors.white,
    marginBottom: spacing.lg,
    borderRadius: 12,
    ...shadows.medium,
    overflow: 'hidden',
  },
  listingStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  statLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.light,
  },
  soldInfo: {
    alignItems: 'center',
  },
  soldPrice: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.accent.marketGreen,
  },
  soldDate: {
    fontSize: typography.sizes.sm,
    color: colors.text.light,
  },
  listingActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.sm,
    gap: spacing.xs,
  },
  actionButton: {
    backgroundColor: colors.neutral.lightGray,
    borderRadius: 15,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  actionButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.text.dark,
    fontWeight: typography.weights.medium,
  },
  dangerButton: {
    backgroundColor: colors.danger,
  },
  dangerText: {
    color: colors.white,
  },
});