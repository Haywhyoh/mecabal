import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Alert, Modal, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { NINVerificationService, NINVerificationResponse } from '../services/ninVerification';

interface NINData {
  nin: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  stateOfOrigin: string;
  isVerified: boolean;
}

export default function NINVerificationScreen() {
  const navigation = useNavigation();
  const { refreshUser } = useAuth();

  const [nin, setNin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'input' | 'preview' | 'success'>('input');
  const [ninData, setNinData] = useState<NINVerificationResponse | null>(null);

  const validateNIN = (ninNumber: string) => {
    return NINVerificationService.validateNIN(ninNumber);
  };

  const formatNIN = (ninNumber: string) => {
    return NINVerificationService.formatNIN(ninNumber);
  };

  const handleNINChange = (text: string) => {
    const cleanText = text.replace(/[^\d]/g, '');
    if (cleanText.length <= 11) {
      setNin(cleanText);
    }
  };

  const handleVerifyNIN = async () => {
    if (!validateNIN(nin)) {
      Alert.alert('Invalid NIN', 'Please enter a valid 11-digit National Identification Number');
      return;
    }

    setIsLoading(true);

    try {
      // Call real backend API
      const result = await NINVerificationService.verifyNIN(nin);

      if (result.success && result.data) {
        // Verification successful - show preview
        setNinData(result.data);
        setVerificationStep('preview');
      } else {
        // Verification failed
        Alert.alert(
          'Verification Failed',
          result.error || 'Unable to verify NIN. Please check your number and try again.'
        );
      }
    } catch (error) {
      console.error('NIN verification error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmVerification = async () => {
    try {
      // Refresh user data to get updated verification status
      await refreshUser();

      // Show success screen
      setVerificationStep('success');

      // Optionally show alert
      Alert.alert(
        'NIN Verified Successfully',
        'Your National ID has been verified and linked to your profile. This helps build trust in the community.'
      );
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const handleSkipVerification = () => {
    Alert.alert(
      'Skip NIN Verification?',
      'You can verify your NIN later in your profile settings. Some community features may be limited without verification.',
      [
        {
          text: 'Continue Without NIN',
          style: 'destructive',
          onPress: async () => {
            // Mark as skipped in backend
            await NINVerificationService.skipVerification();
            navigation.goBack();
          }
        },
        { text: 'Verify Now', style: 'cancel' }
      ]
    );
  };

  const InfoModal = () => (
    <Modal visible={showInfoModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowInfoModal(false)}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>About NIN Verification</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.modalContent}>
          <View style={styles.infoSection}>
            <MaterialCommunityIcons name="shield-check" size={24} color="#00A651" />
            <Text style={styles.infoTitle}>Why verify your NIN?</Text>
            <Text style={styles.infoText}>
              • Builds trust with your neighbors{'\n'}
              • Unlocks additional community features{'\n'}
              • Helps prevent fraud and fake accounts{'\n'}
              • Required for some local business features
            </Text>
          </View>

          <View style={styles.infoSection}>
            <MaterialCommunityIcons name="lock" size={24} color="#0066CC" />
            <Text style={styles.infoTitle}>Your privacy is protected</Text>
            <Text style={styles.infoText}>
              • Your NIN is encrypted and stored securely{'\n'}
              • Only basic info is shared for verification{'\n'}
              • You control what appears on your profile{'\n'}
              • Full NIN number is never displayed publicly
            </Text>
          </View>

          <View style={styles.infoSection}>
            <MaterialCommunityIcons name="help-circle" size={24} color="#FF6B35" />
            <Text style={styles.infoTitle}>Optional verification</Text>
            <Text style={styles.infoText}>
              NIN verification is completely optional. You can skip this step and verify later in your profile settings if you change your mind.
            </Text>
          </View>

          <View style={styles.supportSection}>
            <Text style={styles.supportTitle}>Need help finding your NIN?</Text>
            <Text style={styles.supportText}>
              Your NIN is printed on your national ID card or can be retrieved through NIMC services.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );

  if (verificationStep === 'success') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#2C2C2C" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>NIN Verification</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.successContainer}>
            <MaterialCommunityIcons name="check-circle" size={80} color="#00A651" />
            <Text style={styles.successTitle}>NIN Verified Successfully!</Text>
            <Text style={styles.successSubtitle}>
              Your National ID has been verified and your community trust score has been updated.
            </Text>

            <View style={styles.benefitsCard}>
              <Text style={styles.benefitsTitle}>You've unlocked:</Text>
              <View style={styles.benefitItem}>
                <MaterialCommunityIcons name="star" size={16} color="#FFC107" />
                <Text style={styles.benefitText}>Verified Resident badge</Text>
              </View>
              <View style={styles.benefitItem}>
                <MaterialCommunityIcons name="shield-check" size={16} color="#00A651" />
                <Text style={styles.benefitText}>Enhanced profile trust</Text>
              </View>
              <View style={styles.benefitItem}>
                <MaterialCommunityIcons name="store" size={16} color="#228B22" />
                <Text style={styles.benefitText}>Local business features</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.continueButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.continueButtonText}>Continue to Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (verificationStep === 'preview' && ninData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setVerificationStep('input')}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#2C2C2C" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirm Details</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="account-check" size={64} color="#00A651" />
          </View>

          <Text style={styles.title}>Verify Your Information</Text>
          <Text style={styles.subtitle}>
            Please confirm that the information below matches your records.
          </Text>

          <View style={styles.dataCard}>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Full Name</Text>
              <Text style={styles.dataValue}>{ninData.firstName} {ninData.lastName}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Date of Birth</Text>
              <Text style={styles.dataValue}>{ninData.dateOfBirth}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Gender</Text>
              <Text style={styles.dataValue}>{ninData.gender}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>State of Origin</Text>
              <Text style={styles.dataValue}>{ninData.stateOfOrigin}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>NIN</Text>
              <Text style={styles.dataValue}>{formatNIN(ninData.ninNumber)}</Text>
            </View>
          </View>

          <View style={styles.privacyNotice}>
            <MaterialCommunityIcons name="information" size={16} color="#0066CC" />
            <Text style={styles.privacyText}>
              Only your name and verification status will be visible to neighbors. Your NIN and other sensitive information remain private.
            </Text>
          </View>

          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmVerification}>
            <Text style={styles.confirmButtonText}>Confirm and Verify</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.editButton} onPress={() => setVerificationStep('input')}>
            <Text style={styles.editButtonText}>Edit NIN</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#2C2C2C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NIN Verification</Text>
        <TouchableOpacity onPress={() => setShowInfoModal(true)}>
          <MaterialCommunityIcons name="information" size={24} color="#8E8E8E" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="card-account-details" size={64} color="#00A651" />
        </View>

        {/* Title */}
        <Text style={styles.title}>Verify Your National ID</Text>
        <Text style={styles.subtitle}>
          Optional: Link your NIN to build trust and unlock additional community features. Your information is kept private and secure.
        </Text>

        {/* NIN Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>National Identification Number (NIN)</Text>
          <View style={styles.ninInputContainer}>
            <MaterialCommunityIcons name="card-account-details-outline" size={20} color="#8E8E8E" />
            <TextInput
              style={styles.ninInput}
              value={formatNIN(nin)}
              onChangeText={handleNINChange}
              placeholder="1234 567 8901"
              placeholderTextColor="#8E8E8E"
              keyboardType="numeric"
              maxLength={13} // Includes spaces
            />
            {validateNIN(nin) && (
              <MaterialCommunityIcons name="check-circle" size={20} color="#00A651" />
            )}
          </View>
          
          <Text style={styles.inputHelp}>
            Enter your 11-digit National Identification Number
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>Benefits of NIN Verification</Text>
          
          <View style={styles.benefitItem}>
            <MaterialCommunityIcons name="shield-check" size={20} color="#00A651" />
            <Text style={styles.benefitText}>Verified resident badge on your profile</Text>
          </View>
          
          <View style={styles.benefitItem}>
            <MaterialCommunityIcons name="account-heart" size={20} color="#FF69B4" />
            <Text style={styles.benefitText}>Increased trust from neighbors</Text>
          </View>
          
          <View style={styles.benefitItem}>
            <MaterialCommunityIcons name="store" size={20} color="#228B22" />
            <Text style={styles.benefitText}>Access to local business features</Text>
          </View>
          
          <View style={styles.benefitItem}>
            <MaterialCommunityIcons name="vote" size={20} color="#7B68EE" />
            <Text style={styles.benefitText}>Participate in community decisions</Text>
          </View>
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[
            styles.verifyButton,
            validateNIN(nin) ? styles.verifyButtonActive : styles.verifyButtonDisabled
          ]}
          onPress={handleVerifyNIN}
          disabled={!validateNIN(nin) || isLoading}
        >
          {isLoading ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.verifyButtonText}>Verifying...</Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="shield-check" size={20} color="#FFFFFF" />
              <Text style={styles.verifyButtonText}>Verify NIN</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Skip Option */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkipVerification}>
          <Text style={styles.skipButtonText}>Skip for Now</Text>
        </TouchableOpacity>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <MaterialCommunityIcons name="lock" size={16} color="#00A651" />
          <Text style={styles.securityText}>
            Your NIN is encrypted and stored securely. We only use it for verification purposes and never share it publicly.
          </Text>
        </View>
      </View>

      <InfoModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    textAlign: 'center',
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
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 8,
  },
  ninInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ninInput: {
    flex: 1,
    fontSize: 16,
    color: '#2C2C2C',
    marginLeft: 12,
    marginRight: 8,
  },
  inputHelp: {
    fontSize: 12,
    color: '#8E8E8E',
    marginTop: 4,
  },
  benefitsContainer: {
    marginBottom: 32,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#2C2C2C',
    marginLeft: 12,
    flex: 1,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
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
    marginLeft: 8,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#8E8E8E',
    fontWeight: '500',
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
  dataCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  dataLabel: {
    fontSize: 14,
    color: '#8E8E8E',
    fontWeight: '500',
  },
  dataValue: {
    fontSize: 14,
    color: '#2C2C2C',
    fontWeight: '600',
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  privacyText: {
    fontSize: 12,
    color: '#0066CC',
    lineHeight: 16,
    marginLeft: 8,
    flex: 1,
  },
  confirmButton: {
    backgroundColor: '#00A651',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  editButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  editButtonText: {
    fontSize: 16,
    color: '#8E8E8E',
    fontWeight: '500',
  },
  successContainer: {
    alignItems: 'center',
    paddingTop: 48,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2C2C2C',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#8E8E8E',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  benefitsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    width: '100%',
  },
  continueButton: {
    backgroundColor: '#00A651',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  modalHeader: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  closeText: {
    fontSize: 16,
    color: '#8E8E8E',
    minWidth: 60,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    textAlign: 'center',
  },
  placeholder: {
    minWidth: 60,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  infoSection: {
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginTop: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E8E',
    lineHeight: 20,
  },
  supportSection: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  supportTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 4,
  },
  supportText: {
    fontSize: 12,
    color: '#8E8E8E',
    lineHeight: 16,
  },
});