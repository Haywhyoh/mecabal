import React, { useState, useEffect, useRef } from 'react';
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

export default function EmailVerificationScreen({ navigation, route }: any) {
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  // Create refs for OTP input fields
  const otpRefs = useRef<Array<TextInput | null>>([]);

  const { email, firstName, lastName, isSignup, onLoginSuccess } = route.params || {};

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(timer - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleVerifyCode = async () => {
    if (verificationCode.join('').length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit verification code');
      return;
    }

    setIsLoading(true);
    
    try {
      const code = verificationCode.join('');
      
      // Use MeCabal authentication service to verify email OTP
      const result = await MeCabalAuth.verifyEmailOTP(email, code);
      
      if (result.success && result.verified) {
        if (isSignup) {
          // For signup flow, create user profile and continue to phone verification
          const userResult = await MeCabalAuth.createUserWithEmail({
            email: email,
            first_name: firstName,
            last_name: lastName
          });
          
          if (userResult.success) {
            Alert.alert(
              'Email Verified!',
              'Your email has been verified successfully. Now let\'s verify your phone number.',
              [{ text: 'Continue', onPress: () => {
                navigation.navigate('PhoneVerification', { 
                  language: 'en', 
                  signupMethod: 'email',
                  isSignup: true,
                  userDetails: { firstName, lastName, email },
                  userId: userResult.user?.id
                });
              }}]
            );
          } else {
            Alert.alert('Error', userResult.error || 'Failed to create user profile.');
          }
        } else {
          // For login flow, complete the login process
          const loginResult = await MeCabalAuth.completeEmailLogin(email);
          
          if (loginResult.success) {
            Alert.alert(
              'Welcome Back!',
              'Your email has been verified successfully.',
              [{ text: 'Continue', onPress: () => {
                if (onLoginSuccess) {
                  onLoginSuccess();
                } else {
                  navigation.navigate('MainTabs');
                }
              }}]
            );
          } else {
            Alert.alert('Error', loginResult.error || 'Login failed. Please try again.');
          }
        }
      } else {
        Alert.alert('Verification Failed', result.error || 'Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      Alert.alert('Error', 'Failed to verify email. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    try {
      const purpose = isSignup ? 'registration' : 'login';
      const result = await MeCabalAuth.sendEmailOTP(email, purpose);
      
      if (result.success) {
        setTimer(60);
        setCanResend(false);
        setVerificationCode(['', '', '', '', '', '']);
        Alert.alert('Code Sent', 'A new verification code has been sent to your email address');
      } else {
        Alert.alert('Error', result.error || 'Failed to resend code. Please try again.');
      }
    } catch (error) {
      console.error('Resend email OTP error:', error);
      Alert.alert('Error', 'Failed to resend code. Please check your connection and try again.');
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
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
          </View>

          {/* Main Content */}
          <View style={styles.mainContent}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Verify Your Email</Text>
              <Text style={styles.subtitle}>
                We've sent a 6-digit code to{'\n'}
                <Text style={styles.emailText}>{email}</Text>
              </Text>
            </View>

            {/* Code Input Section */}
            <View style={styles.codeSection}>
              {/* <Text style={styles.inputLabel}>Verification Code</Text> */}
              <View style={styles.otpContainer}>
                {verificationCode.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      if (ref) otpRefs.current[index] = ref;
                    }}
                    style={[
                      styles.otpInput,
                      digit && styles.otpInputFilled
                    ]}
                    value={digit}
                    onChangeText={(value) => {
                      if (value.length <= 1) {
                        const newCode = [...verificationCode];
                        newCode[index] = value;
                        setVerificationCode(newCode);
                        
                        // Auto-focus next input if a digit was entered
                        if (value && index < 5) {
                          otpRefs.current[index + 1]?.focus();
                        }
                      }
                    }}
                    keyboardType="numeric"
                    maxLength={1}
                    textAlign="center"
                    placeholder="0"
                    placeholderTextColor={COLORS.textSecondary}
                    autoFocus={index === 0}
                  />
                ))}
              </View>
              
              {/* Resend Code */}
              <View style={styles.resendContainer}>
                {canResend ? (
                  <TouchableOpacity onPress={handleResendCode}>
                    <Text style={styles.resendText}>Resend Code</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.timerText}>
                    Resend code in {timer}s
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Verify Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[
                styles.verifyButton, 
                (verificationCode.join('').length !== 6 || isLoading) && styles.verifyButtonDisabled
              ]} 
              onPress={handleVerifyCode}
              disabled={verificationCode.join('').length !== 6 || isLoading}
            >
              <Text style={[
                styles.verifyButtonText,
                (verificationCode.join('').length !== 6 || isLoading) && styles.verifyButtonTextDisabled
              ]}>
                {isLoading ? 'Verifying...' : 'Verify Email'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.changeEmailButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.changeEmailText}>Change Email Address</Text>
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
    lineHeight: TYPOGRAPHY.lineHeights.relaxed,
  },
  emailText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  codeSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.text,
    fontWeight: '500',
    marginBottom: SPACING.lg,
  },
  otpContainer: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 300,
    marginBottom: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    fontSize: TYPOGRAPHY.fontSizes.xxl,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.xs,
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.lightGreen,
  },
  codeInput: {
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    fontSize: TYPOGRAPHY.fontSizes.xxl,
    color: COLORS.text,
    fontWeight: '600',
    letterSpacing: 4,
    minWidth: 200,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  resendContainer: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  resendText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.primary,
    fontWeight: '400',
  },
  timerText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
  },
  buttonContainer: {
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.md,
  },
  verifyButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  verifyButtonDisabled: {
    backgroundColor: COLORS.lightGray,
  },
  verifyButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: '600',
  },
  verifyButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
  changeEmailButton: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  changeEmailText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.primary,
    fontWeight: '500',
  },
});