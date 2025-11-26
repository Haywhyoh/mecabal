import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBusinessTables1760042844356 implements MigrationInterface {
    name = 'CreateBusinessTables1760042844356'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if tables already exist
        const licensesExists = await queryRunner.hasTable('business_licenses');
        const reviewsExists = await queryRunner.hasTable('business_reviews');
        const inquiriesExists = await queryRunner.hasTable('business_inquiries');
        const profilesExists = await queryRunner.hasTable('business_profiles');
        const servicesExists = await queryRunner.hasTable('business_services');
        const categoriesExists = await queryRunner.hasTable('business_categories');
        const activityLogExists = await queryRunner.hasTable('business_activity_log');

        // Create business_licenses table
        if (!licensesExists) {
            await queryRunner.query(`CREATE TABLE "business_licenses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "businessId" uuid NOT NULL, "licenseType" character varying(100) NOT NULL, "licenseNumber" character varying(100) NOT NULL, "issuingAuthority" character varying(255) NOT NULL, "issueDate" date, "expiryDate" date, "documentUrl" character varying(500), "isVerified" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f47264eccd6d6af45472eaa152c" PRIMARY KEY ("id"))`);
        }

        // Create business_reviews table
        if (!reviewsExists) {
            await queryRunner.query(`CREATE TABLE "business_reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "businessId" uuid NOT NULL, "userId" uuid NOT NULL, "rating" integer NOT NULL, "reviewText" text, "serviceQuality" integer, "professionalism" integer, "valueForMoney" integer, "response" text, "respondedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bed5317b9c51c138b04219e85b4" PRIMARY KEY ("id"))`);
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_f2f09ebef8b72ffa18d854e3b1" ON "business_reviews" ("businessId", "createdAt") `);
        }

        // Create business_inquiries table
        if (!inquiriesExists) {
            await queryRunner.query(`CREATE TABLE "business_inquiries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "businessId" uuid NOT NULL, "userId" uuid NOT NULL, "inquiryType" character varying(50) NOT NULL, "message" text NOT NULL, "phoneNumber" character varying(20), "preferredContact" character varying(20), "preferredDate" TIMESTAMP, "status" character varying(20) NOT NULL DEFAULT 'pending', "response" text, "respondedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_21b583767e51daf8c147c3420ef" PRIMARY KEY ("id"))`);
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_40c271dacaf3b9e600f5e7311f" ON "business_inquiries" ("businessId", "status") `);
        }

        // Create business_profiles table
        if (!profilesExists) {
            await queryRunner.query(`CREATE TABLE "business_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "businessName" character varying(255) NOT NULL, "description" text, "category" character varying(100) NOT NULL, "subcategory" character varying(100), "serviceArea" character varying(50) NOT NULL, "pricingModel" character varying(50) NOT NULL, "availability" character varying(50) NOT NULL, "phoneNumber" character varying(20), "whatsappNumber" character varying(20), "businessAddress" text, "yearsOfExperience" integer NOT NULL DEFAULT '0', "isVerified" boolean NOT NULL DEFAULT false, "verificationLevel" character varying(20) NOT NULL DEFAULT 'basic', "profileImageUrl" character varying(500), "coverImageUrl" character varying(500), "rating" numeric(3,2) NOT NULL DEFAULT '0', "reviewCount" integer NOT NULL DEFAULT '0', "completedJobs" integer NOT NULL DEFAULT '0', "responseTime" character varying(50), "hasInsurance" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "paymentMethods" jsonb, "businessHours" jsonb, "joinedDate" TIMESTAMP NOT NULL DEFAULT now(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_29525485b1db8e87caf6a5ef042" PRIMARY KEY ("id"))`);
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_f9b9ec020a16e506c389b2fb40" ON "business_profiles" ("category", "serviceArea", "isActive") `);
        }

        // Create business_services table
        if (!servicesExists) {
            await queryRunner.query(`CREATE TABLE "business_services" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "businessId" uuid NOT NULL, "serviceName" character varying(255) NOT NULL, "description" text, "priceMin" numeric(10,2), "priceMax" numeric(10,2), "duration" character varying(50), "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4b6dd7a4ce2532b6ad960b3d537" PRIMARY KEY ("id"))`);
        }

        // Create business_categories table
        if (!categoriesExists) {
            await queryRunner.query(`CREATE TABLE "business_categories" ("id" character varying(100) NOT NULL, "name" character varying(255) NOT NULL, "description" text, "icon" character varying(100), "color" character varying(50), "subcategories" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d10a707dfd0ca189233999204e5" PRIMARY KEY ("id"))`);
        }

        // Create business_activity_log table
        if (!activityLogExists) {
            await queryRunner.query(`CREATE TABLE "business_activity_log" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "businessId" uuid NOT NULL, "activityType" character varying(50) NOT NULL, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_be8f3df51ec66032431eb692f08" PRIMARY KEY ("id"))`);
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_b9e0f7844aefd920417d70b352" ON "business_activity_log" ("businessId", "createdAt") `);
        }

        // Add foreign key constraints with exception handling
        if (!licensesExists || await queryRunner.hasTable('business_licenses')) {
            await queryRunner.query(`
                DO $$ BEGIN
                    ALTER TABLE "business_licenses" ADD CONSTRAINT "FK_1eefd428737a1454df366801f6b" FOREIGN KEY ("businessId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            `);
        }

        if (!reviewsExists || await queryRunner.hasTable('business_reviews')) {
            await queryRunner.query(`
                DO $$ BEGIN
                    ALTER TABLE "business_reviews" ADD CONSTRAINT "FK_efed53aca2fc6dcc156c2c6a80f" FOREIGN KEY ("businessId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            `);
            await queryRunner.query(`
                DO $$ BEGIN
                    ALTER TABLE "business_reviews" ADD CONSTRAINT "FK_a28352ae82dcf503196e5f9cf9e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            `);
        }

        if (!inquiriesExists || await queryRunner.hasTable('business_inquiries')) {
            await queryRunner.query(`
                DO $$ BEGIN
                    ALTER TABLE "business_inquiries" ADD CONSTRAINT "FK_378dd74f0c779bd704a631c5ec2" FOREIGN KEY ("businessId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            `);
            await queryRunner.query(`
                DO $$ BEGIN
                    ALTER TABLE "business_inquiries" ADD CONSTRAINT "FK_f427dcb9114e4a9e1d70873e3c4" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            `);
        }

        if (!profilesExists || await queryRunner.hasTable('business_profiles')) {
            await queryRunner.query(`
                DO $$ BEGIN
                    ALTER TABLE "business_profiles" ADD CONSTRAINT "FK_393d386c30e0691410b9b5f54b9" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            `);
        }

        if (!servicesExists || await queryRunner.hasTable('business_services')) {
            await queryRunner.query(`
                DO $$ BEGIN
                    ALTER TABLE "business_services" ADD CONSTRAINT "FK_e5947796a4042ce27ff67e9e41b" FOREIGN KEY ("businessId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            `);
        }

        if (!activityLogExists || await queryRunner.hasTable('business_activity_log')) {
            await queryRunner.query(`
                DO $$ BEGIN
                    ALTER TABLE "business_activity_log" ADD CONSTRAINT "FK_6945a9672284a2c56eb966b3e25" FOREIGN KEY ("businessId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "business_activity_log" DROP CONSTRAINT IF EXISTS "FK_6945a9672284a2c56eb966b3e25"`);
        await queryRunner.query(`ALTER TABLE "business_services" DROP CONSTRAINT IF EXISTS "FK_e5947796a4042ce27ff67e9e41b"`);
        await queryRunner.query(`ALTER TABLE "business_profiles" DROP CONSTRAINT IF EXISTS "FK_393d386c30e0691410b9b5f54b9"`);
        await queryRunner.query(`ALTER TABLE "business_inquiries" DROP CONSTRAINT IF EXISTS "FK_f427dcb9114e4a9e1d70873e3c4"`);
        await queryRunner.query(`ALTER TABLE "business_inquiries" DROP CONSTRAINT IF EXISTS "FK_378dd74f0c779bd704a631c5ec2"`);
        await queryRunner.query(`ALTER TABLE "business_reviews" DROP CONSTRAINT IF EXISTS "FK_a28352ae82dcf503196e5f9cf9e"`);
        await queryRunner.query(`ALTER TABLE "business_reviews" DROP CONSTRAINT IF EXISTS "FK_efed53aca2fc6dcc156c2c6a80f"`);
        await queryRunner.query(`ALTER TABLE "business_licenses" DROP CONSTRAINT IF EXISTS "FK_1eefd428737a1454df366801f6b"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_b9e0f7844aefd920417d70b352"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "business_activity_log"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "business_categories"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "business_services"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_f9b9ec020a16e506c389b2fb40"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "business_profiles"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_40c271dacaf3b9e600f5e7311f"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "business_inquiries"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_f2f09ebef8b72ffa18d854e3b1"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "business_reviews"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "business_licenses"`);
    }

}
