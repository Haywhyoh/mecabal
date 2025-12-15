import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHelpOffersTable20251216000000 implements MigrationInterface {
  name = 'CreateHelpOffersTable20251216000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const helpOffersExists = await queryRunner.hasTable('help_offers');

    // Create HelpOfferStatus enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "help_offer_status_enum" AS ENUM ('pending', 'accepted', 'rejected', 'completed', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create ContactMethod enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "contact_method_enum" AS ENUM ('phone', 'message', 'meet');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create help_offers table
    if (!helpOffersExists) {
      await queryRunner.query(`
        CREATE TABLE "help_offers" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "post_id" uuid NOT NULL,
          "user_id" uuid NOT NULL,
          "message" text NOT NULL,
          "contact_method" "contact_method_enum" NOT NULL,
          "availability" text,
          "estimated_time" text,
          "status" "help_offer_status_enum" NOT NULL DEFAULT 'pending',
          "accepted_at" TIMESTAMP,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_help_offers" PRIMARY KEY ("id")
        )
      `);
    }

    // Create unique index on (post_id, user_id) to prevent duplicate offers
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_help_offers_post_id_user_id" 
      ON "help_offers" ("post_id", "user_id")
    `);

    // Create index on (post_id, status)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_help_offers_post_id_status" 
      ON "help_offers" ("post_id", "status")
    `);

    // Create index on (user_id, status)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_help_offers_user_id_status" 
      ON "help_offers" ("user_id", "status")
    `);

    // Create index on status
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_help_offers_status" 
      ON "help_offers" ("status")
    `);

    // Add foreign key constraints
    if (!helpOffersExists || await queryRunner.hasTable('help_offers')) {
      await queryRunner.query(`
        DO $$ BEGIN
          ALTER TABLE "help_offers"
          ADD CONSTRAINT "FK_help_offers_post_id"
          FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE;
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      await queryRunner.query(`
        DO $$ BEGIN
          ALTER TABLE "help_offers"
          ADD CONSTRAINT "FK_help_offers_user_id"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_help_offers_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_help_offers_user_id_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_help_offers_post_id_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_help_offers_post_id_user_id"`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "help_offers"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "contact_method_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "help_offer_status_enum"`);
  }
}

