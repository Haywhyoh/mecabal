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

*END OF PART 1 - Gamification Guide continues in next response due to length...*
