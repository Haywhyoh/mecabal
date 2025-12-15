import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from './user.entity';
import { Post } from './post.entity';

export enum HelpOfferStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ContactMethod {
  PHONE = 'phone',
  MESSAGE = 'message',
  MEET = 'meet',
}

@Entity('help_offers')
@Index(['postId', 'userId'], { unique: true })
@Index(['postId', 'status'])
@Index(['userId', 'status'])
@Index(['status'])
export class HelpOffer {
  @ApiProperty({ description: 'Unique identifier for the help offer' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Post ID this offer is for' })
  @Column({ name: 'post_id', type: 'uuid' })
  postId: string;

  @ApiProperty({ description: 'User ID who is offering help' })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Message explaining how they can help' })
  @Column({ type: 'text' })
  message: string;

  @ApiProperty({
    description: 'Preferred contact method',
    enum: ContactMethod,
  })
  @Column({
    name: 'contact_method',
    type: 'enum',
    enum: ContactMethod,
  })
  contactMethod: ContactMethod;

  @ApiPropertyOptional({ description: 'Availability information' })
  @Column({ type: 'text', nullable: true })
  availability?: string;

  @ApiPropertyOptional({ description: 'Estimated time to complete' })
  @Column({ name: 'estimated_time', type: 'text', nullable: true })
  estimatedTime?: string;

  @ApiProperty({
    description: 'Status of the help offer',
    enum: HelpOfferStatus,
    default: HelpOfferStatus.PENDING,
  })
  @Column({
    type: 'enum',
    enum: HelpOfferStatus,
    default: HelpOfferStatus.PENDING,
  })
  status: HelpOfferStatus;

  @ApiPropertyOptional({ description: 'When the offer was accepted' })
  @Column({ name: 'accepted_at', type: 'timestamp', nullable: true })
  acceptedAt?: Date;

  @ApiProperty({ description: 'Help offer creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}

