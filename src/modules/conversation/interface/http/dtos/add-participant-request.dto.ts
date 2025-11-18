import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Add Participant Request DTO (HTTP Layer)
 *
 * HTTP-specific DTO for POST /conversations/:id/participants endpoint.
 * Allows adding participants to GROUP conversations only.
 */
export class AddParticipantRequestDto {
  @ApiProperty({
    description: 'User ID to add as participant',
    example: '01234567-89ab-cdef-0123-456789abcdef',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  userId!: string;
}
