import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBusinessGeography1760045444997 implements MigrationInterface {
    name = 'AddBusinessGeography1760045444997'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "business_profiles" ADD "location" geography(Point,4326)`);
        await queryRunner.query(`ALTER TABLE "business_profiles" ADD "latitude" numeric(10,7)`);
        await queryRunner.query(`ALTER TABLE "business_profiles" ADD "longitude" numeric(10,7)`);
        await queryRunner.query(`ALTER TABLE "business_profiles" ADD "state" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "business_profiles" ADD "city" character varying(100)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "business_profiles" DROP COLUMN "city"`);
        await queryRunner.query(`ALTER TABLE "business_profiles" DROP COLUMN "state"`);
        await queryRunner.query(`ALTER TABLE "business_profiles" DROP COLUMN "longitude"`);
        await queryRunner.query(`ALTER TABLE "business_profiles" DROP COLUMN "latitude"`);
        await queryRunner.query(`ALTER TABLE "business_profiles" DROP COLUMN "location"`);
    }

}
