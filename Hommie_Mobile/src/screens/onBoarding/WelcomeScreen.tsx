import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import AuthBackground from '../../components/AuthBackground';
import SocialButton from '../../components/SocialButton';
import { safeGoBack } from '../../utils/navigationUtils';

export default function WelcomeScreen({ navigation, route }: any) {
  const onSocialLoginSuccess = route.params?.onSocialLoginSuccess;
  const onLoginSuccess = route.params?.onLoginSuccess;
  const initialMode = route.params?.mode || 'signup'; // 'signup' or 'login'
  
  const [mode, setMode] = useState(initialMode);
  
  const isSignupMode = mode === 'signup';
  const isLoginMode = mode === 'login';

  const handleJoinCommunity = () => {
    // Navigate directly to phone verification with default language (English)
    navigation.navigate('PhoneVerification', { language: 'en', isSignup: true });
  };

  // Signup handlers
  const handleGoogleSignUp = () => {
    console.log('Google sign-up pressed');
    navigation.navigate('PhoneVerification', { language: 'en', signupMethod: 'google', isSignup: true });
  };

  const handleAppleSignUp = () => {
    console.log('Apple sign-up pressed');
    navigation.navigate('PhoneVerification', { language: 'en', signupMethod: 'apple', isSignup: true });
  };

  const handleEmailSignUp = () => {
    console.log('Email sign-up pressed');
    navigation.navigate('EmailRegistration');
  };

  // Login handlers
  const handleGoogleLogin = () => {
    console.log('Google login pressed');
    if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  const handleEmailLogin = () => {
    console.log('Email login pressed');
    navigation.navigate('EmailLogin', { onLoginSuccess, onSocialLoginSuccess });
  };

  // Mode switching
  const switchToLogin = () => setMode('login');
  const switchToSignup = () => setMode('signup');

  const handleInviteCode = () => {
    navigation.navigate('InvitationCode');
  };

  return (
    <AuthBackground overlayOpacity={isLoginMode ? 0.3 : 0.6}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.appName}>MeCabal</Text>
          <Text style={styles.tagline}>
            {isSignupMode ? 'Explore your neighborhood' : 'Welcome back to your neighborhood'}
          </Text>
        </View>

        <View style={styles.authOptions}>
          <View style={styles.socialButtons}>
            {isSignupMode ? (
              <>
                <SocialButton 
                  provider="google" 
                  text="Continue with Google" 
                  onPress={handleGoogleSignUp}
                  variant="welcome"
                />
                <SocialButton 
                  provider="apple" 
                  text="Continue with Apple" 
                  onPress={handleAppleSignUp}
                  variant="welcome"
                />
                <SocialButton 
                  provider="email" 
                  text="Continue with Email" 
                  onPress={handleEmailSignUp}
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
            <TouchableOpacity onPress={isSignupMode ? switchToLogin : switchToSignup}>
              <Text style={styles.modeLink}>
                {isSignupMode ? 'Sign In' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.languageSelector}>
            <Text style={styles.languageText}>EN (NG)</Text>
            <Text style={styles.chevron}>▼</Text>
          </View>
        </View>
      </View>
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
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
    color: '#E8F5E8',
    marginBottom: SPACING.sm,
    fontStyle: 'italic',
  },
  tagline: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
    lineHeight: 34,
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
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    marginRight: SPACING.xs,
  },
  modeLink: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: '600',
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
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    marginRight: SPACING.xs,
  },
  chevron: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.xs,
  },
});
