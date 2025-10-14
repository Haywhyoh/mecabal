import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateHelpCategories1760105000002 implements MigrationInterface {
  name = 'UpdateHelpCategories1760105000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns for borrow category
    await queryRunner.query(`
      ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS borrow_duration VARCHAR(50),
      ADD COLUMN IF NOT EXISTS borrow_item VARCHAR(200),
      ADD COLUMN IF NOT EXISTS item_condition TEXT
    `);

    // Add new columns for task category
    await queryRunner.query(`
      ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS task_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS estimated_duration VARCHAR(100)
    `);

    // Update existing 'job' help posts to 'task'
    await queryRunner.query(`
      UPDATE posts
      SET help_category = 'task'
      WHERE help_category = 'job' AND post_type = 'help'
    `);

    console.log('✅ Help categories updated: job → task, new fields added');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert task back to job
    await queryRunner.query(`
      UPDATE posts
      SET help_category = 'job'
      WHERE help_category = 'task' AND post_type = 'help'
    `);

    // Remove new columns
    await queryRunner.query(`
      ALTER TABLE posts
      DROP COLUMN IF EXISTS borrow_duration,
      DROP COLUMN IF EXISTS borrow_item,
      DROP COLUMN IF EXISTS item_condition,
      DROP COLUMN IF EXISTS task_type,
      DROP COLUMN IF EXISTS estimated_duration
    `);

    console.log('✅ Help categories migration rolled back');
  }
}
