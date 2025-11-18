import { IsUUID, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Mark Messages as Read DTO
 *
 * Used to mark all messages in a conversation as read by the current user.
 * The lastReadAt timestamp is optional and defaults to the current time.
 */
export class MarkMessagesReadDto {
  @IsUUID()
  conversationId!: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  lastReadAt?: Date;
}
