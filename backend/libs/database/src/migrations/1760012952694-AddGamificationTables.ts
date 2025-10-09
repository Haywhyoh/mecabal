import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddGamificationTables1760012952694 implements MigrationInterface {
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
