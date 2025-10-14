import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '@app/database/entities/user.entity';
import { ConversationParticipant } from './conversation-participant.entity';
import { Message } from './message.entity';

export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
  COMMUNITY = 'community',
}

export enum ContextType {
  EVENT = 'event',
  BUSINESS = 'business',
  LISTING = 'listing',
  GENERAL = 'general',
}

@Entity('conversations')
@Index(['contextType', 'contextId'])
@Index(['updatedAt'])
@Index(['lastMessageAt'])
export class Conversation {
  @ApiProperty({ description: 'Unique identifier for the conversation' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Type of conversation',
    enum: ConversationType,
    example: ConversationType.DIRECT,
  })
  @Column({
    type: 'enum',
    enum: ConversationType,
  })
  type: ConversationType;

  @ApiProperty({
    description: 'Conversation title',
    example: 'Event Discussion',
    required: false,
  })
  @Column({ nullable: true })
  title?: string;

  @ApiProperty({
    description: 'Conversation description',
    example: 'Discussion about the upcoming community event',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({
    description: 'Conversation avatar URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  // Context - What this conversation is about
  @ApiProperty({
    description: 'Context type of the conversation',
    enum: ContextType,
    example: ContextType.EVENT,
    required: false,
  })
  @Column({
    type: 'enum',
    enum: ContextType,
    name: 'context_type',
    nullable: true,
  })
  contextType?: ContextType;

  @ApiProperty({
    description: 'ID of the related context (event, business, listing)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @Column({ name: 'context_id', type: 'uuid', nullable: true })
  contextId?: string;

  @ApiProperty({
    description: 'Whether the conversation is archived',
    default: false,
  })
  @Column({ name: 'is_archived', default: false })
  isArchived: boolean;

  @ApiProperty({
    description: 'ID of the user who created the conversation',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ name: 'creator_id', type: 'uuid' })
  creatorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @OneToMany(() => ConversationParticipant, (participant) => participant.conversation, { cascade: true })
  participants: ConversationParticipant[];

  @OneToMany(() => Message, (message) => message.conversation, { cascade: true })
  messages: Message[];

  @ApiProperty({ description: 'Conversation creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Timestamp of the last message in the conversation',
    required: false,
  })
  @Column({ name: 'last_message_at', type: 'timestamp', nullable: true })
  lastMessageAt?: Date;

  // Helper methods
  getParticipantCount(): number {
    return this.participants?.length || 0;
  }

  getMessageCount(): number {
    return this.messages?.length || 0;
  }

  getLastMessage(): Message | null {
    if (!this.messages || this.messages.length === 0) {
      return null;
    }
    return this.messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  }

  isDirectMessage(): boolean {
    return this.type === ConversationType.DIRECT;
  }

  isGroupMessage(): boolean {
    return this.type === ConversationType.GROUP;
  }

  isCommunityMessage(): boolean {
    return this.type === ConversationType.COMMUNITY;
  }

  hasContext(): boolean {
    return !!(this.contextType && this.contextId);
  }

  getContextDescription(): string {
    if (!this.hasContext()) return 'General conversation';
    
    switch (this.contextType) {
      case ContextType.EVENT:
        return 'Event discussion';
      case ContextType.BUSINESS:
        return 'Business inquiry';
      case ContextType.LISTING:
        return 'Marketplace listing';
      default:
        return 'General conversation';
    }
  }
}
