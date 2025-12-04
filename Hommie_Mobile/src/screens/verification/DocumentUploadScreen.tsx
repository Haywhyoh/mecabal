import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Dimensions,
  TextInput,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { verificationService } from '../services/verificationService';
import { useProfile } from '../contexts/ProfileContext';

const { width } = Dimensions.get('window');

// Document types supported by the verification system
const DOCUMENT_TYPES = [
  {
    id: 'nin_card',
    name: 'NIN Card',
    description: 'National Identification Number Card',
    icon: 'card-account-details',
    color: '#00A651',
  },
  {
    id: 'drivers_license',
    name: 'Driver\'s License',
    description: 'Valid driver\'s license',
    icon: 'car',
    color: '#2196F3',
  },
  {
    id: 'voters_card',
    name: 'Voter\'s Card',
    description: 'Permanent Voter\'s Card (PVC)',
    icon: 'vote',
    color: '#FF9800',
  },
  {
    id: 'passport',
    name: 'Passport',
    description: 'International passport',
    icon: 'passport',
    color: '#9C27B0',
  },
  {
    id: 'utility_bill',
    name: 'Utility Bill',
    description: 'Recent utility bill (PHCN, Water, etc.)',
    icon: 'file-document',
    color: '#607D8B',
  },
];

interface UploadedDocument {
  id: string;
  documentType: string;
  documentUrl: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  uploadedAt: string;
  documentNumber?: string;
}

