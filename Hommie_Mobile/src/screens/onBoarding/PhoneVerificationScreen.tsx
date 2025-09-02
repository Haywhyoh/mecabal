import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants';
import { contextAwareGoBack } from '../../utils/navigationUtils';

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

  const language = route.params?.language || 'en';
  const isSignup = route.params?.isSignup || false;


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

  const handleSubmit = async () => {
    if (phoneNumber.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid Nigerian phone number');
      return;
    }

    setIsLoading(true);
    
    try {
      // TODO: Implement actual phone verification logic
      console.log('Phone verification submitted:', { countryCode, phoneNumber, carrier: detectedCarrier });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      navigation.navigate('OTPVerification', { 
        phoneNumber: `${countryCode}${phoneNumber}`,
        carrier: detectedCarrier,
        language,
        isSignup
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Phone Verification?',
      'Phone verification helps keep our community safe. You can still proceed, but some features may be limited.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: () => navigation.navigate('LocationSetup', { language, phoneNumber: '', isSignup }) }
      ]
    );
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
            <TouchableOpacity 
              style={styles.skipButton}
              onPress={handleSkip}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>

          {/* Main Content */}
          <View style={styles.mainContent}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>
                Verify your phone
              </Text>
              
              <Text 
                style={styles.description}
              >
                 We'll send you a code to keep your account safe.
               </Text>
            </View>

            {/* Phone Input Section */}
            <View style={styles.inputSection}>
              {/* Phone Input */}
              <View style={styles.phoneInputContainer}>
                <View style={styles.countryCodeContainer}>
                  <Text style={styles.countryFlag}>🇳🇬</Text>
                  <Text style={styles.countryCode}>{countryCode}</Text>
                </View>
                
                <View style={styles.phoneInputWrapper}>
                  {/* <Text style={styles.inputLabel}>Mobile phone number</Text> */}
                  <TextInput
                    style={styles.phoneInput}
                    placeholder=" 8012345678"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    maxLength={11}
                    placeholderTextColor={COLORS.textSecondary}
                    autoFocus={false}
                    clearButtonMode="while-editing"
                    selectTextOnFocus={true}
                    textContentType="telephoneNumber"
                    autoComplete="tel"
                  />
                  
                  {/* Carrier Detection */}
                  {detectedCarrier && (
                    <View style={styles.carrierIndicator}>
                      <Text style={styles.carrierText}>Detected: {detectedCarrier}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[
                styles.submitButton, 
                (phoneNumber.length < 10 || isLoading) && styles.submitButtonDisabled
              ]} 
              onPress={handleSubmit}
              disabled={phoneNumber.length < 10 || isLoading}
            >
              <Text style={[styles.submitButtonText,
                (phoneNumber.length < 10 || isLoading) && styles.submitButtonDisabled
              ]}>
                {isLoading ? 'Sending...' : 'Send Code'}
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
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    height: 44, // Fixed height to prevent layout shifts
  },
  backButton: {
    padding: SPACING.sm,
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.text,
    fontWeight: '600',
  },
  skipButton: {
    padding: SPACING.sm,
  },
  skipText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.primary,
    fontWeight: '500',
  },
  mainContent: {
    flex: 1,
    paddingTop: SPACING.xxl,
  },
  titleContainer: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizes.xxl,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
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
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.text, // Changed from textSecondary to text for better visibility
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeights.tight,
    paddingHorizontal: SPACING.md,
    maxWidth: 280,
    opacity: 0.8, // Add slight opacity for subtle secondary appearance
    marginBottom: SPACING.lg,
  },
  inputSection: {
    flex: 0,
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  phoneInputContainer: {
    alignItems: 'center',
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  countryFlag: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  countryCode: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    color: COLORS.text,
    fontWeight: '600',
  },
  phoneInputWrapper: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    paddingBottom: SPACING.sm,
    alignItems: 'center',
    minWidth: 320, // Increased minimum width for better text display
    maxWidth: 350, // Increased maximum width
    paddingHorizontal: SPACING.md, // Add horizontal padding
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  phoneInput: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.text,
    textAlign: 'center', // Center the input text
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    fontWeight: '400',
    width: '100%',
    minHeight: 50, // Ensure minimum height for proper text display
    letterSpacing: 1, // Add letter spacing for better readability
  },
  carrierIndicator: {
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  carrierText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  buttonContainer: {
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.md,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md, 
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.small,
    marginBottom: SPACING.xxxl,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.lightGray,
    color: COLORS.textSecondary,
   
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: '600',
  },
});