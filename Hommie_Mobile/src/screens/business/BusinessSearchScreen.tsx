import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../../constants';
import { BusinessService, BusinessProfile, BusinessFilter } from '../../services/businessService';

interface BusinessSearchScreenProps {
  navigation: any;
}

export default function BusinessSearchScreen({ navigation }: BusinessSearchScreenProps) {
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filter, setFilter] = useState<BusinessFilter>({
    page: 1,
    limit: 20,
  });
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const businessService = BusinessService.getInstance();

  const fetchBusinesses = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setFilter(prev => ({ ...prev, page: 1 }));
      } else {
        setLoadingMore(true);
      }

      const currentFilter: BusinessFilter = {
        ...filter,
        search: searchQuery || undefined,
        category: selectedCategory || undefined,
        page: reset ? 1 : filter.page,
      };

      const result = await businessService.getBusinesses(currentFilter);
      
      if (reset) {
        setBusinesses(result.data);
      } else {
        setBusinesses(prev => [...prev, ...result.data]);
      }
      
      setHasMore(result.hasNext);
    } catch (error) {
      console.error('Error fetching businesses:', error);
      Alert.alert('Error', 'Failed to load businesses. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedCategory, filter]);

  useEffect(() => {
    fetchBusinesses(true);
  }, [searchQuery, selectedCategory]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBusinesses(true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setFilter(prev => ({ ...prev, page: (prev.page || 1) + 1 }));
      fetchBusinesses(false);
    }
  };

  const renderBusinessCard = ({ item }: { item: BusinessProfile }) => (
    <TouchableOpacity
      style={styles.businessCard}
      onPress={() => navigation.navigate('BusinessDetail', { businessId: item.id })}
    >
      <View style={styles.businessHeader}>
        <View style={styles.businessInfo}>
          <View style={styles.businessNameRow}>
            <Text style={styles.businessName}>{item.businessName}</Text>
            {item.isVerified && (
              <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
            )}
          </View>
          <Text style={styles.businessCategory}>{item.category}</Text>
        </View>
        {item.profileImageUrl && (
          <Image
            source={{ uri: item.profileImageUrl }}
            style={styles.businessImage}
          />
        )}
      </View>

      <Text style={styles.businessDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.businessStats}>
        <View style={styles.statItem}>
          <Ionicons name="star" size={16} color={colors.accent.warmGold} />
          <Text style={styles.statText}>
            {item.rating.toFixed(1)} ({item.reviewCount})
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={styles.statText}>{item.completedJobs} jobs</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="location" size={16} color={colors.text.light} />
          <Text style={styles.statText}>{item.serviceArea}</Text>
        </View>
      </View>

      <View style={styles.verificationBadge}>
        <Text style={styles.verificationText}>
          {item.verificationLevel.toUpperCase()} VERIFIED
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="business-outline" size={64} color={colors.text.light} />
      <Text style={styles.emptyTitle}>No businesses found</Text>
      <Text style={styles.emptySubtitle}>
        Try adjusting your search or filters
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Local Businesses</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            // TODO: Implement filter modal
          }}
        >
          <Ionicons name="filter" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.text.light} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading businesses...</Text>
        </View>
      ) : (
        <FlatList
          data={businesses}
          renderItem={renderBusinessCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmptyState}
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
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.styles.title3,
    color: colors.text.dark,
    fontWeight: typography.weights.semibold,
  },
  filterButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.lightGray,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    height: 40,
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    ...typography.styles.body,
    color: colors.text.dark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.styles.body,
    color: colors.text.light,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  businessCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    ...shadows.small,
  },
  businessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  businessInfo: {
    flex: 1,
  },
  businessNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs / 2,
  },
  businessName: {
    ...typography.styles.headline,
    color: colors.text.dark,
    fontWeight: typography.weights.semibold,
  },
  businessCategory: {
    ...typography.styles.subhead,
    color: colors.text.light,
  },
  businessImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  businessDescription: {
    ...typography.styles.body,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  businessStats: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    ...typography.styles.caption1,
    color: colors.text.light,
  },
  verificationBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.lightGreen,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verificationText: {
    ...typography.styles.caption2,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  footerLoader: {
    padding: spacing.md,
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    ...typography.styles.title3,
    color: colors.text.dark,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.styles.body,
    color: colors.text.light,
    textAlign: 'center',
  },
});