export default function DocumentUploadScreen() {
  const navigation = useNavigation();
  const { refreshProfile, refreshTrustScore } = useProfile();

  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [documentNumber, setDocumentNumber] = useState('');

  // Load existing documents on mount
  useEffect(() => {
    loadUserDocuments();
  }, []);

  const loadUserDocuments = async () => {
    try {
      setIsLoading(true);
      const documents = await verificationService.getUserDocuments();
      setUploadedDocuments(documents);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Access Required',
        'MeCabal needs camera access to capture your verification documents. You can enable this in Settings > MeCabal > Camera.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => {} }
        ]
      );
      return false;
    }
    return true;
  };

  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Photo Library Access Required',
        'MeCabal needs access to your photo library to select verification documents.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => {} }
        ]
      );
      return false;
    }
    return true;
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Select Document Source',
      'Choose how you want to capture your document',
      [
        {
          text: 'Camera',
          onPress: () => openCamera(),
        },
        {
          text: 'Photo Library',
          onPress: () => openImageLibrary(),
        },
        {
          text: 'Document Picker',
          onPress: () => openDocumentPicker(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const openCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadedImage(result.assets[0].uri);
        setShowImagePreview(true);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const openImageLibrary = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadedImage(result.assets[0].uri);
        setShowImagePreview(true);
      }
    } catch (error) {
      console.error('Image library error:', error);
      Alert.alert('Error', 'Failed to open photo library');
    }
  };

  const openDocumentPicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadedImage(result.assets[0].uri);
        setShowImagePreview(true);
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to open document picker');
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedDocumentType || !uploadedImage) {
      Alert.alert('Error', 'Please select a document type and capture an image');
      return;
    }

    try {
      setUploading(true);

      const file = {
        uri: uploadedImage,
        type: 'image/jpeg',
        name: `${selectedDocumentType}_${Date.now()}.jpg`,
      };

      const result = await verificationService.uploadDocument(
        selectedDocumentType as any,
        file,
        documentNumber || undefined
      );

      Alert.alert(
        'Document Uploaded',
        'Your document has been uploaded successfully and is being reviewed.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setSelectedDocumentType(null);
              setUploadedImage(null);
              setDocumentNumber('');
              setShowImagePreview(false);
              
              // Refresh documents list
              loadUserDocuments();
              
              // Refresh profile data
              refreshProfile();
              refreshTrustScore();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await verificationService.deleteDocument(documentId);
              loadUserDocuments();
              Alert.alert('Success', 'Document deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete document');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return '#00A651';
      case 'rejected':
        return '#E74C3C';
      case 'pending':
      default:
        return '#FF9800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return 'check-circle';
      case 'rejected':
        return 'close-circle';
      case 'pending':
      default:
        return 'clock';
    }
  };

  const renderDocumentTypeSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Select Document Type</Text>
      <View style={styles.documentTypesGrid}>
        {DOCUMENT_TYPES.map((docType) => (
          <TouchableOpacity
            key={docType.id}
            style={[
              styles.documentTypeCard,
              selectedDocumentType === docType.id && styles.documentTypeCardSelected,
            ]}
            onPress={() => setSelectedDocumentType(docType.id)}
          >
            <MaterialCommunityIcons
              name={docType.icon as any}
              size={32}
              color={selectedDocumentType === docType.id ? '#FFFFFF' : docType.color}
            />
            <Text
              style={[
                styles.documentTypeName,
                selectedDocumentType === docType.id && styles.documentTypeNameSelected,
              ]}
            >
              {docType.name}
            </Text>
            <Text
              style={[
                styles.documentTypeDescription,
                selectedDocumentType === docType.id && styles.documentTypeDescriptionSelected,
              ]}
            >
              {docType.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderImageCapture = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Capture Document</Text>
      
      {uploadedImage ? (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: uploadedImage }} style={styles.imagePreview} />
          <TouchableOpacity
            style={styles.changeImageButton}
            onPress={() => setShowImagePreview(true)}
          >
            <MaterialCommunityIcons name="camera" size={20} color="#FFFFFF" />
            <Text style={styles.changeImageButtonText}>Change Image</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.captureButton} onPress={showImagePickerOptions}>
          <MaterialCommunityIcons name="camera-plus" size={48} color="#00A651" />
          <Text style={styles.captureButtonText}>Capture Document</Text>
          <Text style={styles.captureButtonSubtext}>
            Tap to take a photo or select from gallery
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderDocumentNumber = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Document Number (Optional)</Text>
      <Text style={styles.inputLabel}>
        Enter the document number if available (e.g., NIN number, license number)
      </Text>
      <View style={styles.inputContainer}>
        <MaterialCommunityIcons name="card-text" size={20} color="#8E8E8E" />
        <TextInput
          style={styles.textInput}
          placeholder="Enter document number"
          value={documentNumber}
          onChangeText={setDocumentNumber}
          autoCapitalize="characters"
        />
      </View>
    </View>
  );

  const renderUploadedDocuments = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Uploaded Documents</Text>
        <TouchableOpacity onPress={loadUserDocuments}>
          <MaterialCommunityIcons name="refresh" size={24} color="#00A651" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="small" color="#00A651" />
      ) : uploadedDocuments.length === 0 ? (
        <Text style={styles.emptyText}>No documents uploaded yet</Text>
      ) : (
        uploadedDocuments.map((doc) => {
          const docType = DOCUMENT_TYPES.find(dt => dt.id === doc.documentType);
          return (
            <View key={doc.id} style={styles.documentItem}>
              <View style={styles.documentInfo}>
                <MaterialCommunityIcons
                  name={docType?.icon as any || 'file-document'}
                  size={24}
                  color={docType?.color || '#8E8E8E'}
                />
                <View style={styles.documentDetails}>
                  <Text style={styles.documentName}>
                    {docType?.name || doc.documentType}
                  </Text>
                  <Text style={styles.documentDate}>
                    Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                  </Text>
                  <View style={styles.statusContainer}>
                    <MaterialCommunityIcons
                      name={getStatusIcon(doc.verificationStatus)}
                      size={16}
                      color={getStatusColor(doc.verificationStatus)}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(doc.verificationStatus) },
                      ]}
                    >
                      {doc.verificationStatus.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteDocument(doc.id)}
              >
                <MaterialCommunityIcons name="delete" size={20} color="#E74C3C" />
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </View>
  );

  const renderImagePreviewModal = () => (
    <Modal visible={showImagePreview} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Document Preview</Text>
            <TouchableOpacity onPress={() => setShowImagePreview(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#2C2C2C" />
            </TouchableOpacity>
          </View>
          
          {uploadedImage && (
            <Image source={{ uri: uploadedImage }} style={styles.modalImage} />
          )}
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowImagePreview(false)}
            >
              <Text style={styles.modalButtonText}>Use This Image</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={() => {
                setUploadedImage(null);
                setShowImagePreview(false);
              }}
            >
              <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>
                Retake
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#2C2C2C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Documents</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderDocumentTypeSelector()}
        {selectedDocumentType && renderImageCapture()}
        {selectedDocumentType && renderDocumentNumber()}
        {renderUploadedDocuments()}
      </ScrollView>

      {selectedDocumentType && uploadedImage && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
            onPress={handleUploadDocument}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialCommunityIcons name="upload" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.uploadButtonText}>
              {uploading ? 'Uploading...' : 'Upload Document'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {renderImagePreviewModal()}
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
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
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
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  documentTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  documentTypeCard: {
    width: (width - 48) / 2,
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  documentTypeCardSelected: {
    backgroundColor: '#00A651',
    borderColor: '#00A651',
  },
  documentTypeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginTop: 8,
    textAlign: 'center',
  },
  documentTypeNameSelected: {
    color: '#FFFFFF',
  },
  documentTypeDescription: {
    fontSize: 12,
    color: '#8E8E8E',
    marginTop: 4,
    textAlign: 'center',
  },
  documentTypeDescriptionSelected: {
    color: '#E8F5E8',
  },
  captureButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  captureButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginTop: 12,
  },
  captureButtonSubtext: {
    fontSize: 14,
    color: '#8E8E8E',
    marginTop: 4,
    textAlign: 'center',
  },
  imagePreviewContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    width: width - 64,
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  changeImageButton: {
    backgroundColor: '#00A651',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  changeImageButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  inputLabel: {
    fontSize: 14,
    color: '#8E8E8E',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#2C2C2C',
    marginLeft: 8,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentDetails: {
    marginLeft: 12,
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  documentDate: {
    fontSize: 12,
    color: '#8E8E8E',
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  deleteButton: {
    padding: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E8E',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  uploadButton: {
    backgroundColor: '#00A651',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  uploadButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  modalImage: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#00A651',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextSecondary: {
    color: '#2C2C2C',
  },
});
