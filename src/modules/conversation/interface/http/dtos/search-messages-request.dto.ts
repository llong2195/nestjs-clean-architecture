import { IsString, MinLength, MaxLength, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Search Messages Request DTO (HTTP)
 * T080: User Story 5 - Message Search
 *
 * HTTP-specific DTO for POST /messages/search endpoint.
 */
export class SearchMessagesRequestDto {
  @ApiProperty({
    description: 'Search query text (1-100 characters)',
    example: 'hello world',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  query!: string;

  @ApiProperty({
    description: 'Maximum number of results to return (default: 50, max: 100)',
    example: 50,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
