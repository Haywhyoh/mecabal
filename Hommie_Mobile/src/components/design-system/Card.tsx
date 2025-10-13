import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { colors, spacing, BORDER_RADIUS, shadows } from '../../constants';

export interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'small' | 'medium' | 'large';
  margin?: 'none' | 'small' | 'medium' | 'large';
  borderRadius?: 'small' | 'medium' | 'large' | 'none';
  shadow?: 'none' | 'small' | 'medium' | 'large';
  backgroundColor?: string;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'medium',
  margin = 'none',
  borderRadius = 'medium',
  shadow = 'small',
  backgroundColor,
  style,
  onPress,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  ...props
}) => {
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: backgroundColor || colors.white,
      borderRadius: BORDER_RADIUS[borderRadius],
    };

    // Padding styles
    const paddingStyles: Record<string, ViewStyle> = {
      none: {},
      small: { padding: spacing.sm },
      medium: { padding: spacing.md },
      large: { padding: spacing.lg },
    };

    // Margin styles
    const marginStyles: Record<string, ViewStyle> = {
      none: {},
      small: { margin: spacing.sm },
      medium: { margin: spacing.md },
      large: { margin: spacing.lg },
    };

    // Variant styles
    const variantStyles: Record<string, ViewStyle> = {
      default: {
        ...shadows[shadow],
      },
      elevated: {
        ...shadows.large,
        elevation: 8,
      },
      outlined: {
        borderWidth: 1,
        borderColor: colors.neutral.lightGray,
        ...shadows.none,
      },
      filled: {
        backgroundColor: colors.neutral.offWhite,
        ...shadows.none,
      },
    };

    // State styles
    const stateStyles: ViewStyle = {
      ...(disabled && { opacity: 0.6 }),
    };

    return {
      ...baseStyle,
      ...paddingStyles[padding],
      ...marginStyles[margin],
      ...variantStyles[variant],
      ...stateStyles,
      ...style,
    };
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={getCardStyle()}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={getCardStyle()}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      {...props}
    >
      {children}
    </View>
  );
};

export default Card;
