import React, { useState, forwardRef } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, BORDER_RADIUS, shadows } from '../../constants';

export interface InputProps extends TextInputProps {
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
  labelStyle?: ViewStyle;
  errorStyle?: ViewStyle;
  helperStyle?: ViewStyle;
  required?: boolean;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  showCharacterCount?: boolean;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'small' | 'medium' | 'large';
}

export const Input = forwardRef<TextInput, InputProps>(({
  label,
  placeholder,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  helperStyle,
  required = false,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  showCharacterCount = false,
  variant = 'default',
  size = 'medium',
  value,
  onChangeText,
  onFocus,
  onBlur,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      marginBottom: spacing.md,
    };

    return {
      ...baseStyle,
      ...containerStyle,
    };
  };

  const getInputContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: multiline ? 'flex-start' : 'center',
      borderRadius: BORDER_RADIUS.input,
      borderWidth: 1,
      backgroundColor: colors.white,
      ...shadows.small,
    };

    // Size styles
    const sizeStyles: Record<string, ViewStyle> = {
      small: {
        minHeight: 36,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
      },
      medium: {
        minHeight: 44, // iOS minimum touch target
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
      },
      large: {
        minHeight: 50,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
      },
    };

    // Variant styles
    const variantStyles: Record<string, ViewStyle> = {
      default: {
        borderColor: error ? colors.danger : isFocused ? colors.primary : colors.neutral.lightGray,
        backgroundColor: disabled ? colors.neutral.offWhite : colors.white,
      },
      filled: {
        borderColor: 'transparent',
        backgroundColor: error ? colors.danger + '10' : isFocused ? colors.primary + '10' : colors.neutral.offWhite,
      },
      outlined: {
        borderColor: error ? colors.danger : isFocused ? colors.primary : colors.neutral.gray,
        backgroundColor: 'transparent',
        borderWidth: 2,
      },
    };

    // State styles
    const stateStyles: ViewStyle = {
      ...(disabled && { opacity: 0.6 }),
      ...(multiline && { paddingTop: spacing.sm }),
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...stateStyles,
    };
  };

  const getInputStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flex: 1,
      ...typography.styles.body,
      color: colors.text.dark,
      textAlignVertical: multiline ? 'top' : 'center',
    };

    // Size text styles
    const sizeTextStyles: Record<string, ViewStyle> = {
      small: {
        ...typography.styles.callout,
      },
      medium: {
        ...typography.styles.body,
      },
      large: {
        ...typography.styles.headline,
      },
    };

    return {
      ...baseStyle,
      ...sizeTextStyles[size],
      ...inputStyle,
    };
  };

  const getLabelStyle = (): ViewStyle => {
    return {
      ...typography.styles.subhead,
      color: colors.text.dark,
      fontWeight: typography.weights.medium,
      marginBottom: spacing.xs,
      ...labelStyle,
    };
  };

  const getErrorStyle = (): ViewStyle => {
    return {
      ...typography.styles.caption1,
      color: colors.danger,
      marginTop: spacing.xs,
      ...errorStyle,
    };
  };

  const getHelperStyle = (): ViewStyle => {
    return {
      ...typography.styles.caption1,
      color: colors.text.light,
      marginTop: spacing.xs,
      ...helperStyle,
    };
  };

  const getCharacterCountStyle = (): ViewStyle => {
    return {
      ...typography.styles.caption2,
      color: colors.text.tertiary,
      textAlign: 'right',
      marginTop: spacing.xs,
    };
  };

  const renderLeftIcon = () => {
    if (!leftIcon) return null;

    return (
      <View style={styles.leftIconContainer}>
        <Ionicons
          name={leftIcon}
          size={20}
          color={isFocused ? colors.primary : colors.text.light}
        />
      </View>
    );
  };

  const renderRightIcon = () => {
    if (!rightIcon) return null;

    const iconColor = error ? colors.danger : isFocused ? colors.primary : colors.text.light;

    if (onRightIconPress) {
      return (
        <TouchableOpacity
          style={styles.rightIconContainer}
          onPress={onRightIconPress}
          activeOpacity={0.7}
        >
          <Ionicons name={rightIcon} size={20} color={iconColor} />
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.rightIconContainer}>
        <Ionicons name={rightIcon} size={20} color={iconColor} />
      </View>
    );
  };

  const renderCharacterCount = () => {
    if (!showCharacterCount || !maxLength) return null;

    const currentLength = value?.length || 0;
    const isNearLimit = currentLength > maxLength * 0.8;

    return (
      <Text style={[getCharacterCountStyle(), isNearLimit && { color: colors.warning }]}>
        {currentLength}/{maxLength}
      </Text>
    );
  };

  return (
    <View style={getContainerStyle()}>
      {label && (
        <Text style={getLabelStyle()}>
          {label}
          {required && <Text style={{ color: colors.danger }}> *</Text>}
        </Text>
      )}

      <View style={getInputContainerStyle()}>
        {renderLeftIcon()}
        
        <TextInput
          ref={ref}
          style={getInputStyle()}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          accessibilityLabel={label || placeholder}
          accessibilityHint={helperText}
          accessibilityState={{ disabled }}
          {...props}
        />

        {renderRightIcon()}
      </View>

      {error && (
        <Text style={getErrorStyle()}>
          {error}
        </Text>
      )}

      {helperText && !error && (
        <Text style={getHelperStyle()}>
          {helperText}
        </Text>
      )}

      {renderCharacterCount()}
    </View>
  );
});

const styles = StyleSheet.create({
  leftIconContainer: {
    marginRight: spacing.sm,
    justifyContent: 'center',
  },
  rightIconContainer: {
    marginLeft: spacing.sm,
    justifyContent: 'center',
  },
});

Input.displayName = 'Input';

export default Input;
