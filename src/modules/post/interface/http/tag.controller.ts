import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateTagUseCase } from '../../application/use-cases/create-tag.use-case';
import { GetAllTagsUseCase } from '../../application/use-cases/get-all-tags.use-case';
import { GetPostsByTagUseCase } from '../../application/use-cases/get-posts-by-tag.use-case';
import { CreateTagDto } from '../../application/dtos/create-tag.dto';
import { TagResponseDto } from '../../application/dtos/tag-response.dto';
import { PostResponseDto } from '../../application/dtos/post-response.dto';

@ApiTags('Tags')
@Controller('tags')
export class TagController {
  constructor(
    private readonly createTagUseCase: CreateTagUseCase,
    private readonly getAllTagsUseCase: GetAllTagsUseCase,
    private readonly getPostsByTagUseCase: GetPostsByTagUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tag' })
  @ApiResponse({
    status: 201,
    description: 'Tag created successfully',
    type: TagResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Tag already exists' })
  async create(@Body() createTagDto: CreateTagDto): Promise<TagResponseDto> {
    const tag = await this.createTagUseCase.execute(createTagDto.name, createTagDto.slug);

    return {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all tags' })
  @ApiResponse({
    status: 200,
    description: 'Tags retrieved successfully',
    type: [TagResponseDto],
  })
  async findAll(): Promise<TagResponseDto[]> {
    const tags = await this.getAllTagsUseCase.execute();

    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    }));
  }

  @Get(':tagSlug/posts')
  @ApiOperation({ summary: 'Get all posts with a specific tag' })
  @ApiResponse({
    status: 200,
    description: 'Posts retrieved successfully',
    type: [PostResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  async getPostsByTag(@Param('tagSlug') tagSlug: string): Promise<PostResponseDto[]> {
    const posts = await this.getPostsByTagUseCase.execute(tagSlug);

    return posts.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      authorId: post.authorId,
      status: post.status,
      viewCount: 0, // TODO: Add view count tracking
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      publishedAt: post.publishedAt || null,
    }));
  }
}
