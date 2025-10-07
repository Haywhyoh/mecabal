import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('comment_media')
@Index(['commentId'])
export class CommentMedia {
  @ApiProperty({ description: 'Unique identifier for the comment media' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Comment ID this media belongs to' })
  @Column({ name: 'comment_id' })
  commentId: string;

  @ApiProperty({
    description: 'Type of media',
    enum: ['image', 'video'],
    example: 'image',
  })
  @Column({ name: 'media_type', length: 20 })
  mediaType: string;

  // Alias for compatibility
  get type(): string {
    return this.mediaType;
  }

  set type(value: string) {
    this.mediaType = value;
  }

  @ApiProperty({ description: 'URL to the media file' })
  @Column({ name: 'file_url', type: 'text' })
  fileUrl: string;

  @ApiProperty({ description: 'Media caption', required: false })
  @Column({ type: 'text', nullable: true })
  caption?: string;

  // Alias for compatibility
  get url(): string {
    return this.fileUrl;
  }

  set url(value: string) {
    this.fileUrl = value;
  }

  @ApiProperty({
    description: 'URL to thumbnail (for videos/images)',
    required: false,
  })
  @Column({ name: 'thumbnail_url', type: 'text', nullable: true })
  thumbnailUrl?: string;

  @ApiProperty({ description: 'File size in bytes', required: false })
  @Column({ name: 'file_size', nullable: true })
  fileSize?: number;

  @ApiProperty({ description: 'MIME type of the file', example: 'image/jpeg' })
  @Column({ name: 'mime_type', length: 100, nullable: true })
  mimeType?: string;

  @ApiProperty({
    description: 'Duration in seconds (for video)',
    required: false,
  })
  @Column({ name: 'duration_seconds', nullable: true })
  durationSeconds?: number;

  @ApiProperty({
    description: 'Media dimensions (width/height)',
    required: false,
  })
  @Column({ type: 'jsonb', nullable: true })
  dimensions?: { width: number; height: number };

  @ApiProperty({ description: 'Order of media in the comment' })
  @Column({ name: 'upload_order', default: 0 })
  uploadOrder: number;

  @ApiProperty({ description: 'Media upload timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // No relation needed - we only query from PostComment to CommentMedia, not the other way

  // Helper methods
  isImage(): boolean {
    return this.mediaType === 'image';
  }

  isVideo(): boolean {
    return this.mediaType === 'video';
  }

  getFormattedFileSize(): string {
    if (!this.fileSize) return 'Unknown';

    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (this.fileSize === 0) return '0 Bytes';

    const i = Math.floor(Math.log(this.fileSize) / Math.log(1024));
    return (
      Math.round((this.fileSize / Math.pow(1024, i)) * 100) / 100 +
      ' ' +
      sizes[i]
    );
  }
}