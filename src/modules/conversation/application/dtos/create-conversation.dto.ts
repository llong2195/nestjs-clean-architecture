import { IsEnum, IsArray, IsOptional, IsString, ArrayMinSize, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConversationType } from '../../domain/value-objects/conversation-type.vo';

/**
 * Create Conversation DTO
 *
 * Application layer DTO for creating a new conversation.
 * Validates type-specific constraints:
 * - DIRECT: exactly 2 participants, no name
 * - GROUP: 2+ participants, name required
 */
export class CreateConversationDto {
  @ApiProperty({
    description: 'Conversation type',
    enum: ConversationType,
    example: ConversationType.DIRECT,
  })
  @IsEnum(ConversationType, { message: 'Type must be either DIRECT or GROUP' })
  type!: ConversationType;

  @ApiProperty({
    description: 'Participant user IDs (must include authenticated user)',
    type: [String],
    example: ['01234567-89ab-cdef-0123-456789abcdef', '01234567-89ab-cdef-0123-456789abcde0'],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one participant is required' })
  @IsUUID('4', { each: true, message: 'All participant IDs must be valid UUIDs' })
  participantIds!: string[];

  @ApiPropertyOptional({
    description: 'Conversation name (required for GROUP, must be null for DIRECT)',
    example: 'Project Discussion',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  name?: string | null;
}
