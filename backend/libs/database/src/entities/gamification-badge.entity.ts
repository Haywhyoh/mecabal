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
import { Badge } from './badge.entity';

@Entity('gamification_badges')
@Index(['userId', 'badgeId'], { unique: true })
@Index(['userId', 'isDisplayed'])
export class GamificationBadge {
  @ApiProperty({ description: 'Gamification badge ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID' })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Badge ID' })
  @Column({ name: 'badge_id', type: 'uuid' })
  badgeId: string;

  @ApiProperty({ description: 'Earned at timestamp' })
  @Column({ name: 'earned_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  earnedAt: Date;

  @ApiProperty({ description: 'Is claimed' })
  @Column({ name: 'is_claimed', type: 'boolean', default: false })
  isClaimed: boolean;

  @ApiProperty({ description: 'Claimed at timestamp' })
  @Column({ name: 'claimed_at', type: 'timestamp', nullable: true })
  claimedAt?: Date;

  @ApiProperty({ description: 'Is displayed' })
  @Column({ name: 'is_displayed', type: 'boolean', default: true })
  isDisplayed: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Badge, (badge) => badge.gamificationBadges)
  @JoinColumn({ name: 'badge_id' })
  badge: Badge;
}
