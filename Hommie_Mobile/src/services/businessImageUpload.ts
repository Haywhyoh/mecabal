// MeCabal Business Image Upload Service
// Handles business profile and cover image uploads to backend

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import type { ApiResponse } from './types/api.types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface BusinessImageUploadResponse {
  profileImageUrl?: string;
  coverImageUrl?: string;
  imageUrl?: string;
  url?: string;
}

export class BusinessImageUploadService {
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
  static async pickImageFromCamera(aspect?: [number, number]): Promise<string | null> {
    const hasPermission = await this.requestCameraPermissions();
    if (!hasPermission) {
      throw new Error('Camera permission not granted');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: aspect || [1, 1],
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
  static async pickImageFromLibrary(aspect?: [number, number]): Promise<string | null> {
    const hasPermission = await this.requestMediaLibraryPermissions();
    if (!hasPermission) {
      throw new Error('Media library permission not granted');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: aspect || [1, 1],
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0].uri;
  }

  /**
   * Process image - resize and compress
   */
  static async processImage(
    uri: string,
    width: number = 800,
    height: number = 800
  ): Promise<string> {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width, height } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    return manipResult.uri;
  }

  /**
   * Upload business profile image (logo)
   */
  static async uploadProfileImage(
    businessId: string,
    imageUri: string
  ): Promise<ApiResponse<BusinessImageUploadResponse>> {
    try {
      console.log('📤 Uploading business profile image...');

      // Process image (400x400 for profile)
      const processedUri = await this.processImage(imageUri, 400, 400);

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
      const uriParts = processedUri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      formData.append('image', {
        uri: processedUri,
        name: `profile.${fileType}`,
        type: `image/${fileType}`,
      } as any);

      // Upload
      const response = await fetch(`${API_BASE_URL}/business/${businessId}/profile-image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Upload failed with status ${response.status}`,
        }));

        return {
          success: false,
          error: errorData.message || errorData.error || 'Profile image upload failed',
        };
      }

      const data = await response.json();
      console.log('✅ Profile image uploaded successfully');

      // Extract image URL from response
      const imageUrl = data.profileImageUrl || data.imageUrl || data.url || data.data?.profileImageUrl;
      
      return {
        success: true,
        data: { profileImageUrl: imageUrl },
      };
    } catch (error: any) {
      console.error('Profile image upload error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload profile image',
      };
    }
  }

  /**
   * Upload business cover image
   */
  static async uploadCoverImage(
    businessId: string,
    imageUri: string
  ): Promise<ApiResponse<BusinessImageUploadResponse>> {
    try {
      console.log('📤 Uploading business cover image...');

      // Process image (1200x400 for cover)
      const processedUri = await this.processImage(imageUri, 1200, 400);

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
      const uriParts = processedUri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      formData.append('image', {
        uri: processedUri,
        name: `cover.${fileType}`,
        type: `image/${fileType}`,
      } as any);

      // Upload
      const response = await fetch(`${API_BASE_URL}/business/${businessId}/cover-image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Upload failed with status ${response.status}`,
        }));

        return {
          success: false,
          error: errorData.message || errorData.error || 'Cover image upload failed',
        };
      }

      const data = await response.json();
      console.log('✅ Cover image uploaded successfully');

      // Extract image URL from response
      const imageUrl = data.coverImageUrl || data.imageUrl || data.url || data.data?.coverImageUrl;
      
      return {
        success: true,
        data: { coverImageUrl: imageUrl },
      };
    } catch (error: any) {
      console.error('Cover image upload error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload cover image',
      };
    }
  }

  /**
   * Show image picker options
   */
  static async showImagePicker(
    aspect?: [number, number]
  ): Promise<string | null> {
    return this.pickImageFromLibrary(aspect);
  }
}





