import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '@app/database/entities/user.entity';
import { Conversation } from './conversation.entity';

export enum ParticipantRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Entity('conversation_participants')
@Unique(['conversationId', 'userId'])
@Index(['userId'])
@Index(['userId', 'unreadCount'], { where: 'unread_count > 0' })
export class ConversationParticipant {
  @ApiProperty({ description: 'Unique identifier for the participant' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'ID of the conversation',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ name: 'conversation_id', type: 'uuid' })
  conversationId: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @ApiProperty({
    description: 'ID of the user participant',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({
    description: 'Role of the participant in the conversation',
    enum: ParticipantRole,
    example: ParticipantRole.MEMBER,
    default: ParticipantRole.MEMBER,
  })
  @Column({
    type: 'enum',
    enum: ParticipantRole,
    default: ParticipantRole.MEMBER,
  })
  role: ParticipantRole;

  @ApiProperty({
    description: 'Whether the participant has muted the conversation',
    default: false,
  })
  @Column({ name: 'is_muted', default: false })
  isMuted: boolean;

  @ApiProperty({
    description: 'Whether the participant has pinned the conversation',
    default: false,
  })
  @Column({ name: 'is_pinned', default: false })
  isPinned: boolean;

  @ApiProperty({
    description: 'ID of the last read message',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @Column({ name: 'last_read_message_id', type: 'uuid', nullable: true })
  lastReadMessageId?: string;

  @ApiProperty({
    description: 'Timestamp when the participant last read messages',
    required: false,
  })
  @Column({ name: 'last_read_at', type: 'timestamp', nullable: true })
  lastReadAt?: Date;

  @ApiProperty({
    description: 'Number of unread messages for this participant',
    default: 0,
  })
  @Column({ name: 'unread_count', default: 0 })
  unreadCount: number;

  @ApiProperty({ description: 'When the participant joined the conversation' })
  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;

  @ApiProperty({
    description: 'When the participant left the conversation',
    required: false,
  })
  @Column({ name: 'left_at', type: 'timestamp', nullable: true })
  leftAt?: Date;

  // Helper methods
  isActive(): boolean {
    return !this.leftAt;
  }

  isAdmin(): boolean {
    return this.role === ParticipantRole.ADMIN;
  }

  isMember(): boolean {
    return this.role === ParticipantRole.MEMBER;
  }

  hasUnreadMessages(): boolean {
    return this.unreadCount > 0;
  }

  markAsRead(messageId: string): void {
    this.lastReadMessageId = messageId;
    this.lastReadAt = new Date();
    this.unreadCount = 0;
  }

  incrementUnreadCount(): void {
    this.unreadCount += 1;
  }

  resetUnreadCount(): void {
    this.unreadCount = 0;
  }

  leave(): void {
    this.leftAt = new Date();
  }

  rejoin(): void {
    this.leftAt = undefined;
  }
}
