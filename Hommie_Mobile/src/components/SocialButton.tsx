import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants';

interface SocialButtonProps {
  provider: 'google' | 'apple' | 'email' | 'phone';
  onPress: () => void;
  text: string;
  variant?: 'welcome' | 'login';
}

const PROVIDER_CONFIG = {
  google: { 
    iconName: 'google', 
    color: '#000000',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E5E5',
    textColor: '#000000'
  },
  apple: { 
    iconName: 'apple', 
    color: '#FFFFFF',
    backgroundColor: '#000000',
    borderColor: '#000000',
    textColor: '#FFFFFF'
  },
  email: { 
    iconName: 'email', 
    color: '#000000',
    backgroundColor: '#F7F7F7',
    borderColor: '#E5E5E5',
    textColor: '#000000'
  },
  phone: { 
    iconName: 'phone', 
    color: '#000000',
    backgroundColor: '#F7F7F7',
    borderColor: '#E5E5E5',
    textColor: '#000000'
  },
};

export default function SocialButton({ provider, onPress, text, variant = 'welcome' }: SocialButtonProps) {
  const config = PROVIDER_CONFIG[provider];
  
  return (
    <TouchableOpacity 
      style={[
        styles.socialButton,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        }
      ]} 
      onPress={onPress}
    >
      <Icon 
        name={config.iconName} 
        size={20} 
        color={config.color} 
        style={styles.socialIcon} 
      />
      <Text style={[styles.socialButtonText, { color: config.textColor }]}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44, // iOS minimum touch target
    paddingHorizontal: 16,
    borderRadius: 10, // iOS standard border radius
    borderWidth: 1,
    marginBottom: 12, // 12pt spacing between buttons
    width: '100%',
  },
  socialIcon: {
    marginRight: 12,
    width: 20, // 20x20 icon size as specified
    height: 20,
  },
  socialButtonText: {
    fontSize: 17, // iOS body text size
    fontWeight: '600', // Semibold for better readability
  },
});