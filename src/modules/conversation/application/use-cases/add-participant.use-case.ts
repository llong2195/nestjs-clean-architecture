import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConversationRepository } from '../../infrastructure/persistence/conversation.repository';
import { ConversationType } from '../../domain/value-objects/conversation-type.vo';

/**
 * Add Participant Use Case
 *
 * Business logic for adding a participant to a GROUP conversation.
 * Enforces GROUP-only validation (DIRECT conversations cannot add participants).
 */
@Injectable()
export class AddParticipantUseCase {
  constructor(private readonly conversationRepository: ConversationRepository) {}

  /**
   * Execute: Add a participant to a GROUP conversation
   *
   * @param conversationId - Conversation ID
   * @param userIdToAdd - User ID to add as participant
   * @param addedBy - Authenticated user ID performing the action
   * @throws NotFoundException if conversation doesn't exist
   * @throws BadRequestException if conversation is DIRECT type
   */
  async execute(conversationId: string, userIdToAdd: string, addedBy: string): Promise<void> {
    // Load conversation
    const conversation = await this.conversationRepository.findById(conversationId);

    if (!conversation) {
      throw new NotFoundException(
        `Conversation ${conversationId} not found`,
        'CONVERSATION_NOT_FOUND',
      );
    }

    // Validate conversation type
    if (conversation.type === ConversationType.DIRECT) {
      throw new BadRequestException(
        'Cannot add participants to DIRECT conversations',
        'DIRECT_CANNOT_ADD_PARTICIPANTS',
      );
    }

    // Add participant using domain method (validates participant membership)
    conversation.addParticipant(userIdToAdd, addedBy);

    // Persist changes
    await this.conversationRepository.save(conversation);
  }
}
