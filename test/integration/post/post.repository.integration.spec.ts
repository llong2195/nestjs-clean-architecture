import { DataSource, Repository } from 'typeorm';
import { Post } from '../../../src/modules/post/domain/aggregates/post.aggregate';
import { PostStatus } from '../../../src/modules/post/domain/value-objects/post-status.vo';
import { PostOrmEntity } from '../../../src/modules/post/infrastructure/persistence/post.orm-entity';
import { PostRepository } from '../../../src/modules/post/infrastructure/persistence/post.repository';
import { DatabaseTestHelper } from '../../helpers/database-test.helper';

describe('PostRepository Integration Tests', () => {
  let dataSource: DataSource;
  let ormRepository: Repository<PostOrmEntity>;
  let postRepository: PostRepository;

  const authorId = 'test-author-id';

  beforeAll(async () => {
    dataSource = await DatabaseTestHelper.setupDatabase();
    ormRepository = dataSource.getRepository(PostOrmEntity);
    postRepository = new PostRepository(ormRepository, dataSource);
  }, 60000); // Allow 60s for container startup

  afterAll(async () => {
    await DatabaseTestHelper.teardownDatabase();
  });

  beforeEach(async () => {
    await DatabaseTestHelper.cleanDatabase();
  });

  describe('save', () => {
    it('should save a new post to the database', async () => {
      const post = Post.create(authorId, 'Test Title', 'Test content here');

      const savedPost = await postRepository.save(post);

      expect(savedPost).toBeDefined();
      expect(savedPost.id).toBe(post.id);
      expect(savedPost.title).toBe('Test Title');
      expect(savedPost.content).toBe('Test content here');
      expect(savedPost.authorId).toBe(authorId);
      expect(savedPost.status).toBe(PostStatus.DRAFT);
      expect(savedPost.slug).toBe('test-title');

      // Verify in database
      const dbEntity = await ormRepository.findOne({
        where: { id: post.id },
      });
      expect(dbEntity).toBeDefined();
      expect(dbEntity?.title).toBe('Test Title');
    });

    it('should update an existing post', async () => {
      const post = Post.create(authorId, 'Original Title', 'Original content');
      await postRepository.save(post);

      // Update post
      post.updateContent('Updated Title', 'Updated content');
      const updatedPost = await postRepository.save(post);

      expect(updatedPost.title).toBe('Updated Title');
      expect(updatedPost.content).toBe('Updated content');

      // Verify in database
      const dbEntity = await ormRepository.findOne({
        where: { id: post.id },
      });
      expect(dbEntity?.title).toBe('Updated Title');
      expect(dbEntity?.content).toBe('Updated content');
    });
  });

  describe('saveWithTransaction', () => {
    it('should save post within a transaction', async () => {
      const post = Post.create(authorId, 'Transaction Test', 'Content for transaction test');
      post.publish();

      const savedPost = await postRepository.saveWithTransaction(post);

      expect(savedPost).toBeDefined();
      expect(savedPost.status).toBe(PostStatus.PUBLISHED);
      expect(savedPost.publishedAt).toBeDefined();

      // Verify in database
      const dbEntity = await ormRepository.findOne({
        where: { id: post.id },
      });
      expect(dbEntity?.status).toBe(PostStatus.PUBLISHED);
    });

    it('should rollback on error', async () => {
      const post = Post.create(authorId, 'Rollback Test', 'Test content');

      // Mock an error by closing the data source temporarily
      // Note: This is a simple test; in reality, you'd test actual transaction failures
      const spy = jest.spyOn(dataSource, 'createQueryRunner').mockImplementationOnce(() => {
        throw new Error('Simulated transaction error');
      });

      await expect(postRepository.saveWithTransaction(post)).rejects.toThrow(
        'Simulated transaction error',
      );

      spy.mockRestore();

      // Verify post was not saved
      const dbEntity = await ormRepository.findOne({
        where: { id: post.id },
      });
      expect(dbEntity).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find a post by ID', async () => {
      const post = Post.create(authorId, 'Find Test', 'Content to find');
      await postRepository.save(post);

      const foundPost = await postRepository.findById(post.id);

      expect(foundPost).toBeDefined();
      expect(foundPost?.id).toBe(post.id);
      expect(foundPost?.title).toBe('Find Test');
    });

    it('should return null for non-existent ID', async () => {
      const foundPost = await postRepository.findById('non-existent-id');

      expect(foundPost).toBeNull();
    });
  });

  describe('findBySlug', () => {
    it('should find a post by slug', async () => {
      const post = Post.create(authorId, 'Unique Slug Test', 'Test content');
      await postRepository.save(post);

      const foundPost = await postRepository.findBySlug('unique-slug-test');

      expect(foundPost).toBeDefined();
      expect(foundPost?.slug).toBe('unique-slug-test');
      expect(foundPost?.title).toBe('Unique Slug Test');
    });

    it('should return null for non-existent slug', async () => {
      const foundPost = await postRepository.findBySlug('non-existent-slug');

      expect(foundPost).toBeNull();
    });

    it('should find post with custom slug', async () => {
      const post = Post.create(authorId, 'Custom Slug', 'Content', 'my-custom-slug');
      await postRepository.save(post);

      const foundPost = await postRepository.findBySlug('my-custom-slug');

      expect(foundPost).toBeDefined();
      expect(foundPost?.slug).toBe('my-custom-slug');
    });
  });

  describe('findByAuthorId', () => {
    it('should find all posts by author', async () => {
      const post1 = Post.create(authorId, 'Post 1', 'Content 1');
      const post2 = Post.create(authorId, 'Post 2', 'Content 2');
      const post3 = Post.create('other-author', 'Post 3', 'Content 3');

      await postRepository.save(post1);
      await postRepository.save(post2);
      await postRepository.save(post3);

      const authorPosts = await postRepository.findByAuthorId(authorId);

      expect(authorPosts).toHaveLength(2);
      expect(authorPosts.map((p) => p.title)).toContain('Post 1');
      expect(authorPosts.map((p) => p.title)).toContain('Post 2');
      expect(authorPosts.map((p) => p.title)).not.toContain('Post 3');
    });

    it('should support pagination', async () => {
      // Create 5 posts
      for (let i = 1; i <= 5; i++) {
        const post = Post.create(authorId, `Post ${i}`, `Content ${i}`);
        await postRepository.save(post);
      }

      const page1 = await postRepository.findByAuthorId(authorId, {
        skip: 0,
        take: 2,
      });
      const page2 = await postRepository.findByAuthorId(authorId, {
        skip: 2,
        take: 2,
      });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      expect(page1[0].id).not.toBe(page2[0].id);
    });

    it('should return empty array for author with no posts', async () => {
      const posts = await postRepository.findByAuthorId('no-posts-author');

      expect(posts).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('should return all posts', async () => {
      const post1 = Post.create('author1', 'Title 1', 'Content 1');
      const post2 = Post.create('author2', 'Title 2', 'Content 2');

      await postRepository.save(post1);
      await postRepository.save(post2);

      const posts = await postRepository.findAll();

      expect(posts).toHaveLength(2);
    });

    it('should support pagination', async () => {
      for (let i = 1; i <= 5; i++) {
        const post = Post.create(authorId, `Title ${i}`, `Content ${i}`);
        await postRepository.save(post);
      }

      const page1 = await postRepository.findAll({ skip: 0, take: 3 });
      const page2 = await postRepository.findAll({ skip: 3, take: 3 });

      expect(page1).toHaveLength(3);
      expect(page2).toHaveLength(2);
    });

    it('should order by createdAt DESC', async () => {
      const post1 = Post.create(authorId, 'First', 'Content 1');
      await postRepository.save(post1);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const post2 = Post.create(authorId, 'Second', 'Content 2');
      await postRepository.save(post2);

      const posts = await postRepository.findAll();

      expect(posts[0].title).toBe('Second'); // Most recent first
      expect(posts[1].title).toBe('First');
    });
  });

  describe('delete', () => {
    it('should soft delete a post', async () => {
      const post = Post.create(authorId, 'Delete Test', 'To be deleted');
      await postRepository.save(post);

      const deleted = await postRepository.delete(post.id);

      expect(deleted).toBe(true);

      // Verify soft delete
      const foundPost = await postRepository.findById(post.id);
      expect(foundPost).toBeNull();

      // Verify still exists with deletedAt
      const dbEntity = await ormRepository.findOne({
        where: { id: post.id },
        withDeleted: true,
      });
      expect(dbEntity).toBeDefined();
      expect(dbEntity?.deletedAt).toBeDefined();
    });

    it('should return false for non-existent post', async () => {
      const deleted = await postRepository.delete('non-existent-id');

      expect(deleted).toBe(false);
    });
  });

  describe('count', () => {
    it('should count total posts', async () => {
      expect(await postRepository.count()).toBe(0);

      const post1 = Post.create(authorId, 'Count 1', 'Content 1');
      await postRepository.save(post1);

      expect(await postRepository.count()).toBe(1);

      const post2 = Post.create(authorId, 'Count 2', 'Content 2');
      await postRepository.save(post2);

      expect(await postRepository.count()).toBe(2);
    });

    it('should not count soft-deleted posts', async () => {
      const post = Post.create(authorId, 'Count Test', 'Content');
      await postRepository.save(post);

      expect(await postRepository.count()).toBe(1);

      await postRepository.delete(post.id);

      expect(await postRepository.count()).toBe(0);
    });
  });

  describe('countByAuthorId', () => {
    it('should count posts by author', async () => {
      const post1 = Post.create(authorId, 'Author Post 1', 'Content 1');
      const post2 = Post.create(authorId, 'Author Post 2', 'Content 2');
      const post3 = Post.create('other-author', 'Other Post', 'Content 3');

      await postRepository.save(post1);
      await postRepository.save(post2);
      await postRepository.save(post3);

      expect(await postRepository.countByAuthorId(authorId)).toBe(2);
      expect(await postRepository.countByAuthorId('other-author')).toBe(1);
    });

    it('should return 0 for author with no posts', async () => {
      expect(await postRepository.countByAuthorId('no-posts-author')).toBe(0);
    });
  });

  describe('domain mapping', () => {
    it('should correctly preserve post status transitions', async () => {
      const post = Post.create(authorId, 'Status Test', 'Content');
      expect(post.status).toBe(PostStatus.DRAFT);

      await postRepository.save(post);

      post.publish();
      const publishedPost = await postRepository.save(post);

      expect(publishedPost.status).toBe(PostStatus.PUBLISHED);
      expect(publishedPost.publishedAt).toBeDefined();

      publishedPost.archive();
      const archivedPost = await postRepository.save(publishedPost);

      expect(archivedPost.status).toBe(PostStatus.ARCHIVED);
    });

    it('should preserve view count', async () => {
      const post = Post.create(authorId, 'View Test', 'Content');
      await postRepository.save(post);

      post.incrementViewCount();
      post.incrementViewCount();
      const updatedPost = await postRepository.save(post);

      expect(updatedPost.viewCount).toBe(2);
    });

    it('should preserve all domain properties', async () => {
      const post = Post.create(authorId, 'Complete Test', 'Full content', 'custom-slug');
      post.publish();
      post.incrementViewCount();

      const savedPost = await postRepository.save(post);

      expect(savedPost.id).toBe(post.id);
      expect(savedPost.authorId).toBe(authorId);
      expect(savedPost.title).toBe('Complete Test');
      expect(savedPost.content).toBe('Full content');
      expect(savedPost.slug).toBe('custom-slug');
      expect(savedPost.status).toBe(PostStatus.PUBLISHED);
      expect(savedPost.publishedAt).toBeDefined();
      expect(savedPost.viewCount).toBe(1);
    });
  });
});
