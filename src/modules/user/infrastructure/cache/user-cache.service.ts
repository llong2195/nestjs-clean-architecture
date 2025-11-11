import { Injectable } from '@nestjs/common';
import { CacheService } from '../../../../shared/cache/cache.service';
import { UserResponseDto } from '../../application/dtos/user-response.dto';

@Injectable()
export class UserCacheService {
  private readonly USER_PREFIX = 'user';
  private readonly USER_LIST_PREFIX = 'users:list';
  private readonly DEFAULT_TTL = 3600; // 1 hour

  constructor(private readonly cacheService: CacheService) {}

  /**
   * Generate cache key for user by ID
   */
  private getUserKey(userId: string): string {
    return `${this.USER_PREFIX}:${userId}`;
  }

  /**
   * Generate cache key for user list
   */
  private getUserListKey(page: number, limit: number): string {
    return `${this.USER_LIST_PREFIX}:${page}:${limit}`;
  }

  /**
   * Get cached user by ID
   */
  async getUser(userId: string): Promise<UserResponseDto | undefined> {
    return this.cacheService.get<UserResponseDto>(this.getUserKey(userId));
  }

  /**
   * Cache user by ID
   */
  async setUser(userId: string, user: UserResponseDto): Promise<void> {
    await this.cacheService.set(this.getUserKey(userId), user, this.DEFAULT_TTL);
  }

  /**
   * Get cached user list
   */
  async getUserList(page: number, limit: number): Promise<UserResponseDto[] | undefined> {
    return this.cacheService.get<UserResponseDto[]>(this.getUserListKey(page, limit));
  }

  /**
   * Cache user list
   */
  async setUserList(page: number, limit: number, users: UserResponseDto[]): Promise<void> {
    await this.cacheService.set(this.getUserListKey(page, limit), users, this.DEFAULT_TTL);
  }

  /**
   * Invalidate user cache
   */
  async invalidateUser(userId: string): Promise<void> {
    await this.cacheService.delete(this.getUserKey(userId));
  }

  /**
   * Invalidate all user list caches
   */
  async invalidateUserLists(): Promise<void> {
    // In production, use Redis SCAN to find and delete matching keys
    await this.cacheService.deletePattern(`${this.USER_LIST_PREFIX}:*`);
  }

  /**
   * Invalidate all caches for a user (user + lists)
   */
  async invalidateAll(userId: string): Promise<void> {
    await this.invalidateUser(userId);
    await this.invalidateUserLists();
  }
}
