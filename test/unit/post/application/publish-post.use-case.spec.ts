/* eslint-disable @typescript-eslint/unbound-method */
import { PublishPostUseCase } from '../../../../src/modules/post/application/use-cases/publish-post.use-case';
import type { IPostRepository } from '../../../../src/modules/post/domain/repositories/post.repository.interface';
import { Post } from '../../../../src/modules/post/domain/aggregates/post.aggregate';
import { PostStatus } from '../../../../src/modules/post/domain/value-objects/post-status.vo';
import { NotFoundException } from '@nestjs/common';

describe('PublishPostUseCase', () => {
  let useCase: PublishPostUseCase;
  let mockPostRepository: jest.Mocked<IPostRepository>;

  beforeEach(() => {
    mockPostRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findByAuthor: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      saveWithTransaction: jest.fn(),
    } as unknown as jest.Mocked<IPostRepository>;

    useCase = new PublishPostUseCase(mockPostRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should publish a draft post successfully', async () => {
      const postId = 'post-123';
      const draftPost = Post.create('author-123', 'Test Post', 'Test content');

      mockPostRepository.findById.mockResolvedValue(draftPost);
      mockPostRepository.saveWithTransaction.mockImplementation(
        async (post) => await Promise.resolve(post),
      );

      const result = await useCase.execute(postId);

      expect(result).toBeDefined();
      expect(result.status).toBe(PostStatus.PUBLISHED);
      expect(result.publishedAt).toBeInstanceOf(Date);
      expect(mockPostRepository.findById).toHaveBeenCalledWith(postId);
      expect(mockPostRepository.saveWithTransaction).toHaveBeenCalledWith(draftPost);
    });

    it('should generate domain events when publishing', async () => {
      const postId = 'post-123';
      const draftPost = Post.create('author-123', 'Test Post', 'Test content');

      mockPostRepository.findById.mockResolvedValue(draftPost);
      mockPostRepository.saveWithTransaction.mockImplementation(
        async (post) => await Promise.resolve(post),
      );

      await useCase.execute(postId);

      const events = draftPost.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        aggregateId: draftPost.id,
        authorId: 'author-123',
        title: 'Test Post',
        slug: 'test-post',
        eventType: 'PostPublished',
      });
      expect(events[0].publishedAt).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException when post does not exist', async () => {
      const postId = 'non-existent-post';

      mockPostRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(postId)).rejects.toThrow(NotFoundException);
      await expect(useCase.execute(postId)).rejects.toThrow(
        'Post with ID "non-existent-post" not found',
      );
      expect(mockPostRepository.saveWithTransaction).not.toHaveBeenCalled();
    });

    it('should throw error when trying to publish already published post', async () => {
      const postId = 'post-123';
      const publishedPost = Post.reconstitute(
        postId,
        'author-123',
        'Test Post',
        'Test content',
        'test-post',
        PostStatus.PUBLISHED,
        new Date(),
        0,
        new Date(),
        new Date(),
      );

      mockPostRepository.findById.mockResolvedValue(publishedPost);

      await expect(useCase.execute(postId)).rejects.toThrow(/Cannot publish post/);
      expect(mockPostRepository.saveWithTransaction).not.toHaveBeenCalled();
    });

    it('should throw error when trying to publish archived post', async () => {
      const postId = 'post-123';
      const archivedPost = Post.reconstitute(
        postId,
        'author-123',
        'Test Post',
        'Test content',
        'test-post',
        PostStatus.ARCHIVED,
        null,
        0,
        new Date(),
        new Date(),
      );

      mockPostRepository.findById.mockResolvedValue(archivedPost);

      await expect(useCase.execute(postId)).rejects.toThrow(/Cannot publish post/);
      expect(mockPostRepository.saveWithTransaction).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      const postId = 'post-123';
      const draftPost = Post.create('author-123', 'Test Post', 'Test content');

      mockPostRepository.findById.mockResolvedValue(draftPost);
      mockPostRepository.saveWithTransaction.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute(postId)).rejects.toThrow('Database error');
    });

    it('should use saveWithTransaction for atomicity', async () => {
      const postId = 'post-123';
      const draftPost = Post.create('author-123', 'Test Post', 'Test content');

      mockPostRepository.findById.mockResolvedValue(draftPost);
      mockPostRepository.saveWithTransaction.mockImplementation(
        async (post) => await Promise.resolve(post),
      );

      await useCase.execute(postId);

      expect(mockPostRepository.saveWithTransaction).toHaveBeenCalledTimes(1);
      expect(mockPostRepository.save).not.toHaveBeenCalled();
    });
  });
});
