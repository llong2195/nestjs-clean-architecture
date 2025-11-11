import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePostDto {
  @ApiPropertyOptional({
    description: 'Post title',
    example: 'Updated: Introduction to Clean Architecture',
    maxLength: 200,
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: 'Post content in markdown format',
    example: '# Clean Architecture (Updated)\n\nClean Architecture is...',
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({
    description: 'URL slug',
    example: 'introduction-to-clean-architecture-updated',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  slug?: string;
}
