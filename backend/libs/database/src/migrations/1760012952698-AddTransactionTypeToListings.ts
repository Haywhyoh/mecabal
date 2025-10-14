import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTransactionTypeToListings1760012952698 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add transaction_type column to listings table
    await queryRunner.query(`
      ALTER TABLE listings 
      ADD COLUMN IF NOT EXISTS transaction_type varchar(20)
    `);

    // Add index for transaction_type
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_listings_transaction_type ON listings (transaction_type)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_listings_transaction_type`);
    
    // Drop column
    await queryRunner.query(`ALTER TABLE listings DROP COLUMN IF EXISTS transaction_type`);
  }
}
