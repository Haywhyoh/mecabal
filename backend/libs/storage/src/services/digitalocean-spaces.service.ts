import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { UploadResult, MediaFile } from '../interfaces/upload.interface';
import { FileCategory } from '../enums/file-type.enum';

@Injectable()
export class DigitalOceanSpacesService {
  private readonly logger = new Logger(DigitalOceanSpacesService.name);
  private s3: AWS.S3;
  private bucket: string;
  private cdnUrl: string;

  constructor(private configService: ConfigService) {
    this.initializeS3();
  }

  private initializeS3() {
    const accessKeyId = this.configService.get<string>('DO_SPACES_KEY');
    const secretAccessKey = this.configService.get<string>('DO_SPACES_SECRET');
    this.bucket = this.configService.get<string>('DO_SPACES_BUCKET', 'mecabal-uploads');
    const region = this.configService.get<string>('DO_SPACES_REGION', 'nyc3');
    const endpoint = this.configService.get<string>(
      'DO_SPACES_ENDPOINT',
      `https://${region}.digitaloceanspaces.com`,
    );

    this.logger.log('🔧 DigitalOcean Spaces Configuration:');
    this.logger.log(`  - Access Key: ${accessKeyId ? 'SET' : 'NOT SET'}`);
    this.logger.log(`  - Secret Key: ${secretAccessKey ? 'SET' : 'NOT SET'}`);
    this.logger.log(`  - Bucket: ${this.bucket}`);
    this.logger.log(`  - Region: ${region}`);
    this.logger.log(`  - Endpoint: ${endpoint}`);

    if (!accessKeyId || !secretAccessKey) {
      this.logger.warn(
        '❌ DigitalOcean Spaces credentials not configured - uploads will fail',
      );
      return;
    }

    this.s3 = new AWS.S3({
      accessKeyId,
      secretAccessKey,
      endpoint,
      region,
      s3ForcePathStyle: false,
      httpOptions: {
        timeout: 300000, // 5 minutes timeout for large files
        connectTimeout: 60000, // 1 minute connection timeout
      },
    });

    // Set CDN URL
    const cdnEnabled = this.configService.get<boolean>('DO_SPACES_CDN_ENABLED', true);
    if (cdnEnabled) {
      this.cdnUrl = `https://${this.bucket}.${region}.cdn.digitaloceanspaces.com`;
    } else {
      this.cdnUrl = `https://${this.bucket}.${region}.digitaloceanspaces.com`;
    }

    this.logger.log('✅ DigitalOcean Spaces S3 client initialized');
    this.logger.log(`  - CDN URL: ${this.cdnUrl}`);
  }

