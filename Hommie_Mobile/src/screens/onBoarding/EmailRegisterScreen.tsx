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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants';

export default function EmailLoginScreen({ navigation, route }: any) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onSocialLoginSuccess = route.params?.onSocialLoginSuccess;
  const onLoginSuccess = route.params?.onLoginSuccess;
  const isEmailValid = email.trim() && email.includes('@');

  const handleSendOTP = async () => {
    if (!isEmailValid) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    try {
      // TODO: Implement actual OTP sending logic
      console.log('Sending OTP to email:', email);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      navigation.navigate('EmailVerification', { 
        email,
        isSignup: false,
        onLoginSuccess: onLoginSuccess
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
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

            {/* Social Login Options */}
            <View style={styles.socialSection}>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialButtons}>
                <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
                  <Icon name="google" size={20} color="#DB4437" style={styles.socialIcon} />
                  <Text style={styles.socialButtonText}>Google</Text>
                </TouchableOpacity>
                
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
              onPress={() => navigation.navigate('Welcome')}
            >
              <Text style={styles.signUpText}>
                Don't have an account? <Text style={styles.signUpLink}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
    marginBottom: SPACING.xxxl,
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizes.xxxl,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    // lineHeight: TYPOGRAPHY.lineHeights.relaxed,
  },
  inputSection: {
    marginBottom: SPACING.xl,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.text,
    fontWeight: '500',
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  socialSection: {
    marginBottom: SPACING.xl,
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
    fontSize: 18,
    marginRight: SPACING.sm,
  },
  socialButtonText: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: '500',
  },
  buttonContainer: {
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.md,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
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
    fontSize: TYPOGRAPHY.fontSizes.lg,
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