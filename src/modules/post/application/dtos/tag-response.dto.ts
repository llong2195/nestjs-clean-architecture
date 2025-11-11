import { ApiProperty } from '@nestjs/swagger';

export class TagResponseDto {
  @ApiProperty({
    description: 'Tag ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Tag name',
    example: 'TypeScript',
  })
  name!: string;

  @ApiProperty({
    description: 'Tag slug',
    example: 'typescript',
  })
  slug!: string;
}
