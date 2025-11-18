import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Send Message Request DTO (HTTP Layer)
 *
 * HTTP-specific DTO for sending messages via REST API.
 * Note: WebSocket is the primary method for real-time messaging.
 */
export class SendMessageRequestDto {
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
