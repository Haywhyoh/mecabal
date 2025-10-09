// MeCabal Avatar Upload Service
// Handles profile picture uploads to backend S3/Spaces

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import type { ApiResponse } from '../types/api';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface AvatarUploadResponse {
  avatarUrl: string;
}

export class AvatarUploadService {
  /**
   * Request camera permissions
   */
  static async requestCameraPermissions(): Promise<boolean> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Request media library permissions
   */
  static async requestMediaLibraryPermissions(): Promise<boolean> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Pick image from camera
   */
  static async pickImageFromCamera(): Promise<string | null> {
    const hasPermission = await this.requestCameraPermissions();
    if (!hasPermission) {
      throw new Error('Camera permission not granted');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0].uri;
  }

  /**
   * Pick image from library
   */
  static async pickImageFromLibrary(): Promise<string | null> {
    const hasPermission = await this.requestMediaLibraryPermissions();
    if (!hasPermission) {
      throw new Error('Media library permission not granted');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0].uri;
  }

  /**
   * Compress and resize image before upload
   */
  static async processImage(uri: string): Promise<string> {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 400, height: 400 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    return manipResult.uri;
  }

  /**
   * Upload avatar to backend
   */
  static async uploadAvatar(imageUri: string): Promise<ApiResponse<AvatarUploadResponse>> {
    try {
      console.log('📤 Uploading avatar...');

      // Process image first
      const processedUri = await this.processImage(imageUri);

      // Get auth token
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        return {
          success: false,
          error: 'Not authenticated',
        };
      }

      // Create form data
      const formData = new FormData();

      // Get file extension
      const uriParts = processedUri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      formData.append('avatar', {
        uri: processedUri,
        name: `avatar.${fileType}`,
        type: `image/${fileType}`,
      } as any);

      // Upload
      const response = await fetch(`${API_BASE_URL}/users/me/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type - let fetch set it with boundary
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Upload failed with status ${response.status}`,
        }));

        return {
          success: false,
          error: errorData.message || 'Avatar upload failed',
        };
      }

      const data = await response.json();
      console.log('✅ Avatar uploaded successfully:', data.avatarUrl);

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload avatar',
      };
    }
  }

  /**
   * Delete avatar
   */
  static async deleteAvatar(): Promise<ApiResponse<{ message: string }>> {
    try {
      console.log('🗑️ Deleting avatar...');

      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        return {
          success: false,
          error: 'Not authenticated',
        };
      }

      const response = await fetch(`${API_BASE_URL}/users/me/avatar`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Delete failed with status ${response.status}`,
        }));

        return {
          success: false,
          error: errorData.message || 'Avatar deletion failed',
        };
      }

      const data = await response.json();
      console.log('✅ Avatar deleted successfully');

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('Avatar delete error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete avatar',
      };
    }
  }

  /**
   * Show avatar selection dialog
   */
  static async showAvatarPicker(): Promise<string | null> {
    // In a real implementation, show ActionSheet with options:
    // - Take Photo
    // - Choose from Library
    // - Remove Current Photo (if exists)

    // For now, just launch library
    return this.pickImageFromLibrary();
  }
}
