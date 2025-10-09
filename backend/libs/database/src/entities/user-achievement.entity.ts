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
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';
import { Achievement } from './achievement.entity';

@Entity('user_achievements')
@Index(['userId', 'achievementId'], { unique: true })
@Index(['userId', 'isUnlocked'])
export class UserAchievement {
  @ApiProperty({ description: 'User achievement ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID' })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Achievement ID' })
  @Column({ name: 'achievement_id', type: 'uuid' })
  achievementId: string;

  @ApiProperty({ description: 'Progress (0-100)' })
  @Column({ type: 'int', default: 0 })
  progress: number;

  @ApiProperty({ description: 'Is unlocked' })
  @Column({ name: 'is_unlocked', type: 'boolean', default: false })
  isUnlocked: boolean;

  @ApiProperty({ description: 'Unlocked at timestamp' })
  @Column({ name: 'unlocked_at', type: 'timestamp', nullable: true })
  unlockedAt?: Date;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Achievement, (achievement) => achievement.userAchievements)
  @JoinColumn({ name: 'achievement_id' })
  achievement: Achievement;
}
