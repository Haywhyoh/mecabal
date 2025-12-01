import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, BORDER_RADIUS } from '../../constants';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  showLabel?: boolean;
  label?: string;
  disabled?: boolean;
}

const STAR_SIZES = {
  small: 16,
  medium: 20,
  large: 24,
};

const TOUCH_TARGET_SIZES = {
  small: 32,
  medium: 44,
  large: 48,
};

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 'medium',
  interactive = false,
  onRatingChange,
  showLabel = false,
  label = 'Rating',
  disabled = false,
}) => {
  const starSize = STAR_SIZES[size];
  const touchTargetSize = interactive ? TOUCH_TARGET_SIZES[size] : starSize;

  const handlePress = async (starIndex: number) => {
    if (interactive && onRatingChange && !disabled) {
      const newRating = starIndex + 1;
      
      // Haptic feedback
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        // Haptics not available on this device
      }
      
      onRatingChange(newRating);
    }
  };

  const renderStars = () => {
    return Array.from({ length: maxRating }, (_, index) => {
      const isFilled = index < Math.floor(rating);
      const isHalfFilled = index < rating && index >= Math.floor(rating);

      const StarComponent = interactive ? TouchableOpacity : View;

      return (
        <StarComponent
          key={index}
          onPress={() => handlePress(index)}
          style={[
            styles.starContainer,
            interactive && { 
              width: touchTargetSize, 
              height: touchTargetSize,
              opacity: disabled ? 0.5 : 1,
            },
          ]}
          activeOpacity={interactive ? 0.7 : 1}
          disabled={disabled}
          accessibilityRole={interactive ? "button" : undefined}
          accessibilityLabel={`Rate ${index + 1} star${index + 1 !== 1 ? 's' : ''}`}
          accessibilityHint={interactive ? `Tap to rate ${index + 1} star${index + 1 !== 1 ? 's' : ''}` : undefined}
        >
          <MaterialCommunityIcons
            name={isFilled ? 'star' : isHalfFilled ? 'star-half-full' : 'star-outline'}
            size={starSize}
            color={isFilled || isHalfFilled ? '#FFC107' : '#E0E0E0'}
          />
        </StarComponent>
      );
    });
  };

  const getRatingText = () => {
    if (rating === 0) return 'Not rated';
    if (rating === 1) return 'Poor';
    if (rating === 2) return 'Fair';
    if (rating === 3) return 'Good';
    if (rating === 4) return 'Very Good';
    if (rating === 5) return 'Excellent';
    return `${rating.toFixed(1)} stars`;
  };

  return (
    <View style={styles.container}>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={[
            styles.label,
            disabled && styles.disabledLabel
          ]}>
            {label}
          </Text>
          {interactive && (
            <Text style={[
              styles.ratingText,
              disabled && styles.disabledText
            ]}>
              {getRatingText()}
            </Text>
          )}
        </View>
      )}
      
      <View style={styles.starsContainer}>
        {renderStars()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.semibold as any,
    color: '#1F2937',
  },
  disabledLabel: {
    color: '#9CA3AF',
  },
  ratingText: {
    fontSize: typography.sizes.caption1,
    color: '#4B5563',
    fontWeight: typography.weights.medium as any,
  },
  disabledText: {
    color: '#9CA3AF',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starContainer: {
    marginRight: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
