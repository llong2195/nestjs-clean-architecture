import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreatePostTables1731316000000 implements MigrationInterface {
  name = 'CreatePostTables1731316000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create posts table
    await queryRunner.createTable(
      new Table({
        name: 'posts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'author_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'DRAFT'",
            isNullable: false,
          },
          {
            name: 'published_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'view_count',
            type: 'integer',
            default: 0,
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

    // Create tags table
    await queryRunner.createTable(
      new Table({
        name: 'tags',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '50',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '100',
            isUnique: true,
            isNullable: false,
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

    // Create comments table
    await queryRunner.createTable(
      new Table({
        name: 'comments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'post_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'author_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
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

    // Create post_tags junction table
    await queryRunner.createTable(
      new Table({
        name: 'post_tags',
        columns: [
          {
            name: 'post_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'tag_id',
            type: 'uuid',
            isPrimary: true,
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

    // Create indexes for posts
    await queryRunner.createIndex(
      'posts',
      new TableIndex({
        name: 'idx_posts_author_id',
        columnNames: ['author_id'],
      }),
    );

    await queryRunner.createIndex(
      'posts',
      new TableIndex({
        name: 'idx_posts_slug',
        columnNames: ['slug'],
      }),
    );

    await queryRunner.createIndex(
      'posts',
      new TableIndex({
        name: 'idx_posts_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'posts',
      new TableIndex({
        name: 'idx_posts_deleted_at',
        columnNames: ['deleted_at'],
      }),
    );

    // Create indexes for comments
    await queryRunner.createIndex(
      'comments',
      new TableIndex({
        name: 'idx_comments_post_id',
        columnNames: ['post_id'],
      }),
    );

    await queryRunner.createIndex(
      'comments',
      new TableIndex({
        name: 'idx_comments_author_id',
        columnNames: ['author_id'],
      }),
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'posts',
      new TableForeignKey({
        name: 'fk_posts_author',
        columnNames: ['author_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'comments',
      new TableForeignKey({
        name: 'fk_comments_post',
        columnNames: ['post_id'],
        referencedTableName: 'posts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'comments',
      new TableForeignKey({
        name: 'fk_comments_author',
        columnNames: ['author_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'post_tags',
      new TableForeignKey({
        name: 'fk_post_tags_post',
        columnNames: ['post_id'],
        referencedTableName: 'posts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'post_tags',
      new TableForeignKey({
        name: 'fk_post_tags_tag',
        columnNames: ['tag_id'],
        referencedTableName: 'tags',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.dropForeignKey('post_tags', 'fk_post_tags_tag');
    await queryRunner.dropForeignKey('post_tags', 'fk_post_tags_post');
    await queryRunner.dropForeignKey('comments', 'fk_comments_author');
    await queryRunner.dropForeignKey('comments', 'fk_comments_post');
    await queryRunner.dropForeignKey('posts', 'fk_posts_author');

    // Drop indexes
    await queryRunner.dropIndex('comments', 'idx_comments_author_id');
    await queryRunner.dropIndex('comments', 'idx_comments_post_id');
    await queryRunner.dropIndex('posts', 'idx_posts_deleted_at');
    await queryRunner.dropIndex('posts', 'idx_posts_status');
    await queryRunner.dropIndex('posts', 'idx_posts_slug');
    await queryRunner.dropIndex('posts', 'idx_posts_author_id');

    // Drop tables
    await queryRunner.dropTable('post_tags');
    await queryRunner.dropTable('comments');
    await queryRunner.dropTable('tags');
    await queryRunner.dropTable('posts');
  }
}
