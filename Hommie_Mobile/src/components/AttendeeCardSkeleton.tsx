import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors, spacing, shadows } from '../constants';

const AttendeeCardSkeleton: React.FC = () => {
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
      <View style={styles.attendeeInfo}>
        {/* Avatar skeleton */}
        <Animated.View style={[styles.avatarSkeleton, shimmerStyle]} />
        
        {/* Details skeleton */}
        <View style={styles.details}>
          {/* Name skeleton */}
          <Animated.View style={[styles.nameSkeleton, shimmerStyle]} />
          
          {/* Verification text skeleton */}
          <Animated.View style={[styles.verificationSkeleton, shimmerStyle]} />
          
          {/* Metrics skeleton */}
          <Animated.View style={[styles.metricsSkeleton, shimmerStyle]} />
        </View>
      </View>
      
      {/* Contact button skeleton */}
      <Animated.View style={[styles.contactButtonSkeleton, shimmerStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: spacing.md,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.small,
  },
  attendeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarSkeleton: {
    height: 50,
    width: 50,
    borderRadius: 25,
    marginRight: spacing.md,
    backgroundColor: colors.neutral.lightGray,
  },
  details: {
    flex: 1,
  },
  nameSkeleton: {
    height: 16,
    width: '70%',
    borderRadius: spacing.xs,
    marginBottom: spacing.xs,
    backgroundColor: colors.neutral.lightGray,
  },
  verificationSkeleton: {
    height: 14,
    width: '50%',
    borderRadius: spacing.xs,
    marginBottom: spacing.xs,
    backgroundColor: colors.neutral.lightGray,
  },
  metricsSkeleton: {
    height: 12,
    width: '80%',
    borderRadius: spacing.xs,
    backgroundColor: colors.neutral.lightGray,
  },
  contactButtonSkeleton: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral.lightGray,
  },
});

export default AttendeeCardSkeleton;
