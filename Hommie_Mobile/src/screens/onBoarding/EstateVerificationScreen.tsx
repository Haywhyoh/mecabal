// Estate Verification Screen
// Verification process for gated estates requiring verification

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { locationApi } from '../../services/api/locationApi';
import {
  Neighborhood,
  VerificationStatus,
  PhotoVerificationRequest,
  DocumentVerificationRequest,
  AdminVerificationRequest,
  VerificationRequestResponse,
} from '../../types/location.types';

const { width: screenWidth } = Dimensions.get('window');

// MeCabal brand colors
const MECABAL_GREEN = '#00A651';
const MECABAL_GREEN_LIGHT = '#E8F5E8';

interface EstateVerificationScreenProps {
  navigation: any;
  route: {
    params: {
      neighborhood: Neighborhood;
    };
  };
}

type VerificationMethod = 'document' | 'admin' | 'photo' | 'skip';

interface VerificationOption {
  id: VerificationMethod;
  title: string;
  description: string;
  icon: string;
  color: string;
  estimatedTime: string;
  requirements: string[];
}

const VERIFICATION_OPTIONS: VerificationOption[] = [
  {
    id: 'document',
    title: 'Upload Proof of Residence',
    description: 'Upload utility bill, bank statement, or official document',
    icon: 'document-text',
    color: '#007AFF',
    estimatedTime: '1-2 days',
    requirements: [
      'Document must show your name and address',
      'Document must be recent (within 3 months)',
      'Clear, readable image required',
    ],
  },
  {
    id: 'admin',
    title: 'Request from Estate Admin',
    description: 'Get verified by your estate manager or admin',
    icon: 'person',
    color: '#34C759',
    estimatedTime: '1-3 days',
    requirements: [
      'Estate admin must approve your request',
      'Admin will verify your residence',
      'You may need to provide additional info',
    ],
  },
  {
    id: 'photo',
    title: 'Take Photo at Estate',
    description: 'Take a photo at a recognizable location in the estate',
    icon: 'camera',
    color: '#FF9500',
    estimatedTime: 'Same day',
    requirements: [
      'Photo must be taken at the estate',
      'Include recognizable landmarks',
      'GPS location will be verified',
    ],
  },
];

