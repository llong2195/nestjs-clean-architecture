import { Post } from '../../../../src/modules/post/domain/aggregates/post.aggregate';
import { PostStatus } from '../../../../src/modules/post/domain/value-objects/post-status.vo';

describe('Post Aggregate', () => {
  describe('create', () => {
    it('should create a new post with valid data', () => {
      const authorId = '550e8400-e29b-41d4-a716-446655440000';
      const title = 'My First Post';
      const content = 'This is the content of my first post.';

      const post = Post.create(authorId, title, content);

      expect(post).toBeDefined();
      expect(post.id).toBeDefined();
      expect(post.authorId).toBe(authorId);
      expect(post.title).toBe(title);
      expect(post.content).toBe(content);
      expect(post.status).toBe(PostStatus.DRAFT);
      expect(post.publishedAt).toBeNull();
      expect(post.viewCount).toBe(0);
      expect(post.slug).toBe('my-first-post');
      expect(post.createdAt).toBeInstanceOf(Date);
      expect(post.updatedAt).toBeInstanceOf(Date);
    });

    it('should create post with custom slug', () => {
      const post = Post.create('author-id', 'Test Post', 'Content', 'custom-slug');

      expect(post.slug).toBe('custom-slug');
    });

    it('should generate slug from title', () => {
      const post = Post.create('author-id', 'Hello World!', 'Content');

      expect(post.slug).toBe('hello-world');
    });

    it('should handle special characters in slug generation', () => {
      const post = Post.create('author-id', 'Test @#$ Post!!!', 'Content');

      expect(post.slug).toBe('test-post');
    });

    it('should throw error for empty title', () => {
      expect(() => Post.create('author-id', '', 'Content')).toThrow('Post title cannot be empty');
    });

    it('should throw error for whitespace-only title', () => {
      expect(() => Post.create('author-id', '   ', 'Content')).toThrow(
        'Post title cannot be empty',
      );
    });

    it('should throw error for title exceeding 200 characters', () => {
      const longTitle = 'a'.repeat(201);

      expect(() => Post.create('author-id', longTitle, 'Content')).toThrow(
        'Post title cannot exceed 200 characters',
      );
    });

    it('should throw error for empty content', () => {
      expect(() => Post.create('author-id', 'Title', '')).toThrow('Post content cannot be empty');
    });

    it('should throw error for empty author ID', () => {
      expect(() => Post.create('', 'Title', 'Content')).toThrow('Author ID is required');
    });

    it('should trim whitespace from title and content', () => {
      const post = Post.create('author-id', '  Title  ', '  Content  ');

      expect(post.title).toBe('Title');
      expect(post.content).toBe('Content');
    });
  });

  describe('publish', () => {
    it('should publish a draft post', () => {
      const post = Post.create('author-id', 'Title', 'Content');

      post.publish();

      expect(post.status).toBe(PostStatus.PUBLISHED);
      expect(post.publishedAt).toBeInstanceOf(Date);

      const events = post.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        postId: post.id,
        authorId: 'author-id',
        title: 'Title',
        slug: 'title',
      });
      expect(events[0].publishedAt).toBeInstanceOf(Date);
      expect(events[0].occurredAt).toBeInstanceOf(Date);
    });

    it('should throw error when publishing already published post', () => {
      const post = Post.create('author-id', 'Title', 'Content');
      post.publish();

      expect(() => post.publish()).toThrow('Post is already published');
    });

    it('should throw error when publishing archived post', () => {
      const post = Post.reconstitute(
        'post-id',
        'author-id',
        'Title',
        'Content',
        'title',
        PostStatus.ARCHIVED,
        null,
        0,
        new Date(),
        new Date(),
      );

      expect(() => post.publish()).toThrow('Cannot publish an archived post');
    });

    it('should set publishedAt timestamp', () => {
      const post = Post.create('author-id', 'Title', 'Content');
      const beforePublish = new Date();

      post.publish();

      expect(post.publishedAt).toBeInstanceOf(Date);
      expect(post.publishedAt!.getTime()).toBeGreaterThanOrEqual(beforePublish.getTime());
    });
  });

  describe('archive', () => {
    it('should archive a draft post', () => {
      const post = Post.create('author-id', 'Title', 'Content');

      post.archive();

      expect(post.status).toBe(PostStatus.ARCHIVED);

      const events = post.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        postId: post.id,
      });
      expect(events[0].occurredAt).toBeInstanceOf(Date);
    });

    it('should archive a published post', () => {
      const post = Post.create('author-id', 'Title', 'Content');
      post.publish();
      post.clearDomainEvents();

      post.archive();

      expect(post.status).toBe(PostStatus.ARCHIVED);
    });

    it('should throw error when archiving already archived post', () => {
      const post = Post.create('author-id', 'Title', 'Content');
      post.archive();

      expect(() => post.archive()).toThrow('Post is already archived');
    });
  });

  describe('incrementViewCount', () => {
    it('should increment view count', () => {
      const post = Post.create('author-id', 'Title', 'Content');

      expect(post.viewCount).toBe(0);

      post.incrementViewCount();
      expect(post.viewCount).toBe(1);

      post.incrementViewCount();
      expect(post.viewCount).toBe(2);
    });
  });

  describe('updateContent', () => {
    it('should update title and content', () => {
      const post = Post.create('author-id', 'Old Title', 'Old Content');

      post.updateContent('New Title', 'New Content');

      expect(post.title).toBe('New Title');
      expect(post.content).toBe('New Content');
      expect(post.slug).toBe('new-title');
    });

    it('should update with custom slug', () => {
      const post = Post.create('author-id', 'Title', 'Content');

      post.updateContent('New Title', 'New Content', 'custom-slug');

      expect(post.slug).toBe('custom-slug');
    });

    it('should throw error for title exceeding 200 characters', () => {
      const post = Post.create('author-id', 'Title', 'Content');
      const longTitle = 'a'.repeat(201);

      expect(() => post.updateContent(longTitle, 'Content')).toThrow(
        'Post title cannot exceed 200 characters',
      );
    });

    it('should trim whitespace', () => {
      const post = Post.create('author-id', 'Title', 'Content');

      post.updateContent('  New Title  ', '  New Content  ');

      expect(post.title).toBe('New Title');
      expect(post.content).toBe('New Content');
    });
  });

  describe('domain events', () => {
    it('should clear domain events', () => {
      const post = Post.create('author-id', 'Title', 'Content');
      post.publish();

      expect(post.getDomainEvents()).toHaveLength(1);

      post.clearDomainEvents();

      expect(post.getDomainEvents()).toHaveLength(0);
    });

    it('should not mutate original events when getting', () => {
      const post = Post.create('author-id', 'Title', 'Content');
      post.publish();

      const events1 = post.getDomainEvents();
      events1.push({} as any);

      const events2 = post.getDomainEvents();

      expect(events2).toHaveLength(1);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute post from persistence data', () => {
      const id = 'post-id';
      const authorId = 'author-id';
      const title = 'Title';
      const content = 'Content';
      const slug = 'title';
      const status = PostStatus.PUBLISHED;
      const publishedAt = new Date('2024-01-01');
      const viewCount = 100;
      const createdAt = new Date('2023-12-01');
      const updatedAt = new Date('2024-01-01');

      const post = Post.reconstitute(
        id,
        authorId,
        title,
        content,
        slug,
        status,
        publishedAt,
        viewCount,
        createdAt,
        updatedAt,
      );

      expect(post.id).toBe(id);
      expect(post.authorId).toBe(authorId);
      expect(post.title).toBe(title);
      expect(post.content).toBe(content);
      expect(post.slug).toBe(slug);
      expect(post.status).toBe(status);
      expect(post.publishedAt).toBe(publishedAt);
      expect(post.viewCount).toBe(viewCount);
      expect(post.createdAt).toBe(createdAt);
      expect(post.updatedAt).toBe(updatedAt);
    });
  });
});
