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

export enum BadgeCategory {
  VERIFICATION = 'verification',
  LEADERSHIP = 'leadership',
  CONTRIBUTION = 'contribution',
  SAFETY = 'safety',
  BUSINESS = 'business',
}

@Entity('user_badges')
@Index(['userId', 'isActive'])
export class UserBadge {
  @ApiProperty({ description: 'Badge ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID' })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Badge type' })
  @Column({ name: 'badge_type', length: 50 })
  badgeType: string;

  @ApiProperty({ description: 'Badge category', enum: BadgeCategory })
  @Column({ name: 'badge_category', type: 'varchar', length: 50 })
  badgeCategory: BadgeCategory;

  @ApiProperty({ description: 'Awarded at timestamp' })
  @Column({ name: 'awarded_at', type: 'timestamp' })
  awardedAt: Date;

  @ApiProperty({ description: 'Awarded by (admin user ID)' })
  @Column({ name: 'awarded_by', type: 'uuid', nullable: true })
  awardedBy?: string;

  @ApiProperty({ description: 'Is active' })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Revoked at timestamp' })
  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revokedAt?: Date;

  @ApiProperty({ description: 'Revoked by (admin user ID)' })
  @Column({ name: 'revoked_by', type: 'uuid', nullable: true })
  revokedBy?: string;

  @ApiProperty({ description: 'Revocation reason' })
  @Column({ name: 'revocation_reason', type: 'text', nullable: true })
  revocationReason?: string;

  @ApiProperty({ description: 'Metadata' })
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
