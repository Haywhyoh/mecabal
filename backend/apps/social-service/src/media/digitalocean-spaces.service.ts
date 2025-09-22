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
    const endpoint = this.configService.get<string>('DO_SPACES_ENDPOINT', `https://${region}.digitaloceanspaces.com`);

    if (!accessKeyId || !secretAccessKey || !bucket) {
      this.logger.warn('DigitalOcean Spaces credentials not configured');
      return;
    }

    this.s3 = new AWS.S3({
      accessKeyId,
      secretAccessKey,
      endpoint,
      region,
      s3ForcePathStyle: false,
    });
  }

  async uploadFile(
    file: MediaFile,
    folder: string = 'media',
    options?: {
      quality?: number;
      maxWidth?: number;
      maxHeight?: number;
    }
  ): Promise<UploadResult> {
    try {
      if (!this.s3) {
        throw new Error('DigitalOcean Spaces not configured');
      }

      // Generate unique filename
      const fileExtension = this.getFileExtension(file.originalName);
      const fileName = `${uuidv4()}.${fileExtension}`;
      const key = `${folder}/${fileName}`;

      // Process image if needed
      let processedBuffer = file.buffer;
      let processedMimeType = file.mimeType;

      if (file.mimeType.startsWith('image/') && options) {
        const processed = await this.processImage(file.buffer, options);
        processedBuffer = processed.buffer;
        processedMimeType = processed.mimeType;
      }

      // Upload to DigitalOcean Spaces
      const uploadParams = {
        Bucket: this.configService.get<string>('DO_SPACES_BUCKET'),
        Key: key,
        Body: processedBuffer,
        ContentType: processedMimeType,
        ACL: 'public-read',
        Metadata: {
          originalName: file.originalName,
          uploadedAt: new Date().toISOString(),
        },
      };

      const result = await this.s3.upload(uploadParams).promise();

      this.logger.log(`File uploaded successfully: ${key}`);

      return {
        url: result.Location,
        key,
        size: processedBuffer.length,
        mimeType: processedMimeType,
      };
    } catch (error) {
      this.logger.error('Error uploading file to DigitalOcean Spaces:', error);
      throw new Error('Failed to upload file');
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      if (!this.s3) {
        throw new Error('DigitalOcean Spaces not configured');
      }

      const deleteParams = {
        Bucket: this.configService.get<string>('DO_SPACES_BUCKET'),
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
    }
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
        Bucket: this.configService.get<string>('DO_SPACES_BUCKET'),
        MaxKeys: 1000,
      };

      const result = await this.s3.listObjectsV2(listParams).promise();
      
      const totalFiles = result.Contents?.length || 0;
      const totalSize = result.Contents?.reduce((sum, obj) => sum + (obj.Size || 0), 0) || 0;
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
