import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddCulturalProfileTables1760101567945 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create nigerian_states table
    await queryRunner.createTable(
      new Table({
        name: 'nigerian_states',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '50',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'region',
            type: 'varchar',
            length: '50',
            comment: 'North Central, North East, North West, South East, South South, South West',
          },
          {
            name: 'capital',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'lgas',
            type: 'jsonb',
            comment: 'Array of Local Government Areas',
          },
          {
            name: 'population',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'area_sqkm',
            type: 'decimal',
            precision: 10,
            scale: 2,
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
      }),
      true,
    );

    // Create nigerian_languages table
    await queryRunner.createTable(
      new Table({
        name: 'nigerian_languages',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '50',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'native_name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'greeting',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'speakers_count',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'regions',
            type: 'jsonb',
            comment: 'Array of regions where spoken',
          },
          {
            name: 'is_major',
            type: 'boolean',
            default: false,
            comment: 'Is it a major language (Hausa, Yoruba, Igbo, English)',
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

    // Create cultural_backgrounds table
    await queryRunner.createTable(
      new Table({
        name: 'cultural_backgrounds',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '50',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'region',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'traditions',
            type: 'jsonb',
            isNullable: true,
            comment: 'Cultural traditions and practices',
          },
          {
            name: 'population_estimate',
            type: 'int',
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
      }),
      true,
    );

    // Create professional_categories table
    await queryRunner.createTable(
      new Table({
        name: 'professional_categories',
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
            length: '100',
          },
          {
            name: 'titles',
            type: 'jsonb',
            comment: 'Array of professional titles in this category',
          },
          {
            name: 'icon',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'display_order',
            type: 'int',
            default: 0,
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

    // Create user_privacy_settings table
    await queryRunner.createTable(
      new Table({
        name: 'user_privacy_settings',
        columns: [
          {
            name: 'user_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'show_state_on_profile',
            type: 'boolean',
            default: true,
          },
          {
            name: 'show_languages_on_profile',
            type: 'boolean',
            default: true,
          },
          {
            name: 'show_culture_on_profile',
            type: 'boolean',
            default: false,
          },
          {
            name: 'show_profession_on_profile',
            type: 'boolean',
            default: true,
          },
          {
            name: 'show_location_on_profile',
            type: 'boolean',
            default: true,
          },
          {
            name: 'show_bio_on_profile',
            type: 'boolean',
            default: true,
          },
          {
            name: 'show_age_on_profile',
            type: 'boolean',
            default: false,
          },
          {
            name: 'allow_cultural_matching',
            type: 'boolean',
            default: true,
          },
          {
            name: 'allow_professional_networking',
            type: 'boolean',
            default: true,
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

    // Create user_languages table (many-to-many)
    await queryRunner.createTable(
      new Table({
        name: 'user_languages',
        columns: [
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'language_id',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'proficiency',
            type: 'varchar',
            length: '20',
            isNullable: true,
            comment: 'native, fluent, intermediate, basic',
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
            columnNames: ['language_id'],
            referencedTableName: 'nigerian_languages',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'nigerian_states',
      new TableIndex({
        name: 'IDX_STATES_REGION',
        columnNames: ['region'],
      }),
    );

    await queryRunner.createIndex(
      'nigerian_languages',
      new TableIndex({
        name: 'IDX_LANGUAGES_MAJOR',
        columnNames: ['is_major'],
      }),
    );

    await queryRunner.createIndex(
      'cultural_backgrounds',
      new TableIndex({
        name: 'IDX_CULTURAL_REGION',
        columnNames: ['region'],
      }),
    );

    await queryRunner.createIndex(
      'professional_categories',
      new TableIndex({
        name: 'IDX_PROFESSIONAL_ORDER',
        columnNames: ['display_order'],
      }),
    );

    await queryRunner.createIndex(
      'user_languages',
      new TableIndex({
        name: 'IDX_USER_LANGUAGES_UNIQUE',
        columnNames: ['user_id', 'language_id'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_languages');
    await queryRunner.dropTable('user_privacy_settings');
    await queryRunner.dropTable('professional_categories');
    await queryRunner.dropTable('cultural_backgrounds');
    await queryRunner.dropTable('nigerian_languages');
    await queryRunner.dropTable('nigerian_states');
  }
}




