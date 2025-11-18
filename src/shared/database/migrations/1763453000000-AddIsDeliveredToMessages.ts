import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add is_delivered column to messages table for tracking delivery status
 */
export class AddIsDeliveredToMessages1763453000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add is_delivered column with default false
    await queryRunner.query(`
      ALTER TABLE "messages"
      ADD COLUMN "is_delivered" boolean NOT NULL DEFAULT false
    `);

    // Add comment for documentation
    await queryRunner.query(`
      COMMENT ON COLUMN "messages"."is_delivered" IS 'Indicates whether the message has been delivered to the recipient'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove is_delivered column
    await queryRunner.query(`
      ALTER TABLE "messages"
      DROP COLUMN "is_delivered"
    `);
  }
}
