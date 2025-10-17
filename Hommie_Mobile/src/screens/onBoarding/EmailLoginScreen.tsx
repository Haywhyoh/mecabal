import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants';
import { safeGoBack, contextAwareGoBack } from '../../utils/navigationUtils';
import { MeCabalAuth } from '../../services';
import { GoogleSignInButton } from '../../components';
import { useAuth } from '../../contexts/AuthContext';

export default function EmailLoginScreen({ navigation, route }: any) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onSocialLoginSuccess = route.params?.onSocialLoginSuccess;
  const onLoginSuccess = route.params?.onLoginSuccess;
  const isEmailValid = email.trim() && email.includes('@');
  
  const { signInWithGoogle, isLoading: authLoading } = useAuth();

  const handleSendOTP = async () => {
    if (!isEmailValid) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    try {
      // Use MeCabal authentication service for email login
      const result = await MeCabalAuth.loginWithEmail(email);
      
      if (result.success) {
        Alert.alert(
          'Login Code Sent',
          'A verification code has been sent to your email address.',
          [{ text: 'OK', onPress: () => {
            navigation.navigate('EmailVerification', { 
              email,
              isSignup: false, // This is for login, not signup
              onLoginSuccess: onLoginSuccess
            });
          }}]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to send verification code. Please try again.');
      }
    } catch (error) {
      console.error('Email login OTP error:', error);
      Alert.alert('Error', 'Failed to send verification code. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    console.log('Google login pressed');
    
    try {
      const success = await signInWithGoogle();
      if (success) {
        console.log('✅ Google login successful');
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          // Navigate to main app or next screen
          navigation.navigate('MainApp');
        }
      }
    } catch (error) {
      console.error('❌ Google login failed:', error);
    }
  };

  const handleAppleLogin = () => {
    console.log('Apple login pressed');
    // For SSO login, authenticate and go to home if successful
    if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  const handleFacebookLogin = () => {
    console.log('Facebook login pressed');
    // For SSO login, authenticate and go to home if successful
    if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => contextAwareGoBack(navigation, 'onboarding')}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
          </View>

          {/* Main Content */}
          <View style={styles.mainContent}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                Sign in to your account
              </Text>
            </View>

            {/* Email Input Section */}
            <View style={styles.inputSection}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="email" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor={COLORS.textSecondary}
                    autoFocus
                  />
                </View>
              </View>
            </View>

            {/* Social Login Options */}
            <View style={styles.socialSection}>
              <GoogleSignInButton 
                buttonText="Sign in with Google"
                onSuccess={handleGoogleLogin}
                size="large"
                variant="default"
                disabled={authLoading}
                style={styles.googleButton}
              />
              
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialButtons}>
                <TouchableOpacity style={styles.socialButton} onPress={handleAppleLogin}>
                  <Icon name="apple" size={20} color="#000000" style={styles.socialIcon} />
                  <Text style={styles.socialButtonText}>Apple</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.socialButton} onPress={handleFacebookLogin}>
                  <Icon name="facebook" size={20} color="#1877F2" style={styles.socialIcon} />
                  <Text style={styles.socialButtonText}>Facebook</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Login Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[
                styles.loginButton, 
                (!isEmailValid || isLoading) && styles.loginButtonDisabled
              ]} 
              onPress={handleSendOTP}
              disabled={!isEmailValid || isLoading}
            >
              <Text style={[
                styles.loginButtonText,
                (!isEmailValid || isLoading) && styles.loginButtonTextDisabled
              ]}>
                {isLoading ? 'Sending Code...' : 'Send Login Code'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.signUpPrompt}
              onPress={() => safeGoBack(navigation, 'Welcome')}
            >
              <Text style={styles.signUpText}>
                Don't have an account? <Text style={styles.signUpLink}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    height: 44,
  },
  backButton: {
    padding: SPACING.sm,
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.text,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    paddingTop: SPACING.xl,
  },
  titleContainer: {
    marginBottom: SPACING.xxl,
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizes.xxxl,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeights.relaxed,
  },
  inputSection: {
    marginBottom: SPACING.lg,
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.text,
    fontWeight: '500',
    marginBottom: SPACING.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputIcon: {
    marginLeft: SPACING.md,
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.text,
  },
  socialSection: {
    marginBottom: SPACING.xl,
  },
  googleButton: {
    marginBottom: SPACING.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.lightGray,
  },
  dividerText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    marginHorizontal: SPACING.md,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  socialButton: {
    backgroundColor: COLORS.lightGray,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    flex: 1,
    marginHorizontal: SPACING.xs,
    justifyContent: 'center',
  },
  socialIcon: {
    marginRight: SPACING.sm,
  },
  socialButtonText: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: '500',
  },
  buttonContainer: {
    paddingBottom: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  loginButtonDisabled: {
    backgroundColor: COLORS.lightGray,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: '600',
  },
  loginButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
  signUpPrompt: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  signUpText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
  },
  signUpLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});