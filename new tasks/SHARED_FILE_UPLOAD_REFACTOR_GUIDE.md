# Shared File Upload Service - Refactor Guide
**MeCabal - Reusing DigitalOcean Spaces Service**
*Moving File Upload to Common Library*

---

## Overview

You already have a working DigitalOcean Spaces service in `social-service`. Instead of creating duplicate file upload services, we'll:

1. **Move** `DigitalOceanSpacesService` to a shared library (`@app/common`)
2. **Enhance** it to support multiple upload types (avatars, documents, media)
3. **Reuse** it across User Service, Social Service, and future services
4. **Update** Social Service to use the shared version

---

## Current Situation

### Existing Service Location
```
backend/apps/social-service/src/media/digitalocean-spaces.service.ts
```

**Current Features:**
- ✅ S3-compatible upload to DigitalOcean Spaces
- ✅ File deletion
- ✅ URL generation
- ✅ Image processing placeholder
- ✅ Bucket stats
- ✅ Comprehensive logging
- ✅ Timeout handling

**Current Usage:**
- Only in Social Service for media uploads

---

## Refactoring Plan

### Step 1: Create Shared Storage Module (30 minutes)

#### 1.1: Create Storage Library Structure

```bash
cd backend/libs
mkdir -p storage/src
cd storage
```

Create basic files:

**File:** `backend/libs/storage/src/storage.module.ts`

```typescript
import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DigitalOceanSpacesService } from './services/digitalocean-spaces.service';
import { FileUploadService } from './services/file-upload.service';
import { ImageProcessingService } from './services/image-processing.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    DigitalOceanSpacesService,
    FileUploadService,
    ImageProcessingService,
  ],
  exports: [
    DigitalOceanSpacesService,
    FileUploadService,
    ImageProcessingService,
  ],
})
export class StorageModule {}
```

**File:** `backend/libs/storage/src/index.ts`

```typescript
export * from './storage.module';
export * from './services/digitalocean-spaces.service';
export * from './services/file-upload.service';
export * from './services/image-processing.service';
export * from './interfaces/upload.interface';
export * from './enums/file-type.enum';
```

**File:** `backend/libs/storage/tsconfig.lib.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "declaration": true,
    "outDir": "../../dist/libs/storage"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test", "**/*spec.ts"]
}
```

---

### Step 2: Move and Enhance DigitalOcean Spaces Service (1 hour)

#### 2.1: Copy and Enhance the Service

**File:** `backend/libs/storage/src/services/digitalocean-spaces.service.ts`

```typescript
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
```

---

### Step 3: Create Supporting Files

#### 3.1: File Type Enum

**File:** `backend/libs/storage/src/enums/file-type.enum.ts`

```typescript
export enum FileCategory {
  AVATARS = 'avatars',
  DOCUMENTS = 'documents',
  MEDIA = 'media',
  BUSINESS_DOCS = 'business-docs',
  EVENT_IMAGES = 'event-images',
}
```

#### 3.2: Upload Interfaces

**File:** `backend/libs/storage/src/interfaces/upload.interface.ts`

```typescript
export interface UploadResult {
  url: string;
  key: string;
  size: number;
  mimeType: string;
  bucket: string;
  etag?: string;
}

export interface MediaFile {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface UploadOptions {
  userId?: string;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  makePublic?: boolean;
}
```

#### 3.3: Image Processing Service

**File:** `backend/libs/storage/src/services/image-processing.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';

export interface ImageProcessingOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);

  /**
   * Process image with sharp
   */
  async processImage(
    buffer: Buffer,
    options: ImageProcessingOptions = {},
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    try {
      const {
        quality = 85,
        maxWidth = 2000,
        maxHeight = 2000,
        format = 'jpeg',
      } = options;

      this.logger.log('🖼️ Processing image with sharp');
      this.logger.log(`  - Quality: ${quality}`);
      this.logger.log(`  - Max dimensions: ${maxWidth}x${maxHeight}`);
      this.logger.log(`  - Format: ${format}`);

      let processor = sharp(buffer).rotate(); // Auto-rotate based on EXIF

      // Resize if needed
      if (maxWidth || maxHeight) {
        processor = processor.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      // Convert format
      let mimeType = 'image/jpeg';
      switch (format) {
        case 'png':
          processor = processor.png({ quality, compressionLevel: 9 });
          mimeType = 'image/png';
          break;
        case 'webp':
          processor = processor.webp({ quality });
          mimeType = 'image/webp';
          break;
        default:
          processor = processor.jpeg({ quality, progressive: true });
          mimeType = 'image/jpeg';
      }

      const processedBuffer = await processor.toBuffer();

      this.logger.log(
        `✅ Image processed: ${buffer.length} → ${processedBuffer.length} bytes`,
      );

      return {
        buffer: processedBuffer,
        mimeType,
      };
    } catch (error) {
      this.logger.error('❌ Error processing image:', error);
      // Return original if processing fails
      return {
        buffer,
        mimeType: 'image/jpeg',
      };
    }
  }

  /**
   * Create thumbnail
   */
  async createThumbnail(
    buffer: Buffer,
    width: number = 200,
    height: number = 200,
  ): Promise<Buffer> {
    return sharp(buffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  }

  /**
   * Get image metadata
   */
  async getImageMetadata(buffer: Buffer): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
  }> {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: buffer.length,
    };
  }
}
```

#### 3.4: High-Level File Upload Service

**File:** `backend/libs/storage/src/services/file-upload.service.ts`

```typescript
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
   * Delete file
   */
  async deleteFile(key: string): Promise<boolean> {
    return this.spacesService.deleteFile(key);
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
}
```

---

### Step 4: Update tsconfig and package.json

