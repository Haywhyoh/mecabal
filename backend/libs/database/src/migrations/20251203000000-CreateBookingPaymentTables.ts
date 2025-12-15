import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBookingPaymentTables20251203000000 implements MigrationInterface {
  name = 'CreateBookingPaymentTables20251203000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create BookingStatus enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "booking_status_enum" AS ENUM ('pending', 'confirmed', 'in-progress', 'completed', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create PaymentStatus enum for bookings
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "booking_payment_status_enum" AS ENUM ('pending', 'paid', 'refunded', 'failed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create PaymentStatus enum for payments
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "payment_status_enum" AS ENUM ('pending', 'success', 'failed', 'refunded', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create PaymentType enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "payment_type_enum" AS ENUM ('service-booking', 'bill-payment', 'event-ticket', 'subscription', 'other');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create bookings table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bookings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "businessId" uuid NOT NULL,
        "serviceId" uuid,
        "serviceName" character varying(255) NOT NULL,
        "status" "booking_status_enum" NOT NULL DEFAULT 'pending',
        "scheduledDate" date,
        "scheduledTime" time,
        "address" text,
        "description" text,
        "price" numeric(10,2) NOT NULL,
        "paymentStatus" "booking_payment_status_enum" NOT NULL DEFAULT 'pending',
        "paymentId" uuid,
        "completedAt" timestamp,
        "cancelledAt" timestamp,
        "cancellationReason" text,
        "canReview" boolean NOT NULL DEFAULT false,
        "hasReviewed" boolean NOT NULL DEFAULT false,
        "reviewId" uuid,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bookings" PRIMARY KEY ("id"),
        CONSTRAINT "FK_bookings_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_bookings_businessId" FOREIGN KEY ("businessId") REFERENCES "business_profiles"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_bookings_serviceId" FOREIGN KEY ("serviceId") REFERENCES "business_services"("id") ON DELETE SET NULL
      )
    `);

    // Create indexes for bookings
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_bookings_userId_status" ON "bookings" ("userId", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_bookings_businessId_status" ON "bookings" ("businessId", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_bookings_scheduledDate" ON "bookings" ("scheduledDate")
    `);

    // Create payments table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "amount" numeric(10,2) NOT NULL,
        "currency" character varying(3) NOT NULL DEFAULT 'NGN',
        "status" "payment_status_enum" NOT NULL DEFAULT 'pending',
        "type" "payment_type_enum" NOT NULL,
        "reference" character varying(255) NOT NULL,
        "paystackReference" character varying(255),
        "description" text,
        "metadata" jsonb,
        "bookingId" uuid,
        "billId" uuid,
        "eventId" uuid,
        "paidAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payments" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_payments_reference" UNIQUE ("reference"),
        CONSTRAINT "FK_payments_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_payments_bookingId" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL
      )
    `);

    // Create indexes for payments
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payments_userId_status" ON "payments" ("userId", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payments_reference" ON "payments" ("reference")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payments_paystackReference" ON "payments" ("paystackReference")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payments_type_status" ON "payments" ("type", "status")
    `);

    // Create bank_accounts table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bank_accounts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "accountNumber" character varying(20) NOT NULL,
        "bankCode" character varying(10) NOT NULL,
        "bankName" character varying(255) NOT NULL,
        "accountName" character varying(255) NOT NULL,
        "isVerified" boolean NOT NULL DEFAULT false,
        "isDefault" boolean NOT NULL DEFAULT false,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bank_accounts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_bank_accounts_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes for bank_accounts
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_bank_accounts_userId" ON "bank_accounts" ("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_bank_accounts_userId_isDefault" ON "bank_accounts" ("userId", "isDefault")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bank_accounts_userId_isDefault"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bank_accounts_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_type_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_paystackReference"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_reference"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_userId_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bookings_scheduledDate"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bookings_businessId_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bookings_userId_status"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "bank_accounts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bookings"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "booking_payment_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "booking_status_enum"`);
  }
}