  /**
   * Upload file to DigitalOcean Spaces
   * @param file - File to upload
   * @param category - File category (avatars, documents, media, etc.)
   * @param options - Upload options
   */
  async uploadFile(
    file: MediaFile,
    category: FileCategory,
    options?: {
      userId?: string;
      quality?: number;
      maxWidth?: number;
      maxHeight?: number;
      makePublic?: boolean;
    },
  ): Promise<UploadResult> {
    this.logger.log('🔧 DigitalOcean Spaces uploadFile called:');
    this.logger.log(`  - File name: ${file.originalName}`);
    this.logger.log(`  - File size: ${file.size} bytes`);
    this.logger.log(`  - File type: ${file.mimeType}`);
    this.logger.log(`  - Category: ${category}`);
    this.logger.log(`  - User ID: ${options?.userId || 'N/A'}`);

    try {
      if (!this.s3) {
        this.logger.error('❌ DigitalOcean Spaces not configured');
        throw new BadRequestException('File upload service not configured');
      }

      // Validate file
      this.validateFile(file, category);

      this.logger.log('🚀 Starting DigitalOcean Spaces upload...');

      // Add timeout wrapper
      const uploadPromise = this.performUpload(file, category, options);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          this.logger.error('⏰ Upload timeout after 5 minutes');
          reject(new Error('Upload timeout after 5 minutes'));
        }, 300000);
      });

      const result = await Promise.race([uploadPromise, timeoutPromise]);
      this.logger.log('✅ DigitalOcean Spaces upload successful:', result);
      return result;
    } catch (error) {
      this.logger.error(
        '❌ Error uploading file to DigitalOcean Spaces:',
        error,
      );
      throw error;
    }
  }

  private async performUpload(
    file: MediaFile,
    category: FileCategory,
    options?: {
      userId?: string;
      quality?: number;
      maxWidth?: number;
      maxHeight?: number;
      makePublic?: boolean;
    },
  ): Promise<UploadResult> {
    // Generate folder path based on category and user
    const folder = this.generateFolderPath(category, options?.userId);

    // Generate unique filename
    const fileExtension = this.getFileExtension(file.originalName);
    const fileName = `${uuidv4()}.${fileExtension}`;
    const key = `${folder}/${fileName}`;

    this.logger.log(`  - Generated key: ${key}`);

    // Prepare buffer (image processing happens in separate service)
    const buffer = file.buffer;
    const mimeType = file.mimeType;

    // Upload parameters
    const acl = options?.makePublic !== false ? 'public-read' : 'private';
    const uploadParams = {
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ACL: acl,
      Metadata: {
        originalName: file.originalName,
        uploadedAt: new Date().toISOString(),
        category: category,
        ...(options?.userId && { userId: options.userId }),
      },
      CacheControl: 'max-age=31536000', // 1 year cache
    };

    this.logger.log('🚀 Uploading to DigitalOcean Spaces:');
    this.logger.log(`  - Bucket: ${this.bucket}`);
    this.logger.log(`  - Key: ${key}`);
    this.logger.log(`  - ACL: ${acl}`);

    const result = await this.s3.upload(uploadParams).promise();

    this.logger.log(`✅ File uploaded successfully: ${key}`);

    // Use CDN URL for public files
    const url = acl === 'public-read'
      ? `${this.cdnUrl}/${key}`
      : result.Location;

    return {
      url,
      key,
      size: buffer.length,
      mimeType,
      bucket: this.bucket,
      etag: result.ETag,
    };
  }

  /**
   * Delete file from DigitalOcean Spaces
   */
  async deleteFile(key: string): Promise<boolean> {
    try {
      if (!this.s3) {
        throw new Error('DigitalOcean Spaces not configured');
      }

      const deleteParams = {
        Bucket: this.bucket,
        Key: key,
      };

      await this.s3.deleteObject(deleteParams).promise();
      this.logger.log(`✅ File deleted successfully: ${key}`);

      return true;
    } catch (error) {
      this.logger.error('❌ Error deleting file:', error);
      return false;
    }
  }

  /**
   * Delete multiple files
   */
  async deleteFiles(keys: string[]): Promise<{ deleted: string[]; failed: string[] }> {
    const deleted: string[] = [];
    const failed: string[] = [];

    for (const key of keys) {
      const success = await this.deleteFile(key);
      if (success) {
        deleted.push(key);
      } else {
        failed.push(key);
      }
    }

    return { deleted, failed };
  }

  /**
   * Get file URL
   */
  async getFileUrl(key: string, expiresIn?: number): Promise<string> {
    try {
      if (!this.s3) {
        throw new Error('DigitalOcean Spaces not configured');
      }

      // If no expiration, return direct CDN URL
      if (!expiresIn) {
        return `${this.cdnUrl}/${key}`;
      }

      // Generate presigned URL for private files
      const params = {
        Bucket: this.bucket,
        Key: key,
        Expires: expiresIn,
      };

      return this.s3.getSignedUrl('getObject', params);
    } catch (error) {
      this.logger.error('Error getting file URL:', error);
      throw new Error('Failed to get file URL');
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      if (!this.s3) {
        return false;
      }

      await this.s3.headObject({ Bucket: this.bucket, Key: key }).promise();
      return true;
    } catch (error) {
      if (error.code === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get bucket statistics
   */
  async getBucketStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    lastModified: Date;
  }> {
    try {
      if (!this.s3) {
        throw new Error('DigitalOcean Spaces not configured');
      }

      const listParams = {
        Bucket: this.bucket,
        MaxKeys: 1000,
      };

      const result = await this.s3.listObjectsV2(listParams).promise();

      const totalFiles = result.Contents?.length || 0;
      const totalSize =
        result.Contents?.reduce((sum, obj) => sum + (obj.Size || 0), 0) || 0;
      const lastModified = result.Contents?.[0]?.LastModified || new Date();

      return {
        totalFiles,
        totalSize,
        lastModified,
      };
    } catch (error) {
      this.logger.error('Error getting bucket stats:', error);
      throw new Error('Failed to get bucket stats');
    }
  }

  /**
   * Generate folder path based on category
   */
  private generateFolderPath(category: FileCategory, userId?: string): string {
    const basePath = category;

    if (userId) {
      return `${basePath}/${userId}`;
    }

    return basePath;
  }

  /**
   * Validate file based on category
   */
  private validateFile(file: MediaFile, category: FileCategory): void {
    const maxSizes: Record<FileCategory, number> = {
      [FileCategory.AVATARS]: 5 * 1024 * 1024, // 5MB
      [FileCategory.DOCUMENTS]: 10 * 1024 * 1024, // 10MB
      [FileCategory.MEDIA]: 50 * 1024 * 1024, // 50MB
      [FileCategory.BUSINESS_DOCS]: 10 * 1024 * 1024, // 10MB
      [FileCategory.EVENT_IMAGES]: 20 * 1024 * 1024, // 20MB
      [FileCategory.MESSAGING_ATTACHMENTS]: 25 * 1024 * 1024, // 25MB
    };

    const allowedTypes: Record<FileCategory, string[]> = {
      [FileCategory.AVATARS]: ['image/jpeg', 'image/png', 'image/webp'],
      [FileCategory.DOCUMENTS]: [
        'image/jpeg',
        'image/png',
        'application/pdf',
        'image/webp',
      ],
      [FileCategory.MEDIA]: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'video/mp4',
        'video/quicktime',
      ],
      [FileCategory.BUSINESS_DOCS]: [
        'image/jpeg',
        'image/png',
        'application/pdf',
      ],
      [FileCategory.EVENT_IMAGES]: [
        'image/jpeg',
        'image/png',
        'image/webp',
      ],
      [FileCategory.MESSAGING_ATTACHMENTS]: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'video/mp4',
        'video/quicktime',
        'audio/mpeg',
        'audio/wav',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
    };

    const maxSize = maxSizes[category];
    const allowed = allowedTypes[category];

    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB for ${category}`,
      );
    }

    if (!allowed.includes(file.mimeType)) {
      throw new BadRequestException(
        `Invalid file type for ${category}. Allowed types: ${allowed.join(', ')}`,
      );
    }
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || 'bin';
  }
}
