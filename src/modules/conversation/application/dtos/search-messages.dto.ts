import { IsString, MinLength, MaxLength, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Search Messages DTO
 * T074: User Story 5 - Message Search
 *
 * Validates search query and pagination parameters for full-text message search.
 */
export class SearchMessagesDto {
  @ApiProperty({
    description: 'Search query text',
    example: 'hello world',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  query!: string;

  @ApiProperty({
    description: 'Maximum number of results (default: 50)',
    example: 50,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
