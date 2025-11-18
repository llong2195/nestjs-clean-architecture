import { Injectable, BadRequestException } from '@nestjs/common';
import { ConversationRepository } from '../../infrastructure/persistence/conversation.repository';
import { Conversation } from '../../domain/aggregates/conversation.aggregate';
import { ConversationType } from '../../domain/value-objects/conversation-type.vo';
import { CreateConversationDto } from '../dtos/create-conversation.dto';
import { ConversationResponseDto } from '../dtos/conversation-response.dto';

/**
 * Create Conversation Use Case
 *
 * Business logic for creating a new conversation.
 * Enforces:
 * - DIRECT conversations: exactly 2 participants, no name
 * - GROUP conversations: 2+ participants, name required
 * - DIRECT uniqueness: only 1 DIRECT conversation per participant pair
 */
@Injectable()
export class CreateConversationUseCase {
  constructor(private readonly conversationRepository: ConversationRepository) {}

  /**
   * Execute: Create a new conversation
   *
   * @param dto - Conversation details
   * @param createdBy - Authenticated user ID
   * @returns Created conversation
   * @throws BadRequestException if validation fails
   * @throws ConflictException if DIRECT conversation already exists
   */
  async execute(dto: CreateConversationDto, createdBy: string): Promise<ConversationResponseDto> {
    // Validate participant count based on type
    if (dto.type === ConversationType.DIRECT) {
      if (dto.participantIds.length !== 2) {
        throw new BadRequestException(
          'DIRECT conversations must have exactly 2 participants',
          'INVALID_PARTICIPANT_COUNT',
        );
      }

      if (dto.name !== null && dto.name !== undefined) {
        throw new BadRequestException(
          'DIRECT conversations cannot have a name',
          'DIRECT_CANNOT_HAVE_NAME',
        );
      }

      // Check for existing DIRECT conversation (T024: Uniqueness check)
      const [userId1, userId2] = dto.participantIds;
      const existingConversation = await this.conversationRepository.findDirectConversation(
        userId1,
        userId2,
      );

      if (existingConversation) {
        // Return existing conversation instead of creating duplicate
        return ConversationResponseDto.fromDomain(existingConversation);
      }
    }

    if (dto.type === ConversationType.GROUP) {
      if (dto.participantIds.length < 2) {
        throw new BadRequestException(
          'GROUP conversations must have at least 2 participants',
          'INVALID_PARTICIPANT_COUNT',
        );
      }

      if (!dto.name || dto.name.trim().length === 0) {
        throw new BadRequestException(
          'GROUP conversations must have a name',
          'GROUP_NAME_REQUIRED',
        );
      }
    }

    // Ensure creator is in participant list
    const participantIds = [...new Set([...dto.participantIds, createdBy])];

    // Create conversation using domain aggregate
    const conversation = Conversation.create(dto.name ?? null, dto.type, createdBy, participantIds);

    // Persist conversation
    const savedConversation = await this.conversationRepository.save(conversation);

    // Return response DTO
    return ConversationResponseDto.fromDomain(savedConversation);
  }
}
