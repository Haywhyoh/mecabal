# Business Features - Apple Human Interface Guidelines Implementation

## Overview

This document outlines how to implement the business features following Apple's Human Interface Guidelines (HIG) to ensure a native, polished iOS experience. While MeCabal is a cross-platform React Native app, adhering to iOS design principles will create a premium user experience.

---

## Core Design Principles

### 1. **Clarity**
- Content is paramount
- Use whitespace effectively
- Clear visual hierarchy
- Legible text at all sizes

### 2. **Deference**
- UI helps users understand and interact with content
- Subtle, unobtrusive animations
- Minimal chrome (UI elements)
- Let content shine

### 3. **Depth**
- Visual layers and realistic motion
- Smooth transitions
- Contextual navigation
- Modal presentations for focused tasks

---

## Navigation Patterns

### Tab Bar Navigation (Main App)
Following the existing MeCabal structure with business features integrated:

```
┌─────────────────────────────────┐
│ Home  Feed  Events  Market  More │ ← Tab Bar
└─────────────────────────────────┘
```

**Business Features Access Points:**

1. **Home Tab:**
   - "Local Businesses" card → Business Directory
   - Featured businesses carousel

2. **More Tab:**
   - "My Business" (if registered)
   - "Register Business" (if not registered)
   - "My Inquiries"

### Navigation Stack Pattern

```
Business Directory
  └→ Business Detail
      ├→ Reviews (Full Screen)
      │   └→ Write Review
      ├→ Send Inquiry (Modal)
      └→ Share Business (Native Sheet)

My Business Profile
  └→ Edit Business (Modal)
      └→ Manage Services
      └→ Business Analytics
      └→ Inquiries Management
```

**HIG Compliance:**
- Use navigation bar for hierarchical content
- Back button always visible and functional
- Modals for self-contained tasks
- Sheets for quick actions

---

## Visual Design Standards

### Typography

Following SF Pro (iOS system font) scale:

| Style | Size | Weight | Usage |
|-------|------|--------|-------|
| Large Title | 34pt | Bold | Screen titles (scrollable) |
| Title 1 | 28pt | Bold | Main headings |
| Title 2 | 22pt | Bold | Section headers |
| Title 3 | 20pt | Semibold | Card titles |
| Headline | 17pt | Semibold | List item titles |
| Body | 17pt | Regular | Body text |
| Callout | 16pt | Regular | Secondary text |
| Subhead | 15pt | Regular | Tertiary text |
| Footnote | 13pt | Regular | Metadata |
| Caption 1 | 12pt | Regular | Timestamps |
| Caption 2 | 11pt | Regular | Labels |

**Implementation in React Native:**

```typescript
// src/constants/typography.ts
import { Platform } from 'react-native';

export const Typography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
    lineHeight: 41,
  },
  title1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  title2: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 25,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  callout: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 21,
  },
  subhead: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  caption1: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  caption2: {
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 13,
  },
};
```

### Color Palette

**Primary Colors:**
```typescript
export const Colors = {
  // Brand
  primary: '#00A651',        // MeCabal Green
  primaryLight: '#E8F5E8',   // Light green tint
  primaryDark: '#007B3D',    // Dark green

  // System Colors (iOS)
  systemBlue: '#007AFF',
  systemGreen: '#34C759',
  systemIndigo: '#5856D6',
  systemOrange: '#FF9500',
  systemPink: '#FF2D55',
  systemPurple: '#AF52DE',
  systemRed: '#FF3B30',
  systemTeal: '#5AC8FA',
  systemYellow: '#FFCC00',

  // Neutral
  label: '#000000',          // Primary text
  secondaryLabel: '#3C3C43', // Secondary text (60% opacity)
  tertiaryLabel: '#3C3C43',  // Tertiary text (30% opacity)
  quaternaryLabel: '#3C3C43', // Quaternary text (18% opacity)

  // Backgrounds
  systemBackground: '#FFFFFF',
  secondarySystemBackground: '#F2F2F7',
  tertiarySystemBackground: '#FFFFFF',

  // Grouped Backgrounds
  systemGroupedBackground: '#F2F2F7',
  secondarySystemGroupedBackground: '#FFFFFF',
  tertiarySystemGroupedBackground: '#F2F2F7',

  // Fill Colors
  systemFill: 'rgba(120, 120, 128, 0.2)',
  secondarySystemFill: 'rgba(120, 120, 128, 0.16)',
  tertiarySystemFill: 'rgba(118, 118, 128, 0.12)',
  quaternarySystemFill: 'rgba(116, 116, 128, 0.08)',

  // Separators
  separator: 'rgba(60, 60, 67, 0.29)',
  opaqueSeparator: '#C6C6C8',
};
```

