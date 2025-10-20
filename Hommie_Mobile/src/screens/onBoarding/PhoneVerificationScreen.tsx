import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, Alert, ScrollView, Animated } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants';
import { contextAwareGoBack } from '../../utils/navigationUtils';
import { MeCabalAuth } from '../../services';
import * as Haptics from 'expo-haptics';

const NIGERIAN_CARRIERS = [
  { name: 'MTN', codes: ['080', '081', '090', '070', '091', '0816', '0813', '0814', '0810', '0811', '0812', '0703', '0706', '0704', '0705', '0708', '0709', '0903', '0906', '0904', '0905', '0908', '0909'] },
  { name: 'Airtel', codes: ['0802', '0808', '0708', '0812', '0701', '0902', '0901', '0809', '0811', '0708', '0810', '0907', '0908', '0909', '0901', '0902', '0903', '0904', '0905', '0906', '0907', '0908', '0909'] },
  { name: 'Glo', codes: ['0805', '0807', '0811', '0815', '0705', '0905', '0805', '0807', '0811', '0815', '0705', '0905', '0805', '0807', '0811', '0815', '0705', '0905', '0805', '0807', '0811', '0815', '0705', '0905'] },
  { name: '9mobile', codes: ['0809', '0817', '0818', '0908', '0909', '0817', '0818', '0809', '0817', '0818', '0908', '0909', '0817', '0818', '0809', '0817', '0818', '0908', '0909', '0817', '0818', '0809', '0817', '0818'] },
];


