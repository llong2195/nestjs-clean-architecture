import { ApiProperty } from '@nestjs/swagger';

export class CommentResponseDto {
  @ApiProperty({
    description: 'Comment ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Post ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  postId!: string;

  @ApiProperty({
    description: 'Author ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  authorId!: string;

  @ApiProperty({
    description: 'Comment content',
    example: 'Great article! Very insightful.',
  })
  content!: string;

  @ApiProperty({
    description: 'Created timestamp',
    example: '2025-11-11T10:00:00.000Z',
  })
  createdAt!: Date;
}
