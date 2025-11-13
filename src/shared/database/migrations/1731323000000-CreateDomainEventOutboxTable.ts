import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateDomainEventOutboxTable1731323000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'domain_event_outbox',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'event_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'aggregate_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'event_type',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'payload',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'aggregate_version',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'caused_by',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'occurred_on',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'published',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'published_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'retry_count',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'last_error',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes for efficient querying
    await queryRunner.createIndex(
      'domain_event_outbox',
      new TableIndex({
        name: 'idx_outbox_event_id',
        columnNames: ['event_id'],
      }),
    );

    await queryRunner.createIndex(
      'domain_event_outbox',
      new TableIndex({
        name: 'idx_outbox_aggregate_id',
        columnNames: ['aggregate_id'],
      }),
    );

    await queryRunner.createIndex(
      'domain_event_outbox',
      new TableIndex({
        name: 'idx_outbox_event_type',
        columnNames: ['event_type'],
      }),
    );

    await queryRunner.createIndex(
      'domain_event_outbox',
      new TableIndex({
        name: 'idx_outbox_published',
        columnNames: ['published'],
      }),
    );

    // Composite index for polling unpublished events
    await queryRunner.createIndex(
      'domain_event_outbox',
      new TableIndex({
        name: 'idx_outbox_published_created',
        columnNames: ['published', 'created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('domain_event_outbox');
  }
}
