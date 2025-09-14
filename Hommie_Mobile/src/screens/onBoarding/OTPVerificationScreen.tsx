import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants';
import { contextAwareGoBack } from '../../utils/navigationUtils';
import { MeCabalAuth } from '../../services';
import { useAuth } from '../../contexts/AuthContext';

export default function OTPVerificationScreen({ navigation, route }: any) {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const { register, loginWithEmail } = useAuth();

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

  // Check if OTP is complete
  useEffect(() => {
    const otpString = otp.join('');
    if (otpString.length === 4) {
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

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length === 4) {
      setIsVerifying(true);
      
      try {
        // Use SMS-based OTP verification with Nigerian phone number
        const purpose = isSignup ? 'registration' : 'login';
        
        if (isSignup) {
          // For signup, first verify the OTP
          const verifyResult = await MeCabalAuth.verifyOTP(phoneNumber, otpString, 'registration');
          
          if (!verifyResult.success) {
            Alert.alert('Verification Failed', verifyResult.error || 'Invalid verification code. Please try again.');
            return;
          }
          
          // Check if user already exists (from email verification)
          const existingUserId = route.params?.userId;
          const userDetails = route.params?.userDetails;
          
          if (existingUserId) {
            // User already exists from email verification, just update phone number
            const updateResult = await MeCabalAuth.updateProfile(existingUserId, {
              phone_number: phoneNumber,
              verification_level: 2 // Both email and phone verified
            });
            
            if (updateResult.success) {
              Alert.alert(
                'Phone Verified!',
                'Your phone number has been verified successfully.',
                [{ text: 'Continue', onPress: () => {
                  navigation.navigate('LocationSetup', { 
                    language, 
                    phoneNumber, 
                    isSignup,
                    userId: existingUserId 
                  });
                }}]
              );
            } else {
              Alert.alert('Update Failed', updateResult.error || 'Failed to update phone number.');
            }
          } else {
            // Create new user account after successful OTP verification
            const authResult = await MeCabalAuth.createUserAfterVerification({
              email: userDetails?.email || route.params?.email || `${phoneNumber.replace(/^\+234/, '0').replace(/^234/, '0')}@mecabal.temp`,
              phone_number: phoneNumber,
              first_name: userDetails?.firstName || route.params?.firstName || '',
              last_name: userDetails?.lastName || route.params?.lastName || '',
              state_of_origin: route.params?.stateOfOrigin,
              preferred_language: language
            });
            
            if (authResult.success && authResult.user) {
              // Update auth context
              await register(authResult.user);
              
              Alert.alert(
                'Registration Successful!',
                'Your account has been created and verified successfully.',
                [{ text: 'Continue', onPress: () => {
                  navigation.navigate('LocationSetup', { 
                    language, 
                    phoneNumber, 
                    isSignup,
                    userId: authResult.user?.id 
                  });
                }}]
              );
            } else {
              Alert.alert('Registration Failed', authResult.error || 'Failed to create account.');
            }
          }
        } else {
          // For login, verify OTP with phone number
          const verifyResult = await MeCabalAuth.verifyOTP(phoneNumber, otpString, 'login');
          
          if (verifyResult.success) {
            // Complete login after successful OTP verification
            const loginResult = await MeCabalAuth.completeLogin(phoneNumber);
            
            if (loginResult.success && loginResult.user) {
              // Update auth context
              await register(loginResult.user);
              
              Alert.alert(
                'Welcome Back!',
                'You have been logged in successfully.',
                [{ text: 'Continue', onPress: () => {
                  navigation.navigate('LocationSetup', { 
                    language, 
                    phoneNumber, 
                    isSignup,
                    userId: loginResult.user?.id 
                  });
                }}]
              );
            } else {
              Alert.alert('Login Failed', loginResult.error || 'Failed to complete login process.');
            }
          } else {
            Alert.alert('Login Failed', verifyResult.error || 'Invalid verification code. Please try again.');
          }
        }
      } catch (error) {
        console.error('OTP verification error:', error);
        Alert.alert('Error', 'Failed to verify OTP. Please check your connection and try again.');
      } finally {
        setIsVerifying(false);
      }
    } else {
      Alert.alert('Error', 'Please enter the complete 4-digit OTP');
    }
  };

  const handleResend = async () => {
    if (canResend) {
      try {
        const purpose = isSignup ? 'registration' : 'login';
        // Use SMS OTP for resending
        const result = await MeCabalAuth.sendOTP(phoneNumber, purpose);
        
        if (result.success) {
          setTimeLeft(30);
          setCanResend(false);
          setOtp(['', '', '', '']);
          Alert.alert('OTP Sent', `A new 4-digit verification code has been sent to ${phoneNumber}`);
        } else {
          Alert.alert('Error', result.error || 'Failed to resend verification code. Please try again.');
        }
      } catch (error) {
        console.error('Resend OTP error:', error);
        Alert.alert('Error', 'Failed to resend verification code. Please check your connection and try again.');
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
            <Text style={styles.description}>
              We've sent a 4-digit code to
            </Text>
            
            <Text style={styles.phoneNumber}>
              {phoneNumber}
            </Text>

            {/* <Text style={styles.instruction}>
              Enter the code below to verify your account
            </Text> */}

            {/* OTP Input */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
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
                  onChangeText={(value) => handleOtpChange(value, index)}
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
            </View>

            {/* Timer and Resend */}
            <View style={styles.timerContainer}>
              {!canResend ? (
                <Text style={styles.timerText}>
                  Resend code in {formatTime(timeLeft)}
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResend}>
                  <Text style={styles.resendText}>Resend code</Text>
                </TouchableOpacity>
              )}
            </View>

        
          </View>

          {/* Verify Button */}
          <TouchableOpacity 
            style={[
              styles.verifyButton, 
              (otp.join('').length < 4 || isVerifying) && styles.verifyButtonDisabled
            ]} 
            onPress={handleVerify}
            disabled={otp.join('').length < 4 || isVerifying}
          >
            <Text style={styles.verifyButtonText}>
              {isVerifying ? 'Verifying...' : 'Verify'}
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
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
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
  phoneNumber: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  instruction: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
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
