import { Injectable, BadRequestException } from '@nestjs/common';
import { ConversationRepository } from '../../infrastructure/persistence/conversation.repository';
import { SearchMessagesDto } from '../dtos/search-messages.dto';
import { MessageSearchResultDto } from '../dtos/message-search-result.dto';

/**
 * Search Messages Use Case
 * T076: User Story 5 - Message Search and History
 *
 * Searches messages across all user's conversations using PostgreSQL full-text search.
 * Results are ranked by relevance (ts_rank) and limited to 50 by default.
 *
 * Business Rules:
 * - User can only search their own conversations (authorization enforced at repository level)
 * - Empty/whitespace-only queries are rejected
 * - Results are paginated with configurable limit
 * - Search uses PostgreSQL tsvector for performance
 */
@Injectable()
export class SearchMessagesUseCase {
  constructor(private readonly conversationRepository: ConversationRepository) {}

  async execute(dto: SearchMessagesDto, userId: string): Promise<MessageSearchResultDto[]> {
    // T076: Validate query is not empty or whitespace-only
    const trimmedQuery = dto.query.trim();
    if (trimmedQuery.length === 0) {
      throw new BadRequestException('Search query cannot be empty');
    }

    // T076: Set default limit to 50, max 100
    const limit = dto.limit && dto.limit <= 100 ? dto.limit : 50;

    // T077-T079: Repository handles authorization, full-text search, and ranking
    const results = await this.conversationRepository.searchMessagesAcrossConversations(
      userId,
      trimmedQuery,
      limit,
    );

    // Map to search result DTOs
    return results.map((message) => ({
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      isDelivered: message.isDelivered,
      isRead: message.isRead,
      isEdited: message.isEdited,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      rank: message.rank,
    }));
  }
}
