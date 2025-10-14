import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBusinessGeography1760045444997 implements MigrationInterface {
    name = 'AddBusinessGeography1760045444997'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add location fields using regular numeric types instead of PostGIS geography
        // This avoids the need for PostGIS extension in development
        // Check if columns exist before adding them
        const latitudeExists = await queryRunner.hasColumn('business_profiles', 'latitude');
        const longitudeExists = await queryRunner.hasColumn('business_profiles', 'longitude');
        const stateExists = await queryRunner.hasColumn('business_profiles', 'state');
        const cityExists = await queryRunner.hasColumn('business_profiles', 'city');

        if (!latitudeExists) {
            await queryRunner.query(`ALTER TABLE "business_profiles" ADD "latitude" numeric(10,7)`);
        }
        if (!longitudeExists) {
            await queryRunner.query(`ALTER TABLE "business_profiles" ADD "longitude" numeric(10,7)`);
        }
        if (!stateExists) {
            await queryRunner.query(`ALTER TABLE "business_profiles" ADD "state" character varying(100)`);
        }
        if (!cityExists) {
            await queryRunner.query(`ALTER TABLE "business_profiles" ADD "city" character varying(100)`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "business_profiles" DROP COLUMN "city"`);
        await queryRunner.query(`ALTER TABLE "business_profiles" DROP COLUMN "state"`);
        await queryRunner.query(`ALTER TABLE "business_profiles" DROP COLUMN "longitude"`);
        await queryRunner.query(`ALTER TABLE "business_profiles" DROP COLUMN "latitude"`);
    }

}
