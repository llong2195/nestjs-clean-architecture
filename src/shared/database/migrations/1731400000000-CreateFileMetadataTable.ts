import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateFileMetadataTable1731400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'file_metadata',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'original_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'mime_type',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'size',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'storage_key',
            type: 'varchar',
            length: '500',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'url',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'uploaded_by',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'uploaded_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create index on uploaded_by for quick lookups
    await queryRunner.createIndex(
      'file_metadata',
      new TableIndex({
        name: 'idx_file_metadata_uploaded_by',
        columnNames: ['uploaded_by'],
      }),
    );

    // Create index on storage_key for quick lookups
    await queryRunner.createIndex(
      'file_metadata',
      new TableIndex({
        name: 'idx_file_metadata_storage_key',
        columnNames: ['storage_key'],
      }),
    );

    // Create index on uploaded_at for sorting
    await queryRunner.createIndex(
      'file_metadata',
      new TableIndex({
        name: 'idx_file_metadata_uploaded_at',
        columnNames: ['uploaded_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('file_metadata', 'idx_file_metadata_uploaded_at');
    await queryRunner.dropIndex('file_metadata', 'idx_file_metadata_storage_key');
    await queryRunner.dropIndex('file_metadata', 'idx_file_metadata_uploaded_by');
    await queryRunner.dropTable('file_metadata');
  }
}
