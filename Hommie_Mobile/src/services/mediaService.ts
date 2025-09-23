import { ENV, API_ENDPOINTS } from '../config/environment';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { MeCabalAuth } from './auth';

export interface MediaFile {
  uri: string;
  type: 'image' | 'video';
  name: string;
  size: number;
  width?: number;
  height?: number;
}

export interface UploadedMedia {
  id: string;
  url: string;
  type: 'image' | 'video';
  caption?: string;
  size: number;
  width?: number;
  height?: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface MediaUploadResponse {
  media: UploadedMedia[];
  uploadTime: number;
  totalSize: number;
}

export class MediaService {
  private static instance: MediaService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = ENV.API.BASE_URL;
  }

  public static getInstance(): MediaService {
    if (!MediaService.instance) {
      MediaService.instance = new MediaService();
    }
    return MediaService.instance;
  }

  /**
   * Get authentication headers
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await MeCabalAuth.getAuthToken();

    return {
      'Authorization': `Bearer ${token}`,
    };
  }

  /**
   * Pick image from gallery or camera
   */
  async pickImage(options?: {
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
  }): Promise<MediaFile | null> {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access media library is required');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options?.allowsEditing || true,
        aspect: options?.aspect || [4, 3],
        quality: options?.quality || 0.8,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      if (!asset) {
        return null;
      }

      return {
        uri: asset.uri,
        type: 'image',
        name: this.generateFileName('image'),
        size: asset.fileSize || 0,
        width: asset.width,
        height: asset.height,
      };
    } catch (error) {
      console.error('Error picking image:', error);
      throw new Error('Failed to pick image');
    }
  }

  /**
   * Pick video from gallery or camera
   */
  async pickVideo(options?: {
    maxDuration?: number;
    quality?: ImagePicker.UIImagePickerControllerQualityType;
  }): Promise<MediaFile | null> {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access media library is required');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        videoMaxDuration: options?.maxDuration || 60,
        quality: options?.quality || ImagePicker.UIImagePickerControllerQualityType.Medium,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      if (!asset) {
        return null;
      }

      return {
        uri: asset.uri,
        type: 'video',
        name: this.generateFileName('video'),
        size: asset.fileSize || 0,
        width: asset.width,
        height: asset.height,
      };
    } catch (error) {
      console.error('Error picking video:', error);
      throw new Error('Failed to pick video');
    }
  }

  /**
   * Upload media file to backend
   */
  async uploadMedia(
    mediaFile: MediaFile,
    options: {
      caption?: string;
      quality?: number;
      maxWidth?: number;
      maxHeight?: number;
    } = {}
  ): Promise<UploadedMedia> {
    try {
      // Convert file to FormData
      const formData = new FormData();
      
      // Read file as blob
      const fileBlob = await this.uriToBlob(mediaFile.uri);
      
      formData.append('files', fileBlob, mediaFile.name);
      formData.append('type', mediaFile.type);
      
      if (options.caption) {
        formData.append('caption', options.caption);
      }
      if (options.quality) {
        formData.append('quality', options.quality.toString());
      }
      if (options.maxWidth) {
        formData.append('maxWidth', options.maxWidth.toString());
      }
      if (options.maxHeight) {
        formData.append('maxHeight', options.maxHeight.toString());
      }

      // Upload to backend
      const response = await fetch(`${this.baseUrl}/media/upload`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload media');
      }

      const result: MediaUploadResponse = await response.json();
      return result.media[0];
    } catch (error) {
      console.error('Error uploading media:', error);
      throw new Error('Failed to upload media');
    }
  }

  /**
   * Upload multiple media files
   */
  async uploadMultipleMedia(
    mediaFiles: MediaFile[],
    options: {
      caption?: string;
      quality?: number;
      maxWidth?: number;
      maxHeight?: number;
    } = {}
  ): Promise<UploadedMedia[]> {
    try {
      // Convert files to FormData
      const formData = new FormData();
      
      for (const mediaFile of mediaFiles) {
        const fileBlob = await this.uriToBlob(mediaFile.uri);
        formData.append('files', fileBlob, mediaFile.name);
      }
      
      formData.append('type', mediaFiles[0].type);
      
      if (options.caption) {
        formData.append('caption', options.caption);
      }
      if (options.quality) {
        formData.append('quality', options.quality.toString());
      }
      if (options.maxWidth) {
        formData.append('maxWidth', options.maxWidth.toString());
      }
      if (options.maxHeight) {
        formData.append('maxHeight', options.maxHeight.toString());
      }

      // Upload to backend
      const response = await fetch(`${this.baseUrl}/media/upload`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload media');
      }

      const result: MediaUploadResponse = await response.json();
      return result.media;
    } catch (error) {
      console.error('Error uploading multiple media:', error);
      throw new Error('Failed to upload media files');
    }
  }

  /**
   * Delete media file
   */
  async deleteMedia(mediaId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/media/${mediaId}`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete media');
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      throw new Error('Failed to delete media');
    }
  }

  /**
   * Get user's media files
   */
  async getUserMedia(limit: number = 20, offset: number = 0): Promise<UploadedMedia[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/media/my-media?limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers: await this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch media');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user media:', error);
      throw new Error('Failed to fetch media');
    }
  }

  /**
   * Get media statistics
   */
  async getMediaStats(): Promise<{
    totalMedia: number;
    totalSize: number;
    imageCount: number;
    videoCount: number;
    lastUploaded: string | null;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/media/stats`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch media stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching media stats:', error);
      throw new Error('Failed to fetch media stats');
    }
  }

  /**
   * Convert URI to Blob for FormData
   */
  private async uriToBlob(uri: string): Promise<Blob> {
    try {
      const response = await fetch(uri);
      return await response.blob();
    } catch (error) {
      console.error('Error converting URI to blob:', error);
      throw new Error('Failed to process file');
    }
  }

  /**
   * Generate unique file name
   */
  private generateFileName(type: 'image' | 'video'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = type === 'image' ? 'jpg' : 'mp4';
    return `${timestamp}-${random}.${extension}`;
  }

  /**
   * Get media file info
   */
  async getMediaInfo(uri: string): Promise<{ width: number; height: number; size: number }> {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (!info.exists) {
        throw new Error('File does not exist');
      }

      // For now, return default dimensions
      // In production, implement proper image dimension detection
      return {
        width: 800,
        height: 600,
        size: info.size || 0,
      };
    } catch (error) {
      console.error('Error getting media info:', error);
      throw new Error('Failed to get media info');
    }
  }
}

export default MediaService;