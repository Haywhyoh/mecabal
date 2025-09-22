import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

@Entity('media')
@Index(['uploadedBy'])
@Index(['type'])
@Index(['uploadedAt'])
export class Media {
  @ApiProperty({ description: 'Unique identifier for the media' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Media file URL' })
  @Column({ type: 'text' })
  url: string;

  @ApiProperty({ description: 'Media type', enum: ['image', 'video'] })
  @Column({ name: 'media_type', length: 20 })
  type: 'image' | 'video';

  @ApiProperty({ description: 'Media caption', required: false })
  @Column({ type: 'text', nullable: true })
  caption?: string;

  @ApiProperty({ description: 'File size in bytes' })
  @Column({ name: 'file_size' })
  size: number;

  @ApiProperty({ description: 'Image width', required: false })
  @Column({ name: 'width', nullable: true })
  width?: number;

  @ApiProperty({ description: 'Image height', required: false })
  @Column({ name: 'height', nullable: true })
  height?: number;

  @ApiProperty({ description: 'File MIME type' })
  @Column({ name: 'mime_type', length: 100 })
  mimeType: string;

  @ApiProperty({ description: 'Original filename' })
  @Column({ name: 'original_filename', length: 255 })
  originalFilename: string;

  @ApiProperty({ description: 'Storage path in DigitalOcean Spaces' })
  @Column({ name: 'storage_path', type: 'text' })
  storagePath: string;

  @ApiProperty({ description: 'User ID who uploaded the media' })
  @Column({ name: 'uploaded_by' })
  uploadedBy: string;

  @ApiProperty({ description: 'Media upload timestamp' })
  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User;
}
