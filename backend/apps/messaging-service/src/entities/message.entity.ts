import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '@app/database/entities/user.entity';
import { Conversation } from './conversation.entity';
import { MessageReceipt } from './message-receipt.entity';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  LOCATION = 'location',
  FILE = 'file',
  SYSTEM = 'system',
}

@Entity('messages')
@Index(['conversationId', 'createdAt'])
@Index(['senderId'])
@Index(['replyToMessageId'], { where: 'reply_to_message_id IS NOT NULL' })
export class Message {
  @ApiProperty({ description: 'Unique identifier for the message' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'ID of the conversation this message belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ name: 'conversation_id', type: 'uuid' })
  conversationId: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @ApiProperty({
    description: 'ID of the user who sent the message',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ name: 'sender_id', type: 'uuid' })
  senderId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @ApiProperty({
    description: 'Content of the message',
    example: 'Hello! How are you doing?',
  })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({
    description: 'Type of the message',
    enum: MessageType,
    example: MessageType.TEXT,
    default: MessageType.TEXT,
  })
  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type: MessageType;

  @ApiProperty({
    description: 'ID of the message this is replying to',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @Column({ name: 'reply_to_message_id', type: 'uuid', nullable: true })
  replyToMessageId?: string;

  @ManyToOne(() => Message, { nullable: true })
  @JoinColumn({ name: 'reply_to_message_id' })
  replyToMessage?: Message;

  @ApiProperty({
    description: 'Additional metadata for the message (JSON)',
    example: { imageUrl: 'https://example.com/image.jpg', imageWidth: 800, imageHeight: 600 },
    required: false,
  })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Whether the message has been edited',
    default: false,
  })
  @Column({ name: 'is_edited', default: false })
  isEdited: boolean;

  @ApiProperty({
    description: 'Timestamp when the message was edited',
    required: false,
  })
  @Column({ name: 'edited_at', type: 'timestamp', nullable: true })
  editedAt?: Date;

  @ApiProperty({
    description: 'Whether the message has been deleted',
    default: false,
  })
  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  @ApiProperty({
    description: 'Timestamp when the message was deleted',
    required: false,
  })
  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @OneToMany(() => MessageReceipt, (receipt) => receipt.message, { cascade: true })
  receipts: MessageReceipt[];

  @ApiProperty({ description: 'Message creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper methods
  isTextMessage(): boolean {
    return this.type === MessageType.TEXT;
  }

  isMediaMessage(): boolean {
    return [MessageType.IMAGE, MessageType.VIDEO, MessageType.AUDIO, MessageType.FILE].includes(this.type);
  }

  isSystemMessage(): boolean {
    return this.type === MessageType.SYSTEM;
  }

  isLocationMessage(): boolean {
    return this.type === MessageType.LOCATION;
  }

  isReply(): boolean {
    return !!this.replyToMessageId;
  }

  getMediaUrl(): string | null {
    if (!this.isMediaMessage() || !this.metadata) {
      return null;
    }

    switch (this.type) {
      case MessageType.IMAGE:
        return this.metadata.imageUrl || null;
      case MessageType.VIDEO:
        return this.metadata.videoUrl || null;
      case MessageType.AUDIO:
        return this.metadata.audioUrl || null;
      case MessageType.FILE:
        return this.metadata.fileUrl || null;
      default:
        return null;
    }
  }

  getLocationData(): { latitude: number; longitude: number; address?: string } | null {
    if (!this.isLocationMessage() || !this.metadata?.location) {
      return null;
    }
    return this.metadata.location;
  }

  getImageDimensions(): { width: number; height: number } | null {
    if (this.type !== MessageType.IMAGE || !this.metadata) {
      return null;
    }
    return {
      width: this.metadata.imageWidth || 0,
      height: this.metadata.imageHeight || 0,
    };
  }

  getAudioDuration(): number | null {
    if (this.type !== MessageType.AUDIO || !this.metadata) {
      return null;
    }
    return this.metadata.audioDuration || null;
  }

  edit(newContent: string): void {
    this.content = newContent;
    this.isEdited = true;
    this.editedAt = new Date();
  }

  delete(): void {
    this.isDeleted = true;
    this.deletedAt = new Date();
  }

  restore(): void {
    this.isDeleted = false;
    this.deletedAt = undefined;
  }

  getDisplayContent(): string {
    if (this.isDeleted) {
      return 'This message was deleted';
    }

    if (this.isSystemMessage()) {
      return this.content;
    }

    if (this.isMediaMessage()) {
      const mediaType = this.type.charAt(0).toUpperCase() + this.type.slice(1);
      return `Sent a ${mediaType}`;
    }

    if (this.isLocationMessage()) {
      return 'Shared a location';
    }

    return this.content;
  }
}
