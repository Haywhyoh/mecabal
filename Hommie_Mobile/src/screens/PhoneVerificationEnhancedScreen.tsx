import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ScreenHeader } from '../components/ScreenHeader';
import { 
  NIGERIAN_PHONE_PREFIXES, 
  validateNigerianPhone, 
  formatNigerianPhone, 
  getPhoneNetworkInfo 
} from '../constants/nigerianData';

interface NetworkInfo {
  network: string;
  prefix: string;
  color: string;
}

interface PhoneVerificationEnhancedScreenProps {
  navigation?: any;
}

export default function PhoneVerificationEnhancedScreen({ navigation }: PhoneVerificationEnhancedScreenProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formattedNumber, setFormattedNumber] = useState('');
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpInputs, setOtpInputs] = useState(['', '', '', '', '', '']);

  useEffect(() => {
    // Auto-format phone number as user types
    const formatted = formatNigerianPhone(phoneNumber);
    setFormattedNumber(formatted);
    
    // Validate phone number
    const valid = validateNigerianPhone(phoneNumber);
    setIsValid(valid);
    
    // Get network information
    if (phoneNumber.length >= 4) {
      const network = getPhoneNetworkInfo(phoneNumber);
      setNetworkInfo(network || null);
    } else {
      setNetworkInfo(null);
    }
  }, [phoneNumber]);

  const handlePhoneChange = (text: string) => {
    // Remove all non-numeric characters except +
    let cleaned = text.replace(/[^\d+]/g, '');
    
    // Ensure it starts with either +234 or 0
    if (!cleaned.startsWith('+234') && !cleaned.startsWith('0') && cleaned.length > 0) {
      if (cleaned.startsWith('234')) {
        cleaned = '+' + cleaned;
      } else if (cleaned.length === 10) {
        cleaned = '0' + cleaned;
      } else {
        cleaned = '0' + cleaned;
      }
    }
    
    // Limit length
    if (cleaned.startsWith('+234') && cleaned.length > 14) {
      cleaned = cleaned.substring(0, 14);
    } else if (cleaned.startsWith('0') && cleaned.length > 11) {
      cleaned = cleaned.substring(0, 11);
    }
    
    setPhoneNumber(cleaned);
  };

  const handleSendVerification = async () => {
    if (!isValid) {
      Alert.alert('Invalid Number', 'Please enter a valid Nigerian phone number');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setVerificationSent(true);
      Alert.alert(
        'Verification Sent', 
        `A 6-digit code has been sent to ${formattedNumber} via SMS. Please check your messages.`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    const newInputs = [...otpInputs];
    newInputs[index] = text;
    setOtpInputs(newInputs);
    setOtp(newInputs.join(''));
    
    // Auto-focus next input
    if (text && index < 5) {
      // Focus next input (would need refs in real implementation)
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert('Incomplete Code', 'Please enter the complete 6-digit verification code');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      Alert.alert(
        'Verification Successful', 
        'Your phone number has been verified successfully!'
      );
    } catch (error) {
      Alert.alert('Verification Failed', 'Invalid code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = () => {
    setOtpInputs(['', '', '', '', '', '']);
    setOtp('');
    handleSendVerification();
  };

  if (verificationSent) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <ScreenHeader 
          title="Verify Phone Number"
          navigation={navigation}
        />

        <View style={styles.content}>
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="message-text" size={64} color="#00A651" />
          </View>

          {/* Title */}
          <Text style={styles.title}>Enter Verification Code</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit code to{'\n'}
            <Text style={styles.phoneText}>{formattedNumber}</Text>
          </Text>

          {/* Network Info */}
          {networkInfo && (
            <View style={styles.networkBadge}>
              <View style={[styles.networkDot, { backgroundColor: networkInfo.color }]} />
              <Text style={styles.networkText}>{networkInfo.network}</Text>
            </View>
          )}

          {/* OTP Input */}
          <View style={styles.otpContainer}>
            {otpInputs.map((value, index) => (
              <TextInput
                key={index}
                style={[
                  styles.otpInput,
                  value && styles.otpInputFilled
                ]}
                value={value}
                onChangeText={(text) => handleOtpChange(text, index)}
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
              />
            ))}
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[
              styles.verifyButton,
              otp.length === 6 ? styles.verifyButtonActive : styles.verifyButtonDisabled
            ]}
            onPress={handleVerifyOtp}
            disabled={otp.length !== 6 || isLoading}
          >
            {isLoading ? (
              <MaterialCommunityIcons name="loading" size={20} color="#FFFFFF" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify Phone Number</Text>
            )}
          </TouchableOpacity>

          {/* Resend Code */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            <TouchableOpacity onPress={handleResendCode}>
              <Text style={styles.resendLink}>Resend Code</Text>
            </TouchableOpacity>
          </View>

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <MaterialCommunityIcons name="information" size={16} color="#8E8E8E" />
            <Text style={styles.helpText}>
              Make sure your phone has network coverage and can receive SMS messages
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <ScreenHeader 
        title="Phone Verification"
        navigation={navigation}
      />

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="phone-check" size={64} color="#00A651" />
        </View>

        {/* Title */}
        <Text style={styles.title}>Verify Your Phone Number</Text>
        <Text style={styles.subtitle}>
          We'll send you a verification code to confirm your phone number and keep your account secure.
        </Text>

        {/* Phone Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Nigerian Phone Number</Text>
          <View style={styles.phoneInputContainer}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>🇳🇬 +234</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              placeholder="803 123 4567"
              placeholderTextColor="#8E8E8E"
              keyboardType="phone-pad"
              maxLength={14}
            />
            {isValid && (
              <MaterialCommunityIcons name="check-circle" size={20} color="#00A651" />
            )}
          </View>
          
          {/* Network Info */}
          {networkInfo && (
            <View style={styles.networkInfo}>
              <View style={[styles.networkDot, { backgroundColor: networkInfo.color }]} />
              <Text style={styles.networkText}>{networkInfo.network}</Text>
              <MaterialCommunityIcons name="signal" size={16} color="#8E8E8E" />
            </View>
          )}
          
          {/* Format Display */}
          {formattedNumber && (
            <Text style={styles.formattedText}>Formatted: {formattedNumber}</Text>
          )}
        </View>

        {/* Supported Networks */}
        <View style={styles.networksContainer}>
          <Text style={styles.networksTitle}>Supported Networks</Text>
          <View style={styles.networksList}>
            {['MTN', 'Airtel', 'Glo', '9mobile'].map((network) => {
              const networkData = NIGERIAN_PHONE_PREFIXES.find(p => p.network === network);
              return (
                <View key={network} style={styles.networkChip}>
                  <View style={[styles.networkDot, { backgroundColor: networkData?.color || '#8E8E8E' }]} />
                  <Text style={styles.networkChipText}>{network}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Send Verification Button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            isValid ? styles.sendButtonActive : styles.sendButtonDisabled
          ]}
          onPress={handleSendVerification}
          disabled={!isValid || isLoading}
        >
          {isLoading ? (
            <MaterialCommunityIcons name="loading" size={20} color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="message-text" size={20} color="#FFFFFF" />
              <Text style={styles.sendButtonText}>Send Verification Code</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <MaterialCommunityIcons name="shield-check" size={16} color="#00A651" />
          <Text style={styles.securityText}>
            Your phone number is encrypted and will only be used for account verification and security purposes.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2C2C2C',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E8E',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  phoneText: {
    fontWeight: '600',
    color: '#00A651',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  countryCode: {
    marginRight: 12,
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C2C2C',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#2C2C2C',
    marginRight: 8,
  },
  networkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  networkText: {
    fontSize: 14,
    color: '#8E8E8E',
    marginRight: 4,
  },
  formattedText: {
    fontSize: 14,
    color: '#00A651',
    marginTop: 4,
  },
  networksContainer: {
    marginBottom: 32,
  },
  networksTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 8,
  },
  networksList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  networkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  networkChipText: {
    fontSize: 12,
    color: '#2C2C2C',
    marginLeft: 4,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sendButtonActive: {
    backgroundColor: '#00A651',
  },
  sendButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#00A651',
    lineHeight: 16,
    marginLeft: 8,
    flex: 1,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: 'center',
    marginBottom: 24,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 32,
  },
  otpInput: {
    width: 44,
    height: 56,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    fontSize: 20,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  otpInputFilled: {
    borderColor: '#00A651',
    backgroundColor: '#E8F5E8',
  },
  verifyButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  verifyButtonActive: {
    backgroundColor: '#00A651',
  },
  verifyButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resendText: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  resendLink: {
    fontSize: 14,
    color: '#00A651',
    fontWeight: '600',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#8E8E8E',
    lineHeight: 16,
    marginLeft: 8,
    flex: 1,
  },
});