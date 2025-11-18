import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConversationIndexes1763449000000 implements MigrationInterface {
  name = 'AddConversationIndexes1763449000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add missing columns to conversation_participants table
    await queryRunner.query(`
      ALTER TABLE conversation_participants
      ADD COLUMN IF NOT EXISTS left_at timestamp NULL
    `);

    await queryRunner.query(`
      ALTER TABLE conversation_participants
      ADD COLUMN IF NOT EXISTS last_read_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);

    // Add tsvector column for full-text search on messages.content
    await queryRunner.query(`
      ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS search_vector tsvector
      GENERATED ALWAYS AS (to_tsvector('english', content)) STORED
    `);

    // Create GIN index for full-text search
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_search_vector
      ON messages USING GIN (search_vector)
    `);

    // Create index on messages for conversation history queries (conversation_id, created_at DESC)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
      ON messages(conversation_id, created_at DESC)
    `);

    // Create partial index on active conversation participants
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_active
      ON conversation_participants(user_id)
      WHERE left_at IS NULL
    `);

    // Create index on conversation_participants for conversation queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation
      ON conversation_participants(conversation_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes in reverse order
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_conversation_participants_conversation
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_conversation_participants_user_active
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_messages_conversation_created
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_messages_search_vector
    `);

    // Drop tsvector column
    await queryRunner.query(`
      ALTER TABLE messages DROP COLUMN IF EXISTS search_vector
    `);

    // Drop added columns from conversation_participants
    await queryRunner.query(`
      ALTER TABLE conversation_participants DROP COLUMN IF EXISTS last_read_at
    `);

    await queryRunner.query(`
      ALTER TABLE conversation_participants DROP COLUMN IF EXISTS left_at
    `);
  }
}
