import { ApiProperty } from '@nestjs/swagger';
import { MessageResponseDto } from './message-response.dto';

/**
 * Message Search Result DTO
 * T075: User Story 5 - Message Search
 *
 * Extends MessageResponseDto with relevance ranking from PostgreSQL ts_rank.
 */
export class MessageSearchResultDto extends MessageResponseDto {
  @ApiProperty({
    description: 'Relevance score from full-text search (higher = more relevant)',
    example: 0.8572,
    type: Number,
  })
  rank!: number;
}
