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
import { User } from './user.entity';
import { Neighborhood } from './neighborhood.entity';
import { PostCategory } from './post-category.entity';
import { PostMedia } from './post-media.entity';
import { PostReaction } from './post-reaction.entity';
import { PostComment } from './post-comment.entity';

@Entity('posts')
@Index(['neighborhoodId', 'createdAt'])
@Index(['userId'])
@Index(['categoryId'])
export class Post {
  @ApiProperty({ description: 'Unique identifier for the post' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID who created the post' })
  @Column({ name: 'user_id' })
  userId: string;

  @ApiProperty({ description: 'Neighborhood ID where post was made' })
  @Column({ name: 'neighborhood_id' })
  neighborhoodId: string;

  @ApiProperty({ description: 'Post category ID', required: false })
  @Column({ name: 'category_id', nullable: true })
  categoryId?: number;

  @ApiProperty({
    description: 'Post title',
    example: 'Community BBQ This Weekend',
  })
  @Column({ length: 200, nullable: true })
  title?: string;

  @ApiProperty({ description: 'Post content' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({
    description: 'Type of post',
    enum: ['general', 'event', 'alert', 'marketplace', 'lost_found', 'help'],
    example: 'general',
  })
  @Column({ name: 'post_type', length: 20, default: 'general' })
  postType: string;

  // Help-specific fields
  @ApiProperty({
    description: 'Help category (required if postType is help)',
    enum: ['errand', 'task', 'recommendation', 'advice', 'borrow'],
    required: false,
  })
  @Column({ name: 'help_category', length: 50, nullable: true })
  helpCategory?: string;

  @ApiProperty({
    description: 'Urgency level for help requests',
    enum: ['low', 'medium', 'high'],
    required: false,
  })
  @Column({ name: 'urgency', length: 20, nullable: true })
  urgency?: string;

  @ApiProperty({
    description: 'Budget for help request',
    example: '₦50,000',
    required: false,
  })
  @Column({ name: 'budget', length: 100, nullable: true })
  budget?: string;

  @ApiProperty({
    description: 'Deadline for help request',
    required: false,
  })
  @Column({ name: 'deadline', type: 'timestamp', nullable: true })
  deadline?: Date;

  // Borrow-specific fields
  @ApiProperty({
    description: 'Borrow duration (for borrow requests)',
    enum: ['few_hours', 'day', 'few_days', 'week'],
    required: false,
  })
  @Column({ name: 'borrow_duration', length: 50, nullable: true })
  borrowDuration?: string;

  @ApiProperty({
    description: 'Item to borrow (for borrow requests)',
    required: false,
  })
  @Column({ name: 'borrow_item', length: 200, nullable: true })
  borrowItem?: string;

  @ApiProperty({
    description: 'Item condition notes (for borrow requests)',
    required: false,
  })
  @Column({ name: 'item_condition', type: 'text', nullable: true })
  itemCondition?: string;

  // Task-specific fields
  @ApiProperty({
    description: 'Task type (for task requests)',
    required: false,
  })
  @Column({ name: 'task_type', length: 50, nullable: true })
  taskType?: string;

  @ApiProperty({
    description: 'Estimated duration (for task requests)',
    required: false,
  })
  @Column({ name: 'estimated_duration', length: 100, nullable: true })
  estimatedDuration?: string;

  @ApiProperty({
    description: 'Privacy level of the post',
    enum: ['neighborhood', 'group', 'public'],
    example: 'neighborhood',
  })
  @Column({ name: 'privacy_level', length: 20, default: 'neighborhood' })
  privacyLevel: string;

  @ApiProperty({ description: 'Whether post is pinned' })
  @Column({ name: 'is_pinned', default: false })
  isPinned: boolean;

  @ApiProperty({ description: 'Whether post is approved' })
  @Column({ name: 'is_approved', default: true })
  isApproved: boolean;

  @ApiProperty({
    description: 'Moderation status',
    enum: ['pending', 'approved', 'rejected'],
    example: 'approved',
  })
  @Column({ name: 'moderation_status', length: 20, default: 'approved' })
  moderationStatus: string;

  @ApiProperty({
    description: 'User ID who moderated the post',
    required: false,
  })
  @Column({ name: 'moderated_by', nullable: true })
  moderatedBy?: string;

  @ApiProperty({ description: 'When post was moderated', required: false })
  @Column({ name: 'moderated_at', type: 'timestamp', nullable: true })
  moderatedAt?: Date;

  @ApiProperty({ description: 'Post expiration time', required: false })
  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @ApiProperty({ description: 'Post creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Neighborhood, (neighborhood) => neighborhood.posts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'neighborhood_id' })
  neighborhood: Neighborhood;

  @ManyToOne(() => PostCategory, (category) => category.posts, {
    nullable: true,
  })
  @JoinColumn({ name: 'category_id' })
  category?: PostCategory;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'moderated_by' })
  moderator?: User;

  @OneToMany(() => PostMedia, (media) => media.post)
  media: PostMedia[];

  @OneToMany(() => PostReaction, (reaction) => reaction.post)
  reactions: PostReaction[];

  @OneToMany(() => PostComment, (comment) => comment.post)
  comments: PostComment[];

  // Helper methods
  isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }

  isVisible(): boolean {
    return (
      this.isApproved &&
      this.moderationStatus === 'approved' &&
      !this.isExpired()
    );
  }
}
