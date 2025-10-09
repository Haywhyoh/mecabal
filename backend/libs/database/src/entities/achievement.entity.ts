import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserAchievement } from './user-achievement.entity';

export enum AchievementCategory {
  COMMUNITY = 'community',
  SAFETY = 'safety',
  SOCIAL = 'social',
  BUSINESS = 'business',
  EVENTS = 'events',
  LEADERSHIP = 'leadership',
}

export enum AchievementRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

@Entity('achievements')
@Index(['category', 'isActive'])
export class Achievement {
  @ApiProperty({ description: 'Achievement ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Achievement name' })
  @Column({ length: 255 })
  name: string;

  @ApiProperty({ description: 'Achievement description' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ description: 'Icon name' })
  @Column({ length: 100 })
  icon: string;

  @ApiProperty({ description: 'Color hex code' })
  @Column({ length: 50 })
  color: string;

  @ApiProperty({ description: 'Achievement category', enum: AchievementCategory })
  @Column({ type: 'varchar', length: 50 })
  category: AchievementCategory;

  @ApiProperty({ description: 'Points awarded' })
  @Column({ type: 'int' })
  points: number;

  @ApiProperty({ description: 'Achievement rarity', enum: AchievementRarity })
  @Column({ type: 'varchar', length: 20 })
  rarity: AchievementRarity;

  @ApiProperty({ description: 'Requirements configuration' })
  @Column({ type: 'jsonb' })
  requirements: {
    type: string;
    count: number;
    description: string;
  };

  @ApiProperty({ description: 'Is active' })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => UserAchievement, (ua) => ua.achievement)
  userAchievements: UserAchievement[];
}
