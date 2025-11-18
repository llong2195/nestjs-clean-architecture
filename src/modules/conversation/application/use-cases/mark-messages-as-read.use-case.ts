import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConversationRepository } from '../../infrastructure/persistence/conversation.repository';
import { MarkMessagesReadDto } from '../dtos/mark-messages-read.dto';

/**
 * Mark Messages As Read Use Case
 *
 * Marks all messages in a conversation as read by the current user.
 * Only participants can mark messages as read.
 */
@Injectable()
export class MarkMessagesAsReadUseCase {
  constructor(private readonly conversationRepository: ConversationRepository) {}

  async execute(dto: MarkMessagesReadDto, userId: string): Promise<void> {
    // Find conversation
    const conversation = await this.conversationRepository.findById(dto.conversationId);
    if (!conversation) {
      throw new NotFoundException(`Conversation not found`);
    }

    // Check if user is a participant
    const isParticipant = conversation.participantIds.includes(userId);
    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    // Mark all unread messages as read
    const lastReadAt = dto.lastReadAt ?? new Date();
    await this.conversationRepository.markMessagesAsRead(dto.conversationId, userId, lastReadAt);
  }
}
