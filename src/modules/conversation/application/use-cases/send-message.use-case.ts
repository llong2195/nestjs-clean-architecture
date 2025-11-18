import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConversationRepository } from '../../infrastructure/persistence/conversation.repository';
import { Message } from '../../domain/entities/message.entity';
import { SendMessageDto } from '../dtos/send-message.dto';
import { MessageResponseDto } from '../dtos/message-response.dto';

/**
 * Send Message Use Case
 *
 * Business logic for sending a message to a conversation.
 * Enforces:
 * - User must be a participant in the conversation
 * - Rate limiting (10 messages/minute) - handled by gateway ThrottlerGuard
 * - Message content validation (1-5000 chars)
 */
@Injectable()
export class SendMessageUseCase {
  constructor(private readonly conversationRepository: ConversationRepository) {}

  /**
   * Execute: Send a message to a conversation
   *
   * @param dto - Message details
   * @param senderId - Authenticated user ID
   * @returns Created message
   * @throws NotFoundException if conversation doesn't exist
   * @throws ForbiddenException if user is not a participant
   */
  async execute(dto: SendMessageDto, senderId: string): Promise<MessageResponseDto> {
    // Load conversation to verify participant access
    const conversation = await this.conversationRepository.findById(dto.conversationId);

    if (!conversation) {
      throw new NotFoundException(
        `Conversation ${dto.conversationId} not found`,
        'CONVERSATION_NOT_FOUND',
      );
    }

    // Check if sender is a participant
    if (!conversation.isParticipant(senderId)) {
      throw new ForbiddenException('Only participants can send messages', 'NOT_A_PARTICIPANT');
    }

    // Create message using domain entity
    const message = Message.create(dto.conversationId, senderId, dto.content);

    // Persist message
    const savedMessage = await this.conversationRepository.saveMessage(message);

    // Return response DTO
    return MessageResponseDto.fromDomain(savedMessage);
  }
}
