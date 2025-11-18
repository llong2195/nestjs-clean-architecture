import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConversationRepository } from '../../infrastructure/persistence/conversation.repository';
import { ConversationResponseDto } from '../dtos/conversation-response.dto';

/**
 * GetConversationUseCase
 * T061: Get single conversation by ID
 *
 * Retrieves a conversation by ID. User must be a participant.
 */
@Injectable()
export class GetConversationUseCase {
  constructor(private readonly conversationRepository: ConversationRepository) {}

  async execute(conversationId: string, userId: string): Promise<ConversationResponseDto> {
    const conversation = await this.conversationRepository.findById(conversationId);

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${conversationId} not found`);
    }

    if (!conversation.participantIds.includes(userId)) {
      throw new ForbiddenException('You are not a participant of this conversation');
    }

    return ConversationResponseDto.fromDomain(conversation);
  }
}
