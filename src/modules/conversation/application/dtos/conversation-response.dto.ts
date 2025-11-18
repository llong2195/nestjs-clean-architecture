import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageResponseDto } from './message-response.dto';
import { ConversationType } from '../../domain/value-objects/conversation-type.vo';

/**
 * Conversation Response DTO
 *
 * Application layer DTO for conversation responses.
 * Includes last message preview and unread count for UI display.
 */
export class ConversationResponseDto {
  @ApiProperty({
    description: 'Conversation ID',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  @Expose()
  id!: string;

  @ApiPropertyOptional({
    description: 'Conversation name (null for DIRECT conversations)',
    example: 'Project Discussion',
    nullable: true,
  })
  @Expose()
  name!: string | null;

  @ApiProperty({
    description: 'Conversation type',
    enum: ConversationType,
    example: ConversationType.DIRECT,
  })
  @Expose()
  type!: ConversationType;

  @ApiProperty({
    description: 'User ID of conversation creator',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  @Expose()
  createdBy!: string;

  @ApiProperty({
    description: 'Whether the conversation is active',
    example: true,
  })
  @Expose()
  isActive!: boolean;

  @ApiProperty({
    description: 'Participant user IDs',
    type: [String],
    example: ['01234567-89ab-cdef-0123-456789abcdef', '01234567-89ab-cdef-0123-456789abcde0'],
  })
  @Expose()
  participantIds!: string[];

  @ApiPropertyOptional({
    description: 'Last message in conversation (for preview)',
    type: MessageResponseDto,
    nullable: true,
  })
  @Expose()
  @Type(() => MessageResponseDto)
  lastMessage?: MessageResponseDto | null;

  @ApiProperty({
    description: 'Number of unread messages for current user',
    example: 3,
  })
  @Expose()
  unreadCount!: number;

  @ApiProperty({
    description: 'Conversation creation timestamp',
    example: '2025-11-18T10:00:00.000Z',
  })
  @Expose()
  createdAt!: Date;

  @ApiProperty({
    description: 'Last activity timestamp',
    example: '2025-11-18T10:30:00.000Z',
  })
  @Expose()
  updatedAt!: Date;

  /**
   * Create from domain aggregate
   */
  static fromDomain(
    conversation: {
      id: string;
      name: string | null;
      type: ConversationType;
      createdBy: string;
      isActive: boolean;
      participantIds: string[];
      createdAt: Date;
      updatedAt: Date;
    },
    unreadCount: number = 0,
    lastMessage?: {
      id: string;
      conversationId: string;
      senderId: string;
      content: string;
      isDelivered: boolean;
      isRead: boolean;
      isEdited: boolean;
      createdAt: Date;
      updatedAt: Date;
    } | null,
  ): ConversationResponseDto {
    const dto = new ConversationResponseDto();
    dto.id = conversation.id;
    dto.name = conversation.name;
    dto.type = conversation.type;
    dto.createdBy = conversation.createdBy;
    dto.isActive = conversation.isActive;
    dto.participantIds = conversation.participantIds;
    dto.unreadCount = unreadCount;
    dto.lastMessage = lastMessage ? MessageResponseDto.fromDomain(lastMessage) : null;
    dto.createdAt = conversation.createdAt;
    dto.updatedAt = conversation.updatedAt;
    return dto;
  }
}
