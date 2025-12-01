import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, BORDER_RADIUS } from '../../constants';
import { ReviewStats } from '../../services/types/review.types';

interface RatingBreakdownProps {
  stats: ReviewStats;
  selectedRating?: number;
  onRatingFilter?: (rating: number | undefined) => void;
}

export const RatingBreakdown: React.FC<RatingBreakdownProps> = ({
  stats,
  selectedRating,
  onRatingFilter,
}) => {
  const renderStars = (rating: number, size: number = 16) => {
    return Array.from({ length: 5 }, (_, index) => (
      <MaterialCommunityIcons
        key={index}
        name={index < rating ? 'star' : 'star-outline'}
        size={size}
        color="#FFC107"
        style={styles.star}
      />
    ));
  };

  const renderRatingBar = (rating: number) => {
    const count = stats.ratingBreakdown[rating as keyof typeof stats.ratingBreakdown];
    const percentage = stats.totalReviews > 0
      ? (count / stats.totalReviews) * 100
      : 0;

    const isSelected = selectedRating === rating;

    return (
      <TouchableOpacity
        key={rating}
        style={[
          styles.ratingRow,
          isSelected && styles.selectedRatingRow,
        ]}
        onPress={() => onRatingFilter?.(isSelected ? undefined : rating)}
        activeOpacity={0.7}
      >
        <View style={styles.ratingLabelContainer}>
          <Text style={styles.ratingLabel}>{rating}</Text>
          <MaterialCommunityIcons
            name="star"
            size={14}
            color="#FFC107"
            style={styles.ratingStar}
          />
        </View>
        
        <View style={styles.ratingBarContainer}>
          <View style={styles.ratingBar}>
            <View
              style={[
                styles.ratingBarFill,
                { width: `${percentage}%` }
              ]}
            />
          </View>
        </View>
        
        <View style={styles.ratingCountContainer}>
          <Text style={[
            styles.ratingCount,
            isSelected && styles.selectedRatingCount
          ]}>
            {count}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderOverallRating = () => {
    const roundedRating = Math.round(stats.averageRating * 10) / 10;
    
    return (
      <View style={styles.overallRatingContainer}>
        <View style={styles.overallRatingNumber}>
          <Text style={styles.ratingNumber}>{roundedRating}</Text>
          <Text style={styles.ratingOutOf}>/5</Text>
        </View>
        
        <View style={styles.overallStars}>
          {renderStars(Math.round(stats.averageRating), 20)}
        </View>
        
        <Text style={styles.totalReviewsText}>
          Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
        </Text>
      </View>
    );
  };

  const renderDetailedAverages = () => {
    const averages = [
      { label: 'Service Quality', value: stats.averageServiceQuality },
      { label: 'Professionalism', value: stats.averageProfessionalism },
      { label: 'Value for Money', value: stats.averageValueForMoney },
    ].filter(avg => avg.value > 0);

    if (averages.length === 0) return null;

    return (
      <View style={styles.detailedAverages}>
        <Text style={styles.sectionTitle}>Detailed Averages</Text>
        {averages.map((avg, index) => (
          <View key={index} style={styles.averageRow}>
            <Text style={styles.averageLabel}>{avg.label}</Text>
            <View style={styles.averageRating}>
              <Text style={styles.averageValue}>
                {avg.value.toFixed(1)}
              </Text>
              <View style={styles.averageStars}>
                {renderStars(Math.round(avg.value), 12)}
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Overall Rating */}
      {renderOverallRating()}

      {/* Rating Breakdown */}
      <View style={styles.breakdownSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Rating Breakdown</Text>
          {selectedRating && (
            <TouchableOpacity
              style={styles.clearFilterButton}
              onPress={() => onRatingFilter?.(undefined)}
              activeOpacity={0.7}
            >
              <Text style={styles.clearFilterText}>Clear Filter</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.breakdownContainer}>
          {[5, 4, 3, 2, 1].map(renderRatingBar)}
        </View>
      </View>

      {/* Detailed Averages */}
      {renderDetailedAverages()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: BORDER_RADIUS.md,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  overallRatingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
    marginBottom: spacing.md,
  },
  overallRatingNumber: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  ratingNumber: {
    fontSize: 48,
    fontWeight: typography.weights.bold,
    color: colors.text.dark,
  },
  ratingOutOf: {
    fontSize: typography.sizes.title3,
    color: colors.text.secondary,
    marginLeft: 4,
  },
  overallStars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  star: {
    marginRight: 2,
  },
  totalReviewsText: {
    fontSize: typography.sizes.callout,
    color: colors.text.secondary,
  },
  breakdownSection: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.headline,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
  },
  clearFilterButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.lightGreen,
    borderRadius: BORDER_RADIUS.sm,
  },
  clearFilterText: {
    fontSize: typography.sizes.caption1,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
  breakdownContainer: {
    gap: spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  selectedRatingRow: {
    backgroundColor: colors.lightGreen,
  },
  ratingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 40,
  },
  ratingLabel: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
    marginRight: 4,
  },
  ratingStar: {
    marginRight: 0,
  },
  ratingBarContainer: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  ratingBar: {
    height: 8,
    backgroundColor: colors.neutral.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: colors.accent.warmGold,
    borderRadius: 4,
  },
  ratingCountContainer: {
    width: 30,
    alignItems: 'flex-end',
  },
  ratingCount: {
    fontSize: typography.sizes.caption1,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  selectedRatingCount: {
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  detailedAverages: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral.lightGray,
    paddingTop: spacing.md,
  },
  averageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  averageLabel: {
    fontSize: typography.sizes.callout,
    color: colors.text.secondary,
    flex: 1,
  },
  averageRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  averageValue: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
    marginRight: spacing.xs,
  },
  averageStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
