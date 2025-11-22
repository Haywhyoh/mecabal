import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, Alert, ScrollView, Animated, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants';
import { contextAwareGoBack } from '../../utils/navigationUtils';
import { MeCabalAuth } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import * as Haptics from 'expo-haptics';

export default function OTPVerificationScreen({ navigation, route }: any) {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { register, loginWithEmail, setUser } = useAuth();

  // Use ref to prevent duplicate calls
  const verificationInProgress = useRef(false);
  
  // Animation values
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const focusAnim = useRef(new Animated.Value(0)).current;

  const phoneNumber = route.params?.phoneNumber || '08012345678';
  const carrier = route.params?.carrier || 'Unknown';
  const language = route.params?.language || 'en';
  const isSignup = route.params?.isSignup || false;

  // Create refs for OTP input fields
  const otpRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Auto-verify when all 4 digits are entered
  useEffect(() => {
    const otpString = otp.join('');
    if (otpString.length === 4 && !isVerifying) {
      // Auto-verify when all 4 digits are entered
      setTimeout(() => {
        handleVerify();
      }, 500);
    }
  }, [otp]);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow single digits
    if (value.length > 1) {
      value = value.slice(-1); // Take only the last character
    }

    // Add haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Clear any previous errors
    setError(null);

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input if a digit was entered
    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
    
    // Auto-focus previous input if digit was deleted and we're not at the first input
    if (!value && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const shakeError = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleVerify = async () => {
    console.log('📱 handleVerify called, isVerifying:', isVerifying, 'verificationInProgress:', verificationInProgress.current);

    // Prevent duplicate calls with both state and ref
    if (verificationInProgress.current || isVerifying) {
      console.log('📱 Verification already in progress, skipping...');
      return;
    }

    const otpString = otp.join('');
    if (otpString.length === 4) {
      setIsVerifying(true);
      verificationInProgress.current = true;
      setError(null);

      try {
        // Use SMS-based OTP verification with Nigerian phone number
        const purpose = isSignup ? 'registration' : 'login';
        
        if (isSignup) {
          // Add debug logging
          console.log('📱 Starting OTP verification:', { phoneNumber, otpCode: otpString, purpose: 'registration' });

          // Single verification call - backend handles everything
          const verifyResult = await MeCabalAuth.verifyOTP(phoneNumber, otpString, 'registration');

          console.log('📱 OTP verification result:', verifyResult);

          if (!verifyResult.success) {
            setError(verifyResult.error || 'Invalid verification code. Please try again.');
            shakeError();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
          }

          // Don't set user in context yet - wait until location setup is complete
          // This prevents the navigation from switching to MainStack prematurely
          console.log('✅ User verified but not authenticated until location setup:', verifyResult.user?.id);

          // Verification successful - proceed to location setup
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert(
            'Phone Verified!',
            'Your phone number has been verified successfully. Let\'s set up your location.',
            [{ text: 'Continue', onPress: () => {
              navigation.navigate('LocationSetup', {
                language,
                phoneNumber,
                isSignup: true,
                userId: verifyResult.user?.id,
                userDetails: verifyResult.user
              });
            }}]
          );
        } else {
          // Add debug logging
          console.log('📱 Starting login OTP verification:', { phoneNumber, otpCode: otpString, purpose: 'login' });

          // Single verification call for login
          const verifyResult = await MeCabalAuth.verifyOTP(phoneNumber, otpString, 'login');

          console.log('📱 Login OTP verification result:', verifyResult);

          if (verifyResult.success && verifyResult.verified) {
            // Don't set user in context yet - wait until location setup is complete
            console.log('✅ Login user verified but not authenticated until location setup:', verifyResult.user?.id);

            Alert.alert(
              'Welcome Back!',
              'Your phone number has been verified successfully. Let\'s confirm your location.',
              [{ text: 'Continue', onPress: () => {
                navigation.navigate('LocationSetup', {
                  language,
                  phoneNumber,
                  isSignup: false,
                  userId: verifyResult.user?.id,
                  userDetails: verifyResult.user
                });
              }}]
            );
          } else {
            setError(verifyResult.error || 'Invalid verification code. Please try again.');
            shakeError();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
        }
      } catch (error) {
        console.error('OTP verification error:', error);
        setError('Failed to verify OTP. Please check your connection and try again.');
        shakeError();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setIsVerifying(false);
        verificationInProgress.current = false;
      }
    } else {
      setError('Please enter the complete 4-digit OTP');
      shakeError();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleResend = async () => {
    if (canResend) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      try {
        const purpose = isSignup ? 'registration' : 'login';
        // Use SMS OTP for resending
        const result = await MeCabalAuth.sendOTP(phoneNumber, purpose);
        
        if (result.success) {
          setTimeLeft(30);
          setCanResend(false);
          setOtp(['', '', '', '']);
          setError(null);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('OTP Sent', `A new 4-digit verification code has been sent to ${phoneNumber}`);
        } else {
          setError(result.error || 'Failed to resend verification code. Please try again.');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } catch (error) {
        console.error('Resend OTP error:', error);
        setError('Failed to resend verification code. Please check your connection and try again.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const handleCallMe = () => {
    Alert.alert(
      'Call Me Instead',
      `We'll call you at ${phoneNumber} with a verification code.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Me', onPress: () => {
          // TODO: Implement call-me verification
          Alert.alert('Call Initiated', 'You will receive a call shortly with your verification code.');
        }}
      ]
    );
  };

  const handleUSSD = () => {
    Alert.alert(
      'USSD Verification',
      `Dial *123*1# on your ${carrier} line to verify your number.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'I\'ve Done This', onPress: () => {
          // TODO: Check USSD verification status
          navigation.navigate('LocationSetup', { language, phoneNumber, isSignup });
        }}
      ]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPhoneNumber = (phone: string) => {
    // Format phone number for display: +234 801 234 5678
    if (phone.startsWith('+234')) {
      const number = phone.substring(4);
      return `+234 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
    }
    return phone;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden={true} />
      
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
            <Text style={styles.title}>
              Enter verification code
            </Text>
            
            <Text style={styles.description}>
              We sent a code to
            </Text>
            
            <Text style={styles.phoneNumber}>
              {formatPhoneNumber(phoneNumber)}
            </Text>

            {/* OTP Input */}
            <Animated.View style={[styles.otpContainer, {
              transform: [{ translateX: shakeAnim }]
            }]}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    if (ref) otpRefs.current[index] = ref;
                  }}
                  style={[
                    styles.otpInput,
                    digit && styles.otpInputFilled,
                    focusedIndex === index && styles.otpInputFocused
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onFocus={() => setFocusedIndex(index)}
                  onBlur={() => setFocusedIndex(null)}
                  keyboardType="numeric"
                  maxLength={1}
                  textAlign="center"
                  placeholder="0"
                  placeholderTextColor={COLORS.textSecondary}
                  onKeyPress={({ nativeEvent }) => {
                    // Handle backspace
                    if (nativeEvent.key === 'Backspace' && !digit && index > 0) {
                      otpRefs.current[index - 1]?.focus();
                    }
                  }}
                />
              ))}
            </Animated.View>

            {/* Error Message */}
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            {/* Loading State */}
            {isVerifying && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>Verifying...</Text>
              </View>
            )}

            {/* Timer and Resend */}
            <View style={styles.timerContainer}>
              {!canResend ? (
                <View style={styles.timerRow}>
                  <Text style={styles.timerIcon}>⟳</Text>
                  <Text style={styles.timerText}>
                    Resend code in {formatTime(timeLeft)}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity onPress={handleResend} style={styles.resendButton}>
                  <Text style={styles.resendText}>Resend code</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Alternative Options */}
            <View style={styles.alternativeOptions}>
              <TouchableOpacity onPress={handleCallMe} style={styles.alternativeButton}>
                <Text style={styles.alternativeText}>Try WhatsApp</Text>
              </TouchableOpacity>
              <Text style={styles.alternativeSeparator}>•</Text>
              <TouchableOpacity onPress={handleCallMe} style={styles.alternativeButton}>
                <Text style={styles.alternativeText}>Call me</Text>
              </TouchableOpacity>
            </View>
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
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonText: {
    fontSize: 17,
    color: COLORS.primary,
    fontWeight: '400',
  },

  mainContent: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 41,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 17,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 40,
    textAlign: 'center',
  },
  instruction: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    gap: 12,
  },
  otpInput: {
    width: 64,
    height: 64,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    fontSize: 28,
    fontWeight: '500',
    color: COLORS.text,
    textAlign: 'center',
    backgroundColor: COLORS.white,
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.lightGreen,
  },
  otpInputFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  errorText: {
    fontSize: 15,
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '400',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginLeft: 8,
    fontWeight: '400',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerIcon: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginRight: 6,
  },
  timerText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '600',
  },
  alternativeOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alternativeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  alternativeText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '400',
  },
  alternativeSeparator: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginHorizontal: 8,
  },
});