### Spacing & Layout

**8-Point Grid System:**

```typescript
export const Spacing = {
  xs: 4,    // Minimal spacing
  sm: 8,    // Small spacing
  md: 16,   // Standard spacing
  lg: 24,   // Large spacing
  xl: 32,   // Extra large spacing
  xxl: 48,  // Maximum spacing
};
```

**Safe Areas:**
Always respect safe areas for devices with notches:

```typescript
import { SafeAreaView } from 'react-native-safe-area-context';

<SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
  {/* Content */}
</SafeAreaView>
```

---

## Component Design Patterns

### 1. Business Card Component

**Design Specs:**
- Corner radius: 12pt
- Padding: 16pt
- Shadow: 0px 2px 8px rgba(0, 0, 0, 0.08)
- Elevation: 2 (Android)
- Minimum touch target: 44x44pt

**Implementation:**

```typescript
// src/components/BusinessCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Typography, Colors, Spacing } from '../constants/design';

interface BusinessCardProps {
  business: BusinessProfile;
  onPress: () => void;
}

export const BusinessCard: React.FC<BusinessCardProps> = ({ business, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`View ${business.businessName} profile`}
    >
      <View style={styles.header}>
        <Text style={styles.businessName} numberOfLines={1}>
          {business.businessName}
        </Text>
        <VerificationBadge level={business.verificationLevel} />
      </View>

      <Text style={styles.category} numberOfLines={1}>
        {business.subcategory}
      </Text>

      <View style={styles.ratingRow}>
        <StarRating rating={business.rating} size="small" />
        <Text style={styles.reviewCount}>
          ({business.reviewCount})
        </Text>
        <Text style={styles.distance}>• {business.distance}km</Text>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {business.description}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.secondarySystemGroupedBackground,
    borderRadius: 12,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  businessName: {
    ...Typography.headline,
    color: Colors.label,
    flex: 1,
  },
  category: {
    ...Typography.subhead,
    color: Colors.secondaryLabel,
    marginBottom: Spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  reviewCount: {
    ...Typography.caption1,
    color: Colors.tertiaryLabel,
    marginLeft: Spacing.xs,
  },
  distance: {
    ...Typography.caption1,
    color: Colors.tertiaryLabel,
    marginLeft: Spacing.xs,
  },
  description: {
    ...Typography.callout,
    color: Colors.secondaryLabel,
    lineHeight: 20,
  },
});
```

### 2. Star Rating Component

**Design Specs:**
- Star size: 16pt (small), 20pt (medium), 24pt (large)
- Color: #FFCC00 (filled), #E0E0E0 (empty)
- Spacing between stars: 2pt
- Interactive: Minimum 44pt touch target

**Implementation:**

