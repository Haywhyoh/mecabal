import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '@app/database/entities/user.entity';
import { Conversation } from './conversation.entity';

@Entity('typing_indicators')
@Index(['conversationId', 'expiresAt'], { where: 'is_typing = TRUE' })
export class TypingIndicator {
  @ApiProperty({
    description: 'ID of the conversation',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryColumn({ name: 'conversation_id', type: 'uuid' })
  conversationId: string;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @ApiProperty({
    description: 'ID of the user who is typing',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({
    description: 'Whether the user is currently typing',
    default: true,
  })
  @Column({ name: 'is_typing', default: true })
  isTyping: boolean;

  @ApiProperty({
    description: 'When the typing indicator was last updated',
  })
  @CreateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ApiProperty({
    description: 'When the typing indicator expires (5 seconds from last update)',
  })
  @Column({
    name: 'expires_at',
    type: 'timestamp',
    default: () => "NOW() + INTERVAL '5 seconds'",
  })
  expiresAt: Date;

  // Helper methods
  isActive(): boolean {
    return this.isTyping && this.expiresAt > new Date();
  }

  isExpired(): boolean {
    return this.expiresAt <= new Date();
  }

  startTyping(): void {
    this.isTyping = true;
    this.updatedAt = new Date();
    this.expiresAt = new Date(Date.now() + 5000); // 5 seconds from now
  }

  stopTyping(): void {
    this.isTyping = false;
    this.updatedAt = new Date();
  }

  extendTyping(): void {
    if (this.isTyping) {
      this.updatedAt = new Date();
      this.expiresAt = new Date(Date.now() + 5000); // Extend by 5 seconds
    }
  }

  getTimeUntilExpiry(): number {
    return Math.max(0, this.expiresAt.getTime() - Date.now());
  }

  isAboutToExpire(): boolean {
    return this.getTimeUntilExpiry() < 1000; // Less than 1 second
  }
}
