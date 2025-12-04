import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Switch,
  Image,
  ActivityIndicator,
  RefreshControl,
  Platform,
  ActionSheetIOS
} from 'react-native';
import { SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, shadows } from '../../constants';
import { MarketplaceListingCard } from '../../components/business';
import { EmptyState } from '../../components/ui';
import { ListingsService } from '../../services/listingsService';

interface MyListingsScreenProps {
  navigation?: any;
}

export default function MyListingsScreen({ navigation }: MyListingsScreenProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'sold' | 'inactive'>('active');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listings, setListings] = useState<any>({ active: [], sold: [], inactive: [] });
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const listingsService = ListingsService.getInstance();

  // Fetch user's listings on mount
  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch listings from API
      const result = await listingsService.getMyListings();

      // Categorize listings by status
      const categorizedListings = {
        active: result.data.filter((listing: any) => listing.status === 'active'),
        sold: result.data.filter((listing: any) => listing.status === 'sold'),
        inactive: result.data.filter((listing: any) => listing.status === 'expired' || listing.status === 'draft'),
      };

      setListings(categorizedListings);

      // Calculate stats
      const calculatedStats = {
        totalListings: result.data.length,
        activeListings: categorizedListings.active.length,
        totalViews: result.data.reduce((sum: number, listing: any) => sum + listing.viewsCount, 0),
        totalInterested: result.data.reduce((sum: number, listing: any) => sum + (listing.savesCount || 0), 0),
        responseRate: 85, // This would come from backend
        averageResponseTime: '2 hours', // This would come from backend
        totalSold: categorizedListings.sold.length,
        totalEarnings: '₦300,000' // This would be calculated from sold items
      };
      setStats(calculatedStats);

    } catch (err: any) {
      console.error('Error fetching listings:', err);
      setError(err.message || 'Failed to load listings');

      // Show fallback mock data if API fails
      setListings({
        active: [],
        sold: [],
        inactive: []
      });
      setStats({
        totalListings: 0,
        activeListings: 0,
        totalViews: 0,
        totalInterested: 0,
        responseRate: 0,
        averageResponseTime: 'N/A',
        totalSold: 0,
        totalEarnings: '₦0'
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchListings();
    setRefreshing(false);
  };

  const triggerHaptic = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleListingAction = async (listingId: string, action: string) => {
    triggerHaptic();

    switch (action) {
      case 'edit':
        navigation?.navigate('CreateListing', { listingId, mode: 'edit' });
        break;

      case 'promote':
        Alert.alert(
          'Promote Listing',
          'Feature your listing for better visibility?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Promote (₦2,000)',
              onPress: async () => {
                triggerHaptic();
                // TODO: Implement promotion API call
                Alert.alert('Success', 'Listing promoted successfully!');
              }
            }
          ],
          { cancelable: true }
        );
        break;

      case 'deactivate':
        Alert.alert(
          'Deactivate Listing',
          'This will hide your listing from buyers. Continue?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Deactivate',
              style: 'destructive',
              onPress: async () => {
                try {
                  await listingsService.updateListing(listingId, { status: 'draft' } as any);
                  triggerHaptic();
                  Alert.alert('Success', 'Listing deactivated');
                  await fetchListings();
                } catch (err: any) {
                  Alert.alert('Error', err.message || 'Failed to deactivate listing');
                }
              }
            }
          ],
          { cancelable: true }
        );
        break;

      case 'reactivate':
        Alert.alert(
          'Reactivate Listing',
          'Make this listing visible again?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Reactivate',
              onPress: async () => {
                try {
                  await listingsService.updateListing(listingId, { status: 'active' } as any);
                  triggerHaptic();
                  Alert.alert('Success', 'Listing reactivated');
                  await fetchListings();
                } catch (err: any) {
                  Alert.alert('Error', err.message || 'Failed to reactivate listing');
                }
              }
            }
          ],
          { cancelable: true }
        );
        break;

      case 'delete':
        Alert.alert(
          'Delete Listing',
          'This action cannot be undone. Continue?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                try {
                  await listingsService.deleteListing(listingId);
                  triggerHaptic();
                  Alert.alert('Success', 'Listing deleted');
                  await fetchListings();
                } catch (err: any) {
                  Alert.alert('Error', err.message || 'Failed to delete listing');
                }
              }
            }
          ],
          { cancelable: true }
        );
        break;

      case 'duplicate':
        // TODO: Implement duplicate functionality
        Alert.alert('Coming Soon', 'Duplicate listing feature coming soon!');
        break;

      case 'mark_sold':
        Alert.alert(
          'Mark as Sold',
          'Mark this item as sold?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Mark Sold',
              onPress: async () => {
                try {
                  await listingsService.markAsSold(listingId);
                  triggerHaptic();
                  Alert.alert('Success', 'Item marked as sold');
                  await fetchListings();
                } catch (err: any) {
                  Alert.alert('Error', err.message || 'Failed to mark as sold');
                }
              }
            }
          ],
          { cancelable: true }
        );
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

      {/* Action Buttons with Emojis */}
      <View style={styles.listingActions}>
        {activeTab === 'active' && (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleListingAction(item.id, 'edit')}
              accessible={true}
              accessibilityLabel="Edit listing"
              accessibilityRole="button"
            >
              <Text style={styles.actionButtonText}>✏️ Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleListingAction(item.id, 'promote')}
              accessible={true}
              accessibilityLabel="Promote listing"
              accessibilityRole="button"
            >
              <Text style={styles.actionButtonText}>🚀 Promote</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleListingAction(item.id, 'mark_sold')}
              accessible={true}
              accessibilityLabel="Mark as sold"
              accessibilityRole="button"
            >
              <Text style={styles.actionButtonText}>✅ Mark Sold</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              onPress={() => handleListingAction(item.id, 'deactivate')}
              accessible={true}
              accessibilityLabel="Pause listing"
              accessibilityRole="button"
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
              accessible={true}
              accessibilityLabel="Reactivate listing"
              accessibilityRole="button"
            >
              <Text style={styles.actionButtonText}>▶️ Reactivate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleListingAction(item.id, 'duplicate')}
              accessible={true}
              accessibilityLabel="Duplicate listing"
              accessibilityRole="button"
            >
              <Text style={styles.actionButtonText}>📋 Duplicate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              onPress={() => handleListingAction(item.id, 'delete')}
              accessible={true}
              accessibilityLabel="Delete listing"
              accessibilityRole="button"
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
              accessible={true}
              accessibilityLabel="Duplicate listing"
              accessibilityRole="button"
            >
              <Text style={styles.actionButtonText}>📋 Duplicate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                triggerHaptic();
                Alert.alert('Leave Review', 'Leave a review for the buyer?');
              }}
              accessible={true}
              accessibilityLabel="Review buyer"
              accessibilityRole="button"
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
      {/* Header with iOS-compliant icons */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            triggerHaptic();
            navigation?.goBack();
          }}
          accessible={true}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Listings</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            triggerHaptic();
            navigation?.navigate('CreateListing');
          }}
          accessible={true}
          accessibilityLabel="Add new listing"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={20} color={colors.white} />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Analytics Toggle */}
      <View style={styles.analyticsToggle}>
        <Text style={styles.toggleLabel}>Show Analytics</Text>
        <Switch
          value={showAnalytics}
          onValueChange={(value) => {
            triggerHaptic();
            setShowAnalytics(value);
          }}
          trackColor={{ false: colors.neutral.lightGray, true: colors.lightGreen }}
          thumbColor={showAnalytics ? colors.primary : colors.neutral.gray}
          accessible={true}
          accessibilityLabel="Toggle analytics"
          accessibilityRole="switch"
        />
      </View>

      {/* Stats Overview */}
      {showAnalytics && stats && (
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
        { key: 'active', label: 'Active', count: listings.active.length },
        { key: 'sold', label: 'Sold', count: listings.sold.length },
        { key: 'inactive', label: 'Inactive', count: listings.inactive.length },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          onPress={() => {
            triggerHaptic();
            setActiveTab(tab.key as any);
          }}
          accessible={true}
          accessibilityLabel={`${tab.label} tab, ${tab.count} listings`}
          accessibilityRole="button"
          accessibilityState={{ selected: activeTab === tab.key }}
        >
          <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
            {tab.label} ({tab.count})
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const getCurrentListings = () => {
    return listings[activeTab] || [];
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

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading listings...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.danger} />
          <Text style={styles.errorTitle}>Unable to Load Listings</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              triggerHaptic();
              fetchListings();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : getCurrentListings().length === 0 ? (
        <EmptyState {...getEmptyStateProps()} />
      ) : (
        <FlatList
          data={getCurrentListings()}
          renderItem={renderListingCard}
          keyExtractor={(item) => item.id}
          style={styles.listingsContainer}
          contentContainerStyle={styles.listingsContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
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
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: 4,
    minHeight: 36,
  },
  addButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.base,
    color: colors.text.light,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  errorText: {
    fontSize: typography.sizes.base,
    color: colors.text.light,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  retryButtonText: {
    fontSize: typography.sizes.base,
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