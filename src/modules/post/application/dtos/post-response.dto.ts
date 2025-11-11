import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostStatus } from '../../domain/value-objects/post-status.vo';

export class PostResponseDto {
  @ApiProperty({
    description: 'Post ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: 'Author user ID',
    example: '660e8400-e29b-41d4-a716-446655440001',
  })
  authorId!: string;

  @ApiProperty({
    description: 'Post title',
    example: 'Introduction to Clean Architecture',
  })
  title!: string;

  @ApiProperty({
    description: 'Post content',
    example: '# Clean Architecture\n\nClean Architecture is...',
  })
  content!: string;

  @ApiProperty({
    description: 'URL slug',
    example: 'introduction-to-clean-architecture',
  })
  slug!: string;

  @ApiProperty({
    description: 'Post status',
    enum: PostStatus,
    example: PostStatus.PUBLISHED,
  })
  status!: PostStatus;

  @ApiPropertyOptional({
    description: 'Published date',
    example: '2025-11-11T12:00:00.000Z',
    nullable: true,
  })
  publishedAt!: Date | null;

  @ApiProperty({
    description: 'View count',
    example: 42,
  })
  viewCount!: number;

  @ApiProperty({
    description: 'Created date',
    example: '2025-11-10T10:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Updated date',
    example: '2025-11-11T12:00:00.000Z',
  })
  updatedAt!: Date;
}
