import { Injectable } from '@nestjs/common';
import { CacheService } from '../../../../shared/cache/cache.service';
import { PostResponseDto } from '../../application/dtos/post-response.dto';

@Injectable()
export class PostCacheService {
  private readonly POST_PREFIX = 'post';
  private readonly POST_SLUG_PREFIX = 'post:slug';
  private readonly POST_LIST_PREFIX = 'posts:list';
  private readonly DEFAULT_TTL = 3600; // 1 hour
  private readonly POPULAR_POST_TTL = 7200; // 2 hours for popular posts

  constructor(private readonly cacheService: CacheService) {}

  /**
   * Generate cache key for post by ID
   */
  private getPostKey(postId: string): string {
    return `${this.POST_PREFIX}:${postId}`;
  }

  /**
   * Generate cache key for post by slug
   */
  private getPostSlugKey(slug: string): string {
    return `${this.POST_SLUG_PREFIX}:${slug}`;
  }

  /**
   * Generate cache key for post list
   */
  private getPostListKey(page: number, limit: number, authorId?: string): string {
    const authorPart = authorId ? `:author:${authorId}` : '';
    return `${this.POST_LIST_PREFIX}${authorPart}:${page}:${limit}`;
  }

  /**
   * Get cached post by ID
   */
  async getPost(postId: string): Promise<PostResponseDto | undefined> {
    return this.cacheService.get<PostResponseDto>(this.getPostKey(postId));
  }

  /**
   * Cache post by ID
   */
  async setPost(postId: string, post: PostResponseDto, ttl?: number): Promise<void> {
    await this.cacheService.set(this.getPostKey(postId), post, ttl || this.DEFAULT_TTL);
  }

  /**
   * Get cached post by slug
   */
  async getPostBySlug(slug: string): Promise<PostResponseDto | undefined> {
    return this.cacheService.get<PostResponseDto>(this.getPostSlugKey(slug));
  }

  /**
   * Cache post by slug
   */
  async setPostBySlug(slug: string, post: PostResponseDto, ttl?: number): Promise<void> {
    await this.cacheService.set(this.getPostSlugKey(slug), post, ttl || this.DEFAULT_TTL);
  }

  /**
   * Get cached post list
   */
  async getPostList(
    page: number,
    limit: number,
    authorId?: string,
  ): Promise<PostResponseDto[] | undefined> {
    return this.cacheService.get<PostResponseDto[]>(this.getPostListKey(page, limit, authorId));
  }

  /**
   * Cache post list
   */
  async setPostList(
    page: number,
    limit: number,
    posts: PostResponseDto[],
    authorId?: string,
  ): Promise<void> {
    await this.cacheService.set(
      this.getPostListKey(page, limit, authorId),
      posts,
      this.DEFAULT_TTL,
    );
  }

  /**
   * Invalidate post cache (both ID and slug)
   */
  async invalidatePost(postId: string, slug?: string): Promise<void> {
    await this.cacheService.delete(this.getPostKey(postId));
    if (slug) {
      await this.cacheService.delete(this.getPostSlugKey(slug));
    }
  }

  /**
   * Invalidate all post list caches
   */
  async invalidatePostLists(): Promise<void> {
    // In production, use Redis SCAN to find and delete matching keys
    await this.cacheService.deletePattern(`${this.POST_LIST_PREFIX}:*`);
  }

  /**
   * Invalidate all caches for a post (post + slug + lists)
   */
  async invalidateAll(postId: string, slug?: string): Promise<void> {
    await this.invalidatePost(postId, slug);
    await this.invalidatePostLists();
  }

  /**
   * Cache popular post with longer TTL
   */
  async cachePopularPost(postId: string, post: PostResponseDto): Promise<void> {
    await this.setPost(postId, post, this.POPULAR_POST_TTL);
    if (post.slug) {
      await this.setPostBySlug(post.slug, post, this.POPULAR_POST_TTL);
    }
  }
}
