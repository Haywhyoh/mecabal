import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLocationAndCulturalFieldsToUser1756389958825 implements MigrationInterface {
    name = 'AddLocationAndCulturalFieldsToUser1756389958825'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "state" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "city" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "estate" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "location" geography(Point,4326)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "landmark" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "address" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD "cultural_background" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "native_languages" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "bio" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD "professional_skills" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD "occupation" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "phone_verified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "identity_verified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "address_verified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "phone_carrier" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "google_id" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_0bd5012aeb82628e07f6a1be53b" UNIQUE ("google_id")`);
        await queryRunner.query(`ALTER TABLE "users" ADD "apple_id" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_222297ce9ce93ae516d1e82b07c" UNIQUE ("apple_id")`);
        await queryRunner.query(`ALTER TABLE "users" ADD "facebook_id" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_df199bc6e53abe32d64bbcf2110" UNIQUE ("facebook_id")`);
        await queryRunner.query(`ALTER TABLE "users" ADD "member_since" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD "verification_badge" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "verification_badge"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "member_since"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_df199bc6e53abe32d64bbcf2110"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "facebook_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_222297ce9ce93ae516d1e82b07c"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "apple_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_0bd5012aeb82628e07f6a1be53b"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "google_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone_carrier"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "address_verified"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "identity_verified"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone_verified"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "occupation"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "professional_skills"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "bio"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "native_languages"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "cultural_background"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "address"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "landmark"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "estate"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "city"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "state"`);
    }

}
