import { Injectable } from '@nestjs/common';
import { ConversationRepository } from '../../infrastructure/persistence/conversation.repository';
import { ConversationCacheService } from '../../infrastructure/cache/conversation-cache.service';
import { ConversationResponseDto } from '../dtos/conversation-response.dto';
import { GetConversationListDto } from '../dtos/get-conversation-list.dto';

/**
 * Get Conversation List Use Case
 *
 * Retrieves a user's conversation list sorted by most recent activity.
 * Uses Redis caching to improve performance (60-second TTL).
 * Includes unread count and last message preview for each conversation.
 *
 * T057: Implement conversation list with caching and sorting
 * T058: Add unread count calculation
 * T059: Add last message preview with 50-char truncation
 */
@Injectable()
export class GetConversationListUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly conversationCache: ConversationCacheService,
  ) {}

  async execute(dto: GetConversationListDto, userId: string): Promise<ConversationResponseDto[]> {
    // T057: Try cache first
    const cached = await this.conversationCache.getConversationList(userId, dto.type);
    if (cached) {
      return this.applyPagination(cached, dto.limit ?? 50, dto.offset ?? 0);
    }

    // Load conversations from database
    let conversations = await this.conversationRepository.findByUserId(userId);

    // Filter by type if provided
    if (dto.type) {
      conversations = conversations.filter((c) => c.type === dto.type);
    }

    // T057: Sort by most recent activity (updatedAt DESC)
    conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    // T058, T059: Enhance with unread count and last message
    const enhanced = await Promise.all(
      conversations.map(async (conversation) => {
        // T058: Get unread count
        const unreadCount = await this.conversationRepository.getUnreadCount(
          conversation.id,
          userId,
        );

        // T059: Get last message with 50-char truncation
        const lastMessage = await this.conversationRepository.getLastMessage(conversation.id);
        const lastMessagePreview = lastMessage
          ? this.truncateMessage(lastMessage.content, 50)
          : null;

        // Map to response DTO
        return {
          id: conversation.id,
          name: conversation.name,
          type: conversation.type,
          participantIds: conversation.participantIds,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
          isActive: conversation.isActive,
          unreadCount,
          lastMessage: lastMessagePreview
            ? {
                content: lastMessagePreview,
                createdAt: lastMessage!.createdAt,
                senderId: lastMessage!.senderId,
              }
            : null,
        } as ConversationResponseDto;
      }),
    );

    // Cache the result
    await this.conversationCache.setConversationList(userId, enhanced, dto.type);

    // Apply pagination
    return this.applyPagination(enhanced, dto.limit ?? 50, dto.offset ?? 0);
  }

  /**
   * T059: Truncate message content to specified length
   */
  private truncateMessage(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  }

  /**
   * Apply pagination to conversation list
   */
  private applyPagination(
    conversations: ConversationResponseDto[],
    limit: number,
    offset: number,
  ): ConversationResponseDto[] {
    return conversations.slice(offset, offset + limit);
  }
}
