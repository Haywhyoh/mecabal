// MeCabal Google Sign-In Button Component
// Apple HIG compliant Google Sign-In button for iOS and Android
// Follows Google's design guidelines and accessibility standards

import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
  AccessibilityInfo,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { MeCabalGoogleAuth } from '../../services/googleAuth';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onLoading?: (isLoading: boolean) => void;
  disabled?: boolean;
  style?: any;
  textStyle?: any;
  loadingText?: string;
  buttonText?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'outline' | 'minimal';
  showIcon?: boolean;
  testID?: string;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  onLoading,
  disabled = false,
  style,
  textStyle,
  loadingText = 'Signing in...',
  buttonText = 'Continue with Google',
  size = 'medium',
  variant = 'default',
  showIcon = true,
  testID = 'google-sign-in-button',
}) => {
  const { signInWithGoogle, isLoading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handlePress = async () => {
    if (disabled || isSigningIn || isLoading) {
      return;
    }

    try {
      setIsSigningIn(true);
      onLoading?.(true);

      console.log('🔐 Google Sign-In button pressed');

      // Check if Google Sign-In is available
      const isAvailable = await MeCabalGoogleAuth.isGoogleSignInAvailable();
      if (!isAvailable) {
        throw new Error('Google Sign-In is not available on this device');
      }

      // Perform Google Sign-In
      const success = await signInWithGoogle();

      if (success) {
        console.log('✅ Google Sign-In successful');
        onSuccess?.();
      } else {
        console.log('❌ Google Sign-In failed');
        onError?.('Google Sign-In failed. Please try again.');
      }
    } catch (error: any) {
      console.error('❌ Google Sign-In error:', error);
      
      let errorMessage = 'Google Sign-In failed. Please try again.';
      
      if (error.message?.includes('cancelled')) {
        errorMessage = 'Sign-in was cancelled';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message?.includes('not available')) {
        errorMessage = 'Google Sign-In is not available on this device';
      } else if (error.message) {
        errorMessage = error.message;
      }

      onError?.(errorMessage);
      
      // Show user-friendly error alert
      Alert.alert(
        'Sign-In Error',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setIsSigningIn(false);
      onLoading?.(false);
    }
  };

  const isButtonDisabled = disabled || isSigningIn || isLoading;
  const isButtonLoading = isSigningIn || isLoading;

  // Size configurations
  const sizeConfig = {
    small: {
      height: 40,
      paddingHorizontal: 16,
      fontSize: 14,
      iconSize: 16,
    },
    medium: {
      height: 48,
      paddingHorizontal: 20,
      fontSize: 16,
      iconSize: 20,
    },
    large: {
      height: 56,
      paddingHorizontal: 24,
      fontSize: 18,
      iconSize: 24,
    },
  };

  const currentSize = sizeConfig[size];

  // Variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: '#4285F4',
        };
      case 'minimal':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
      default:
        return {
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#DADCE0',
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          height: currentSize.height,
          paddingHorizontal: currentSize.paddingHorizontal,
          ...variantStyles,
        },
        isButtonDisabled && styles.buttonDisabled,
        style,
      ]}
      onPress={handlePress}
      disabled={isButtonDisabled}
      activeOpacity={0.8}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={isButtonLoading ? loadingText : buttonText}
      accessibilityHint="Tap to sign in with your Google account"
      accessibilityState={{
        disabled: isButtonDisabled,
        busy: isButtonLoading,
      }}
    >
      <View style={styles.buttonContent}>
        {isButtonLoading ? (
          <ActivityIndicator
            size="small"
            color="#4285F4"
            style={styles.loadingIndicator}
          />
        ) : (
          showIcon && (
            <View style={styles.googleIcon}>
              <Text style={[styles.googleIconText, { fontSize: currentSize.iconSize }]}>
                G
              </Text>
            </View>
          )
        )}
        
        <Text
          style={[
            styles.buttonText,
            {
              fontSize: currentSize.fontSize,
              color: variant === 'minimal' ? '#4285F4' : '#3C4043',
            },
            isButtonDisabled && styles.buttonTextDisabled,
            textStyle,
          ]}
        >
          {isButtonLoading ? loadingText : buttonText}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 200, // Minimum touch target
  },
  buttonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.05,
    elevation: 1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  googleIconText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  buttonText: {
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    textAlign: 'center',
  },
  buttonTextDisabled: {
    opacity: 0.6,
  },
  loadingIndicator: {
    marginRight: 12,
  },
});

export default GoogleSignInButton;
