import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateSessionsTable1731320000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create sessions table
    await queryRunner.createTable(
      new Table({
        name: 'sessions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v7()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'token',
            type: 'varchar',
            length: '500',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
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

    // Create index on user_id
    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'idx_sessions_user_id',
        columnNames: ['user_id'],
      }),
    );

    // Create unique index on token
    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'idx_sessions_token',
        columnNames: ['token'],
        isUnique: true,
      }),
    );

    // Create index on expires_at for efficient cleanup queries
    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'idx_sessions_expires_at',
        columnNames: ['expires_at'],
      }),
    );

    // Create foreign key to users table
    await queryRunner.createForeignKey(
      'sessions',
      new TableForeignKey({
        name: 'fk_sessions_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey('sessions', 'fk_sessions_user');

    // Drop indexes
    await queryRunner.dropIndex('sessions', 'idx_sessions_expires_at');
    await queryRunner.dropIndex('sessions', 'idx_sessions_token');
    await queryRunner.dropIndex('sessions', 'idx_sessions_user_id');

    // Drop table
    await queryRunner.dropTable('sessions');
  }
}
