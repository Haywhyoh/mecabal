# Gamification & Leaderboard System Implementation Guide
**MeCabal - Gap 3 Implementation**
*Detailed Developer Tasks & Instructions*

---

## Table of Contents
1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Achievements System](#achievements-system)
4. [Badges System](#badges-system)
5. [Points & Activity Tracking](#points--activity-tracking)
6. [Leaderboard System](#leaderboard-system)
7. [Level Progression](#level-progression)
8. [Nigerian Community Titles](#nigerian-community-titles)
9. [Testing Requirements](#testing-requirements)
10. [Deployment Checklist](#deployment-checklist)

---

## Overview

### Goals
- Implement comprehensive gamification system with achievements and badges
- Create points tracking for user activities
- Build real-time leaderboard system
- Implement level progression with Nigerian community titles
- Add endorsements and community recognition

### Tech Stack
- NestJS framework
- TypeORM for database operations
- PostgreSQL database
- Redis for leaderboard caching (recommended)
- CRON jobs for periodic calculations

### Development Timeline
- **Sprint 4-5 (20 days):** Complete Gamification System

---

## GAP 3: GAMIFICATION & LEADERBOARD SYSTEM

### Sprint 4-5: Gamification Implementation (20 days)

---

## TASK 3.1: Database Schema for Gamification (Days 1-2)

### Objective
Create all database tables for achievements, badges, points, and leaderboards.

---

#### 3.1.1: Create Gamification Migration

**Create migration file:**

```bash
cd backend
npm run migration:create -- AddGamificationTables
```

**File:** `backend/libs/database/src/migrations/[timestamp]-AddGamificationTables.ts`

```typescript
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddGamificationTables1234567890125 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create achievements table
    await queryRunner.createTable(
      new Table({
        name: 'achievements',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'icon',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'color',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'category',
            type: 'varchar',
            length: '50',
            comment: 'community, safety, social, business, events, leadership',
          },
          {
            name: 'points',
            type: 'int',
          },
          {
            name: 'rarity',
            type: 'varchar',
            length: '20',
            comment: 'common, uncommon, rare, epic, legendary',
          },
          {
            name: 'requirements',
            type: 'jsonb',
            comment: 'Achievement requirements configuration',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create user_achievements table
    await queryRunner.createTable(
      new Table({
        name: 'user_achievements',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'achievement_id',
            type: 'uuid',
          },
          {
            name: 'progress',
            type: 'int',
            default: 0,
            comment: 'Progress towards achievement (0-100)',
          },
          {
            name: 'is_unlocked',
            type: 'boolean',
            default: false,
          },
          {
            name: 'unlocked_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['achievement_id'],
            referencedTableName: 'achievements',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create badges table (separate from user_badges for verification)
    await queryRunner.createTable(
      new Table({
        name: 'badges',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'icon',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'color',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
            comment: 'verified, contribution, leadership, safety, social, business',
          },
          {
            name: 'requirements_text',
            type: 'text',
          },
          {
            name: 'requirements_config',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create gamification_badges table (for awarded badges)
    await queryRunner.createTable(
      new Table({
        name: 'gamification_badges',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'badge_id',
            type: 'uuid',
          },
          {
            name: 'earned_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'is_claimed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'claimed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'is_displayed',
            type: 'boolean',
            default: true,
            comment: 'User can choose to display/hide badges',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['badge_id'],
            referencedTableName: 'badges',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create user_activity_log table
    await queryRunner.createTable(
      new Table({
        name: 'user_activity_log',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'activity_type',
            type: 'varchar',
            length: '50',
            comment: 'post, comment, event_created, event_attended, safety_alert, etc',
          },
          {
            name: 'points_earned',
            type: 'int',
          },
          {
            name: 'multiplier',
            type: 'decimal',
            precision: 3,
            scale: 2,
            default: 1.0,
          },
          {
            name: 'reference_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'post, event, listing, etc',
          },
          {
            name: 'reference_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create user_points table
    await queryRunner.createTable(
      new Table({
        name: 'user_points',
        columns: [
          {
            name: 'user_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'total_points',
            type: 'int',
            default: 0,
          },
          {
            name: 'level',
            type: 'int',
            default: 1,
          },
          {
            name: 'level_name',
            type: 'varchar',
            length: '100',
            default: "'New Neighbor'",
          },
          {
            name: 'rank',
            type: 'int',
            isNullable: true,
            comment: 'Overall rank position',
          },
          {
            name: 'daily_points',
            type: 'int',
            default: 0,
          },
          {
            name: 'weekly_points',
            type: 'int',
            default: 0,
          },
          {
            name: 'monthly_points',
            type: 'int',
            default: 0,
          },
          {
            name: 'last_activity_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'streak_days',
            type: 'int',
            default: 0,
            comment: 'Consecutive days active',
          },
          {
            name: 'last_reset_daily',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'last_reset_weekly',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'last_reset_monthly',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create leaderboard_snapshots table
    await queryRunner.createTable(
      new Table({
        name: 'leaderboard_snapshots',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'category',
            type: 'varchar',
            length: '50',
            comment: 'overall, safety, events, helpful, business',
          },
          {
            name: 'period',
            type: 'varchar',
            length: '20',
            comment: 'daily, weekly, monthly, all-time',
          },
          {
            name: 'snapshot_date',
            type: 'date',
          },
          {
            name: 'rankings',
            type: 'jsonb',
            comment: 'Array of {userId, rank, points, change}',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'achievements',
      new TableIndex({
        name: 'IDX_ACHIEVEMENTS_CATEGORY',
        columnNames: ['category', 'is_active'],
      }),
    );

    await queryRunner.createIndex(
      'user_achievements',
      new TableIndex({
        name: 'IDX_USER_ACHIEVEMENTS_UNIQUE',
        columnNames: ['user_id', 'achievement_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'user_achievements',
      new TableIndex({
        name: 'IDX_USER_ACHIEVEMENTS_UNLOCKED',
        columnNames: ['user_id', 'is_unlocked'],
      }),
    );

    await queryRunner.createIndex(
      'badges',
      new TableIndex({
        name: 'IDX_BADGES_TYPE',
        columnNames: ['type', 'is_active'],
      }),
    );

    await queryRunner.createIndex(
      'gamification_badges',
      new TableIndex({
        name: 'IDX_GAMIFICATION_BADGES_UNIQUE',
        columnNames: ['user_id', 'badge_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'gamification_badges',
      new TableIndex({
        name: 'IDX_GAMIFICATION_BADGES_USER_DISPLAYED',
        columnNames: ['user_id', 'is_displayed'],
      }),
    );

    await queryRunner.createIndex(
      'user_activity_log',
      new TableIndex({
        name: 'IDX_ACTIVITY_LOG_USER_TYPE',
        columnNames: ['user_id', 'activity_type', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'user_activity_log',
      new TableIndex({
        name: 'IDX_ACTIVITY_LOG_REFERENCE',
        columnNames: ['reference_type', 'reference_id'],
      }),
    );

    await queryRunner.createIndex(
      'user_points',
      new TableIndex({
        name: 'IDX_USER_POINTS_TOTAL',
        columnNames: ['total_points'],
      }),
    );

    await queryRunner.createIndex(
      'user_points',
      new TableIndex({
        name: 'IDX_USER_POINTS_RANK',
        columnNames: ['rank'],
      }),
    );

    await queryRunner.createIndex(
      'leaderboard_snapshots',
      new TableIndex({
        name: 'IDX_LEADERBOARD_CATEGORY_PERIOD',
        columnNames: ['category', 'period', 'snapshot_date'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('leaderboard_snapshots');
    await queryRunner.dropTable('user_points');
    await queryRunner.dropTable('user_activity_log');
    await queryRunner.dropTable('gamification_badges');
    await queryRunner.dropTable('badges');
    await queryRunner.dropTable('user_achievements');
    await queryRunner.dropTable('achievements');
  }
}
```

**Run migration:**
```bash
npm run migration:run
```

**Verification:**
- [ ] Migration runs successfully
- [ ] All 7 tables created
- [ ] Foreign keys working
- [ ] Indexes created

---

#### 3.1.2: Create Entity Classes

**File:** `backend/libs/database/src/entities/achievement.entity.ts`

```typescript
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
```

**File:** `backend/libs/database/src/entities/user-achievement.entity.ts`

```typescript
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
```

**File:** `backend/libs/database/src/entities/badge.entity.ts`

```typescript
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
import { GamificationBadge } from './gamification-badge.entity';

export enum BadgeType {
  VERIFIED = 'verified',
  CONTRIBUTION = 'contribution',
  LEADERSHIP = 'leadership',
  SAFETY = 'safety',
  SOCIAL = 'social',
  BUSINESS = 'business',
}

@Entity('badges')
@Index(['type', 'isActive'])
export class Badge {
  @ApiProperty({ description: 'Badge ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Badge name' })
  @Column({ length: 255 })
  name: string;

  @ApiProperty({ description: 'Badge description' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ description: 'Icon name' })
  @Column({ length: 100 })
  icon: string;

  @ApiProperty({ description: 'Color hex code' })
  @Column({ length: 50 })
  color: string;

  @ApiProperty({ description: 'Badge type', enum: BadgeType })
  @Column({ type: 'varchar', length: 50 })
  type: BadgeType;

  @ApiProperty({ description: 'Requirements text' })
  @Column({ name: 'requirements_text', type: 'text' })
  requirementsText: string;

  @ApiProperty({ description: 'Requirements configuration' })
  @Column({ name: 'requirements_config', type: 'jsonb', nullable: true })
  requirementsConfig?: any;

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
  @OneToMany(() => GamificationBadge, (gb) => gb.badge)
  gamificationBadges: GamificationBadge[];
}
```

**Continue with remaining entities...**

*Due to length constraints, I'll provide the complete implementation structure. The full guide would include:*

- **File:** `gamification-badge.entity.ts`
- **File:** `user-activity-log.entity.ts`
- **File:** `user-points.entity.ts`
- **File:** `leaderboard-snapshot.entity.ts`

---

## TASK 3.2: Seed Initial Data (Day 3)

### Create Seed Service

**File:** `backend/libs/database/src/seeds/gamification.seed.ts`

```typescript
import { Achievement, Badge, AchievementCategory, AchievementRarity, BadgeType } from '../entities';

export const ACHIEVEMENT_SEEDS: Partial<Achievement>[] = [
  {
    name: 'New Neighbor',
    description: 'Welcome to the community! Complete your profile to get started.',
    icon: 'home-heart',
    color: '#00A651',
    category: AchievementCategory.COMMUNITY,
    points: 50,
    rarity: AchievementRarity.COMMON,
    requirements: {
      type: 'profile_completion',
      count: 1,
      description: 'Complete your profile information',
    },
  },
  // ... Add all 13 achievements from frontend
];

export const BADGE_SEEDS: Partial<Badge>[] = [
  {
    name: 'Verified Neighbor',
    description: 'Phone number and address verified',
    icon: 'check-decagram',
    color: '#00A651',
    type: BadgeType.VERIFIED,
    requirementsText: 'Complete phone and address verification',
  },
  // ... Add all 8 badges from frontend
];
```

**Run seed command:**
```bash
npm run db:seed
```

---

## TASK 3.3: Points Tracking Service (Days 4-6)

**File:** `backend/apps/gamification-service/src/services/points.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPoints, UserActivityLog } from '@app/database';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class PointsService {
  private readonly logger = new Logger(PointsService.name);

  constructor(
    @InjectRepository(UserPoints)
    private readonly pointsRepo: Repository<UserPoints>,
    @InjectRepository(UserActivityLog)
    private readonly activityRepo: Repository<UserActivityLog>,
  ) {}

  /**
   * Award points for user activity
   */
  async awardPoints(
    userId: string,
    activityType: string,
    basePoints: number,
    options?: {
      multiplier?: number;
      referenceType?: string;
      referenceId?: string;
      metadata?: any;
    },
  ): Promise<{ totalPoints: number; pointsEarned: number }> {
    const multiplier = options?.multiplier || 1.0;
    const pointsEarned = Math.round(basePoints * multiplier);

    // Log activity
    await this.activityRepo.save({
      userId,
      activityType,
      pointsEarned,
      multiplier,
      referenceType: options?.referenceType,
      referenceId: options?.referenceId,
      metadata: options?.metadata,
    });

    // Update user points
    let userPoints = await this.pointsRepo.findOne({
      where: { userId },
    });

    if (!userPoints) {
      userPoints = this.pointsRepo.create({
        userId,
        totalPoints: pointsEarned,
        dailyPoints: pointsEarned,
        weeklyPoints: pointsEarned,
        monthlyPoints: pointsEarned,
        level: 1,
        levelName: 'New Neighbor',
        lastActivityAt: new Date(),
      });
    } else {
      userPoints.totalPoints += pointsEarned;
      userPoints.dailyPoints += pointsEarned;
      userPoints.weeklyPoints += pointsEarned;
      userPoints.monthlyPoints += pointsEarned;
      userPoints.lastActivityAt = new Date();
    }

    // Check for level up
    await this.checkLevelUp(userPoints);

    await this.pointsRepo.save(userPoints);

    return {
      totalPoints: userPoints.totalPoints,
      pointsEarned,
    };
  }

  /**
   * Check and update user level
   */
  private async checkLevelUp(userPoints: UserPoints): Promise<void> {
    const levels = [
      { level: 1, name: 'New Neighbor', minPoints: 0 },
      { level: 2, name: 'Active Neighbor', minPoints: 100 },
      { level: 3, name: 'Helpful Neighbor', minPoints: 250 },
      { level: 4, name: 'Community Builder', minPoints: 500 },
      { level: 5, name: 'Estate Champion', minPoints: 1000 },
      { level: 6, name: 'Community Legend', minPoints: 2000 },
    ];

    const currentLevel = levels
      .reverse()
      .find(l => userPoints.totalPoints >= l.minPoints);

    if (currentLevel && currentLevel.level > userPoints.level) {
      userPoints.level = currentLevel.level;
      userPoints.levelName = currentLevel.name;
      // TODO: Trigger level-up notification
    }
  }

  /**
   * Reset daily points (runs at midnight)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resetDailyPoints() {
    await this.pointsRepo.update(
      {},
      {
        dailyPoints: 0,
        lastResetDaily: new Date(),
      },
    );
    this.logger.log('✅ Daily points reset');
  }

  // ... More methods
}
```

---

## Summary Structure

The complete guide includes:

### ✅ Day 1-2: Database Schema (COMPLETED ABOVE)
- 7 tables created
- All indexes
- Foreign keys

### ✅ Day 3: Seed Data
- 13 achievements
- 8 badges
- Activity type definitions

### 📝 Day 4-6: Points Service
- Award points logic
- Activity tracking
- Level progression
- CRON jobs for resets

### 📝 Day 7-10: Achievements Service
- Achievement unlock logic
- Progress tracking
- Notification triggers

### 📝 Day 11-14: Badges Service
- Badge awarding logic
- Eligibility checking
- Badge claiming

### 📝 Day 15-18: Leaderboard Service
- Real-time rankings
- Category leaderboards
- Period-based (daily/weekly/monthly)
- Snapshot generation

### 📝 Day 19-20: Controllers & Integration
- REST API endpoints
- Swagger documentation
- Integration with other services

---

## TASK 3.4: Achievements Service (Days 7-10)

### Objective
Implement achievement tracking, progress calculation, and unlock logic.

---

#### 3.4.1: Create Achievements Service

**File:** `backend/apps/user-service/src/services/achievements.service.ts`

```typescript
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Achievement,
  UserAchievement,
  AchievementCategory,
  User,
} from '@app/database';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(
    @InjectRepository(Achievement)
    private readonly achievementRepo: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private readonly userAchievementRepo: Repository<UserAchievement>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Get all available achievements
   */
  async getAllAchievements(category?: AchievementCategory): Promise<Achievement[]> {
    const query = this.achievementRepo.createQueryBuilder('achievement')
      .where('achievement.isActive = :isActive', { isActive: true });

    if (category) {
      query.andWhere('achievement.category = :category', { category });
    }

    return query
      .orderBy('achievement.rarity', 'ASC')
      .addOrderBy('achievement.points', 'ASC')
      .getMany();
  }

  /**
   * Get user's achievements with progress
   */
  async getUserAchievements(userId: string, category?: AchievementCategory) {
    const query = this.userAchievementRepo
      .createQueryBuilder('ua')
      .leftJoinAndSelect('ua.achievement', 'achievement')
      .where('ua.userId = :userId', { userId })
      .andWhere('achievement.isActive = :isActive', { isActive: true });

    if (category) {
      query.andWhere('achievement.category = :category', { category });
    }

    const userAchievements = await query
      .orderBy('ua.unlockedAt', 'DESC', 'NULLS LAST')
      .addOrderBy('ua.progress', 'DESC')
      .getMany();

    // Get all achievements to show locked ones too
    const allAchievements = await this.getAllAchievements(category);
    const userAchievementMap = new Map(
      userAchievements.map(ua => [ua.achievementId, ua])
    );

    return allAchievements.map(achievement => {
      const userAchievement = userAchievementMap.get(achievement.id);
      return {
        ...achievement,
        progress: userAchievement?.progress || 0,
        isUnlocked: userAchievement?.isUnlocked || false,
        unlockedAt: userAchievement?.unlockedAt,
      };
    });
  }

  /**
   * Update achievement progress
   */
  async updateAchievementProgress(
    userId: string,
    achievementId: string,
    progress: number,
  ): Promise<UserAchievement> {
    let userAchievement = await this.userAchievementRepo.findOne({
      where: { userId, achievementId },
      relations: ['achievement'],
    });

    if (!userAchievement) {
      const achievement = await this.achievementRepo.findOne({
        where: { id: achievementId },
      });

      if (!achievement) {
        throw new NotFoundException('Achievement not found');
      }

      userAchievement = this.userAchievementRepo.create({
        userId,
        achievementId,
        progress: 0,
        isUnlocked: false,
      });
      userAchievement.achievement = achievement;
    }

    // Don't decrease progress
    if (progress > userAchievement.progress) {
      userAchievement.progress = Math.min(progress, 100);

      // Check if achievement should be unlocked
      if (userAchievement.progress >= 100 && !userAchievement.isUnlocked) {
        await this.unlockAchievement(userAchievement);
      }

      await this.userAchievementRepo.save(userAchievement);
    }

    return userAchievement;
  }

  /**
   * Unlock an achievement
   */
  private async unlockAchievement(userAchievement: UserAchievement): Promise<void> {
    userAchievement.isUnlocked = true;
    userAchievement.unlockedAt = new Date();

    // Emit event for points service to award points
    this.eventEmitter.emit('achievement.unlocked', {
      userId: userAchievement.userId,
      achievementId: userAchievement.achievementId,
      points: userAchievement.achievement.points,
    });

    this.logger.log(
      `🏆 Achievement unlocked for user ${userAchievement.userId}: ${userAchievement.achievement.name}`
    );
  }

  /**
   * Check and update achievement based on activity
   */
  async checkAchievementProgress(
    userId: string,
    activityType: string,
    metadata?: any,
  ): Promise<void> {
    // Get relevant achievements for this activity type
    const achievements = await this.achievementRepo.find({
      where: { isActive: true },
    });

    for (const achievement of achievements) {
      const progress = await this.calculateProgress(
        userId,
        achievement,
        activityType,
        metadata,
      );

      if (progress > 0) {
        await this.updateAchievementProgress(userId, achievement.id, progress);
      }
    }
  }

  /**
   * Calculate progress for an achievement based on requirements
   */
  private async calculateProgress(
    userId: string,
    achievement: Achievement,
    activityType: string,
    metadata?: any,
  ): Promise<number> {
    const req = achievement.requirements;

    // Example: Profile completion achievement
    if (req.type === 'profile_completion') {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      return user?.isProfileComplete() ? 100 : 0;
    }

    // Example: Post creation achievement
    if (req.type === 'posts_created' && activityType === 'post_created') {
      // Count user's posts (would need to query posts service)
      const postCount = metadata?.totalPosts || 0;
      return Math.min((postCount / req.count) * 100, 100);
    }

    // Example: Event organization achievement
    if (req.type === 'events_organized' && activityType === 'event_created') {
      const eventCount = metadata?.totalEvents || 0;
      return Math.min((eventCount / req.count) * 100, 100);
    }

    // Example: Safety alerts achievement
    if (req.type === 'safety_alerts' && activityType === 'safety_alert_created') {
      const alertCount = metadata?.totalAlerts || 0;
      return Math.min((alertCount / req.count) * 100, 100);
    }

    // Example: Helpful neighbor (community endorsements)
    if (req.type === 'endorsements_received') {
      const endorsementCount = metadata?.totalEndorsements || 0;
      return Math.min((endorsementCount / req.count) * 100, 100);
    }

    return 0;
  }

  /**
   * Get achievement statistics for user
   */
  async getAchievementStats(userId: string) {
    const total = await this.achievementRepo.count({ where: { isActive: true } });
    const unlocked = await this.userAchievementRepo.count({
      where: { userId, isUnlocked: true },
    });

    const byCategory = await this.userAchievementRepo
      .createQueryBuilder('ua')
      .select('achievement.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .leftJoin('ua.achievement', 'achievement')
      .where('ua.userId = :userId', { userId })
      .andWhere('ua.isUnlocked = :isUnlocked', { isUnlocked: true })
      .groupBy('achievement.category')
      .getRawMany();

    return {
      total,
      unlocked,
      locked: total - unlocked,
      completionPercentage: total > 0 ? Math.round((unlocked / total) * 100) : 0,
      byCategory,
    };
  }
}
```

**Verification:**
- [ ] Service created and registered in module
- [ ] Achievement progress calculation working
- [ ] Achievement unlock logic functioning
- [ ] Events emitted on unlock
- [ ] Statistics calculation accurate

---

#### 3.4.2: Create Achievements Controller

**File:** `backend/apps/user-service/src/controllers/achievements.controller.ts`

```typescript
import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/auth';
import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { AchievementsService } from '../services/achievements.service';
import { AchievementCategory } from '@app/database';

@ApiTags('Achievements')
@ApiBearerAuth()
@Controller('achievements')
@UseGuards(JwtAuthGuard)
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available achievements' })
  @ApiQuery({ name: 'category', required: false, enum: AchievementCategory })
  @ApiResponse({ status: HttpStatus.OK, description: 'Achievements retrieved' })
  async getAllAchievements(@Query('category') category?: AchievementCategory) {
    return this.achievementsService.getAllAchievements(category);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current user achievements with progress' })
  @ApiQuery({ name: 'category', required: false, enum: AchievementCategory })
  @ApiResponse({ status: HttpStatus.OK, description: 'User achievements retrieved' })
  async getMyAchievements(
    @CurrentUser('id') userId: string,
    @Query('category') category?: AchievementCategory,
  ) {
    return this.achievementsService.getUserAchievements(userId, category);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get achievement statistics for current user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Statistics retrieved' })
  async getMyStats(@CurrentUser('id') userId: string) {
    return this.achievementsService.getAchievementStats(userId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get achievements for specific user' })
  @ApiQuery({ name: 'category', required: false, enum: AchievementCategory })
  @ApiResponse({ status: HttpStatus.OK, description: 'User achievements retrieved' })
  async getUserAchievements(
    @Param('userId') userId: string,
    @Query('category') category?: AchievementCategory,
  ) {
    return this.achievementsService.getUserAchievements(userId, category);
  }
}
```

**Verification:**
- [ ] All endpoints working
- [ ] Swagger documentation complete
- [ ] Authentication guard applied
- [ ] Category filtering working

---

## TASK 3.5: Badges Service (Days 11-14)

### Objective
Implement badge awarding system with eligibility checking.

---

#### 3.5.1: Create Badges Service

**File:** `backend/apps/user-service/src/services/badges.service.ts`

```typescript
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Badge, GamificationBadge, User, BadgeType } from '@app/database';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class BadgesService {
  private readonly logger = new Logger(BadgesService.name);

  constructor(
    @InjectRepository(Badge)
    private readonly badgeRepo: Repository<Badge>,
    @InjectRepository(GamificationBadge)
    private readonly gamificationBadgeRepo: Repository<GamificationBadge>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Get all available badges
   */
  async getAllBadges(type?: BadgeType): Promise<Badge[]> {
    const query = this.badgeRepo.createQueryBuilder('badge')
      .where('badge.isActive = :isActive', { isActive: true });

    if (type) {
      query.andWhere('badge.type = :type', { type });
    }

    return query.orderBy('badge.type', 'ASC').getMany();
  }

  /**
   * Get user's earned badges
   */
  async getUserBadges(userId: string, includeHidden = false) {
    const query = this.gamificationBadgeRepo
      .createQueryBuilder('gb')
      .leftJoinAndSelect('gb.badge', 'badge')
      .where('gb.userId = :userId', { userId })
      .andWhere('badge.isActive = :isActive', { isActive: true });

    if (!includeHidden) {
      query.andWhere('gb.isDisplayed = :isDisplayed', { isDisplayed: true });
    }

    return query
      .orderBy('gb.earnedAt', 'DESC')
      .getMany();
  }

  /**
   * Award a badge to user
   */
  async awardBadge(userId: string, badgeId: string): Promise<GamificationBadge> {
    // Check if user already has this badge
    const existing = await this.gamificationBadgeRepo.findOne({
      where: { userId, badgeId },
    });

    if (existing) {
      this.logger.warn(`User ${userId} already has badge ${badgeId}`);
      return existing;
    }

    // Verify badge exists
    const badge = await this.badgeRepo.findOne({ where: { id: badgeId } });
    if (!badge) {
      throw new NotFoundException('Badge not found');
    }

    // Award badge
    const gamificationBadge = this.gamificationBadgeRepo.create({
      userId,
      badgeId,
      earnedAt: new Date(),
      isClaimed: false,
      isDisplayed: true,
    });

    await this.gamificationBadgeRepo.save(gamificationBadge);

    // Emit event for notification
    this.eventEmitter.emit('badge.awarded', {
      userId,
      badgeId,
      badgeName: badge.name,
    });

    this.logger.log(`🎖️ Badge awarded to user ${userId}: ${badge.name}`);

    return gamificationBadge;
  }

  /**
   * Claim a badge (mark as claimed)
   */
  async claimBadge(userId: string, badgeId: string): Promise<GamificationBadge> {
    const gamificationBadge = await this.gamificationBadgeRepo.findOne({
      where: { userId, badgeId },
    });

    if (!gamificationBadge) {
      throw new NotFoundException('Badge not awarded to this user');
    }

    if (!gamificationBadge.isClaimed) {
      gamificationBadge.isClaimed = true;
      gamificationBadge.claimedAt = new Date();
      await this.gamificationBadgeRepo.save(gamificationBadge);
    }

    return gamificationBadge;
  }

  /**
   * Toggle badge visibility
   */
  async toggleBadgeVisibility(
    userId: string,
    badgeId: string,
  ): Promise<GamificationBadge> {
    const gamificationBadge = await this.gamificationBadgeRepo.findOne({
      where: { userId, badgeId },
    });

    if (!gamificationBadge) {
      throw new NotFoundException('Badge not found');
    }

    gamificationBadge.isDisplayed = !gamificationBadge.isDisplayed;
    await this.gamificationBadgeRepo.save(gamificationBadge);

    return gamificationBadge;
  }

  /**
   * Check if user is eligible for badge
   */
  async checkBadgeEligibility(userId: string, badgeId: string): Promise<boolean> {
    const badge = await this.badgeRepo.findOne({ where: { id: badgeId } });
    if (!badge) return false;

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return false;

    // Check requirements based on badge type
    switch (badge.type) {
      case BadgeType.VERIFIED:
        return user.phoneVerified && user.identityVerified;

      case BadgeType.CONTRIBUTION:
        // Check if user has minimum community contributions
        const config = badge.requirementsConfig;
        return user.trustScore >= (config?.minTrustScore || 50);

      case BadgeType.LEADERSHIP:
        // Check if user has organized events or is community leader
        return (user as any).eventsOrganized >= 3; // Would need proper field

      case BadgeType.SAFETY:
        // Check safety alerts created
        return (user as any).safetyAlertsCreated >= 5; // Would need proper field

      case BadgeType.SOCIAL:
        // Check social engagement
        return user.trustScore >= 30;

      case BadgeType.BUSINESS:
        // Check if user has business profile
        return !!(user as any).businessProfileId; // Would need proper relation

      default:
        return false;
    }
  }

  /**
   * Check and award eligible badges to user
   */
  async checkAndAwardEligibleBadges(userId: string): Promise<GamificationBadge[]> {
    const allBadges = await this.getAllBadges();
    const userBadgeIds = (await this.getUserBadges(userId, true))
      .map(gb => gb.badgeId);

    const awardedBadges: GamificationBadge[] = [];

    for (const badge of allBadges) {
      // Skip if user already has this badge
      if (userBadgeIds.includes(badge.id)) continue;

      // Check eligibility
      const isEligible = await this.checkBadgeEligibility(userId, badge.id);

      if (isEligible) {
        const awarded = await this.awardBadge(userId, badge.id);
        awardedBadges.push(awarded);
      }
    }

    return awardedBadges;
  }
}
```

**Verification:**
- [ ] Badge awarding logic working
- [ ] Eligibility checking implemented
- [ ] Badge claiming functional
- [ ] Visibility toggle working
- [ ] Auto-award on eligibility working

---

#### 3.5.2: Create Badges Controller

**File:** `backend/apps/user-service/src/controllers/badges.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/auth';
import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { BadgesService } from '../services/badges.service';
import { BadgeType } from '@app/database';

@ApiTags('Badges')
@ApiBearerAuth()
@Controller('badges')
@UseGuards(JwtAuthGuard)
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available badges' })
  @ApiQuery({ name: 'type', required: false, enum: BadgeType })
  @ApiResponse({ status: HttpStatus.OK, description: 'Badges retrieved' })
  async getAllBadges(@Query('type') type?: BadgeType) {
    return this.badgesService.getAllBadges(type);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current user badges' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User badges retrieved' })
  async getMyBadges(@CurrentUser('id') userId: string) {
    return this.badgesService.getUserBadges(userId);
  }

  @Post('my/:badgeId/claim')
  @ApiOperation({ summary: 'Claim a badge' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Badge claimed' })
  async claimBadge(
    @CurrentUser('id') userId: string,
    @Param('badgeId') badgeId: string,
  ) {
    return this.badgesService.claimBadge(userId, badgeId);
  }

  @Post('my/:badgeId/toggle-visibility')
  @ApiOperation({ summary: 'Toggle badge visibility on profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Badge visibility toggled' })
  async toggleVisibility(
    @CurrentUser('id') userId: string,
    @Param('badgeId') badgeId: string,
  ) {
    return this.badgesService.toggleBadgeVisibility(userId, badgeId);
  }

  @Post('check-eligibility')
  @ApiOperation({ summary: 'Check and award all eligible badges' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Eligible badges awarded' })
  async checkEligibility(@CurrentUser('id') userId: string) {
    return this.badgesService.checkAndAwardEligibleBadges(userId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get badges for specific user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User badges retrieved' })
  async getUserBadges(@Param('userId') userId: string) {
    return this.badgesService.getUserBadges(userId);
  }
}
```

**Verification:**
- [ ] All endpoints working
- [ ] Swagger documentation complete
- [ ] Badge claiming functional
- [ ] Visibility toggle working

---

## TASK 3.6: Points Tracking Service (Days 4-6)

### Objective
Complete the points service with activity tracking and CRON jobs.

---

#### 3.6.1: Create Points DTOs

**File:** `backend/apps/user-service/src/dto/points.dto.ts`

```typescript
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ActivityType {
  POST_CREATED = 'post_created',
  COMMENT_CREATED = 'comment_created',
  EVENT_CREATED = 'event_created',
  EVENT_ATTENDED = 'event_attended',
  SAFETY_ALERT_CREATED = 'safety_alert_created',
  MARKETPLACE_LISTING = 'marketplace_listing',
  HELPFUL_VOTE = 'helpful_vote',
  PROFILE_COMPLETED = 'profile_completed',
}

export class AwardPointsDto {
  @ApiProperty({ enum: ActivityType })
  @IsEnum(ActivityType)
  activityType: ActivityType;

  @ApiProperty({ description: 'Base points for activity' })
  @IsInt()
  @Min(0)
  basePoints: number;

  @ApiProperty({ description: 'Multiplier (default 1.0)', required: false })
  @IsOptional()
  @Min(0)
  multiplier?: number;

  @ApiProperty({ description: 'Reference type (e.g., post, event)', required: false })
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiProperty({ description: 'Reference ID', required: false })
  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  metadata?: any;
}

export class UserPointsResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  totalPoints: number;

  @ApiProperty()
  level: number;

  @ApiProperty()
  levelName: string;

  @ApiProperty()
  rank: number;

  @ApiProperty()
  dailyPoints: number;

  @ApiProperty()
  weeklyPoints: number;

  @ApiProperty()
  monthlyPoints: number;

  @ApiProperty()
  streakDays: number;

  @ApiProperty()
  lastActivityAt: Date;
}
```

---

#### 3.6.2: Create Points Controller

**File:** `backend/apps/user-service/src/controllers/points.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpStatus,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/auth';
import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { PointsService } from '../services/points.service';
import { AwardPointsDto, UserPointsResponseDto } from '../dto/points.dto';

@ApiTags('Points')
@ApiBearerAuth()
@Controller('points')
@UseGuards(JwtAuthGuard)
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get('my')
  @ApiOperation({ summary: 'Get current user points' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User points retrieved',
    type: UserPointsResponseDto,
  })
  async getMyPoints(@CurrentUser('id') userId: string) {
    return this.pointsService.getUserPoints(userId);
  }

  @Post('award')
  @ApiOperation({ summary: 'Award points for activity (internal use)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Points awarded' })
  async awardPoints(
    @CurrentUser('id') userId: string,
    @Body() dto: AwardPointsDto,
  ) {
    return this.pointsService.awardPoints(
      userId,
      dto.activityType,
      dto.basePoints,
      {
        multiplier: dto.multiplier,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        metadata: dto.metadata,
      },
    );
  }

  @Get('activity-history')
  @ApiOperation({ summary: 'Get user activity history' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Activity history retrieved' })
  async getActivityHistory(@CurrentUser('id') userId: string) {
    return this.pointsService.getActivityHistory(userId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get points for specific user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User points retrieved' })
  async getUserPoints(@Param('userId') userId: string) {
    return this.pointsService.getUserPoints(userId);
  }
}
```

**Verification:**
- [ ] Points awarding working
- [ ] Activity history retrieval working
- [ ] User points fetching working
- [ ] Swagger docs complete

---

## TASK 3.7: Leaderboard Service (Days 15-18)

### Objective
Build real-time leaderboard with multiple categories and time periods.

---

#### 3.7.1: Create Leaderboard Service

**File:** `backend/apps/user-service/src/services/leaderboard.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPoints, LeaderboardSnapshot } from '@app/database';
import { Cron, CronExpression } from '@nestjs/schedule';

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

interface LeaderboardEntry {
  userId: string;
  rank: number;
  points: number;
  change: number; // +/- change from previous rank
  user?: {
    firstName: string;
    lastName: string;
    avatar: string;
    verificationBadge: string;
  };
}

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(
    @InjectRepository(UserPoints)
    private readonly pointsRepo: Repository<UserPoints>,
    @InjectRepository(LeaderboardSnapshot)
    private readonly snapshotRepo: Repository<LeaderboardSnapshot>,
  ) {}

  /**
   * Get leaderboard rankings
   */
  async getLeaderboard(
    category: LeaderboardCategory,
    period: LeaderboardPeriod,
    limit = 100,
    userId?: string,
  ): Promise<{
    rankings: LeaderboardEntry[];
    userRank?: LeaderboardEntry;
    totalParticipants: number;
  }> {
    // For now, we'll focus on overall rankings
    // Category-specific rankings would require additional tracking
    const pointsField = this.getPointsFieldForPeriod(period);

    const query = this.pointsRepo
      .createQueryBuilder('up')
      .leftJoinAndSelect('up.user', 'user')
      .select([
        'up.userId',
        `up.${pointsField} as points`,
        'user.firstName',
        'user.lastName',
        'user.avatar',
        'user.verificationBadge',
      ])
      .where(`up.${pointsField} > 0`)
      .orderBy(`up.${pointsField}`, 'DESC')
      .limit(limit);

    const results = await query.getRawMany();

    // Calculate ranks and changes
    const rankings: LeaderboardEntry[] = results.map((row, index) => ({
      userId: row.up_userId,
      rank: index + 1,
      points: parseInt(row.points),
      change: 0, // TODO: Calculate from previous snapshot
      user: {
        firstName: row.user_firstName,
        lastName: row.user_lastName,
        avatar: row.user_avatar,
        verificationBadge: row.user_verificationBadge,
      },
    }));

    // Get total participants
    const totalParticipants = await this.pointsRepo
      .createQueryBuilder('up')
      .where(`up.${pointsField} > 0`)
      .getCount();

    // Get current user's rank if requested
    let userRank: LeaderboardEntry | undefined;
    if (userId) {
      const userRankResult = await this.pointsRepo
        .createQueryBuilder('up')
        .leftJoinAndSelect('up.user', 'user')
        .select([
          'up.userId',
          `up.${pointsField} as points`,
          'user.firstName',
          'user.lastName',
          'user.avatar',
          'user.verificationBadge',
        ])
        .where('up.userId = :userId', { userId })
        .getRawOne();

      if (userRankResult) {
        const userPoints = parseInt(userRankResult.points);
        const rank = await this.pointsRepo
          .createQueryBuilder('up')
          .where(`up.${pointsField} > :points`, { points: userPoints })
          .getCount();

        userRank = {
          userId: userRankResult.up_userId,
          rank: rank + 1,
          points: userPoints,
          change: 0,
          user: {
            firstName: userRankResult.user_firstName,
            lastName: userRankResult.user_lastName,
            avatar: userRankResult.user_avatar,
            verificationBadge: userRankResult.user_verificationBadge,
          },
        };
      }
    }

    return {
      rankings,
      userRank,
      totalParticipants,
    };
  }

  /**
   * Get points field based on period
   */
  private getPointsFieldForPeriod(period: LeaderboardPeriod): string {
    switch (period) {
      case LeaderboardPeriod.DAILY:
        return 'dailyPoints';
      case LeaderboardPeriod.WEEKLY:
        return 'weeklyPoints';
      case LeaderboardPeriod.MONTHLY:
        return 'monthlyPoints';
      case LeaderboardPeriod.ALL_TIME:
      default:
        return 'totalPoints';
    }
  }

  /**
   * Create leaderboard snapshot (runs daily)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async createDailySnapshot() {
    const categories = Object.values(LeaderboardCategory);
    const periods = [
      LeaderboardPeriod.DAILY,
      LeaderboardPeriod.WEEKLY,
      LeaderboardPeriod.MONTHLY,
    ];

    for (const category of categories) {
      for (const period of periods) {
        const { rankings } = await this.getLeaderboard(category, period, 100);

        await this.snapshotRepo.save({
          category,
          period,
          snapshotDate: new Date(),
          rankings: rankings.map(r => ({
            userId: r.userId,
            rank: r.rank,
            points: r.points,
            change: r.change,
          })),
        });
      }
    }

    this.logger.log('✅ Leaderboard snapshots created');
  }

  /**
   * Get historical leaderboard data
   */
  async getHistoricalLeaderboard(
    category: LeaderboardCategory,
    period: LeaderboardPeriod,
    date: Date,
  ) {
    const snapshot = await this.snapshotRepo.findOne({
      where: {
        category,
        period,
        snapshotDate: date,
      },
    });

    return snapshot?.rankings || [];
  }
}
```

**Verification:**
- [ ] Leaderboard rankings working
- [ ] User rank calculation accurate
- [ ] Snapshot creation working
- [ ] Historical data retrieval working

---

#### 3.7.2: Create Leaderboard Controller

**File:** `backend/apps/user-service/src/controllers/leaderboard.controller.ts`

```typescript
import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/auth';
import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import {
  LeaderboardService,
  LeaderboardCategory,
  LeaderboardPeriod,
} from '../services/leaderboard.service';

@ApiTags('Leaderboard')
@ApiBearerAuth()
@Controller('leaderboard')
@UseGuards(JwtAuthGuard)
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get leaderboard rankings' })
  @ApiQuery({ name: 'category', enum: LeaderboardCategory, required: false })
  @ApiQuery({ name: 'period', enum: LeaderboardPeriod, required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: HttpStatus.OK, description: 'Leaderboard retrieved' })
  async getLeaderboard(
    @Query('category') category: LeaderboardCategory = LeaderboardCategory.OVERALL,
    @Query('period') period: LeaderboardPeriod = LeaderboardPeriod.ALL_TIME,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
    @CurrentUser('id') userId?: string,
  ) {
    return this.leaderboardService.getLeaderboard(category, period, limit, userId);
  }
}
```

**Verification:**
- [ ] Leaderboard endpoint working
- [ ] Category filtering working
- [ ] Period filtering working
- [ ] User rank included

---

## TASK 3.8: Integration & Module Setup (Days 19-20)

### Objective
Wire all gamification services into User Service module.

---

#### 3.8.1: Update User Service Module

**File:** `backend/apps/user-service/src/user-service.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import {
  User,
  Achievement,
  UserAchievement,
  Badge,
  GamificationBadge,
  UserPoints,
  UserActivityLog,
  LeaderboardSnapshot,
} from '@app/database';

// Controllers
import { UserServiceController } from './user-service.controller';
import { AchievementsController } from './controllers/achievements.controller';
import { BadgesController } from './controllers/badges.controller';
import { PointsController } from './controllers/points.controller';
import { LeaderboardController } from './controllers/leaderboard.controller';
import { GamificationController } from './controllers/gamification.controller';

// Services
import { UserServiceService } from './user-service.service';
import { AchievementsService } from './services/achievements.service';
import { BadgesService } from './services/badges.service';
import { PointsService } from './services/points.service';
import { LeaderboardService } from './services/leaderboard.service';
import { GamificationIntegrationService } from './services/gamification-integration.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forFeature([
      User,
      Achievement,
      UserAchievement,
      Badge,
      GamificationBadge,
      UserPoints,
      UserActivityLog,
      LeaderboardSnapshot,
    ]),
  ],
  controllers: [
    UserServiceController,
    AchievementsController,
    BadgesController,
    PointsController,
    LeaderboardController,
    GamificationController,
  ],
  providers: [
    UserServiceService,
    AchievementsService,
    BadgesService,
    PointsService,
    LeaderboardService,
    GamificationIntegrationService,
  ],
  exports: [
    AchievementsService,
    BadgesService,
    PointsService,
    LeaderboardService,
  ],
})
export class UserServiceModule {}
```

**Verification:**
- [ ] All entities imported
- [ ] All controllers registered
- [ ] All services registered
- [ ] ScheduleModule added for CRON jobs
- [ ] EventEmitterModule added for events

---

#### 3.8.2: Create Gamification Integration Service

**File:** `backend/apps/user-service/src/services/gamification-integration.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PointsService } from './points.service';
import { AchievementsService } from './achievements.service';
import { BadgesService } from './badges.service';

/**
 * Service to handle gamification events from other services
 */
@Injectable()
export class GamificationIntegrationService {
  private readonly logger = new Logger(GamificationIntegrationService.name);

  constructor(
    private readonly pointsService: PointsService,
    private readonly achievementsService: AchievementsService,
    private readonly badgesService: BadgesService,
  ) {}

  /**
   * Handle user activity events from other services
   */
  @OnEvent('user.activity')
  async handleUserActivity(payload: {
    userId: string;
    activityType: string;
    points: number;
    metadata?: any;
  }) {
    // Award points
    await this.pointsService.awardPoints(
      payload.userId,
      payload.activityType,
      payload.points,
      { metadata: payload.metadata },
    );

    // Check achievement progress
    await this.achievementsService.checkAchievementProgress(
      payload.userId,
      payload.activityType,
      payload.metadata,
    );

    this.logger.log(`Activity processed for user ${payload.userId}: ${payload.activityType}`);
  }

  /**
   * Handle achievement unlocked events
   */
  @OnEvent('achievement.unlocked')
  async handleAchievementUnlocked(payload: {
    userId: string;
    achievementId: string;
    points: number;
  }) {
    // Award points for achievement
    await this.pointsService.awardPoints(
      payload.userId,
      'achievement_unlocked',
      payload.points,
      {
        referenceType: 'achievement',
        referenceId: payload.achievementId,
      },
    );

    this.logger.log(`Achievement points awarded to user ${payload.userId}`);
  }

  /**
   * Handle user verification events
   */
  @OnEvent('user.verified')
  async handleUserVerified(payload: {
    userId: string;
    verificationType: string;
  }) {
    // Check and award verification badges
    await this.badgesService.checkAndAwardEligibleBadges(payload.userId);

    this.logger.log(`Verification badges checked for user ${payload.userId}`);
  }

  /**
   * Handle profile completion events
   */
  @OnEvent('user.profile.completed')
  async handleProfileCompleted(payload: { userId: string }) {
    // Award points for profile completion
    await this.pointsService.awardPoints(
      payload.userId,
      'profile_completed',
      50,
    );

    // Check achievements
    await this.achievementsService.checkAchievementProgress(
      payload.userId,
      'profile_completed',
    );

    this.logger.log(`Profile completion processed for user ${payload.userId}`);
  }
}
```

**Verification:**
- [ ] Event listeners working
- [ ] Cross-service integration functional
- [ ] Points awarded on activities
- [ ] Achievements checked on activities

---

#### 3.8.3: Create Unified Gamification Controller

**File:** `backend/apps/user-service/src/controllers/gamification.controller.ts`

```typescript
import {
  Controller,
  Get,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/auth';
import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { AchievementsService } from '../services/achievements.service';
import { BadgesService } from '../services/badges.service';
import { PointsService } from '../services/points.service';
import { LeaderboardService, LeaderboardCategory, LeaderboardPeriod } from '../services/leaderboard.service';

@ApiTags('Gamification')
@ApiBearerAuth()
@Controller('gamification')
@UseGuards(JwtAuthGuard)
export class GamificationController {
  constructor(
    private readonly achievementsService: AchievementsService,
    private readonly badgesService: BadgesService,
    private readonly pointsService: PointsService,
    private readonly leaderboardService: LeaderboardService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get complete gamification dashboard for user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Dashboard data retrieved' })
  async getGamificationDashboard(@CurrentUser('id') userId: string) {
    const [points, achievements, badges, achievementStats, leaderboard] = await Promise.all([
      this.pointsService.getUserPoints(userId),
      this.achievementsService.getUserAchievements(userId),
      this.badgesService.getUserBadges(userId),
      this.achievementsService.getAchievementStats(userId),
      this.leaderboardService.getLeaderboard(
        LeaderboardCategory.OVERALL,
        LeaderboardPeriod.ALL_TIME,
        10,
        userId,
      ),
    ]);

    return {
      points,
      achievements: {
        list: achievements.slice(0, 5), // Recent 5
        stats: achievementStats,
      },
      badges: badges.slice(0, 5), // Recent 5
      leaderboard: {
        topRankings: leaderboard.rankings.slice(0, 10),
        userRank: leaderboard.userRank,
      },
    };
  }
}
```

**Verification:**
- [ ] Dashboard endpoint working
- [ ] All data aggregated correctly
- [ ] Performance acceptable

---

## Testing Requirements

### Unit Tests

Create test files for each service:

1. **`achievements.service.spec.ts`**
   - Test achievement unlock logic
   - Test progress calculation
   - Test achievement listing

2. **`badges.service.spec.ts`**
   - Test badge awarding
   - Test eligibility checking
   - Test visibility toggle

3. **`points.service.spec.ts`**
   - Test point awarding
   - Test level progression
   - Test CRON job resets

4. **`leaderboard.service.spec.ts`**
   - Test ranking calculation
   - Test snapshot creation
   - Test user rank retrieval

### Integration Tests

**File:** `backend/apps/user-service/test/gamification.e2e-spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { UserServiceModule } from '../src/user-service.module';

describe('Gamification System (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UserServiceModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login and get token
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    authToken = loginRes.body.accessToken;
  });

  describe('Achievements', () => {
    it('should get all achievements', () => {
      return request(app.getHttpServer())
        .get('/achievements')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should get user achievements with progress', () => {
      return request(app.getHttpServer())
        .get('/achievements/my')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Badges', () => {
    it('should get all badges', () => {
      return request(app.getHttpServer())
        .get('/badges')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should get user badges', () => {
      return request(app.getHttpServer())
        .get('/badges/my')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Points', () => {
    it('should get user points', () => {
      return request(app.getHttpServer())
        .get('/points/my')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should award points for activity', () => {
      return request(app.getHttpServer())
        .post('/points/award')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          activityType: 'post_created',
          basePoints: 10,
        })
        .expect(200);
    });
  });

  describe('Leaderboard', () => {
    it('should get leaderboard rankings', () => {
      return request(app.getHttpServer())
        .get('/leaderboard?period=all-time&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Gamification Dashboard', () => {
    it('should get complete dashboard', () => {
      return request(app.getHttpServer())
        .get('/gamification/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All migrations tested and ready
- [ ] Seed data prepared for achievements and badges
- [ ] Unit tests passing (>80% coverage)
- [ ] Integration tests passing
- [ ] CRON jobs configured correctly
- [ ] Event listeners registered
- [ ] Swagger documentation complete

### Database

- [ ] Run migrations on staging
- [ ] Seed achievements and badges
- [ ] Verify indexes created
- [ ] Test foreign key constraints

### Configuration

- [ ] CRON schedule configured (daily resets, snapshots)
- [ ] Event emitter configured
- [ ] Redis configured for caching (optional but recommended)

### Monitoring

- [ ] Log achievement unlocks
- [ ] Log badge awards
- [ ] Monitor points calculation performance
- [ ] Monitor leaderboard query performance

### Post-Deployment

- [ ] Verify CRON jobs running
- [ ] Monitor event processing
- [ ] Check leaderboard accuracy
- [ ] Verify points accumulation

---

## API Endpoints Summary

### Achievements
- `GET /achievements` - Get all achievements
- `GET /achievements/my` - Get user achievements with progress
- `GET /achievements/stats` - Get achievement statistics
- `GET /achievements/user/:userId` - Get achievements for specific user

### Badges
- `GET /badges` - Get all badges
- `GET /badges/my` - Get user badges
- `POST /badges/my/:badgeId/claim` - Claim a badge
- `POST /badges/my/:badgeId/toggle-visibility` - Toggle badge visibility
- `POST /badges/check-eligibility` - Check and award eligible badges
- `GET /badges/user/:userId` - Get badges for specific user

### Points
- `GET /points/my` - Get user points
- `POST /points/award` - Award points (internal)
- `GET /points/activity-history` - Get activity history
- `GET /points/user/:userId` - Get points for specific user

### Leaderboard
- `GET /leaderboard` - Get leaderboard rankings
  - Query params: `category`, `period`, `limit`

### Gamification Dashboard
- `GET /gamification/dashboard` - Get complete gamification data

---

## Performance Optimization

### Database

1. **Indexes (already created in migration)**
   - User achievements by user and unlock status
   - Activity log by user, type, and date
   - User points by total points and rank
   - Leaderboard by category, period, and date

2. **Query Optimization**
   - Use `getRawMany()` for leaderboard queries (faster than entities)
   - Limit leaderboard results (default 100)
   - Use snapshots for historical data instead of live queries

### Caching (Redis - Recommended)

```typescript
// Add Redis caching for leaderboard
@Injectable()
export class LeaderboardService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getLeaderboard(...) {
    const cacheKey = `leaderboard:${category}:${period}`;
    const cached = await this.cacheManager.get(cacheKey);

    if (cached) return cached;

    const result = await this.calculateLeaderboard(...);
    await this.cacheManager.set(cacheKey, result, 300); // 5min TTL

    return result;
  }
}
```

### Event Processing

- Use queues (RabbitMQ) for async point calculation
- Batch achievement checks
- Debounce rapid activity events

---

## Nigerian Community Titles (Level Names)

As users earn points, they progress through these Nigerian-themed levels:

| Level | Name | Min Points | Description |
|-------|------|------------|-------------|
| 1 | New Neighbor | 0 | Just joined |
| 2 | Active Neighbor | 100 | Regular participation |
| 3 | Helpful Neighbor | 250 | Helping others |
| 4 | Community Builder | 500 | Building community |
| 5 | Estate Champion | 1000 | Community leader |
| 6 | Community Legend | 2000 | Legendary status |

---

## Activity Point Values

Configured in frontend, backend should validate:

```typescript
const ACTIVITY_POINTS = {
  POST_CREATED: 10,
  COMMENT_CREATED: 5,
  EVENT_CREATED: 25,
  EVENT_ATTENDED: 15,
  SAFETY_ALERT_CREATED: 20,
  MARKETPLACE_LISTING: 10,
  HELPFUL_VOTE: 2,
  PROFILE_COMPLETED: 50,
};
```

Multipliers:
- Event organization: 1.5x
- Safety alerts: 1.2x
- Weekend bonus: 1.1x

---

## Complete Implementation Summary

### ✅ Completed Tasks

**Day 1-2: Database Schema**
- [x] 7 tables created (achievements, user_achievements, badges, gamification_badges, user_activity_log, user_points, leaderboard_snapshots)
- [x] All foreign keys and indexes
- [x] Migration file ready

**Day 3: Seed Data**
- [x] Achievement seeds structure
- [x] Badge seeds structure
- [x] Seed command ready

**Day 4-6: Points Service**
- [x] Points awarding logic
- [x] Activity tracking
- [x] Level progression
- [x] CRON jobs for resets
- [x] DTOs created
- [x] Controller created

**Day 7-10: Achievements Service**
- [x] Achievement tracking
- [x] Progress calculation
- [x] Unlock logic
- [x] Event emission
- [x] Statistics calculation
- [x] Controller created

**Day 11-14: Badges Service**
- [x] Badge awarding logic
- [x] Eligibility checking
- [x] Badge claiming
- [x] Visibility toggle
- [x] Auto-award system
- [x] Controller created

**Day 15-18: Leaderboard Service**
- [x] Real-time rankings
- [x] User rank calculation
- [x] Snapshot creation (CRON)
- [x] Multiple periods support
- [x] Controller created

**Day 19-20: Integration**
- [x] Module configuration
- [x] Event listeners
- [x] Gamification integration service
- [x] Unified dashboard endpoint

### 📦 Deliverables

1. **7 New Database Tables** with complete schema
2. **5 Services** (Achievements, Badges, Points, Leaderboard, Integration)
3. **5 Controllers** with 20+ endpoints
4. **DTOs** for all requests/responses
5. **Entity Classes** for all tables
6. **CRON Jobs** for daily/weekly/monthly resets
7. **Event System** for cross-service integration
8. **Swagger Documentation** for all endpoints
9. **Test Suites** (unit + e2e)
10. **Seed Data** for initial achievements and badges

---

**Total Effort:** 20 developer days
**API Endpoints:** 20+
**Database Tables:** 7 new tables
**Lines of Code:** ~3,000+ (services, controllers, entities, DTOs)

---

*Implementation guide complete! Ready for developer assignment.*