**File:** `backend/tsconfig.json`

Add to `paths`:

```json
{
  "compilerOptions": {
    "paths": {
      "@app/storage": ["libs/storage/src"],
      "@app/storage/*": ["libs/storage/src/*"],
      // ... other paths
    }
  }
}
```

**File:** `backend/package.json`

Ensure sharp is installed:

```bash
npm install sharp
npm install --save-dev @types/sharp
```

---

### Step 5: Update User Service to Use Shared Storage

**File:** `backend/apps/user-service/src/user-service.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { StorageModule } from '@app/storage'; // Add this import

@Module({
  imports: [
    // ... other imports
    StorageModule, // Add this
  ],
  // ... rest of module
})
export class UserServiceModule {}
```

**File:** `backend/apps/user-service/src/controllers/user-profile.controller.ts`

Update avatar upload endpoint:

```typescript
import { FileUploadService } from '@app/storage';

@Controller('users')
export class UserProfileController {
  constructor(
    private readonly userProfileService: UserProfileService,
    private readonly fileUploadService: FileUploadService, // Changed from DigitalOceanSpacesService
  ) {}

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ avatarUrl: string }> {
    // Delete old avatar if exists
    if (user.profilePictureUrl) {
      const oldKey = user.profilePictureUrl.split('/').slice(-2).join('/');
      await this.fileUploadService.deleteFile(oldKey).catch(() => {});
    }

    // Upload new avatar (automatically processed)
    const result = await this.fileUploadService.uploadAvatar(
      {
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
      user.id,
    );

    // Update user profile
    await this.userProfileService.updateAvatar(user.id, result.url);

    return { avatarUrl: result.url };
  }
}
```

---

### Step 6: Update Social Service to Use Shared Storage

**File:** `backend/apps/social-service/src/social-service.module.ts`

```typescript
import { StorageModule } from '@app/storage';

@Module({
  imports: [
    // ... other imports
    StorageModule, // Add this
  ],
  // Remove DigitalOceanSpacesService from providers since it's now in StorageModule
})
export class SocialServiceModule {}
```

**File:** `backend/apps/social-service/src/media/media.service.ts`

Update to use shared service:

```typescript
import { FileUploadService } from '@app/storage';

@Injectable()
export class MediaService {
  constructor(
    private readonly fileUploadService: FileUploadService, // Changed
  ) {}

  async uploadMedia(file: Express.Multer.File, userId: string) {
    return this.fileUploadService.uploadMedia(
      {
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
      userId,
    );
  }
}
```

**File:** Delete the old service (or mark deprecated):

```bash
# Optionally delete the old service file
rm backend/apps/social-service/src/media/digitalocean-spaces.service.ts
```

---

### Step 7: Update Verification Service to Use Shared Storage

**File:** `backend/apps/verification-service/src/verification.module.ts` (when created)

```typescript
import { StorageModule } from '@app/storage';

@Module({
  imports: [
    StorageModule,
    // ... other imports
  ],
})
export class VerificationServiceModule {}
```

Usage in verification service:

```typescript
import { FileUploadService } from '@app/storage';

@Injectable()
export class DocumentVerificationService {
  constructor(
    private readonly fileUploadService: FileUploadService,
  ) {}

  async uploadIdentityDocument(
    file: Express.Multer.File,
    userId: string,
  ) {
    return this.fileUploadService.uploadDocument(
      {
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
      userId,
      false, // Keep documents private
    );
  }
}
```

---

## Benefits of This Approach

### ✅ Code Reuse
- One DigitalOcean Spaces implementation for all services
- Shared image processing logic
- Consistent file organization

### ✅ Easy Maintenance
- Update upload logic in one place
- Fix bugs once, benefit everywhere
- Add new features globally

### ✅ Type Safety
- Shared interfaces and enums
- TypeScript types across services
- Better IDE autocomplete

### ✅ Separation of Concerns
- Low-level: DigitalOceanSpacesService (S3 operations)
- Mid-level: ImageProcessingService (image manipulation)
- High-level: FileUploadService (business logic)

### ✅ Flexibility
- Easy to add new storage providers (AWS S3, Azure, etc.)
- Can implement fallback strategies
- Simple to add new file categories

---

## Migration Checklist

- [ ] Create `backend/libs/storage` directory structure
- [ ] Copy and enhance DigitalOceanSpacesService
- [ ] Create FileUploadService
- [ ] Create ImageProcessingService
- [ ] Create enums and interfaces
- [ ] Update tsconfig.json paths
- [ ] Install sharp package
- [ ] Update User Service to use shared storage
- [ ] Update Social Service to use shared storage
- [ ] Remove old DigitalOceanSpacesService from social-service
- [ ] Test avatar uploads in User Service
- [ ] Test media uploads in Social Service
- [ ] Update environment variables if needed
- [ ] Deploy shared library first, then services

---

## Testing the Migration

### Test Avatar Upload
```bash
curl -X POST http://localhost:3002/users/me/avatar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "avatar=@test-avatar.jpg"
```

### Test Media Upload (Social Service)
```bash
curl -X POST http://localhost:3003/media/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-image.jpg"
```

### Test Document Upload (Verification Service)
```bash
curl -X POST http://localhost:3XXX/verification/document/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "document=@test-doc.pdf"
```

---

## Conclusion

By moving the DigitalOcean Spaces service to a shared library:
- ✅ **No duplication** - Reuse existing working code
- ✅ **Enhanced features** - Add image processing, file categories, better validation
- ✅ **Future-proof** - Easy to extend for new services
- ✅ **Consistent** - Same upload behavior across all services

This approach follows NestJS best practices for shared libraries and makes your codebase more maintainable!
