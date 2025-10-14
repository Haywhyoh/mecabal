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
import { Message } from './message.entity';

export enum ReceiptStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

@Entity('message_receipts')
@Unique(['messageId', 'userId'])
@Index(['messageId'])
@Index(['userId', 'status'], { where: "status != 'read'" })
export class MessageReceipt {
  @ApiProperty({ description: 'Unique identifier for the receipt' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'ID of the message this receipt is for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ name: 'message_id', type: 'uuid' })
  messageId: string;

  @ManyToOne(() => Message, (message) => message.receipts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message: Message;

  @ApiProperty({
    description: 'ID of the user this receipt is for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({
    description: 'Status of the message receipt',
    enum: ReceiptStatus,
    example: ReceiptStatus.SENT,
  })
  @Column({
    type: 'enum',
    enum: ReceiptStatus,
  })
  status: ReceiptStatus;

  @ApiProperty({
    description: 'Timestamp when the receipt was created',
  })
  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;

  // Helper methods
  isSent(): boolean {
    return this.status === ReceiptStatus.SENT;
  }

  isDelivered(): boolean {
    return this.status === ReceiptStatus.DELIVERED;
  }

  isRead(): boolean {
    return this.status === ReceiptStatus.READ;
  }

  markAsDelivered(): void {
    this.status = ReceiptStatus.DELIVERED;
  }

  markAsRead(): void {
    this.status = ReceiptStatus.READ;
  }

  getStatusText(): string {
    switch (this.status) {
      case ReceiptStatus.SENT:
        return 'Sent';
      case ReceiptStatus.DELIVERED:
        return 'Delivered';
      case ReceiptStatus.READ:
        return 'Read';
      default:
        return 'Unknown';
    }
  }

  getStatusIcon(): string {
    switch (this.status) {
      case ReceiptStatus.SENT:
        return '✓';
      case ReceiptStatus.DELIVERED:
        return '✓✓';
      case ReceiptStatus.READ:
        return '✓✓';
      default:
        return '?';
    }
  }
}
