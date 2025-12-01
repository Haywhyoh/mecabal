import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, BORDER_RADIUS, shadows } from '../../constants';
import { BusinessReview } from '../../services/types/review.types';
import { ReviewResponseModal } from './ReviewResponseModal';

interface ReviewCardProps {
  review: BusinessReview;
  isBusinessOwner?: boolean;
  businessId?: string;
  businessName?: string;
  onResponseSubmitted?: () => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  isBusinessOwner = false,
  businessId,
  businessName,
  onResponseSubmitted,
}) => {
  const [showResponseModal, setShowResponseModal] = useState(false);
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

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

  const renderDetailedRatings = () => {
    const ratings = [
      { label: 'Service Quality', value: review.serviceQuality },
      { label: 'Professionalism', value: review.professionalism },
      { label: 'Value for Money', value: review.valueForMoney },
    ].filter(rating => rating.value);

    if (ratings.length === 0) return null;

    return (
      <View style={styles.detailedRatings}>
        {ratings.map((rating, index) => (
          <View key={index} style={styles.detailRating}>
            <Text style={styles.detailLabel}>{rating.label}</Text>
            <View style={styles.detailRatingStars}>
              {renderStars(rating.value!, 14)}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderBusinessResponse = () => {
    if (!review.businessResponse) return null;

    return (
      <View style={styles.businessResponse}>
        <View style={styles.responseHeader}>
          <MaterialCommunityIcons
            name="store"
            size={16}
            color={colors.primary}
            style={styles.responseIcon}
          />
          <Text style={styles.responseLabel}>Business Response</Text>
        </View>
        <Text style={styles.responseText}>{review.businessResponse}</Text>
        {review.respondedAt && (
          <Text style={styles.responseDate}>
            {formatDate(review.respondedAt)}
          </Text>
        )}
      </View>
    );
  };

  const handleRespond = () => {
    if (businessId && businessName) {
      setShowResponseModal(true);
    } else {
      Alert.alert('Error', 'Business information not available');
    }
  };

  const handleResponseSubmitted = () => {
    setShowResponseModal(false);
    if (onResponseSubmitted) {
      onResponseSubmitted();
    }
  };

  return (
    <View style={styles.card}>
      {/* Review Header */}
      <View style={styles.reviewHeader}>
        <View style={styles.reviewerInfo}>
          <View style={styles.reviewerAvatar}>
            <Text style={styles.reviewerInitials}>
              {review.user?.firstName?.[0]}{review.user?.lastName?.[0]}
            </Text>
          </View>
          <View style={styles.reviewerDetails}>
            <Text style={styles.reviewerName}>
              {review.user?.firstName} {review.user?.lastName}
            </Text>
            <Text style={styles.reviewDate}>
              {formatDate(review.createdAt)}
            </Text>
          </View>
        </View>
        
        <View style={styles.ratingContainer}>
          {renderStars(review.rating, 18)}
        </View>
      </View>

      {/* Review Text */}
      {review.reviewText && (
        <Text style={styles.reviewText}>{review.reviewText}</Text>
      )}

      {/* Detailed Ratings */}
      {renderDetailedRatings()}

      {/* Business Response */}
      {renderBusinessResponse()}

      {/* Respond Button (Business Owner Only) */}
      {isBusinessOwner && !review.businessResponse && (
        <TouchableOpacity
          style={styles.respondButton}
          onPress={handleRespond}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="reply"
            size={16}
            color={colors.primary}
            style={styles.respondIcon}
          />
          <Text style={styles.respondText}>Respond to Review</Text>
        </TouchableOpacity>
      )}

      {/* Response Modal */}
      {businessId && businessName && (
        <ReviewResponseModal
          visible={showResponseModal}
          onClose={() => setShowResponseModal(false)}
          businessId={businessId}
          reviewId={review.id}
          businessName={businessName}
          onResponseSubmitted={handleResponseSubmitted}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: BORDER_RADIUS.md,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    ...shadows.small,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  reviewerInitials: {
    color: colors.white,
    fontSize: typography.sizes.caption1,
    fontWeight: typography.weights.semibold,
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewerName: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: typography.sizes.caption1,
    color: colors.text.tertiary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginRight: 2,
  },
  reviewText: {
    fontSize: typography.sizes.body,
    color: colors.text.dark,
    lineHeight: typography.lineHeights.body,
    marginBottom: spacing.sm,
  },
  detailedRatings: {
    marginBottom: spacing.sm,
  },
  detailRating: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  detailLabel: {
    fontSize: typography.sizes.caption1,
    color: colors.text.secondary,
    flex: 1,
  },
  detailRatingStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  businessResponse: {
    backgroundColor: colors.neutral.lightGray,
    borderRadius: BORDER_RADIUS.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  responseIcon: {
    marginRight: spacing.xs,
  },
  responseLabel: {
    fontSize: typography.sizes.caption1,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
  responseText: {
    fontSize: typography.sizes.callout,
    color: colors.text.dark,
    lineHeight: typography.lineHeights.callout,
    marginBottom: spacing.xs,
  },
  responseDate: {
    fontSize: typography.sizes.caption2,
    color: colors.text.tertiary,
  },
  respondButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightGreen,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  respondIcon: {
    marginRight: spacing.xs,
  },
  respondText: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
});
