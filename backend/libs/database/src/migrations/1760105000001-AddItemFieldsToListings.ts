import { MigrationInterface, QueryRunner } from "typeorm";

export class AddItemFieldsToListings1760105000001 implements MigrationInterface {
    name = 'AddItemFieldsToListings1760105000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if columns exist before adding them
        const modelExists = await queryRunner.hasColumn('listings', 'model');
        const yearExists = await queryRunner.hasColumn('listings', 'year');
        const warrantyExists = await queryRunner.hasColumn('listings', 'warranty');

        // Add new item-specific fields to listings table only if they don't exist
        if (!modelExists) {
            await queryRunner.query(`ALTER TABLE "listings" ADD "model" character varying(100)`);
        }
        if (!yearExists) {
            await queryRunner.query(`ALTER TABLE "listings" ADD "year" integer`);
        }
        if (!warrantyExists) {
            await queryRunner.query(`ALTER TABLE "listings" ADD "warranty" character varying(100)`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the added fields
        await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN IF EXISTS "warranty"`);
        await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN IF EXISTS "year"`);
        await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN IF EXISTS "model"`);
    }
}
