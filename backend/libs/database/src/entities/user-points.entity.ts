import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

@Entity('user_points')
@Index(['totalPoints'])
@Index(['rank'])
export class UserPoints {
  @ApiProperty({ description: 'User ID' })
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Total points' })
  @Column({ name: 'total_points', type: 'int', default: 0 })
  totalPoints: number;

  @ApiProperty({ description: 'Current level' })
  @Column({ type: 'int', default: 1 })
  level: number;

  @ApiProperty({ description: 'Level name' })
  @Column({ name: 'level_name', type: 'varchar', length: 100, default: 'New Neighbor' })
  levelName: string;

  @ApiProperty({ description: 'Overall rank position' })
  @Column({ type: 'int', nullable: true })
  rank?: number;

  @ApiProperty({ description: 'Daily points' })
  @Column({ name: 'daily_points', type: 'int', default: 0 })
  dailyPoints: number;

  @ApiProperty({ description: 'Weekly points' })
  @Column({ name: 'weekly_points', type: 'int', default: 0 })
  weeklyPoints: number;

  @ApiProperty({ description: 'Monthly points' })
  @Column({ name: 'monthly_points', type: 'int', default: 0 })
  monthlyPoints: number;

  @ApiProperty({ description: 'Last activity timestamp' })
  @Column({ name: 'last_activity_at', type: 'timestamp', nullable: true })
  lastActivityAt?: Date;

  @ApiProperty({ description: 'Consecutive days active' })
  @Column({ name: 'streak_days', type: 'int', default: 0 })
  streakDays: number;

  @ApiProperty({ description: 'Last daily reset date' })
  @Column({ name: 'last_reset_daily', type: 'date', nullable: true })
  lastResetDaily?: Date;

  @ApiProperty({ description: 'Last weekly reset date' })
  @Column({ name: 'last_reset_weekly', type: 'date', nullable: true })
  lastResetWeekly?: Date;

  @ApiProperty({ description: 'Last monthly reset date' })
  @Column({ name: 'last_reset_monthly', type: 'date', nullable: true })
  lastResetMonthly?: Date;

  @ApiProperty({ description: 'Update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