```typescript
// src/components/StarRating.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

const STAR_SIZES = {
  small: 16,
  medium: 20,
  large: 24,
};

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 'medium',
  interactive = false,
  onRatingChange,
}) => {
  const starSize = STAR_SIZES[size];
  const touchTargetSize = interactive ? 44 : starSize;

  const handlePress = (starIndex: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starIndex + 1);
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: maxRating }, (_, index) => {
        const isFilled = index < Math.floor(rating);
        const isHalfFilled = index < rating && index >= Math.floor(rating);

        const StarComponent = interactive ? TouchableOpacity : View;

        return (
          <StarComponent
            key={index}
            onPress={() => handlePress(index)}
            style={[
              styles.starContainer,
              interactive && { width: touchTargetSize, height: touchTargetSize },
            ]}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={isFilled ? 'star' : isHalfFilled ? 'star-half-full' : 'star-outline'}
              size={starSize}
              color={isFilled || isHalfFilled ? '#FFCC00' : '#E0E0E0'}
            />
          </StarComponent>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starContainer: {
    marginRight: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

### 3. Action Buttons

**Primary Button (CTA):**
```typescript
const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // Minimum touch target
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    ...Typography.headline,
    color: '#FFFFFF',
  },
});
```

**Secondary Button:**
```typescript
const styles = StyleSheet.create({
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  secondaryButtonText: {
    ...Typography.headline,
    color: Colors.primary,
  },
});
```

### 4. Modal Presentations

**Bottom Sheet Modal (Preferred for iOS):**

```typescript
import React from 'react';
import { Modal, View, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  children,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.sheet, { paddingBottom: insets.bottom }]}>
              <View style={styles.handle} />
              {children}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.secondarySystemGroupedBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    maxHeight: '90%',
  },
  handle: {
    width: 36,
    height: 5,
    backgroundColor: Colors.tertiaryLabel,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
});
```

---

## Animation & Interaction

### Recommended Animation Durations

```typescript
export const Animations = {
  fast: 200,      // Quick feedback (button press)
  normal: 300,    // Standard transitions
  slow: 500,      // Complex animations
};
```

### Haptic Feedback

Use haptic feedback for important interactions:

```typescript
import * as Haptics from 'expo-haptics';

// Light impact for selections
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Medium impact for important actions
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Heavy impact for significant changes
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

// Success notification
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Warning notification
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

// Error notification
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
```

**When to Use:**
- Star rating selection: Light impact
- Filter selection: Light impact
- Submit button: Medium impact
- Status toggle: Medium impact
- Review submission success: Success notification
- API error: Error notification

---

## Accessibility

### VoiceOver Support

```typescript
<TouchableOpacity
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Contact business"
  accessibilityHint="Opens contact options for this business"
  onPress={handleContact}
>
  <Text>Contact</Text>
</TouchableOpacity>
```

### Dynamic Type Support

Always use scaled font sizes:

```typescript
import { Text, StyleSheet, Platform } from 'react-native';

const styles = StyleSheet.create({
  text: {
    fontSize: 17,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
    }),
  },
});
```

### Color Contrast

Ensure WCAG AA compliance:
- Normal text: 4.5:1 contrast ratio
- Large text (18pt+): 3:1 contrast ratio
- UI components: 3:1 contrast ratio

---

## Loading States

### Skeleton Loading

```typescript
import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export const BusinessCardSkeleton: React.FC = () => {
  const animatedValue = new Animated.Value(0);

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.card}>
      <Animated.View style={[styles.skeletonLine, { opacity, width: '60%' }]} />
      <Animated.View style={[styles.skeletonLine, { opacity, width: '40%' }]} />
      <Animated.View style={[styles.skeletonLine, { opacity, width: '100%', height: 40 }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.secondarySystemGroupedBackground,
    borderRadius: 12,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: Colors.systemFill,
    borderRadius: 4,
    marginBottom: Spacing.sm,
  },
});
```

---

## Error Handling

### Empty States

```typescript
export const EmptyBusinessState: React.FC = () => {
  return (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="store-off" size={64} color={Colors.tertiaryLabel} />
      <Text style={styles.emptyTitle}>No Businesses Found</Text>
      <Text style={styles.emptyMessage}>
        Try adjusting your filters or search in a different area.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.title2,
    color: Colors.label,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyMessage: {
    ...Typography.body,
    color: Colors.secondaryLabel,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  retryText: {
    ...Typography.headline,
    color: '#FFFFFF',
  },
});
```

---

## Performance Optimization

### Image Optimization

```typescript
import { Image } from 'react-native';
import FastImage from 'react-native-fast-image';

// Use FastImage for better performance
<FastImage
  style={styles.businessImage}
  source={{
    uri: business.imageUrl,
    priority: FastImage.priority.normal,
  }}
  resizeMode={FastImage.resizeMode.cover}
/>
```

### List Optimization

```typescript
import { FlatList } from 'react-native';

<FlatList
  data={businesses}
  renderItem={renderBusinessCard}
  keyExtractor={(item) => item.id}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews={true}
  getItemLayout={(data, index) => ({
    length: CARD_HEIGHT,
    offset: CARD_HEIGHT * index,
    index,
  })}
/>
```

---

