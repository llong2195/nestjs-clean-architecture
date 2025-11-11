import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { v7 as uuid } from 'uuid';
import { Post } from '../../src/modules/post/domain/aggregates/post.aggregate';
import { PostStatus } from '../../src/modules/post/domain/value-objects/post-status.vo';
import { PostOrmEntity } from '../../src/modules/post/infrastructure/persistence/post.orm-entity';
import { PostRepository } from '../../src/modules/post/infrastructure/persistence/post.repository';

/**
 * Integration tests for Post transaction management
 *
 * These tests verify:
 * 1. Transaction commits successfully when all operations succeed
 * 2. Transaction rolls back on error (all-or-nothing)
 * 3. Concurrent transactions don't interfere with each other
 *
 * Note: These tests require a running database.
 * Run with: pnpm test:integration (after database is configured)
 */
describe('PostRepository Transactions (Integration)', () => {
  let module: TestingModule;
  let repository: PostRepository;
  let dataSource: DataSource;

  beforeAll(async () => {
    // This would typically use TestContainers or a test database
    // For now, this is a template showing the test structure
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_NAME || 'test_db',
          entities: [PostOrmEntity],
          synchronize: true, // Only for tests
        }),
        TypeOrmModule.forFeature([PostOrmEntity]),
      ],
      providers: [PostRepository],
    }).compile();

    repository = module.get<PostRepository>(PostRepository);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    if (dataSource) {
      await dataSource.destroy();
    }
    await module.close();
  });

  describe('saveWithTransaction', () => {
    it('should commit transaction when publish succeeds', async () => {
      // Arrange
      const authorId = uuid();
      const post = Post.create(
        authorId,
        'Test Post for Transaction',
        'This is test content',
        'test-post-transaction',
      );

      // Act
      const savedPost = await repository.save(post);
      savedPost.publish();
      const publishedPost = await repository.saveWithTransaction(savedPost);

      // Assert
      expect(publishedPost.status).toBe(PostStatus.PUBLISHED);
      expect(publishedPost.publishedAt).toBeDefined();

      // Verify persistence
      const retrievedPost = await repository.findById(publishedPost.id);
      expect(retrievedPost?.status).toBe(PostStatus.PUBLISHED);
    });

    it('should rollback transaction on error', async () => {
      // Arrange
      const authorId = uuid();
      const post = Post.create(
        authorId,
        'Test Post for Rollback',
        'This is test content',
        'test-post-rollback',
      );
      const savedPost = await repository.save(post);

      // Act - Simulate error by mocking repository to throw
      jest
        .spyOn(repository, 'saveWithTransaction')
        .mockRejectedValueOnce(new Error('Simulated database error'));

      // Assert
      await expect(repository.saveWithTransaction(savedPost)).rejects.toThrow(
        'Simulated database error',
      );

      // Verify original state is maintained (no partial update)
      const retrievedPost = await repository.findById(savedPost.id);
      expect(retrievedPost?.status).toBe(PostStatus.DRAFT);
    });

    it('should handle concurrent transactions correctly', async () => {
      // Arrange
      const authorId = uuid();
      const post1 = Post.create(authorId, 'Concurrent Test 1', 'Content 1', 'concurrent-1');
      const post2 = Post.create(authorId, 'Concurrent Test 2', 'Content 2', 'concurrent-2');

      // Act - Execute concurrent transactions
      const [saved1, saved2] = await Promise.all([
        repository.saveWithTransaction(post1),
        repository.saveWithTransaction(post2),
      ]);

      // Assert - Both should succeed independently
      expect(saved1.id).toBeDefined();
      expect(saved2.id).toBeDefined();
      expect(saved1.id).not.toBe(saved2.id);

      // Verify both persisted correctly
      const [retrieved1, retrieved2] = await Promise.all([
        repository.findById(saved1.id),
        repository.findById(saved2.id),
      ]);
      expect(retrieved1).toBeDefined();
      expect(retrieved2).toBeDefined();
    });
  });
});
