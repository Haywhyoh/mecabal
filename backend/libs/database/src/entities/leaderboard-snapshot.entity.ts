import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum LeaderboardCategory {
  OVERALL = 'overall',
  SAFETY = 'safety',
  EVENTS = 'events',
  HELPFUL = 'helpful',
  BUSINESS = 'business',
}

export enum LeaderboardPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALL_TIME = 'all-time',
}

export interface LeaderboardRanking {
  userId: string;
  rank: number;
  points: number;
  change: number; // Change from previous period
  level: number;
  levelName: string;
}

@Entity('leaderboard_snapshots')
@Index(['category', 'period', 'snapshotDate'])
export class LeaderboardSnapshot {
  @ApiProperty({ description: 'Snapshot ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Leaderboard category', enum: LeaderboardCategory })
  @Column({ type: 'varchar', length: 50 })
  category: LeaderboardCategory;

  @ApiProperty({ description: 'Leaderboard period', enum: LeaderboardPeriod })
  @Column({ type: 'varchar', length: 20 })
  period: LeaderboardPeriod;

  @ApiProperty({ description: 'Snapshot date' })
  @Column({ name: 'snapshot_date', type: 'date' })
  snapshotDate: Date;

  @ApiProperty({ description: 'Rankings data' })
  @Column({ type: 'jsonb' })
  rankings: LeaderboardRanking[];

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
