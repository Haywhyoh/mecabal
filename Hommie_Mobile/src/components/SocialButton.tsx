import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants';

interface SocialButtonProps {
  provider: 'google' | 'apple' | 'email';
  onPress: () => void;
  text: string;
  variant?: 'welcome' | 'login';
}

const PROVIDER_CONFIG = {
  google: { iconName: 'google', color: '#DB4437' },
  apple: { iconName: 'apple', color: '#000000' },
  email: { iconName: 'email', color: '#4285F4' },
};

export default function SocialButton({ provider, onPress, text, variant = 'welcome' }: SocialButtonProps) {
  const config = PROVIDER_CONFIG[provider];
  
  return (
    <TouchableOpacity 
      style={[styles.socialButton, variant === 'login' && styles.loginVariant]} 
      onPress={onPress}
    >
      <Icon 
        name={config.iconName} 
        size={20} 
        color={config.color} 
        style={styles.socialIcon} 
      />
      <Text style={styles.socialButtonText}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: SPACING.sm,
    minHeight: 48,
    width: '100%',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  loginVariant: {
    backgroundColor: 'rgba(44, 44, 44, 0.9)',
    borderWidth: 0,
  },
  socialIcon: {
    marginRight: SPACING.md,
    width: 24,
  },
  socialButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: '500',
  },
});