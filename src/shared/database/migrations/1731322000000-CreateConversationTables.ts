import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateConversationTables1731322000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create conversations table
    await queryRunner.createTable(
      new Table({
        name: 'conversations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'created_by',
            type: 'uuid',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create messages table
    await queryRunner.createTable(
      new Table({
        name: 'messages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'conversation_id',
            type: 'uuid',
          },
          {
            name: 'sender_id',
            type: 'uuid',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'is_read',
            type: 'boolean',
            default: false,
          },
          {
            name: 'is_edited',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create conversation_participants junction table
    await queryRunner.createTable(
      new Table({
        name: 'conversation_participants',
        columns: [
          {
            name: 'conversation_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'joined_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign keys for conversations
    await queryRunner.createForeignKey(
      'conversations',
      new TableForeignKey({
        name: 'fk_conversations_creator',
        columnNames: ['created_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Add foreign keys for messages
    await queryRunner.createForeignKey(
      'messages',
      new TableForeignKey({
        name: 'fk_messages_conversation',
        columnNames: ['conversation_id'],
        referencedTableName: 'conversations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'messages',
      new TableForeignKey({
        name: 'fk_messages_sender',
        columnNames: ['sender_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Add foreign keys for conversation_participants
    await queryRunner.createForeignKey(
      'conversation_participants',
      new TableForeignKey({
        name: 'fk_participants_conversation',
        columnNames: ['conversation_id'],
        referencedTableName: 'conversations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'conversation_participants',
      new TableForeignKey({
        name: 'fk_participants_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes for conversations
    await queryRunner.createIndex(
      'conversations',
      new TableIndex({
        name: 'idx_conversations_created_by',
        columnNames: ['created_by'],
      }),
    );

    await queryRunner.createIndex(
      'conversations',
      new TableIndex({
        name: 'idx_conversations_type',
        columnNames: ['type'],
      }),
    );

    await queryRunner.createIndex(
      'conversations',
      new TableIndex({
        name: 'idx_conversations_is_active',
        columnNames: ['is_active'],
      }),
    );

    // Create indexes for messages
    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'idx_messages_conversation_id',
        columnNames: ['conversation_id'],
      }),
    );

    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'idx_messages_sender_id',
        columnNames: ['sender_id'],
      }),
    );

    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'idx_messages_created_at',
        columnNames: ['created_at'],
      }),
    );

    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'idx_messages_is_read',
        columnNames: ['is_read'],
      }),
    );

    // Create indexes for conversation_participants
    await queryRunner.createIndex(
      'conversation_participants',
      new TableIndex({
        name: 'idx_participants_user_id',
        columnNames: ['user_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    await queryRunner.dropForeignKey('conversation_participants', 'fk_participants_user');
    await queryRunner.dropForeignKey('conversation_participants', 'fk_participants_conversation');
    await queryRunner.dropForeignKey('messages', 'fk_messages_sender');
    await queryRunner.dropForeignKey('messages', 'fk_messages_conversation');
    await queryRunner.dropForeignKey('conversations', 'fk_conversations_creator');

    // Drop tables
    await queryRunner.dropTable('conversation_participants');
    await queryRunner.dropTable('messages');
    await queryRunner.dropTable('conversations');
  }
}
