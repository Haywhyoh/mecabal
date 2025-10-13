import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoryHierarchy1760012952698 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns to listing_categories table
    await queryRunner.query(`
      ALTER TABLE listing_categories 
      ADD COLUMN IF NOT EXISTS parent_id integer
    `);

    await queryRunner.query(`
      ALTER TABLE listing_categories 
      ADD COLUMN IF NOT EXISTS field_definitions jsonb
    `);

    await queryRunner.query(`
      ALTER TABLE listing_categories 
      ADD COLUMN IF NOT EXISTS search_keywords jsonb
    `);

    await queryRunner.query(`
      ALTER TABLE listing_categories 
      ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE listing_categories 
      ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE listing_categories 
      ADD COLUMN IF NOT EXISTS icon_url varchar(500)
    `);

    await queryRunner.query(`
      ALTER TABLE listing_categories 
      ADD COLUMN IF NOT EXISTS color_code varchar(7)
    `);

    // Add foreign key constraint for parent_id
    await queryRunner.query(`
      ALTER TABLE listing_categories 
      ADD CONSTRAINT FK_listing_categories_parent_id 
      FOREIGN KEY (parent_id) REFERENCES listing_categories(id) ON DELETE SET NULL
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_listing_categories_parent_id ON listing_categories (parent_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_listing_categories_is_featured ON listing_categories (is_featured)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_listing_categories_sort_order ON listing_categories (sort_order)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_listing_categories_listing_type ON listing_categories (listing_type)
    `);

    // Add GIN indexes for JSONB fields
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_listing_categories_search_keywords_gin ON listing_categories USING GIN (search_keywords)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_listing_categories_field_definitions_gin ON listing_categories USING GIN (field_definitions)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_listing_categories_parent_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_listing_categories_is_featured`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_listing_categories_sort_order`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_listing_categories_listing_type`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_listing_categories_search_keywords_gin`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_listing_categories_field_definitions_gin`);

    // Drop foreign key constraint
    await queryRunner.query(`ALTER TABLE listing_categories DROP CONSTRAINT IF EXISTS FK_listing_categories_parent_id`);

    // Drop columns
    await queryRunner.query(`ALTER TABLE listing_categories DROP COLUMN IF EXISTS parent_id`);
    await queryRunner.query(`ALTER TABLE listing_categories DROP COLUMN IF EXISTS field_definitions`);
    await queryRunner.query(`ALTER TABLE listing_categories DROP COLUMN IF EXISTS search_keywords`);
    await queryRunner.query(`ALTER TABLE listing_categories DROP COLUMN IF EXISTS is_featured`);
    await queryRunner.query(`ALTER TABLE listing_categories DROP COLUMN IF EXISTS sort_order`);
    await queryRunner.query(`ALTER TABLE listing_categories DROP COLUMN IF EXISTS icon_url`);
    await queryRunner.query(`ALTER TABLE listing_categories DROP COLUMN IF EXISTS color_code`);
  }
}
