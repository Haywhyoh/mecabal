import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Relation,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Event } from './event.entity';

@Entity('event_media')
@Index(['eventId'])
@Index(['displayOrder'])
export class EventMedia {
  @ApiProperty({ description: 'Unique identifier for the event media' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Event ID this media belongs to' })
  @Column({ name: 'event_id' })
  eventId: string;

  @ApiProperty({
    description: 'Media URL',
    example: 'https://example.com/images/event-cover.jpg',
  })
  @Column({ type: 'text' })
  url: string;

  @ApiProperty({
    description: 'Media type',
    enum: ['image', 'video'],
    example: 'image',
  })
  @Column({ length: 20 })
  type: 'image' | 'video';

  @ApiProperty({
    description: 'Media caption',
    example: 'Event venue entrance',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  caption?: string;

  @ApiProperty({
    description: 'Display order for sorting media',
    default: 0,
  })
  @Column({ name: 'display_order', default: 0 })
  displayOrder: number;

  @ApiProperty({ description: 'Media creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne('Event', 'media', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: any;

  // Helper methods
  isImage(): boolean {
    return this.type === 'image';
  }

  isVideo(): boolean {
    return this.type === 'video';
  }

  getFileExtension(): string {
    try {
      const url = new URL(this.url);
      const pathname = url.pathname;
      const extension = pathname.split('.').pop()?.toLowerCase();
      return extension || '';
    } catch {
      return '';
    }
  }

  isImageFile(): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    return imageExtensions.includes(this.getFileExtension());
  }

  isVideoFile(): boolean {
    const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
    return videoExtensions.includes(this.getFileExtension());
  }
}
