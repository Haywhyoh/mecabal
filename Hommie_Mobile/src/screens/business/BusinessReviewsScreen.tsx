import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, BORDER_RADIUS, shadows } from '../constants';
import { ScreenHeader } from '../components/ui';
import { ReviewCard, RatingBreakdown } from '../components/business';
import { businessReviewApi } from '../services/api/businessReviewApi';
import { BusinessReview, ReviewStats } from '../services/types/review.types';

interface Props {
  route: {
    params: {
      businessId: string;
      businessName: string;
    };
  };
  navigation: any;
}

// TODO: This should be determined from user context or API
// For now, we'll assume the user is not a business owner
// In a real implementation, this would check if the current user owns this business
const isCurrentUserBusinessOwner = false;

export default function BusinessReviewsScreen({ route, navigation }: Props) {
  const { businessId, businessName } = route.params;

  // State
  const [reviews, setReviews] = useState<BusinessReview[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  // Filtering
  const [selectedRating, setSelectedRating] = useState<number | undefined>();

  // Load data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load more when page changes
  useEffect(() => {
    if (currentPage > 1) {
      loadReviews(false);
    }
  }, [currentPage]);

  // Reload when rating filter changes
  useEffect(() => {
    if (currentPage === 1) {
      loadReviews(true);
    } else {
      setCurrentPage(1);
    }
  }, [selectedRating]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load both reviews and stats in parallel
      const [reviewsResponse, statsData] = await Promise.all([
        businessReviewApi.getReviews(businessId, {
          page: 1,
          limit: 20,
          rating: selectedRating,
        }),
        businessReviewApi.getReviewStats(businessId),
      ]);

      setReviews(reviewsResponse.data);
      setStats(statsData);
      setTotalPages(reviewsResponse.pagination.totalPages);
      setHasMore(reviewsResponse.pagination.page < reviewsResponse.pagination.totalPages);
      setCurrentPage(1);
    } catch (err: any) {
      setError(err.message || 'Failed to load reviews');
      Alert.alert('Error', 'Failed to load reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async (reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setCurrentPage(1);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const response = await businessReviewApi.getReviews(businessId, {
        page: reset ? 1 : currentPage,
        limit: 20,
        rating: selectedRating,
      });

      if (reset) {
        setReviews(response.data);
      } else {
        setReviews(prev => [...prev, ...response.data]);
      }

      setTotalPages(response.pagination.totalPages);
      setHasMore(response.pagination.page < response.pagination.totalPages);
      setCurrentPage(response.pagination.page);
    } catch (err: any) {
      setError(err.message || 'Failed to load reviews');
      Alert.alert('Error', 'Failed to load reviews. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadReviews(true);
  }, [selectedRating]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  }, [loadingMore, hasMore]);

  const handleRatingFilter = useCallback((rating: number | undefined) => {
    setSelectedRating(rating);
  }, []);


  const handleWriteReview = () => {
    navigation.navigate('WriteReview', {
      businessId,
      businessName,
    });
  };

  const renderEmptyState = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyState}>
        <MaterialCommunityIcons
          name="star-outline"
          size={64}
          color={colors.text.tertiary}
        />
        <Text style={styles.emptyTitle}>No Reviews Yet</Text>
        <Text style={styles.emptyMessage}>
          Be the first to review {businessName}
        </Text>
        <TouchableOpacity
          style={styles.writeReviewButton}
          onPress={handleWriteReview}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="star"
            size={16}
            color={colors.white}
            style={styles.writeReviewIcon}
          />
          <Text style={styles.writeReviewText}>Write Review</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderLoadingState = () => {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading reviews...</Text>
      </View>
    );
  };

  const renderErrorState = () => {
    return (
      <View style={styles.errorState}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={64}
          color={colors.danger}
        />
        <Text style={styles.errorTitle}>Failed to Load Reviews</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadInitialData}
          activeOpacity={0.7}
        >
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderReviewsList = () => {
    if (reviews.length === 0) {
      return renderEmptyState();
    }

    return (
      <View style={styles.reviewsList}>
        <View style={styles.reviewsHeader}>
          <Text style={styles.reviewsTitle}>
            {selectedRating ? `${selectedRating} Star Reviews` : 'All Reviews'}
          </Text>
          <TouchableOpacity
            style={styles.writeReviewButtonSmall}
            onPress={handleWriteReview}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="plus"
              size={16}
              color={colors.primary}
            />
            <Text style={styles.writeReviewTextSmall}>Write Review</Text>
          </TouchableOpacity>
        </View>

        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            isBusinessOwner={isCurrentUserBusinessOwner}
            businessId={businessId}
            businessName={businessName}
            onResponseSubmitted={() => {
              // Reload reviews to show the new response
              loadReviews(true);
            }}
          />
        ))}

        {/* Load More Button */}
        {hasMore && (
          <TouchableOpacity
            style={styles.loadMoreButton}
            onPress={handleLoadMore}
            disabled={loadingMore}
            activeOpacity={0.7}
          >
            {loadingMore ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Text style={styles.loadMoreText}>Load More Reviews</Text>
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={16}
                  color={colors.primary}
                />
              </>
            )}
          </TouchableOpacity>
        )}

        {/* End of Results */}
        {!hasMore && reviews.length > 0 && (
          <View style={styles.endOfResults}>
            <Text style={styles.endOfResultsText}>
              You've reached the end of the reviews
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading && reviews.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader
          title={`Reviews - ${businessName}`}
          navigation={navigation}
        />
        {renderLoadingState()}
      </SafeAreaView>
    );
  }

  if (error && reviews.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader
          title={`Reviews - ${businessName}`}
          navigation={navigation}
        />
        {renderErrorState()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title={`Reviews - ${businessName}`}
        navigation={navigation}
        rightComponent={
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleWriteReview}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="star"
              size={20}
              color={colors.primary}
            />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom =
            layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
          if (isCloseToBottom && hasMore && !loadingMore) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {/* Rating Breakdown */}
        {stats && (
          <RatingBreakdown
            stats={stats}
            selectedRating={selectedRating}
            onRatingFilter={handleRatingFilter}
          />
        )}

        {/* Reviews List */}
        {renderReviewsList()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.offWhite,
  },
  scrollView: {
    flex: 1,
  },
  headerButton: {
    padding: spacing.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: colors.lightGreen,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  loadingText: {
    fontSize: typography.sizes.callout,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.sizes.title2,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyMessage: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    ...shadows.small,
  },
  writeReviewIcon: {
    marginRight: spacing.xs,
  },
  writeReviewText: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
  writeReviewButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGreen,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  writeReviewTextSmall: {
    fontSize: typography.sizes.caption1,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.xl,
  },
  errorTitle: {
    fontSize: typography.sizes.title2,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  retryText: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
  reviewsList: {
    paddingBottom: spacing.xl,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  reviewsTitle: {
    fontSize: typography.sizes.headline,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    ...shadows.small,
  },
  loadMoreText: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
    marginRight: spacing.xs,
  },
  endOfResults: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  endOfResultsText: {
    fontSize: typography.sizes.caption1,
    color: colors.text.tertiary,
  },
});
