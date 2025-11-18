import { Injectable } from '@nestjs/common';
import { CacheService } from '../../../../shared/cache/cache.service';
import { ConversationResponseDto } from '../../application/dtos/conversation-response.dto';
import { ConversationType } from '../../domain/value-objects/conversation-type.vo';

/**
 * Conversation Cache Service
 *
 * Handles caching of conversation lists in Redis to improve performance.
 * Cache TTL: 60 seconds
 * Invalidated on: new message, mark as read
 */
@Injectable()
export class ConversationCacheService {
  private readonly CACHE_TTL = 60; // seconds
  private readonly CACHE_PREFIX = 'conversation-list';

  constructor(private readonly cacheService: CacheService) {}

  /**
   * Generate cache key for a user's conversation list
   */
  private getCacheKey(userId: string, type?: ConversationType): string {
    return type ? `${this.CACHE_PREFIX}:${userId}:${type}` : `${this.CACHE_PREFIX}:${userId}`;
  }

  /**
   * Get cached conversation list for a user
   */
  async getConversationList(
    userId: string,
    type?: ConversationType,
  ): Promise<ConversationResponseDto[] | null> {
    const key = this.getCacheKey(userId, type);
    const cached = await this.cacheService.get<ConversationResponseDto[]>(key);
    return cached ?? null;
  }

  /**
   * Cache conversation list for a user
   * TTL: 60 seconds
   */
  async setConversationList(
    userId: string,
    conversations: ConversationResponseDto[],
    type?: ConversationType,
  ): Promise<void> {
    const key = this.getCacheKey(userId, type);
    await this.cacheService.set(key, conversations, this.CACHE_TTL);
  }

  /**
   * T055: Invalidate cache when new message is sent or messages are marked as read
   * Invalidates cache for all participants in the conversation
   */
  async invalidateConversationList(participantIds: string[]): Promise<void> {
    for (const userId of participantIds) {
      await this.invalidateUserCache(userId);
    }
  }

  /**
   * Invalidate cache for a specific user
   */
  async invalidateUserCache(userId: string): Promise<void> {
    const keys = [
      this.getCacheKey(userId),
      this.getCacheKey(userId, ConversationType.DIRECT),
      this.getCacheKey(userId, ConversationType.GROUP),
    ];

    await Promise.all(keys.map((key) => this.cacheService.delete(key)));
  }
}
