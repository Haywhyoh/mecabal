import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  url: string;
  key: string;
  size: number;
  mimeType: string;
}

export interface MediaFile {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
}

@Injectable()
export class DigitalOceanSpacesService {
  private readonly logger = new Logger(DigitalOceanSpacesService.name);
  private s3: AWS.S3;

  constructor(private configService: ConfigService) {
    this.initializeS3();
  }

  private initializeS3() {
    const accessKeyId = this.configService.get<string>('DO_SPACES_KEY');
    const secretAccessKey = this.configService.get<string>('DO_SPACES_SECRET');
    const bucket = this.configService.get<string>('DO_SPACES_BUCKET');
    const region = this.configService.get<string>('DO_SPACES_REGION', 'nyc3');
    const endpoint = this.configService.get<string>(
      'DO_SPACES_ENDPOINT',
      `https://${region}.digitaloceanspaces.com`,
    );

    this.logger.log('🔧 DigitalOcean Spaces Configuration:');
    this.logger.log(`  - Access Key: ${accessKeyId ? 'SET' : 'NOT SET'}`);
    this.logger.log(`  - Secret Key: ${secretAccessKey ? 'SET' : 'NOT SET'}`);
    this.logger.log(`  - Bucket: ${bucket || 'NOT SET'}`);
    this.logger.log(`  - Region: ${region}`);
    this.logger.log(`  - Endpoint: ${endpoint}`);

    if (!accessKeyId || !secretAccessKey || !bucket) {
      this.logger.warn(
        '❌ DigitalOcean Spaces credentials not configured - will use fallback',
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

    this.logger.log('✅ DigitalOcean Spaces S3 client initialized');
  }

  async uploadFile(
    file: MediaFile,
    folder: string = 'media',
    options?: {
      quality?: number;
      maxWidth?: number;
      maxHeight?: number;
    },
  ): Promise<UploadResult> {
    this.logger.log('🔧 DigitalOcean Spaces uploadFile called:');
    this.logger.log(`  - File name: ${file.originalName}`);
    this.logger.log(`  - File size: ${file.size} bytes`);
    this.logger.log(`  - File type: ${file.mimeType}`);
    this.logger.log(`  - Folder: ${folder}`);
    this.logger.log(`  - S3 client available: ${this.s3 ? 'YES' : 'NO'}`);

    try {
      if (!this.s3) {
        this.logger.warn(
          '❌ DigitalOcean Spaces not configured, using fallback',
        );
        throw new Error('DigitalOcean Spaces not configured');
      }

      this.logger.log('🚀 Starting DigitalOcean Spaces upload...');

      // Add timeout wrapper
      const uploadPromise = this.performUpload(file, folder, options);
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
      this.logger.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        name: error.name,
      });
      throw new Error('Failed to upload file');
    }
  }

  private async performUpload(
    file: MediaFile,
    folder: string,
    options?: {
      quality?: number;
      maxWidth?: number;
      maxHeight?: number;
    },
  ): Promise<UploadResult> {
    this.logger.log('🔧 performUpload called:');

    // Generate unique filename
    const fileExtension = this.getFileExtension(file.originalName);
    const fileName = `${uuidv4()}.${fileExtension}`;
    const key = `${folder}/${fileName}`;

    this.logger.log(`  - Generated filename: ${fileName}`);
    this.logger.log(`  - Generated key: ${key}`);

    // Process image if needed
    let processedBuffer = file.buffer;
    let processedMimeType = file.mimeType;

    if (file.mimeType.startsWith('image/') && options) {
      this.logger.log('🖼️ Processing image...');
      const processed = await this.processImage(file.buffer, options);
      processedBuffer = processed.buffer;
      processedMimeType = processed.mimeType;
      this.logger.log(
        `  - Processed buffer size: ${processedBuffer.length} bytes`,
      );
    }

    // Upload to DigitalOcean Spaces
    const bucket =
      this.configService.get<string>('DO_SPACES_BUCKET') || 'mecabal-uploads';
    const uploadParams = {
      Bucket: bucket,
      Key: key,
      Body: processedBuffer,
      ContentType: processedMimeType,
      ACL: 'public-read',
      Metadata: {
        originalName: file.originalName,
        uploadedAt: new Date().toISOString(),
      },
    };

    this.logger.log('🚀 Uploading to DigitalOcean Spaces:');
    this.logger.log(`  - Bucket: ${bucket}`);
    this.logger.log(`  - Key: ${key}`);
    this.logger.log(`  - ContentType: ${processedMimeType}`);
    this.logger.log(`  - Body size: ${processedBuffer.length} bytes`);

    const result = await this.s3.upload(uploadParams).promise();

    this.logger.log(`✅ File uploaded successfully: ${key}`);
    this.logger.log(`✅ Upload result:`, {
      Location: result.Location,
      ETag: result.ETag,
      Bucket: result.Bucket,
      Key: result.Key,
    });

    return {
      url: result.Location,
      key,
      size: processedBuffer.length,
      mimeType: processedMimeType,
    };
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      if (!this.s3) {
        throw new Error('DigitalOcean Spaces not configured');
      }

      const deleteParams = {
        Bucket:
          this.configService.get<string>('DO_SPACES_BUCKET') ||
          'mecabal-uploads',
        Key: key,
      };

      await this.s3.deleteObject(deleteParams).promise();
      this.logger.log(`File deleted successfully: ${key}`);

      return true;
    } catch (error) {
      this.logger.error('Error deleting file from DigitalOcean Spaces:', error);
      return false;
    }
  }

  async getFileUrl(key: string): Promise<string> {
    try {
      if (!this.s3) {
        throw new Error('DigitalOcean Spaces not configured');
      }

      const region = this.configService.get<string>('DO_SPACES_REGION', 'nyc3');
      const bucket = this.configService.get<string>('DO_SPACES_BUCKET');

      return `https://${bucket}.${region}.digitaloceanspaces.com/${key}`;
    } catch (error) {
      this.logger.error('Error getting file URL:', error);
      throw new Error('Failed to get file URL');
    }
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || 'bin';
  }

  private async processImage(
    buffer: Buffer,
    options: {
      quality?: number;
      maxWidth?: number;
      maxHeight?: number;
    },
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    try {
      // For now, return the original buffer
      // In production, implement proper image processing using sharp or similar
      this.logger.log('Image processing not implemented, returning original');

      return {
        buffer,
        mimeType: 'image/jpeg',
      };
    } catch (error) {
      this.logger.error('Error processing image:', error);
      throw new Error('Failed to process image');
    }
  }

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
        Bucket:
          this.configService.get<string>('DO_SPACES_BUCKET') ||
          'mecabal-uploads',
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
}
