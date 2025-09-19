import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeOtpVerificationUserIdNullable1758124817071 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Make user_id column nullable in otp_verifications table
        await queryRunner.query(`ALTER TABLE "otp_verifications" ALTER COLUMN "user_id" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert user_id column to NOT NULL (this may fail if there are null values)
        await queryRunner.query(`ALTER TABLE "otp_verifications" ALTER COLUMN "user_id" SET NOT NULL`);
    }

}
