import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../components/UserProfile';
import { AvatarUploadService } from '../services/avatarUpload';

export default function AvatarTestScreen() {
  const navigation = useNavigation();
  const { user, refreshUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const handleAvatarChange = async () => {
    Alert.alert(
      'Change Profile Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            try {
              setIsUploading(true);
              const imageUri = await AvatarUploadService.pickImageFromCamera();
              if (imageUri) {
                await uploadAvatar(imageUri);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to take photo');
            } finally {
              setIsUploading(false);
            }
          },
        },
        {
          text: 'Choose from Library',
          onPress: async () => {
            try {
              setIsUploading(true);
              const imageUri = await AvatarUploadService.pickImageFromLibrary();
              if (imageUri) {
                await uploadAvatar(imageUri);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to choose photo');
            } finally {
              setIsUploading(false);
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const uploadAvatar = async (imageUri: string) => {
    try {
      const result = await AvatarUploadService.uploadAvatar(imageUri);

      if (result.success && result.data) {
        // Update user context with new avatar URL
        await refreshUser();
        Alert.alert('Success', 'Profile photo updated successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to upload photo');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const testImageProcessing = async () => {
    try {
      const imageUri = await AvatarUploadService.pickImageFromLibrary();
      if (imageUri) {
        const processedUri = await AvatarUploadService.processImage(imageUri);
        Alert.alert('Success', `Image processed: ${processedUri}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process image');
    }
  };

  const testPermissions = async () => {
    try {
      const cameraPermission = await AvatarUploadService.requestCameraPermissions();
      const libraryPermission = await AvatarUploadService.requestMediaLibraryPermissions();
      
      Alert.alert(
        'Permissions',
        `Camera: ${cameraPermission ? 'Granted' : 'Denied'}\nLibrary: ${libraryPermission ? 'Granted' : 'Denied'}`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to check permissions');
    }
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
        <Text style={styles.headerTitle}>Avatar Upload Test</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* User Profile with Avatar Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current User Profile</Text>
          <UserProfile
            user={user}
            size="large"
            showLocation={true}
            showJoinDate={true}
            showVerificationBadge={true}
            showCameraButton={true}
            onCameraPress={handleAvatarChange}
            onAvatarUpdated={async (avatarUrl: string) => {
              await refreshUser();
              Alert.alert('Avatar Updated', `New avatar URL: ${avatarUrl}`);
            }}
          />
        </View>

        {/* Test Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Functions</Text>
          
          <TouchableOpacity
            style={[styles.testButton, isUploading && styles.testButtonDisabled]}
            onPress={handleAvatarChange}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialCommunityIcons name="camera" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.testButtonText}>
              {isUploading ? 'Uploading...' : 'Test Avatar Upload'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={testImageProcessing}>
            <MaterialCommunityIcons name="image-edit" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Test Image Processing</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={testPermissions}>
            <MaterialCommunityIcons name="shield-check" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Test Permissions</Text>
          </TouchableOpacity>
        </View>

        {/* User Info Display */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Information</Text>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>Name: {user?.firstName} {user?.lastName}</Text>
            <Text style={styles.infoText}>Email: {user?.email}</Text>
            <Text style={styles.infoText}>Avatar URL: {user?.profilePictureUrl || 'None'}</Text>
            <Text style={styles.infoText}>Verified: {user?.isVerified ? 'Yes' : 'No'}</Text>
          </View>
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
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
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
  infoContainer: {
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#2C2C2C',
    marginBottom: 4,
  },
});

