import { Injectable, Logger } from '@nestjs/common';
import { DigitalOceanSpacesService } from './digitalocean-spaces.service';
import { ImageProcessingService } from './image-processing.service';
import { MediaFile, UploadResult } from '../interfaces/upload.interface';
import { FileCategory } from '../enums/file-type.enum';

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);

  constructor(
    private readonly spacesService: DigitalOceanSpacesService,
    private readonly imageService: ImageProcessingService,
  ) {}

  /**
   * Upload avatar with automatic processing
   */
  async uploadAvatar(
    file: MediaFile,
    userId: string,
  ): Promise<UploadResult> {
    this.logger.log(`📸 Uploading avatar for user ${userId}`);

    // Process image to standard avatar size
    const processed = await this.imageService.processImage(file.buffer, {
      maxWidth: 400,
      maxHeight: 400,
      quality: 85,
      format: 'jpeg',
    });

    const processedFile: MediaFile = {
      ...file,
      buffer: processed.buffer,
      mimeType: processed.mimeType,
      size: processed.buffer.length,
    };

    return this.spacesService.uploadFile(
      processedFile,
      FileCategory.AVATARS,
      { userId, makePublic: true },
    );
  }

  /**
   * Upload identity document
   */
  async uploadDocument(
    file: MediaFile,
    userId: string,
    makePublic: boolean = false,
  ): Promise<UploadResult> {
    this.logger.log(`📄 Uploading document for user ${userId}`);

    // If it's an image, process it
    if (file.mimeType.startsWith('image/')) {
      const processed = await this.imageService.processImage(file.buffer, {
        maxWidth: 2000,
        maxHeight: 2000,
        quality: 90,
        format: 'jpeg',
      });

      file = {
        ...file,
        buffer: processed.buffer,
        mimeType: processed.mimeType,
        size: processed.buffer.length,
      };
    }

    return this.spacesService.uploadFile(
      file,
      FileCategory.DOCUMENTS,
      { userId, makePublic },
    );
  }

  /**
   * Upload business document
   */
  async uploadBusinessDocument(
    file: MediaFile,
    userId: string,
  ): Promise<UploadResult> {
    this.logger.log(`🏢 Uploading business document for user ${userId}`);

    if (file.mimeType.startsWith('image/')) {
      const processed = await this.imageService.processImage(file.buffer, {
        maxWidth: 2000,
        maxHeight: 2000,
        quality: 90,
      });

      file = {
        ...file,
        buffer: processed.buffer,
        mimeType: processed.mimeType,
        size: processed.buffer.length,
      };
    }

    return this.spacesService.uploadFile(
      file,
      FileCategory.BUSINESS_DOCS,
      { userId, makePublic: false },
    );
  }

  /**
   * Upload social media content
   */
  async uploadMedia(
    file: MediaFile,
    userId: string,
    options?: { quality?: number; maxWidth?: number },
  ): Promise<UploadResult> {
    this.logger.log(`🎨 Uploading media for user ${userId}`);

    // Only process images
    if (file.mimeType.startsWith('image/')) {
      const processed = await this.imageService.processImage(file.buffer, {
        maxWidth: options?.maxWidth || 1920,
        maxHeight: 1920,
        quality: options?.quality || 85,
      });

      file = {
        ...file,
        buffer: processed.buffer,
        mimeType: processed.mimeType,
        size: processed.buffer.length,
      };
    }

    return this.spacesService.uploadFile(
      file,
      FileCategory.MEDIA,
      { userId, makePublic: true },
    );
  }

  /**
   * Upload event image
   */
  async uploadEventImage(
    file: MediaFile,
    userId: string,
    options?: { quality?: number; maxWidth?: number },
  ): Promise<UploadResult> {
    this.logger.log(`🎪 Uploading event image for user ${userId}`);

    // Process image for events
    if (file.mimeType.startsWith('image/')) {
      const processed = await this.imageService.processImage(file.buffer, {
        maxWidth: options?.maxWidth || 1920,
        maxHeight: 1920,
        quality: options?.quality || 85,
      });

      file = {
        ...file,
        buffer: processed.buffer,
        mimeType: processed.mimeType,
        size: processed.buffer.length,
      };
    }

    return this.spacesService.uploadFile(
      file,
      FileCategory.EVENT_IMAGES,
      { userId, makePublic: true },
    );
  }

  /**
   * Delete file
   */
  async deleteFile(key: string): Promise<boolean> {
    return this.spacesService.deleteFile(key);
  }

  /**
   * Delete multiple files
   */
  async deleteFiles(keys: string[]): Promise<{ deleted: string[]; failed: string[] }> {
    return this.spacesService.deleteFiles(keys);
  }

  /**
   * Delete old file and upload new one (atomic replace)
   */
  async replaceFile(
    oldKey: string,
    newFile: MediaFile,
    category: FileCategory,
    userId: string,
  ): Promise<UploadResult> {
    // Upload new file first
    const result = await this.spacesService.uploadFile(
      newFile,
      category,
      { userId },
    );

    // Delete old file (don't fail if deletion fails)
    if (oldKey) {
      await this.spacesService.deleteFile(oldKey).catch(err => {
        this.logger.warn(`Failed to delete old file ${oldKey}:`, err);
      });
    }

    return result;
  }

  /**
   * Get file URL
   */
  async getFileUrl(key: string, expiresIn?: number): Promise<string> {
    return this.spacesService.getFileUrl(key, expiresIn);
  }

  /**
   * Check if file exists
   */
  async fileExists(key: string): Promise<boolean> {
    return this.spacesService.fileExists(key);
  }

  /**
   * Get bucket statistics
   */
  async getBucketStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    lastModified: Date;
  }> {
    return this.spacesService.getBucketStats();
  }
}
