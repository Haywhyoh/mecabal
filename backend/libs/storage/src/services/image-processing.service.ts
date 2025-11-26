import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';

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
      // Ensure numeric values (convert strings to numbers)
      const quality = typeof options.quality === 'string' 
        ? parseFloat(options.quality) 
        : (options.quality ?? 85);
      const maxWidth = typeof options.maxWidth === 'string' 
        ? parseInt(options.maxWidth, 10) 
        : (options.maxWidth ?? 2000);
      const maxHeight = typeof options.maxHeight === 'string' 
        ? parseInt(options.maxHeight, 10) 
        : (options.maxHeight ?? 2000);
      const format = options.format ?? 'jpeg';

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
