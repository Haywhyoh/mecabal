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

export enum ActivityType {
  POST = 'post',
  COMMENT = 'comment',
  EVENT_CREATED = 'event_created',
  EVENT_ATTENDED = 'event_attended',
  SAFETY_ALERT = 'safety_alert',
  LISTING_CREATED = 'listing_created',
  LISTING_PURCHASED = 'listing_purchased',
  PROFILE_COMPLETED = 'profile_completed',
  VERIFICATION_COMPLETED = 'verification_completed',
  HELP_REQUEST = 'help_request',
  HELP_PROVIDED = 'help_provided',
  REVIEW_GIVEN = 'review_given',
  REVIEW_RECEIVED = 'review_received',
  COMMUNITY_ENDORSEMENT = 'community_endorsement',
  DAILY_LOGIN = 'daily_login',
}

@Entity('user_activity_log')
@Index(['userId', 'activityType', 'createdAt'])
@Index(['referenceType', 'referenceId'])
export class UserActivityLog {
  @ApiProperty({ description: 'Activity log ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID' })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Activity type', enum: ActivityType })
  @Column({ name: 'activity_type', type: 'varchar', length: 50 })
  activityType: ActivityType;

  @ApiProperty({ description: 'Points earned' })
  @Column({ name: 'points_earned', type: 'int' })
  pointsEarned: number;

  @ApiProperty({ description: 'Multiplier applied' })
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 1.0 })
  multiplier: number;

  @ApiProperty({ description: 'Reference type' })
  @Column({ name: 'reference_type', type: 'varchar', length: 50, nullable: true })
  referenceType?: string;

  @ApiProperty({ description: 'Reference ID' })
  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId?: string;

  @ApiProperty({ description: 'Additional metadata' })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
