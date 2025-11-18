import { IsString, IsUUID, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Send Message DTO
 *
 * Application layer DTO for sending a message to a conversation.
 * Validates message content constraints per spec (1-5000 chars).
 */
export class SendMessageDto {
  @ApiProperty({
    description: 'Conversation ID where the message will be sent',
    example: '01234567-89ab-cdef-0123-456789abcdef',
    format: 'uuid',
  })
  @IsUUID()
  conversationId!: string;

  @ApiProperty({
    description: 'Message content',
    example: 'Hello, how are you?',
    minLength: 1,
    maxLength: 5000,
  })
  @IsString()
  @MinLength(1, { message: 'Message content cannot be empty' })
  @MaxLength(5000, { message: 'Message content cannot exceed 5000 characters' })
  content!: string;
}
