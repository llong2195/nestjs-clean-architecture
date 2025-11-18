import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConversationRepository } from '../../infrastructure/persistence/conversation.repository';
import { MessageResponseDto } from '../dtos/message-response.dto';

/**
 * Get Message History Use Case
 *
 * Business logic for retrieving conversation message history.
 * Implements pagination with before/limit parameters (default 50 messages).
 */
@Injectable()
export class GetMessageHistoryUseCase {
  private readonly DEFAULT_LIMIT = 50;
  private readonly MAX_LIMIT = 100;

  constructor(private readonly conversationRepository: ConversationRepository) {}

  /**
   * Execute: Get paginated message history for a conversation
   *
   * @param conversationId - Conversation ID
   * @param userId - Authenticated user ID
   * @param options - Pagination options
   * @returns Paginated messages
   * @throws NotFoundException if conversation doesn't exist
   * @throws ForbiddenException if user is not a participant
   */
  async execute(
    conversationId: string,
    userId: string,
    options: {
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<MessageResponseDto[]> {
    // Verify conversation exists and user is participant
    const conversation = await this.conversationRepository.findById(conversationId);

    if (!conversation) {
      throw new NotFoundException(
        `Conversation ${conversationId} not found`,
        'CONVERSATION_NOT_FOUND',
      );
    }

    if (!conversation.isParticipant(userId)) {
      throw new ForbiddenException(
        'Only participants can view message history',
        'NOT_A_PARTICIPANT',
      );
    }

    // Apply pagination limits
    const limit = Math.min(options.limit ?? this.DEFAULT_LIMIT, this.MAX_LIMIT);
    const offset = options.offset ?? 0;

    // Fetch messages
    const messages = await this.conversationRepository.findMessages(conversationId, limit, offset);

    // Convert to response DTOs
    return messages.map((message) => MessageResponseDto.fromDomain(message));
  }
}
