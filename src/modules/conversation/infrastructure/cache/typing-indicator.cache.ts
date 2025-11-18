import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

/**
 * Typing Indicator Cache
 *
 * Manages typing indicators using Redis with 3-second TTL.
 * Uses SETEX command for automatic expiration.
 *
 * Key format: typing:{conversationId}:{userId}
 * Value: timestamp of when typing started
 */
@Injectable()
export class TypingIndicatorCache {
  private readonly TTL_SECONDS = 3; // 3-second TTL per spec
  private readonly KEY_PREFIX = 'typing';

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  /**
   * Set user as typing in conversation (SETEX with 3-second TTL)
   */
  async setTyping(conversationId: string, userId: string): Promise<void> {
    const key = this.buildKey(conversationId, userId);
    const value = Date.now().toString();

    // Use SETEX: SET with EXpiration
    await this.cacheManager.set(key, value, this.TTL_SECONDS * 1000);
  }

  /**
   * Check if user is currently typing in conversation
   */
  async isTyping(conversationId: string, userId: string): Promise<boolean> {
    const key = this.buildKey(conversationId, userId);
    const value = await this.cacheManager.get<string>(key);
    return value !== undefined && value !== null;
  }

  /**
   * T066: Set user as typing (alias for setTyping for consistency with tasks)
   */
  async startTyping(conversationId: string, userId: string): Promise<void> {
    await this.setTyping(conversationId, userId);
  }

  /**
   * T067: Remove typing indicator for user
   */
  async stopTyping(conversationId: string, userId: string): Promise<void> {
    const key = this.buildKey(conversationId, userId);
    await this.cacheManager.del(key);
  }

  /**
   * T068: Get all users currently typing in a conversation
   *
   * Note: This is a simplified implementation that returns empty array.
   * In production, use Redis Sets or track active typers in application state.
   * For this MVP, we rely on broadcasting typing events and client-side tracking.
   */
  async getTypingUsers(_conversationId: string): Promise<string[]> {
    // For MVP, we rely on client-side tracking and WebSocket events
    // Full implementation would require Redis SCAN or Sorted Sets
    return Promise.resolve([]);
  }

  /**
   * Remove typing indicator for user (legacy method)
   * @deprecated Use stopTyping instead
   */
  async removeTyping(conversationId: string, userId: string): Promise<void> {
    await this.stopTyping(conversationId, userId);
  }

  /**
   * Build cache key
   */
  private buildKey(conversationId: string, userId: string): string {
    return `${this.KEY_PREFIX}:${conversationId}:${userId}`;
  }
}
