import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddUserDashboardTables1760007162211 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user_bookmarks table
    await queryRunner.createTable(
      new Table({
        name: 'user_bookmarks',
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
            name: 'item_type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'item_id',
            type: 'uuid',
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

    // Create unique index on user_id, item_type, item_id
    await queryRunner.createIndex(
      'user_bookmarks',
      new TableIndex({
        name: 'IDX_USER_BOOKMARKS_UNIQUE',
        columnNames: ['user_id', 'item_type', 'item_id'],
        isUnique: true,
      }),
    );

    // Create index for faster lookups
    await queryRunner.createIndex(
      'user_bookmarks',
      new TableIndex({
        name: 'IDX_USER_BOOKMARKS_USER_TYPE',
        columnNames: ['user_id', 'item_type'],
      }),
    );

    // Create user_dashboard_stats table (cached statistics)
    await queryRunner.createTable(
      new Table({
        name: 'user_dashboard_stats',
        columns: [
          {
            name: 'user_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'bookmarks_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'saved_deals_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'attending_events_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'posts_shared_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'neighbors_helped_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'events_joined_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'last_calculated_at',
            type: 'timestamp',
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_dashboard_stats');
    await queryRunner.dropTable('user_bookmarks');
  }
}
