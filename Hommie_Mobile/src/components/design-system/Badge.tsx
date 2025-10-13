import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, typography, spacing, BORDER_RADIUS } from '../../constants';

export interface BadgeProps {
  text: string;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
  maxWidth?: number;
  numberOfLines?: number;
  accessibilityLabel?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'default',
  size = 'medium',
  style,
  textStyle,
  maxWidth,
  numberOfLines = 1,
  accessibilityLabel,
}) => {
  const getBadgeStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: BORDER_RADIUS.badge,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-start',
    };

    // Size styles
    const sizeStyles: Record<string, ViewStyle> = {
      small: {
        paddingHorizontal: spacing.xs,
        paddingVertical: 2,
        minHeight: 20,
      },
      medium: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        minHeight: 24,
      },
      large: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        minHeight: 28,
      },
    };

    // Variant styles
    const variantStyles: Record<string, ViewStyle> = {
      default: {
        backgroundColor: colors.neutral.lightGray,
      },
      primary: {
        backgroundColor: colors.primary,
      },
      secondary: {
        backgroundColor: colors.secondary,
      },
      success: {
        backgroundColor: colors.success,
      },
      warning: {
        backgroundColor: colors.warning,
      },
      danger: {
        backgroundColor: colors.danger,
      },
      info: {
        backgroundColor: colors.info,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(maxWidth && { maxWidth }),
      ...style,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      textAlign: 'center',
      fontWeight: typography.weights.medium,
    };

    // Size text styles
    const sizeTextStyles: Record<string, TextStyle> = {
      small: {
        ...typography.styles.caption2,
      },
      medium: {
        ...typography.styles.caption1,
      },
      large: {
        ...typography.styles.footnote,
      },
    };

    // Variant text styles
    const variantTextStyles: Record<string, TextStyle> = {
      default: {
        color: colors.text.dark,
      },
      primary: {
        color: colors.white,
      },
      secondary: {
        color: colors.white,
      },
      success: {
        color: colors.white,
      },
      warning: {
        color: colors.white,
      },
      danger: {
        color: colors.white,
      },
      info: {
        color: colors.white,
      },
    };

    return {
      ...baseTextStyle,
      ...sizeTextStyles[size],
      ...variantTextStyles[variant],
      ...textStyle,
    };
  };

  return (
    <View
      style={getBadgeStyle()}
      accessibilityLabel={accessibilityLabel || text}
      accessibilityRole="text"
    >
      <Text
        style={getTextStyle()}
        numberOfLines={numberOfLines}
        ellipsizeMode="tail"
      >
        {text}
      </Text>
    </View>
  );
};

export default Badge;
