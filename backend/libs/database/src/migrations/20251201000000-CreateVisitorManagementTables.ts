import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVisitorManagementTables20251201000000 implements MigrationInterface {
  name = 'CreateVisitorManagementTables20251201000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create visitors table
    await queryRunner.query(`
      CREATE TABLE "visitors" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "full_name" character varying(200) NOT NULL,
        "phone_number" character varying(20),
        "email" character varying,
        "photo_url" character varying,
        "vehicle_registration" character varying(50),
        "vehicle_make" character varying(100),
        "vehicle_color" character varying(50),
        "id_card_number" character varying(50),
        "id_card_type" character varying(50),
        "company_name" character varying(200),
        "purpose" text,
        "notes" text,
        "estate_id" uuid NOT NULL,
        "is_blacklisted" boolean NOT NULL DEFAULT false,
        "blacklist_reason" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_visitors" PRIMARY KEY ("id")
      )
    `);

    // Create visitor_passes table
    await queryRunner.query(`
      CREATE TABLE "visitor_passes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "visitor_id" uuid NOT NULL,
        "host_id" uuid NOT NULL,
        "estate_id" uuid NOT NULL,
        "qr_code" character varying NOT NULL,
        "qr_payload" text,
        "status" character varying NOT NULL DEFAULT 'PENDING',
        "expected_arrival" TIMESTAMP NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "checked_in_at" TIMESTAMP,
        "checked_out_at" TIMESTAMP,
        "entry_gate" character varying(100),
        "exit_gate" character varying(100),
        "guest_count" integer NOT NULL DEFAULT 0,
        "purpose" text,
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_visitor_passes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_visitor_passes_qr_code" UNIQUE ("qr_code")
      )
    `);

    // Create visitor_alerts table
    await queryRunner.query(`
      CREATE TABLE "visitor_alerts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "estate_id" uuid NOT NULL,
        "visitor_id" uuid,
        "visitor_pass_id" uuid,
        "type" character varying NOT NULL,
        "severity" character varying NOT NULL DEFAULT 'MEDIUM',
        "status" character varying NOT NULL DEFAULT 'OPEN',
        "title" character varying(200) NOT NULL,
        "description" text NOT NULL,
        "location" character varying(200),
        "gate_name" character varying(100),
        "qr_code" character varying(500),
        "ip_address" character varying(50),
        "user_agent" text,
        "resolved_by" uuid,
        "resolution_notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "resolved_at" TIMESTAMP,
        CONSTRAINT "PK_visitor_alerts" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints for visitors table
    await queryRunner.query(`
      ALTER TABLE "visitors"
      ADD CONSTRAINT "FK_visitors_estate"
      FOREIGN KEY ("estate_id")
      REFERENCES "neighborhoods"("id")
      ON DELETE CASCADE
    `);

    // Add foreign key constraints for visitor_passes table
    await queryRunner.query(`
      ALTER TABLE "visitor_passes"
      ADD CONSTRAINT "FK_visitor_passes_visitor"
      FOREIGN KEY ("visitor_id")
      REFERENCES "visitors"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "visitor_passes"
      ADD CONSTRAINT "FK_visitor_passes_host"
      FOREIGN KEY ("host_id")
      REFERENCES "users"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "visitor_passes"
      ADD CONSTRAINT "FK_visitor_passes_estate"
      FOREIGN KEY ("estate_id")
      REFERENCES "neighborhoods"("id")
      ON DELETE CASCADE
    `);

    // Add foreign key constraints for visitor_alerts table
    await queryRunner.query(`
      ALTER TABLE "visitor_alerts"
      ADD CONSTRAINT "FK_visitor_alerts_estate"
      FOREIGN KEY ("estate_id")
      REFERENCES "neighborhoods"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "visitor_alerts"
      ADD CONSTRAINT "FK_visitor_alerts_visitor"
      FOREIGN KEY ("visitor_id")
      REFERENCES "visitors"("id")
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "visitor_alerts"
      ADD CONSTRAINT "FK_visitor_alerts_resolver"
      FOREIGN KEY ("resolved_by")
      REFERENCES "users"("id")
      ON DELETE SET NULL
    `);

    // Create indexes for visitors table
    await queryRunner.query(`
      CREATE INDEX "IDX_visitors_estate_id" ON "visitors" ("estate_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_visitors_phone_number" ON "visitors" ("phone_number")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_visitors_email" ON "visitors" ("email")
    `);

    // Create indexes for visitor_passes table
    await queryRunner.query(`
      CREATE INDEX "IDX_visitor_passes_visitor_id" ON "visitor_passes" ("visitor_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_visitor_passes_host_id" ON "visitor_passes" ("host_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_visitor_passes_estate_id" ON "visitor_passes" ("estate_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_visitor_passes_status" ON "visitor_passes" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_visitor_passes_qr_code" ON "visitor_passes" ("qr_code")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_visitor_passes_expires_at" ON "visitor_passes" ("expires_at")
    `);

    // Create indexes for visitor_alerts table
    await queryRunner.query(`
      CREATE INDEX "IDX_visitor_alerts_estate_id" ON "visitor_alerts" ("estate_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_visitor_alerts_visitor_id" ON "visitor_alerts" ("visitor_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_visitor_alerts_severity" ON "visitor_alerts" ("severity")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_visitor_alerts_status" ON "visitor_alerts" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_visitor_alerts_created_at" ON "visitor_alerts" ("created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_visitor_alerts_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_visitor_alerts_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_visitor_alerts_severity"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_visitor_alerts_visitor_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_visitor_alerts_estate_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_visitor_passes_expires_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_visitor_passes_qr_code"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_visitor_passes_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_visitor_passes_estate_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_visitor_passes_host_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_visitor_passes_visitor_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_visitors_email"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_visitors_phone_number"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_visitors_estate_id"`);

    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "visitor_alerts" DROP CONSTRAINT IF EXISTS "FK_visitor_alerts_resolver"`);
    await queryRunner.query(`ALTER TABLE "visitor_alerts" DROP CONSTRAINT IF EXISTS "FK_visitor_alerts_visitor"`);
    await queryRunner.query(`ALTER TABLE "visitor_alerts" DROP CONSTRAINT IF EXISTS "FK_visitor_alerts_estate"`);
    await queryRunner.query(`ALTER TABLE "visitor_passes" DROP CONSTRAINT IF EXISTS "FK_visitor_passes_estate"`);
    await queryRunner.query(`ALTER TABLE "visitor_passes" DROP CONSTRAINT IF EXISTS "FK_visitor_passes_host"`);
    await queryRunner.query(`ALTER TABLE "visitor_passes" DROP CONSTRAINT IF EXISTS "FK_visitor_passes_visitor"`);
    await queryRunner.query(`ALTER TABLE "visitors" DROP CONSTRAINT IF EXISTS "FK_visitors_estate"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "visitor_alerts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "visitor_passes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "visitors"`);
  }
}

