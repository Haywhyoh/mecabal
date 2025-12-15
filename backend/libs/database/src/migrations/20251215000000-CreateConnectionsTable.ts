import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateConnectionsTable20251215000000 implements MigrationInterface {
  name = 'CreateConnectionsTable20251215000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if table already exists
    const connectionsExists = await queryRunner.hasTable('connections');

    // Create ConnectionType enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "connection_type_enum" AS ENUM ('connect', 'follow', 'trusted', 'neighbor', 'colleague', 'family');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create ConnectionStatus enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "connection_status_enum" AS ENUM ('pending', 'accepted', 'rejected', 'blocked');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create connections table
    if (!connectionsExists) {
      await queryRunner.query(`
        CREATE TABLE "connections" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "from_user_id" uuid NOT NULL,
          "to_user_id" uuid NOT NULL,
          "connection_type" "connection_type_enum" NOT NULL DEFAULT 'connect',
          "status" "connection_status_enum" NOT NULL DEFAULT 'pending',
          "initiated_by" uuid NOT NULL,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          "accepted_at" TIMESTAMP,
          "metadata" jsonb,
          CONSTRAINT "PK_connections" PRIMARY KEY ("id")
        )
      `);
    }

    // Create unique index on (from_user_id, to_user_id)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_connections_from_user_id_to_user_id" 
      ON "connections" ("from_user_id", "to_user_id")
    `);

    // Create index on (from_user_id, status)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_connections_from_user_id_status" 
      ON "connections" ("from_user_id", "status")
    `);

    // Create index on (to_user_id, status)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_connections_to_user_id_status" 
      ON "connections" ("to_user_id", "status")
    `);

    // Create index on connection_type
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_connections_connection_type" 
      ON "connections" ("connection_type")
    `);

    // Add foreign key constraints with exception handling
    if (!connectionsExists || await queryRunner.hasTable('connections')) {
      await queryRunner.query(`
        DO $$ BEGIN
          ALTER TABLE "connections"
          ADD CONSTRAINT "FK_connections_from_user_id"
          FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE CASCADE;
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      await queryRunner.query(`
        DO $$ BEGIN
          ALTER TABLE "connections"
          ADD CONSTRAINT "FK_connections_to_user_id"
          FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE CASCADE;
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_connections_connection_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_connections_to_user_id_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_connections_from_user_id_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_connections_from_user_id_to_user_id"`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "connections"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "connection_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "connection_type_enum"`);
  }
}

