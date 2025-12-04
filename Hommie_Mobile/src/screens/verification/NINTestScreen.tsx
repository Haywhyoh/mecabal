import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { NINVerificationService, NINVerificationResponse, VerificationStatusResponse, TrustScoreResponse } from '../../services/ninVerification';

export default function NINTestScreen() {
  const navigation = useNavigation();
  const { user, refreshUser } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatusResponse | null>(null);
  const [trustScore, setTrustScore] = useState<TrustScoreResponse | null>(null);

  const testNINValidation = () => {
    const testNINs = [
      '12345678901', // Valid
      '1234567890',  // Invalid - too short
      '123456789012', // Invalid - too long
      '1234567890a',  // Invalid - contains letter
    ];

    testNINs.forEach(nin => {
      const isValid = NINVerificationService.validateNIN(nin);
      const formatted = NINVerificationService.formatNIN(nin);
      Alert.alert(
        'NIN Validation Test',
        `NIN: ${nin}\nValid: ${isValid}\nFormatted: ${formatted}`
      );
    });
  };

  const testNINVerification = async () => {
    try {
      setIsLoading(true);
      const result = await NINVerificationService.verifyNIN('12345678901');
      
      if (result.success) {
        Alert.alert('Success', 'NIN verification test completed');
      } else {
        Alert.alert('Error', result.error || 'NIN verification failed');
      }
    } catch (error) {
      Alert.alert('Error', 'NIN verification test failed');
    } finally {
      setIsLoading(false);
    }
  };

  const testGetVerificationStatus = async () => {
    try {
      setIsLoading(true);
      const result = await NINVerificationService.getVerificationStatus();
      
      if (result.success && result.data) {
        setVerificationStatus(result.data);
        Alert.alert(
          'Verification Status',
          `Status: ${result.data.status}\nNIN: ${result.data.ninNumber || 'N/A'}\nVerified At: ${result.data.verifiedAt || 'N/A'}`
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to get verification status');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get verification status');
    } finally {
      setIsLoading(false);
    }
  };

  const testGetTrustScore = async () => {
    try {
      setIsLoading(true);
      const result = await NINVerificationService.getTrustScore();
      
      if (result.success && result.data) {
        setTrustScore(result.data);
        Alert.alert(
          'Trust Score',
          `Score: ${result.data.trustScore}\nPhone Verified: ${result.data.phoneVerified}\nIdentity Verified: ${result.data.identityVerified}\nLevel: ${result.data.verificationLevel}`
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to get trust score');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get trust score');
    } finally {
      setIsLoading(false);
    }
  };

  const testSkipVerification = async () => {
    try {
      setIsLoading(true);
      const result = await NINVerificationService.skipVerification();
      
      if (result.success) {
        Alert.alert('Success', 'Verification skipped successfully');
      } else {
        Alert.alert('Error', result.error || 'Failed to skip verification');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to skip verification');
    } finally {
      setIsLoading(false);
    }
  };

  const testDocumentUpload = async () => {
    Alert.alert(
      'Document Upload Test',
      'This would normally open the image picker. For testing, we\'ll simulate the upload.',
      [
        {
          text: 'Simulate Upload',
          onPress: async () => {
            try {
              setIsLoading(true);
              // Simulate document upload
              const result = await NINVerificationService.uploadDocument('nin_card', 'test-uri');
              
              if (result.success) {
                Alert.alert('Success', 'Document upload test completed');
              } else {
                Alert.alert('Error', result.error || 'Document upload failed');
              }
            } catch (error) {
              Alert.alert('Error', 'Document upload test failed');
            } finally {
              setIsLoading(false);
            }
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#2C2C2C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NIN Verification Test</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* User Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current User</Text>
          <View style={styles.userInfo}>
            <Text style={styles.userText}>Name: {user?.firstName} {user?.lastName}</Text>
            <Text style={styles.userText}>Email: {user?.email}</Text>
            <Text style={styles.userText}>Verified: {user?.isVerified ? 'Yes' : 'No'}</Text>
            <Text style={styles.userText}>Trust Score: {user?.trustScore || 'N/A'}</Text>
          </View>
        </View>

        {/* Test Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Functions</Text>
          
          <TouchableOpacity 
            style={[styles.testButton, isLoading && styles.testButtonDisabled]} 
            onPress={testNINValidation}
            disabled={isLoading}
          >
            <MaterialCommunityIcons name="check-circle" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Test NIN Validation</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.testButton, isLoading && styles.testButtonDisabled]} 
            onPress={testNINVerification}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialCommunityIcons name="shield-check" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.testButtonText}>Test NIN Verification</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.testButton, isLoading && styles.testButtonDisabled]} 
            onPress={testGetVerificationStatus}
            disabled={isLoading}
          >
            <MaterialCommunityIcons name="information" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Get Verification Status</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.testButton, isLoading && styles.testButtonDisabled]} 
            onPress={testGetTrustScore}
            disabled={isLoading}
          >
            <MaterialCommunityIcons name="star" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Get Trust Score</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.testButton, isLoading && styles.testButtonDisabled]} 
            onPress={testSkipVerification}
            disabled={isLoading}
          >
            <MaterialCommunityIcons name="skip-next" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Skip Verification</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.testButton, isLoading && styles.testButtonDisabled]} 
            onPress={testDocumentUpload}
            disabled={isLoading}
          >
            <MaterialCommunityIcons name="upload" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Test Document Upload</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.testButton} 
            onPress={() => navigation.navigate('NINVerification' as never)}
          >
            <MaterialCommunityIcons name="card-account-details" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Open NIN Verification Screen</Text>
          </TouchableOpacity>
        </View>

        {/* Status Display */}
        {verificationStatus && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Verification Status</Text>
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>Status: {verificationStatus.status}</Text>
              <Text style={styles.statusText}>NIN: {verificationStatus.ninNumber || 'N/A'}</Text>
              <Text style={styles.statusText}>Verified At: {verificationStatus.verifiedAt || 'N/A'}</Text>
              {verificationStatus.failureReason && (
                <Text style={styles.statusText}>Failure Reason: {verificationStatus.failureReason}</Text>
              )}
            </View>
          </View>
        )}

        {/* Trust Score Display */}
        {trustScore && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trust Score</Text>
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>Score: {trustScore.trustScore}</Text>
              <Text style={styles.statusText}>Phone Verified: {trustScore.phoneVerified ? 'Yes' : 'No'}</Text>
              <Text style={styles.statusText}>Identity Verified: {trustScore.identityVerified ? 'Yes' : 'No'}</Text>
              <Text style={styles.statusText}>Address Verified: {trustScore.addressVerified ? 'Yes' : 'No'}</Text>
              <Text style={styles.statusText}>Level: {trustScore.verificationLevel}</Text>
              {trustScore.verificationBadge && (
                <Text style={styles.statusText}>Badge: {trustScore.verificationBadge}</Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: 16,
  },
  userInfo: {
    marginTop: 8,
  },
  userText: {
    fontSize: 14,
    color: '#2C2C2C',
    marginBottom: 4,
  },
  testButton: {
    backgroundColor: '#00A651',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  testButtonDisabled: {
    backgroundColor: '#8E8E8E',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusContainer: {
    marginTop: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#2C2C2C',
    marginBottom: 4,
  },
});

