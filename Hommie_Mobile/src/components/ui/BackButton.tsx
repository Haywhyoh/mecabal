import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants';
import { safeGoBack, contextAwareGoBack } from '../../utils/navigationUtils';

interface BackButtonProps {
  /** Custom onPress handler - if provided, overrides default back behavior */
  onPress?: () => void;
  /** Text to display instead of arrow icon */
  text?: string;
  /** Icon name from MaterialCommunityIcons */
  iconName?: string;
  /** Context for smart fallback navigation */
  context?: 'onboarding' | 'main' | 'auth';
  /** Custom style for the button container */
  style?: any;
  /** Custom style for the text/icon */
  textStyle?: any;
  /** Show text next to icon */
  showBackText?: boolean;
  /** Fallback route if can't go back */
  fallbackRoute?: string;
  /** Fallback params */
  fallbackParams?: any;
  /** Button variant */
  variant?: 'minimal' | 'outlined' | 'filled';
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Disable the button */
  disabled?: boolean;
  /** Hide button if can't go back */
  hideIfCantGoBack?: boolean;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onPress,
  text,
  iconName = 'arrow-left',
  context = 'main',
  style,
  textStyle,
  showBackText = false,
  fallbackRoute,
  fallbackParams,
  variant = 'minimal',
  size = 'medium',
  disabled = false,
  hideIfCantGoBack = false,
}) => {
  const navigation = useNavigation();

  // Hide button if requested and can't go back
  if (hideIfCantGoBack && !navigation.canGoBack() && !fallbackRoute) {
    return null;
  }

  const handlePress = () => {
    if (disabled) return;

    if (onPress) {
      onPress();
    } else if (fallbackRoute) {
      safeGoBack(navigation, fallbackRoute, fallbackParams);
    } else {
      contextAwareGoBack(navigation, context);
    }
  };

  // Get styles based on variant and size
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[`button_${size}`], styles[`button_${variant}`]];
    if (disabled) baseStyle.push(styles.button_disabled);
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`text_${size}`], styles[`text_${variant}`]];
    if (disabled) baseStyle.push(styles.text_disabled);
    return baseStyle;
  };

  const iconSize = size === 'large' ? 28 : size === 'small' ? 20 : 24;

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityLabel="Go back"
      accessibilityRole="button"
    >
      <View style={styles.content}>
        <MaterialCommunityIcons 
          name={iconName as any} 
          size={iconSize} 
          color={disabled ? COLORS.lightGray : getTextStyle()[1]?.color || COLORS.text} 
        />
        {(showBackText || text) && (
          <Text style={[getTextStyle(), textStyle]}>
            {text || 'Back'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  button_small: {
    padding: SPACING.xs,
    minWidth: 32,
    minHeight: 32,
  },
  button_medium: {
    padding: SPACING.sm,
    minWidth: 40,
    minHeight: 40,
  },
  button_large: {
    padding: SPACING.md,
    minWidth: 48,
    minHeight: 48,
  },
  button_minimal: {
    backgroundColor: 'transparent',
  },
  button_outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  button_filled: {
    backgroundColor: COLORS.lightGray,
    ...SHADOWS.small,
  },
  button_disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontWeight: '500',
    marginLeft: SPACING.xs,
  },
  text_small: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
  },
  text_medium: {
    fontSize: TYPOGRAPHY.fontSizes.md,
  },
  text_large: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
  },
  text_minimal: {
    color: COLORS.text,
  },
  text_outlined: {
    color: COLORS.text,
  },
  text_filled: {
    color: COLORS.text,
  },
  text_disabled: {
    color: COLORS.lightGray,
  },
});

export default BackButton;