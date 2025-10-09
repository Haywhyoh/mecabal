import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Animated } from 'react-native';
import { colors, spacing, shadows } from '../constants';

const EventDetailsSkeleton: React.FC = () => {
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
    <ScrollView style={styles.container}>
      {/* Header image skeleton */}
      <Animated.View style={[styles.headerImageSkeleton, shimmerStyle]} />
      
      {/* Content container */}
      <View style={styles.content}>
        {/* Title skeleton */}
        <Animated.View style={[styles.titleSkeleton, shimmerStyle]} />
        
        {/* Meta info skeleton */}
        <View style={styles.metaContainer}>
          <View style={styles.metaRow}>
            <Animated.View style={[styles.metaIcon, shimmerStyle]} />
            <Animated.View style={[styles.metaText, shimmerStyle]} />
          </View>
          <View style={styles.metaRow}>
            <Animated.View style={[styles.metaIcon, shimmerStyle]} />
            <Animated.View style={[styles.metaText, shimmerStyle]} />
          </View>
          <View style={styles.metaRow}>
            <Animated.View style={[styles.metaIcon, shimmerStyle]} />
            <Animated.View style={[styles.metaText, shimmerStyle]} />
          </View>
        </View>
        
        {/* Description skeleton */}
        <View style={styles.section}>
          <Animated.View style={[styles.sectionTitle, shimmerStyle]} />
          <Animated.View style={[styles.descriptionLine, shimmerStyle]} />
          <Animated.View style={[styles.descriptionLine, shimmerStyle]} />
          <Animated.View style={[styles.descriptionLineShort, shimmerStyle]} />
        </View>
        
        {/* Organizer skeleton */}
        <View style={styles.section}>
          <Animated.View style={[styles.sectionTitle, shimmerStyle]} />
          <View style={styles.organizerContainer}>
            <Animated.View style={[styles.organizerAvatar, shimmerStyle]} />
            <View style={styles.organizerInfo}>
              <Animated.View style={[styles.organizerName, shimmerStyle]} />
              <Animated.View style={[styles.organizerTitle, shimmerStyle]} />
            </View>
          </View>
        </View>
        
        {/* Requirements skeleton */}
        <View style={styles.section}>
          <Animated.View style={[styles.sectionTitle, shimmerStyle]} />
          <Animated.View style={[styles.requirementItem, shimmerStyle]} />
          <Animated.View style={[styles.requirementItem, shimmerStyle]} />
          <Animated.View style={[styles.requirementItem, shimmerStyle]} />
        </View>
        
        {/* Attendees skeleton */}
        <View style={styles.section}>
          <Animated.View style={[styles.sectionTitle, shimmerStyle]} />
          <View style={styles.attendeesGrid}>
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <Animated.View key={index} style={[styles.attendeeAvatar, shimmerStyle]} />
            ))}
          </View>
        </View>
      </View>
      
      {/* Bottom action buttons skeleton */}
      <View style={styles.actionButtons}>
        <Animated.View style={[styles.rsvpButton, shimmerStyle]} />
        <Animated.View style={[styles.shareButton, shimmerStyle]} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  headerImageSkeleton: {
    height: 250,
    width: '100%',
    backgroundColor: colors.neutral.lightGray,
  },
  content: {
    padding: spacing.lg,
  },
  titleSkeleton: {
    height: 28,
    width: '90%',
    borderRadius: spacing.xs,
    marginBottom: spacing.lg,
    backgroundColor: colors.neutral.lightGray,
  },
  metaContainer: {
    marginBottom: spacing.xl,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  metaIcon: {
    height: 20,
    width: 20,
    borderRadius: 10,
    marginRight: spacing.md,
    backgroundColor: colors.neutral.lightGray,
  },
  metaText: {
    height: 16,
    width: '70%',
    borderRadius: spacing.xs,
    backgroundColor: colors.neutral.lightGray,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    height: 18,
    width: '40%',
    borderRadius: spacing.xs,
    marginBottom: spacing.md,
    backgroundColor: colors.neutral.lightGray,
  },
  descriptionLine: {
    height: 14,
    width: '100%',
    borderRadius: spacing.xs,
    marginBottom: spacing.xs,
    backgroundColor: colors.neutral.lightGray,
  },
  descriptionLineShort: {
    height: 14,
    width: '60%',
    borderRadius: spacing.xs,
    backgroundColor: colors.neutral.lightGray,
  },
  organizerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  organizerAvatar: {
    height: 50,
    width: 50,
    borderRadius: 25,
    marginRight: spacing.md,
    backgroundColor: colors.neutral.lightGray,
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    height: 16,
    width: '60%',
    borderRadius: spacing.xs,
    marginBottom: spacing.xs,
    backgroundColor: colors.neutral.lightGray,
  },
  organizerTitle: {
    height: 14,
    width: '40%',
    borderRadius: spacing.xs,
    backgroundColor: colors.neutral.lightGray,
  },
  requirementItem: {
    height: 16,
    width: '80%',
    borderRadius: spacing.xs,
    marginBottom: spacing.sm,
    backgroundColor: colors.neutral.lightGray,
  },
  attendeesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  attendeeAvatar: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral.lightGray,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
  },
  rsvpButton: {
    flex: 1,
    height: 50,
    borderRadius: spacing.sm,
    backgroundColor: colors.neutral.lightGray,
  },
  shareButton: {
    width: 50,
    height: 50,
    borderRadius: spacing.sm,
    backgroundColor: colors.neutral.lightGray,
  },
});

export default EventDetailsSkeleton;
