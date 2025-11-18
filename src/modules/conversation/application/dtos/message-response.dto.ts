import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Message Response DTO
 *
 * Application layer DTO for message responses.
 * Uses class-transformer @Expose decorators for serialization control.
 */
export class MessageResponseDto {
  @ApiProperty({
    description: 'Message ID',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'Conversation ID',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  @Expose()
  conversationId!: string;

  @ApiProperty({
    description: 'Sender user ID',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  @Expose()
  senderId!: string;

  @ApiProperty({
    description: 'Message content',
    example: 'Hello, how are you?',
  })
  @Expose()
  content!: string;

  @ApiProperty({
    description: 'Whether the message has been delivered',
    example: true,
  })
  @Expose()
  isDelivered!: boolean;

  @ApiProperty({
    description: 'Whether the message has been read',
    example: false,
  })
  @Expose()
  isRead!: boolean;

  @ApiProperty({
    description: 'Whether the message has been edited',
    example: false,
  })
  @Expose()
  isEdited!: boolean;

  @ApiProperty({
    description: 'Message creation timestamp',
    example: '2025-11-18T10:30:00.000Z',
  })
  @Expose()
  createdAt!: Date;

  @ApiProperty({
    description: 'Message last update timestamp',
    example: '2025-11-18T10:30:00.000Z',
  })
  @Expose()
  updatedAt!: Date;

  /**
   * Create from domain entity
   */
  static fromDomain(message: {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    isDelivered: boolean;
    isRead: boolean;
    isEdited: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): MessageResponseDto {
    const dto = new MessageResponseDto();
    dto.id = message.id;
    dto.conversationId = message.conversationId;
    dto.senderId = message.senderId;
    dto.content = message.content;
    dto.isDelivered = message.isDelivered;
    dto.isRead = message.isRead;
    dto.isEdited = message.isEdited;
    dto.createdAt = message.createdAt;
    dto.updatedAt = message.updatedAt;
    return dto;
  }
}