export default function EstateVerificationScreen({ navigation, route }: EstateVerificationScreenProps) {
  const { neighborhood } = route.params;

  // Local state
  const [selectedMethod, setSelectedMethod] = useState<VerificationMethod | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('UNVERIFIED');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [adminMessage, setAdminMessage] = useState('');
  const [showRequirements, setShowRequirements] = useState(false);

  // Initialize component
  useEffect(() => {
    // Check if user already has verification status
    checkExistingVerification();
  }, []);

  const checkExistingVerification = async () => {
    try {
      // In a real app, this would check the user's verification status
      // For now, we'll assume unverified
      setVerificationStatus('UNVERIFIED');
    } catch (error) {
      console.error('Error checking verification status:', error);
    }
  };

  const handleMethodSelect = (method: VerificationMethod) => {
    setSelectedMethod(method);
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleDocumentUpload = async () => {
    try {
      // Request camera roll permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to upload documents.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled) {
        const imageUris = result.assets.map(asset => asset.uri);
        setUploadedImages(imageUris);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images. Please try again.');
    }
  };

  const handlePhotoCapture = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow camera access to take photos.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        setUploadedImages([imageUri]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleSubmitVerification = async () => {
    if (!selectedMethod) return;

    try {
      setIsSubmitting(true);

      let response: VerificationRequestResponse;

      switch (selectedMethod) {
        case 'document':
          if (uploadedImages.length === 0) {
            Alert.alert('No Documents', 'Please upload at least one document.');
            return;
          }
          response = await locationApi.submitDocumentVerification(neighborhood.id, {
            documentType: 'UTILITY_BILL',
            documents: uploadedImages.map(uri => ({ uri } as any)),
          });
          break;

        case 'admin':
          response = await locationApi.submitAdminVerification(neighborhood.id, {
            adminUserId: neighborhood.adminUserId || 'default-admin',
            message: adminMessage,
          });
          break;

        case 'photo':
          if (uploadedImages.length === 0) {
            Alert.alert('No Photos', 'Please take at least one photo.');
            return;
          }
          response = await locationApi.submitPhotoVerification(neighborhood.id, {
            latitude: neighborhood.coordinates?.latitude || 0,
            longitude: neighborhood.coordinates?.longitude || 0,
            photos: uploadedImages.map(uri => ({ uri } as any)),
          });
          break;

        default:
          throw new Error('Invalid verification method');
      }

      setVerificationStatus(response.status);
      
      // Haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        'Verification Submitted',
        response.message,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('ProfileSetupScreen'),
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting verification:', error);
      Alert.alert('Error', 'Failed to submit verification. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipVerification = () => {
    Alert.alert(
      'Skip Verification',
      'You can continue without verification, but you\'ll have limited access to estate features until verified.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip Anyway',
          style: 'destructive',
          onPress: () => navigation.navigate('ProfileSetupScreen'),
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Ionicons name="arrow-back" size={24} color="#007AFF" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Estate Verification</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderEstateInfo = () => (
    <View style={styles.estateInfoCard}>
      <View style={styles.estateHeader}>
        <Ionicons name="home" size={32} color={MECABAL_GREEN} />
        <View style={styles.estateDetails}>
          <Text style={styles.estateName}>{neighborhood.name}</Text>
          <Text style={styles.estateType}>{neighborhood.type} • Gated Community</Text>
        </View>
        <Ionicons name="lock-closed" size={20} color="#FF3B30" />
      </View>
      <Text style={styles.estateDescription}>
        This estate requires verification to ensure you're a legitimate resident. 
        Choose a verification method below.
      </Text>
    </View>
  );

  const renderVerificationOptions = () => (
    <View style={styles.optionsContainer}>
      <Text style={styles.optionsTitle}>Choose Verification Method</Text>
      <Text style={styles.optionsSubtitle}>
        Select the method that works best for you
      </Text>

      {VERIFICATION_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option.id}
          style={[
            styles.optionCard,
            selectedMethod === option.id && styles.optionCardSelected,
          ]}
          onPress={() => handleMethodSelect(option.id)}
          accessibilityLabel={`Select ${option.title} verification method`}
          accessibilityRole="button"
        >
          <View style={styles.optionHeader}>
            <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
              <Ionicons name={option.icon as any} size={24} color="white" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
              <Text style={styles.optionTime}>Estimated time: {option.estimatedTime}</Text>
            </View>
            <View style={styles.optionSelector}>
              {selectedMethod === option.id && (
                <Ionicons name="checkmark-circle" size={24} color={MECABAL_GREEN} />
              )}
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMethodDetails = () => {
    if (!selectedMethod) return null;

    const option = VERIFICATION_OPTIONS.find(opt => opt.id === selectedMethod);
    if (!option) return null;

    return (
      <View style={styles.methodDetailsContainer}>
        <Text style={styles.methodDetailsTitle}>Requirements</Text>
        <View style={styles.requirementsList}>
          {option.requirements.map((requirement, index) => (
            <View key={index} style={styles.requirementItem}>
              <Ionicons name="checkmark" size={16} color={MECABAL_GREEN} />
              <Text style={styles.requirementText}>{requirement}</Text>
            </View>
          ))}
        </View>

        {selectedMethod === 'document' && (
          <View style={styles.uploadContainer}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleDocumentUpload}
              accessibilityLabel="Upload documents"
              accessibilityRole="button"
            >
              <Ionicons name="cloud-upload" size={20} color="#007AFF" />
              <Text style={styles.uploadButtonText}>
                {uploadedImages.length > 0 ? 'Add More Documents' : 'Upload Documents'}
              </Text>
            </TouchableOpacity>
            {uploadedImages.length > 0 && (
              <Text style={styles.uploadStatus}>
                {uploadedImages.length} document(s) selected
              </Text>
            )}
          </View>
        )}

        {selectedMethod === 'photo' && (
          <View style={styles.uploadContainer}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handlePhotoCapture}
              accessibilityLabel="Take photo at estate"
              accessibilityRole="button"
            >
              <Ionicons name="camera" size={20} color="#007AFF" />
              <Text style={styles.uploadButtonText}>
                {uploadedImages.length > 0 ? 'Take Another Photo' : 'Take Photo at Estate'}
              </Text>
            </TouchableOpacity>
            {uploadedImages.length > 0 && (
              <Text style={styles.uploadStatus}>
                {uploadedImages.length} photo(s) taken
              </Text>
            )}
          </View>
        )}

        {selectedMethod === 'admin' && (
          <View style={styles.adminContainer}>
            <Text style={styles.adminLabel}>Message to Estate Admin (Optional)</Text>
            <Text style={styles.adminDescription}>
              Add a message to help the admin verify your residence
            </Text>
            <Text style={styles.adminNote}>
              Admin: {neighborhood.adminUserId || 'Estate Manager'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderActionButtons = () => (
    <View style={styles.actionButtonsContainer}>
      <TouchableOpacity
        style={[
          styles.submitButton,
          (!selectedMethod || isSubmitting) && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmitVerification}
        disabled={!selectedMethod || isSubmitting}
        accessibilityLabel="Submit verification"
        accessibilityRole="button"
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            <Text style={styles.submitButtonText}>Submit Verification</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkipVerification}
        accessibilityLabel="Skip verification"
        accessibilityRole="button"
      >
        <Text style={styles.skipButtonText}>Skip for Now</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderEstateInfo()}
        {renderVerificationOptions()}
        {renderMethodDetails()}
      </ScrollView>
      {renderActionButtons()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  estateInfoCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  estateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  estateDetails: {
    flex: 1,
    marginLeft: 12,
  },
  estateName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  estateType: {
    fontSize: 14,
    color: '#8E8E93',
  },
  estateDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  optionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  optionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  optionsSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 20,
  },
  optionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionCardSelected: {
    borderColor: MECABAL_GREEN,
    backgroundColor: MECABAL_GREEN_LIGHT,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  optionTime: {
    fontSize: 12,
    color: MECABAL_GREEN,
    fontWeight: '500',
  },
  optionSelector: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodDetailsContainer: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  methodDetailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  requirementsList: {
    marginBottom: 16,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#000',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  uploadContainer: {
    marginTop: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  uploadStatus: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
  adminContainer: {
    marginTop: 16,
  },
  adminLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  adminDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  adminNote: {
    fontSize: 12,
    color: MECABAL_GREEN,
    fontStyle: 'italic',
  },
  actionButtonsContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MECABAL_GREEN,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: 'white',
    marginRight: 8,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 17,
    color: '#8E8E93',
  },
});







