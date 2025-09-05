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
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants';
import { MeCabalAuth } from '../../services';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function EmailRegistrationScreen({ navigation }: any) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isFormValid = firstName.trim() && lastName.trim() && email.trim() && email.includes('@');

  const handleSubmit = async () => {
    if (!isFormValid) {
      Alert.alert('Invalid Information', 'Please fill in all fields with valid information');
      return;
    }

    setIsLoading(true);
    
    try {
      // Use simplified Supabase authentication for email registration
      const result = await MeCabalAuth.sendEmailOTP(email, 'registration');
      
      if (result.success) {
        // In development, show the OTP code for testing
        const message = __DEV__ && result.otp_code 
          ? `A verification code has been sent to your email address.\n\nDevelopment OTP: ${result.otp_code}`
          : 'A verification code has been sent to your email address.';
          
        Alert.alert(
          'Verification Code Sent',
          message,
          [{ text: 'OK', onPress: () => {
            navigation.navigate('EmailVerification', { 
              email,
              firstName,
              lastName,
              isSignup: true
            });
          }}]
        );
      } else {
        // Handle specific Supabase auth errors
        let errorMessage = result.error || 'Registration failed. Please try again.';
        
        // Supabase-specific error handling
        if (errorMessage.includes('User already registered')) {
          errorMessage = 'This email is already registered. Try signing in instead.';
        } else if (errorMessage.includes('Invalid email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (errorMessage.includes('rate limit')) {
          errorMessage = 'Too many requests. Please wait a moment before trying again.';
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          errorMessage = 'Please check your internet connection and try again.';
        }
        
        Alert.alert(
          'Registration Error', 
          errorMessage,
          [
            { text: 'Try Again', style: 'default' },
            { 
              text: 'Continue with Phone', 
              onPress: () => {
                // Offer phone verification as alternative
                Alert.alert(
                  'Try Phone Registration?',
                  'You can register using your phone number instead.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Use Phone Number',
                      onPress: () => {
                        navigation.navigate('PhoneVerification', { 
                          language: 'en', 
                          isSignup: true,
                          userDetails: { firstName, lastName, email }
                        });
                      }
                    }
                  ]
                );
              },
              style: 'cancel'
            }
          ]
        );
      }
    } catch (error) {
      console.error('Email registration error:', error);
      
      let errorMessage = 'Registration failed. Please check your connection and try again.';
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = 'Unable to connect to our servers. Please check your internet connection.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        }
      }
      
      Alert.alert(
        'Connection Error', 
        errorMessage,
        [
          { text: 'Retry', style: 'default' },
          { 
            text: 'Try Phone Instead', 
            onPress: () => {
              navigation.navigate('PhoneVerification', { 
                language: 'en', 
                isSignup: true,
                userDetails: { firstName, lastName, email }
              });
            },
            style: 'cancel'
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
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
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-left" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Main Content */}
          <View style={styles.mainContent}>
            <View style={styles.titleContainer}>
              <View style={styles.logoContainer}>
              </View>
              <Text style={styles.title}>Join Your Community</Text>
            
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>First Name</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="account" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Chigozie"
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="account" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ayomide"
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="email" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="sam@example.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>
              </View>

              {/* Trust Indicator */}
              <View style={styles.trustIndicator}>
                <Icon name="shield-check" size={16} color={COLORS.primary} />
                <Text style={styles.trustText}>
                  Your information is secure and encrypted
                </Text>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[
                styles.submitButton, 
                (!isFormValid || isLoading) && styles.submitButtonDisabled
              ]} 
              onPress={handleSubmit}
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <Icon name="loading" size={20} color={COLORS.white} style={styles.loadingIcon} />
              ) : (
                <Icon name="arrow-right" size={20} color={COLORS.white} style={styles.buttonIcon} />
              )}
              <Text style={[
                styles.submitButtonText,
                (!isFormValid || isLoading) && styles.submitButtonTextDisabled
              ]}>
                {isLoading ? 'Creating Account...' : 'Continue'}
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.disclaimerText}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
            
            <Text style={styles.verificationNote}>
              Note: Both email and phone verification are required for account security
            </Text>
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
    paddingTop: Platform.OS === 'ios' ? SPACING.sm : SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    height: 44,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.lightGray,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
  },
  titleContainer: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: SPACING.lg,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizes['3xl'] || 30,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg || 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACING.md,
  },
  formSection: {
    marginBottom: SPACING.xl,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.fontSizes.base || 16,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    borderWidth: 2,
    ...SHADOWS.small,
    borderColor: COLORS.primary,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSizes.base || 16,
    color: COLORS.text,
    backgroundColor: 'transparent',
   
  },
  trustIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.md,
  },
  trustText: {
    fontSize: TYPOGRAPHY.fontSizes.sm || 14,
    color: COLORS.text,
    marginLeft: SPACING.xs,
    fontWeight: '500',
  },
  buttonContainer: {
    paddingTop: SPACING.xl,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    minHeight: 48,
    ...SHADOWS.medium,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.lightGray,
    ...SHADOWS.small,
  },
  buttonIcon: {
    marginRight: SPACING.sm,
  },
  loadingIcon: {
    marginRight: SPACING.sm,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.lg || 18,
    fontWeight: '600',
  },
  submitButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
  disclaimerText: {
    fontSize: TYPOGRAPHY.fontSizes.sm || 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  verificationNote: {
    fontSize: TYPOGRAPHY.fontSizes.xs || 12,
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: '500',
    paddingHorizontal: SPACING.lg,
  },
});