export default function PhoneVerificationScreen({ navigation, route }: any) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+234');
  const [detectedCarrier, setDetectedCarrier] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'sms' | 'whatsapp'>('sms');
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const inputFocusAnim = useRef(new Animated.Value(0)).current;

  const language = route.params?.language || 'en';
  const isSignup = route.params?.isSignup || false;
  const userDetails = route.params?.userDetails; // Get user details including email
  const userId = route.params?.userId; // Get user ID if user was created during email verification
  const existingUser = route.params?.existingUser; // Get existing user object


  // Detect carrier based on phone number prefix
  useEffect(() => {
    if (phoneNumber.length >= 3) {
      const prefix = phoneNumber.substring(0, 3);
      const carrier = NIGERIAN_CARRIERS.find(c => c.codes.includes(prefix));
      setDetectedCarrier(carrier ? carrier.name : null);
    } else {
      setDetectedCarrier(null);
    }
  }, [phoneNumber]);

  // Handle input focus animation
  useEffect(() => {
    Animated.timing(inputFocusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Allow both formats: 08012345678 (11 digits) and 8012345678 (10 digits)
    if (phoneNumber.length < 10 || phoneNumber.length > 11) {
      setError('Please enter a valid Nigerian phone number (10 or 11 digits)');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setError(null);
    setIsLoading(true);
    
    try {
      // Normalize phone number - remove leading 0 if present
      const normalizedPhone = phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber;
      const fullPhoneNumber = `${countryCode}${normalizedPhone}`;
      const purpose = isSignup ? 'registration' : 'login';
      
      // Use MeCabal authentication service with selected method
      const result = await MeCabalAuth.sendOTP(fullPhoneNumber, purpose, selectedMethod, userDetails?.email);
      
      if (result.success) {
        // Show success message with carrier info and OTP code for development
        const message = result.otp_code 
          ? `A 4-digit code has been sent via ${result.carrier || detectedCarrier || 'SMS'}\n\n🔐 Dev Code: ${result.otp_code}`
          : `A 4-digit code has been sent via ${result.carrier || detectedCarrier || 'SMS'}`;
        
        Alert.alert(
          'Verification Code Sent',
          message,
          [{ text: 'OK', onPress: () => {
            navigation.navigate('OTPVerification', {
              phoneNumber: fullPhoneNumber,
              carrier: result.carrier || detectedCarrier,
              language,
              isSignup,
              userDetails, // Pass through the user details including email
              userId, // Pass the user ID if user was created during email verification
              existingUser // Pass the existing user object
            });
          }}]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to send verification code. Please try again.');
      }
    } catch (error) {
      console.error('Phone verification error:', error);
      Alert.alert('Error', 'Failed to send verification code. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Skip Phone Verification?',
      'Phone verification helps keep our community safe. You can still proceed, but some features may be limited.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: () => navigation.navigate('LocationSetup', { language, phoneNumber: '', isSignup: true, userDetails, userId, existingUser }) }
      ]
    );
  };

  const handleMethodSelect = (method: 'sms' | 'whatsapp') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMethod(method);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* iOS Navigation Bar */}
      <View style={styles.navigationBar}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => contextAwareGoBack(navigation, 'onboarding')}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Animated.Text style={[styles.navTitle, {
          opacity: scrollY.interpolate({
            inputRange: [0, 50],
            outputRange: [0, 1],
            extrapolate: 'clamp',
          }),
        }]}>
          Verify your phone
        </Animated.Text>
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleSkip}
          accessibilityLabel="Skip phone verification"
          accessibilityRole="button"
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >

          {/* Large Title */}
          <Animated.View style={[styles.titleContainer, {
            transform: [{
              translateY: scrollY.interpolate({
                inputRange: [0, 50],
                outputRange: [0, -50],
                extrapolate: 'clamp',
              }),
            }],
            opacity: scrollY.interpolate({
              inputRange: [0, 50],
              outputRange: [1, 0],
              extrapolate: 'clamp',
            }),
          }]}>
            <Text style={styles.largeTitle}>
              Verify your phone number
            </Text>
            <Text style={styles.description}>
              We'll send a code to keep your account safe
            </Text>
          </Animated.View>

          {/* Phone Input Section */}
          <View style={styles.inputSection}>
            <View style={styles.phoneInputContainer}>
              <View style={styles.countryCodeContainer}>
                <Text style={styles.countryFlag}>🇳🇬</Text>
                <Text style={styles.countryCode}>{countryCode}</Text>
              </View>
              
              <Animated.View style={[styles.phoneInputWrapper, {
                borderColor: inputFocusAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['#E5E5E5', COLORS.primary],
                }),
                borderWidth: inputFocusAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 2],
                }),
              }]}>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="8012345678 or 08012345678"
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text);
                    setError(null);
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  keyboardType="phone-pad"
                  maxLength={11}
                  placeholderTextColor={COLORS.textSecondary}
                  autoFocus={false}
                  clearButtonMode="while-editing"
                  selectTextOnFocus={true}
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                />
              </Animated.View>
              
              {/* Error Message */}
              {error && (
                <Text style={styles.errorText}>{error}</Text>
              )}
              
              {/* Carrier Detection */}
              {detectedCarrier && !error && (
                <Text style={styles.carrierText}>Detected: {detectedCarrier}</Text>
              )}
            </View>
          </View>

          {/* Method Selection */}
          <View style={styles.methodSection}>
            <Text style={styles.methodTitle}>How should we send it?</Text>
            <View style={styles.methodOptions}>
              <TouchableOpacity 
                style={[
                  styles.methodOption,
                  selectedMethod === 'sms' && styles.methodOptionSelected
                ]}
                onPress={() => handleMethodSelect('sms')}
                accessibilityLabel="Text message (SMS)"
                accessibilityRole="radio"
                accessibilityState={{ checked: selectedMethod === 'sms' }}
              >
                <View style={styles.radioButton}>
                  {selectedMethod === 'sms' && <View style={styles.radioButtonSelected} />}
                </View>
                <Text style={[
                  styles.methodText,
                  selectedMethod === 'sms' && styles.methodTextSelected
                ]}>Text message (SMS)</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.methodOption,
                  selectedMethod === 'whatsapp' && styles.methodOptionSelected
                ]}
                onPress={() => handleMethodSelect('whatsapp')}
                accessibilityLabel="WhatsApp message"
                accessibilityRole="radio"
                accessibilityState={{ checked: selectedMethod === 'whatsapp' }}
              >
                <View style={styles.radioButton}>
                  {selectedMethod === 'whatsapp' && <View style={styles.radioButtonSelected} />}
                </View>
                <Text style={[
                  styles.methodText,
                  selectedMethod === 'whatsapp' && styles.methodTextSelected
                ]}>WhatsApp message</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity 
          style={[
            styles.submitButton, 
            (phoneNumber.length < 10 || phoneNumber.length > 11 || isLoading) && styles.submitButtonDisabled
          ]} 
          onPress={handleSubmit}
          disabled={phoneNumber.length < 10 || phoneNumber.length > 11 || isLoading}
          accessibilityLabel={isLoading ? 'Sending verification code' : 'Send verification code'}
          accessibilityRole="button"
        >
          <Text style={[styles.submitButtonText,
            (phoneNumber.length < 10 || phoneNumber.length > 11 || isLoading) && styles.submitButtonTextDisabled
          ]}>
            {isLoading ? 'Sending...' : 'Send Code'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  navigationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
    height: 44,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100, // Space for fixed button
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
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
  skipButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  skipText: {
    fontSize: 17,
    color: COLORS.primary,
    fontWeight: '400',
  },
  titleContainer: {
    marginBottom: 32,
    paddingTop: 20,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 41,
    marginBottom: 8,
  },
  titleWrapper: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 200,
  },
  descriptionWrapper: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 200,
  },
  description: {
    fontSize: 17,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: 32,
  },
  phoneInputContainer: {
    marginBottom: 8,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  countryFlag: {
    fontSize: 20,
    marginRight: 8,
  },
  countryCode: {
    fontSize: 17,
    color: COLORS.text,
    fontWeight: '400',
  },
  phoneInputWrapper: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  phoneInput: {
    fontSize: 17,
    color: COLORS.text,
    paddingVertical: 0,
    paddingHorizontal: 0,
    fontWeight: '400',
    width: '100%',
    height: '100%',
  },
  errorText: {
    fontSize: 15,
    color: COLORS.danger,
    marginTop: 8,
    fontWeight: '400',
  },
  carrierText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 8,
    fontWeight: '400',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.lightGray,
    opacity: 0.4,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '600',
  },
  submitButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
  methodSection: {
    marginBottom: 32,
  },
  methodTitle: {
    fontSize: 17,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 16,
  },
  methodOptions: {
    gap: 12,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    height: 44,
    backgroundColor: COLORS.white,
  },
  methodOptionSelected: {
    backgroundColor: COLORS.white,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  methodText: {
    fontSize: 17,
    color: COLORS.text,
    fontWeight: '400',
    flex: 1,
  },
  methodTextSelected: {
    color: COLORS.text,
    fontWeight: '400',
  },
  bottomButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 34, // Safe area bottom
    backgroundColor: COLORS.white,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5E5',
  },
});