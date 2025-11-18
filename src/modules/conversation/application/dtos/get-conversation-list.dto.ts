import { IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ConversationType } from '../../domain/value-objects/conversation-type.vo';

/**
 * Get Conversation List DTO
 *
 * Query parameters for retrieving a user's conversation list.
 * Supports pagination and filtering by conversation type.
 */
export class GetConversationListDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 50;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;

  @IsOptional()
  @IsEnum(ConversationType)
  type?: ConversationType;
}
