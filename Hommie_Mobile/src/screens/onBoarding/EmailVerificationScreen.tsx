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
import { useAuth } from '../../contexts/AuthContext';

export default function EmailVerificationScreen({ navigation, route }: any) {
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Create refs for OTP input fields and abort controller
  const otpRefs = useRef<Array<TextInput | null>>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestTimeRef = useRef<number>(0);
  const { register, loginWithEmail } = useAuth();

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

  // Cleanup effect to abort pending requests
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Removed auto-verification to prevent infinite requests
  // Users must manually click the Verify button

  const handleVerifyCode = async () => {
    if (verificationCode.join('').length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit verification code');
      return;
    }

    // Prevent multiple simultaneous verification attempts
    if (isVerifying || isLoading) {
      return;
    }

    // Debouncing: Prevent requests within 1 second of each other
    const now = Date.now();
    if (now - lastRequestTimeRef.current < 1000) {
      return;
    }
    lastRequestTimeRef.current = now;

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    setIsVerifying(true);
    setIsLoading(true);

    try {
      const code = verificationCode.join('');

      if (isSignup) {
        // For signup flow, complete email verification and create user account
        const authResult = await MeCabalAuth.authenticateWithOTP(
          email,
          code,
          'registration',
          {
            first_name: firstName,
            last_name: lastName,
            preferred_language: 'en'
          }
        );

        if (authResult.success && authResult.user) {
          Alert.alert(
            'Email Verified!',
            'Your email has been verified successfully. Now let\'s verify your phone number.',
            [{ text: 'Continue', onPress: () => {
              navigation.navigate('PhoneVerification', {
                language: 'en',
                signupMethod: 'email',
                isSignup: true,
                userDetails: { firstName, lastName, email },
                emailVerified: true,
                userId: authResult.user.id, // Pass the user ID from email verification
                existingUser: authResult.user // Pass the full user object
              });
            }}]
          );
        } else {
          Alert.alert('Verification Failed', authResult.error || 'Invalid verification code. Please try again.');
        }
      } else {
        // For login flow, use AuthContext to properly authenticate
        const success = await loginWithEmail(email, code);

        if (success) {
          Alert.alert(
            'Welcome Back!',
            'Your email has been verified successfully.',
            [{ text: 'Continue', onPress: () => {
              if (onLoginSuccess) {
                onLoginSuccess();
              }
              // AuthContext will handle navigation automatically when user state changes
            }}]
          );
        } else {
          Alert.alert('Error', 'Login failed. Please try again.');
        }
      }
    } catch (error: any) {
      // Don't show error if request was aborted
      if (error.name !== 'AbortError') {
        console.error('Email verification error:', error);
        Alert.alert('Error', 'Failed to verify email. Please check your connection and try again.');
      }
    } finally {
      setIsVerifying(false);
      setIsLoading(false);
      abortControllerRef.current = null;
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
            <Text style={styles.description}>
              We've sent a 6-digit code to
            </Text>
            
            <Text style={styles.emailNumber}>
              {email}
            </Text>

            {/* OTP Input */}
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
                    // Only allow single digits
                    if (value.length > 1) {
                      value = value.slice(-1); // Take only the last character
                    }

                    const newCode = [...verificationCode];
                    newCode[index] = value;
                    setVerificationCode(newCode);

                    // Auto-focus next input if a digit was entered
                    if (value && index < 5) {
                      otpRefs.current[index + 1]?.focus();
                    }
                    
                    // Auto-focus previous input if digit was deleted and we're not at the first input
                    if (!value && index > 0) {
                      otpRefs.current[index - 1]?.focus();
                    }
                  }}
                  onKeyPress={({ nativeEvent }) => {
                    // Handle backspace
                    if (nativeEvent.key === 'Backspace' && !digit && index > 0) {
                      otpRefs.current[index - 1]?.focus();
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={1}
                  textAlign="center"
                  placeholder="0"
                  placeholderTextColor={COLORS.textSecondary}
                />
              ))}
            </View>

            {/* Timer and Resend */}
            <View style={styles.timerContainer}>
              {!canResend ? (
                <Text style={styles.timerText}>
                  Resend code in {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResendCode}>
                  <Text style={styles.resendText}>Resend code</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Verify Button */}
          <TouchableOpacity 
            style={[
              styles.verifyButton, 
              (verificationCode.join('').length < 6 || isLoading || isVerifying) && styles.verifyButtonDisabled
            ]} 
            onPress={handleVerifyCode}
            disabled={verificationCode.join('').length < 6 || isLoading || isVerifying}
          >
            <Text style={styles.verifyButtonText}>
              {(isLoading || isVerifying) ? 'Verifying...' : 'Verify'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
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
  header: {
    marginBottom: SPACING.xl,
  },
  backButton: {
    marginBottom: SPACING.md,
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.text,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    marginTop: SPACING.xl,
    justifyContent: 'center',
  },
  description: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  emailNumber: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: '500',
    color: COLORS.text,
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
    fontWeight: '400',
    color: COLORS.text,
    textAlign: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.xs,
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.lightGreen,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  timerText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
  },
  resendText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  verifyButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.medium,
  },
  verifyButtonDisabled: {
    backgroundColor: COLORS.lightGray,
  },
  verifyButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: '600',
  },
});