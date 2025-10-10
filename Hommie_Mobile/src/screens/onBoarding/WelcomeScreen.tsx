import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Animated,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import SocialButton from '../../components/SocialButton';
import { safeGoBack } from '../../utils/navigationUtils';
import * as Haptics from 'expo-haptics';

export default function WelcomeScreen({ navigation, route }: any) {
  const onSocialLoginSuccess = route.params?.onSocialLoginSuccess;
  const onLoginSuccess = route.params?.onLoginSuccess;
  const initialMode = route.params?.mode || 'signup'; // 'signup' or 'login'
  
  const [mode, setMode] = useState(initialMode);
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonsSlideAnim = useRef(new Animated.Value(30)).current;
  const buttonsFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide-in animation with spring physics
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(buttonsSlideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
        delay: 100,
      }),
      Animated.timing(buttonsFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        delay: 100,
      }),
    ]).start();
  }, []);
  
  const isSignupMode = mode === 'signup';
  const isLoginMode = mode === 'login';

  const handleJoinCommunity = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate directly to phone verification with default language (English)
    navigation.navigate('PhoneVerification', { language: 'en', isSignup: true });
  };

  // Signup handlers
  const handleGoogleSignUp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Google sign-up pressed');
    navigation.navigate('PhoneVerification', { language: 'en', signupMethod: 'google', isSignup: true });
  };

  const handleAppleSignUp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Apple sign-up pressed');
    navigation.navigate('PhoneVerification', { language: 'en', signupMethod: 'apple', isSignup: true });
  };

  const handleEmailSignUp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Email sign-up pressed');
    navigation.navigate('EmailRegistration');
  };

  // Login handlers
  const handleGoogleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Google login pressed');
    if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  const handleEmailLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Email login pressed');
    navigation.navigate('EmailLogin', { onLoginSuccess, onSocialLoginSuccess });
  };

  // Mode switching
  const switchToLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMode('login');
  };
  const switchToSignup = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMode('signup');
  };

  const handleInviteCode = () => {
    navigation.navigate('InvitationCode');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      <View style={styles.content}>
        <Animated.View style={[styles.header, {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
        }]}>
          <Text style={styles.appName}>MeCabal</Text>
          <Text style={styles.tagline}>
            {isSignupMode ? 'Join MeCabal' : 'Welcome back to your neighborhood'}
          </Text>
        </Animated.View>

        <Animated.View style={[styles.authOptions, {
          transform: [{ translateY: buttonsSlideAnim }],
          opacity: buttonsFadeAnim,
        }]}>
          <View style={styles.socialButtons}>
            {isSignupMode ? (
              <>
                <SocialButton 
                  provider="apple" 
                  text="Continue with Apple" 
                  onPress={handleAppleSignUp}
                  variant="welcome"
                />
                <SocialButton 
                  provider="google" 
                  text="Continue with Google" 
                  onPress={handleGoogleSignUp}
                  variant="welcome"
                />
                <SocialButton 
                  provider="email" 
                  text="Continue with Email" 
                  onPress={handleEmailSignUp}
                  variant="welcome"
                />
                <SocialButton 
                  provider="phone" 
                  text="Continue with Phone" 
                  onPress={handleJoinCommunity}
                  variant="welcome"
                />
              </>
            ) : (
              <>
                <SocialButton 
                  provider="google" 
                  text="Sign in with Google" 
                  onPress={handleGoogleLogin}
                  variant="login"
                />
                <SocialButton 
                  provider="email" 
                  text="Sign in with Email" 
                  onPress={handleEmailLogin}
                  variant="login"
                />
              </>
            )}
          </View>

          <View style={styles.modeToggleSection}>
            <Text style={styles.modePrompt}>
              {isSignupMode ? 'Already have an account?' : "Don't have an account?"}
            </Text>
            <TouchableOpacity 
              onPress={isSignupMode ? switchToLogin : switchToSignup}
              accessibilityLabel={isSignupMode ? 'Switch to sign in mode' : 'Switch to sign up mode'}
              accessibilityHint={isSignupMode ? 'Tap to sign in with existing account' : 'Tap to create new account'}
              accessibilityRole="button"
            >
              <Text style={styles.modeLink}>
                {isSignupMode ? 'Sign In' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.languageSelector}
            accessibilityLabel="Language selector"
            accessibilityHint="Tap to change language"
            accessibilityRole="button"
          >
            <Text style={styles.languageText}>EN (NG)</Text>
            <Text style={styles.chevron}>▼</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'flex-start',
    marginTop: SPACING.xl,
  },
  appName: {
    fontSize: 32,
    fontWeight: '400',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
    fontStyle: 'italic',
  },
  tagline: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 41,
  },
  authOptions: {
    marginBottom: SPACING.xl,
  },
  socialButtons: {
    marginBottom: SPACING.lg,
  },
  modeToggleSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  modePrompt: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    marginRight: SPACING.xs,
  },
  modeLink: {
    color: COLORS.primary,
    fontSize: 17, // 17pt as specified
    fontWeight: '600', // Semibold
    textDecorationLine: 'underline',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    marginRight: SPACING.xs,
  },
  chevron: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSizes.xs,
  },
});
