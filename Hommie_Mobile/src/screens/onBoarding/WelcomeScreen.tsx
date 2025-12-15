import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants';
import SocialButton from '../../components/SocialButton';
import { useAuth } from '../../contexts/AuthContext';
import * as Haptics from 'expo-haptics';

export default function WelcomeScreen({ navigation, route }: any) {
  const onSocialLoginSuccess = route.params?.onSocialLoginSuccess;
  const onLoginSuccess = route.params?.onLoginSuccess;
  const { signInWithGoogle, isLoading } = useAuth();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }),
    ]).start();
  }, []);

  const handleEmailSignUp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('EmailRegistration');
  };

  const handlePhoneSignUp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('PhoneVerification', { language: 'en', isSignup: true });
  };

  const handleGoogleSignUp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const success = await signInWithGoogle();
      if (success) {
        if (onSocialLoginSuccess) {
          onSocialLoginSuccess();
        } else {
          navigation.navigate('MainApp');
        }
      }
    } catch (error) {
      console.error('Google sign-up failed:', error);
    }
  };

  const handleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('EmailLogin', { onLoginSuccess, onSocialLoginSuccess });
  };

  return (
    <LinearGradient
      colors={['#f0fdf4', '#ffffff']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        <View style={styles.content}>
          <Animated.View style={[styles.header, {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }]}>
            <Text style={styles.title}>Welcome to MeCabal</Text>
            <Text style={styles.subtitle}>
              Join your neighborhood community and connect with neighbors
            </Text>
          </Animated.View>

          <Animated.View style={[styles.buttonContainer, {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }]}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleEmailSignUp}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Continue with Email</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handlePhoneSignUp}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Continue with Phone</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleGoogleSignUp}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>
                {isLoading ? 'Loading...' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.footer, {
            opacity: fadeAnim,
          }]}>
            <Text style={styles.footerText}>
              Already have an account?{' '}
              <Text style={styles.footerLink} onPress={handleSignIn}>
                Sign in
              </Text>
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING['3xl'],
    paddingBottom: SPACING.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING['3xl'],
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.text.dark,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACING.md,
  },
  buttonContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    ...SHADOWS.medium,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  secondaryButtonText: {
    color: COLORS.text.dark,
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  footerLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
