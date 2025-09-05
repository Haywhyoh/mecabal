import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation, route }: any) {
  const onSocialLoginSuccess = route.params?.onSocialLoginSuccess;
  const onLoginSuccess = route.params?.onLoginSuccess;

  const handleJoinCommunity = () => {
    // Navigate directly to phone verification with default language (English)
    navigation.navigate('PhoneVerification', { language: 'en', isSignup: true });
  };

  const handleSignIn = () => {
    navigation.navigate('Login', { onLoginSuccess, onSocialLoginSuccess });
  };

  const handleGoogleSignIn = () => {
    console.log('Google sign-in pressed - joining');
    // For SSO signup, get user details from provider then continue to phone verification
    navigation.navigate('PhoneVerification', { language: 'en', signupMethod: 'google', isSignup: true });
  };

  const handleAppleSignIn = () => {
    console.log('Apple sign-in pressed - joining');
    // For SSO signup, get user details from provider then continue to phone verification
    navigation.navigate('PhoneVerification', { language: 'en', signupMethod: 'apple', isSignup: true });
  };

  const handleFacebookSignIn = () => {
    console.log('Facebook sign-in pressed - joining');
    // For SSO signup, get user details from provider then continue to phone verification
    navigation.navigate('PhoneVerification', { language: 'en', signupMethod: 'facebook', isSignup: true });
  };

  const handleEmailSignUp = () => {
    // For email signup, go to email registration flow
    navigation.navigate('EmailRegistration');
  };

  const handleGoogleLogin = () => {
    console.log('Google login pressed');
    // For SSO login, authenticate and go to home if successful
    if (onSocialLoginSuccess) {
      onSocialLoginSuccess();
    }
  };

  const handleAppleLogin = () => {
    console.log('Apple login pressed');
    // For SSO login, authenticate and go to home if successful
    if (onSocialLoginSuccess) {
      onSocialLoginSuccess();
    }
  };

  const handleFacebookLogin = () => {
    console.log('Facebook login pressed');
    // For SSO login, authenticate and go to home if successful
    if (onSocialLoginSuccess) {
      onSocialLoginSuccess();
    }
  };

  const handleEmailLogin = () => {
    // For email login, go to email login with OTP
    navigation.navigate('EmailLogin', { onLoginSuccess, onSocialLoginSuccess });
  };

  const handleInviteCode = () => {
    navigation.navigate('InvitationCode');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <Image 
        source={require('../../../assets/background.jpeg')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      <View style={styles.overlay} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.appName}>MeCabal</Text>
          <Text style={styles.tagline}>Explore your neighborhood</Text>
        </View>

        <View style={styles.authOptions}>
          {/* Join Community Section */}
          {/* <TouchableOpacity style={styles.primaryButton} onPress={handleJoinCommunity}>
            <Text style={styles.primaryButtonText}>Join A Community</Text>
          </TouchableOpacity>
          
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or </Text>
            <View style={styles.dividerLine} />
          </View> */}

          <View style={styles.socialButtons}>
            <TouchableOpacity style={styles.socialButton} onPress={handleGoogleSignIn}>
              <Icon name="google" size={20} color="#DB4437" style={styles.socialIcon} />
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.socialButton} onPress={handleAppleSignIn}>
              <Icon name="apple" size={20} color="#000000" style={styles.socialIcon} />
              <Text style={styles.socialButtonText}>Continue with Apple</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.socialButton} onPress={handleEmailSignUp}>
              <Icon name="email" size={20} color="#4285F4" style={styles.socialIcon} />
              <Text style={styles.socialButtonText}>Continue with Email</Text>
            </TouchableOpacity>
          </View>

          {/* Login Section */}
          <View style={styles.loginSection}>
            <Text style={styles.loginPrompt}>Already have an account?</Text>
            <TouchableOpacity onPress={handleSignIn}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

      
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    width: width,
    height: height,
    top: 0,
    left: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
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
    position: 'absolute',
    bottom: SPACING.xl,
    left: SPACING.lg,
    right: SPACING.lg,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    marginHorizontal: SPACING.md,
    opacity: 0.8,
  },
  socialButtons: {
    
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  socialButton: {
    // backgroundColor: 'rgba(44, 44, 44, 0.9)',
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
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  loginPrompt: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    marginRight: SPACING.xs,
  },
  loginLink: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: '600',
    textDecorationLine: 'underline',
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  inviteText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    textDecorationLine: 'underline',
  },
});
