import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors, spacing, shadows } from '../../constants';

const EventCardSkeleton: React.FC = () => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = () => {
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => shimmer());
    };
    shimmer();
  }, [shimmerAnimation]);

  const shimmerStyle = {
    opacity: shimmerAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    }),
  };

  return (
    <View style={styles.container}>
      {/* Image skeleton */}
      <Animated.View style={[styles.imageSkeleton, shimmerStyle]} />
      
      {/* Content skeleton */}
      <View style={styles.content}>
        {/* Title skeleton */}
        <Animated.View style={[styles.titleSkeleton, shimmerStyle]} />
        
        {/* Date and location skeleton */}
        <View style={styles.metaRow}>
          <Animated.View style={[styles.metaItem, shimmerStyle]} />
          <Animated.View style={[styles.metaItem, shimmerStyle]} />
        </View>
        
        {/* Description skeleton */}
        <Animated.View style={[styles.descriptionSkeleton, shimmerStyle]} />
        <Animated.View style={[styles.descriptionSkeletonShort, shimmerStyle]} />
        
        {/* Bottom row skeleton */}
        <View style={styles.bottomRow}>
          <Animated.View style={[styles.categorySkeleton, shimmerStyle]} />
          <Animated.View style={[styles.attendeesSkeleton, shimmerStyle]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: spacing.md,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    ...shadows.medium,
  },
  imageSkeleton: {
    height: 200,
    borderTopLeftRadius: spacing.md,
    borderTopRightRadius: spacing.md,
    backgroundColor: colors.neutral.lightGray,
  },
  content: {
    padding: spacing.lg,
  },
  titleSkeleton: {
    height: 20,
    width: '80%',
    borderRadius: spacing.xs,
    marginBottom: spacing.sm,
    backgroundColor: colors.neutral.lightGray,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  metaItem: {
    height: 14,
    width: '35%',
    borderRadius: spacing.xs,
    marginRight: spacing.md,
    backgroundColor: colors.neutral.lightGray,
  },
  descriptionSkeleton: {
    height: 14,
    width: '100%',
    borderRadius: spacing.xs,
    marginBottom: spacing.xs,
    backgroundColor: colors.neutral.lightGray,
  },
  descriptionSkeletonShort: {
    height: 14,
    width: '60%',
    borderRadius: spacing.xs,
    marginBottom: spacing.md,
    backgroundColor: colors.neutral.lightGray,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categorySkeleton: {
    height: 24,
    width: 80,
    borderRadius: spacing.sm,
    backgroundColor: colors.neutral.lightGray,
  },
  attendeesSkeleton: {
    height: 16,
    width: 60,
    borderRadius: spacing.xs,
    backgroundColor: colors.neutral.lightGray,
  },
});

export default EventCardSkeleton;
