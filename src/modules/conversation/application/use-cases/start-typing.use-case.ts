import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConversationRepository } from '../../infrastructure/persistence/conversation.repository';
import { TypingIndicatorCache } from '../../infrastructure/cache/typing-indicator.cache';
import { StartTypingDto } from '../dtos/start-typing.dto';

/**
 * Start Typing Use Case
 * T065: User Story 3 - Typing Indicators
 *
 * Sets typing indicator for user in conversation with participant authorization check.
 * Uses Redis with 3-second TTL for ephemeral state.
 *
 * Business Rules:
 * - Only conversation participants can set typing indicators
 * - Typing state is ephemeral (Redis-only, no database persistence)
 * - Auto-expires after 3 seconds via Redis TTL
 */
@Injectable()
export class StartTypingUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly typingIndicatorCache: TypingIndicatorCache,
  ) {}

  async execute(dto: StartTypingDto, userId: string): Promise<void> {
    // Load conversation to verify it exists
    const conversation = await this.conversationRepository.findById(dto.conversationId);

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${dto.conversationId} not found`);
    }

    // T065: Participant authorization check
    if (!conversation.participantIds.includes(userId)) {
      throw new ForbiddenException('Only participants can set typing indicators');
    }

    // Set typing indicator in Redis with 3-second TTL
    await this.typingIndicatorCache.startTyping(dto.conversationId, userId);
  }
}
