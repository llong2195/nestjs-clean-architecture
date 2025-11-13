import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CreatePostUseCase } from '../../application/use-cases/create-post.use-case';
import { GetPostUseCase } from '../../application/use-cases/get-post.use-case';
import { UpdatePostUseCase } from '../../application/use-cases/update-post.use-case';
import { PublishPostUseCase } from '../../application/use-cases/publish-post.use-case';
import { ListPostsUseCase } from '../../application/use-cases/list-posts.use-case';
import { CreatePostDto } from '../../application/dtos/create-post.dto';
import { UpdatePostDto } from '../../application/dtos/update-post.dto';
import { PostResponseDto } from '../../application/dtos/post-response.dto';
import { PostMapper } from '../../application/mappers/post.mapper';
import { PostCacheService } from '../../infrastructure/cache/post-cache.service';
import { ApiResponse as ApiResponseType } from '../../../../common/types/response.types';

@ApiTags('posts')
@Controller('posts')
export class PostController {
  constructor(
    private readonly createPostUseCase: CreatePostUseCase,
    private readonly getPostUseCase: GetPostUseCase,
    private readonly updatePostUseCase: UpdatePostUseCase,
    private readonly publishPostUseCase: PublishPostUseCase,
    private readonly listPostsUseCase: ListPostsUseCase,
    private readonly cacheService: PostCacheService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Post created successfully',
    type: PostResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Post with this slug already exists',
  })
  async create(@Body() createPostDto: CreatePostDto): Promise<ApiResponseType<PostResponseDto>> {
    const post = await this.createPostUseCase.execute(createPostDto);
    return {
      status: 'success',
      data: PostMapper.toDto(post),
      meta: {
        timestamp: new Date().toISOString(),
        requestId: '',
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get post by ID' })
  @ApiParam({ name: 'id', description: 'Post UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Post found',
    type: PostResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Post not found',
  })
  async findOne(@Param('id') id: string): Promise<ApiResponseType<PostResponseDto>> {
    // Try cache first
    const cachedPost = await this.cacheService.getPost(id);
    if (cachedPost) {
      return {
        status: 'success',
        data: cachedPost,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: '',
        },
      };
    }

    // Cache miss - fetch from database
    const post = await this.getPostUseCase.execute(id);
    const postDto = PostMapper.toDto(post);

    // Cache for future requests
    await this.cacheService.setPost(id, postDto);

    return {
      status: 'success',
      data: postDto,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: '',
      },
    };
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get post by slug' })
  @ApiParam({ name: 'slug', description: 'Post URL slug' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Post found',
    type: PostResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Post not found',
  })
  async findBySlug(@Param('slug') slug: string): Promise<ApiResponseType<PostResponseDto>> {
    // Try cache first (by slug)
    const cachedPost = await this.cacheService.getPostBySlug(slug);
    if (cachedPost) {
      return {
        status: 'success',
        data: cachedPost,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: '',
        },
      };
    }

    // Cache miss - fetch from database (and increment view count)
    const post = await this.getPostUseCase.findBySlug(slug);
    const postDto = PostMapper.toDto(post);

    // Cache for future requests (both by slug and ID)
    await this.cacheService.setPostBySlug(slug, postDto);
    await this.cacheService.setPost(post.id, postDto);

    return {
      status: 'success',
      data: postDto,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: '',
      },
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all posts with pagination' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 10)',
    type: Number,
  })
  @ApiQuery({
    name: 'authorId',
    required: false,
    description: 'Filter by author ID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Posts retrieved successfully',
    type: [PostResponseDto],
  })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('authorId') authorId?: string,
  ): Promise<ApiResponseType<any>> {
    // Default values for pagination
    const currentPage = page || 1;
    const currentLimit = limit || 10;

    // Try cache first
    const cachedList = await this.cacheService.getPostList(currentPage, currentLimit, authorId);
    if (cachedList) {
      return {
        status: 'success',
        data: cachedList,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: '',
        },
      };
    }

    // Cache miss - fetch from database
    const result = await this.listPostsUseCase.execute({
      page: currentPage,
      limit: currentLimit,
      authorId,
    });

    const responseData = {
      posts: PostMapper.toDtoList(result.data),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };

    // Cache for future requests
    await this.cacheService.setPostList(currentPage, currentLimit, responseData.posts, authorId);

    return {
      status: 'success',
      data: responseData,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: '',
      },
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update post' })
  @ApiParam({ name: 'id', description: 'Post UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Post updated successfully',
    type: PostResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Post not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<ApiResponseType<PostResponseDto>> {
    const post = await this.updatePostUseCase.execute(id, updatePostDto);
    const postDto = PostMapper.toDto(post);

    // Invalidate cache after update
    await this.cacheService.invalidateAll(id, post.slug);

    return {
      status: 'success',
      data: postDto,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: '',
      },
    };
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish post' })
  @ApiParam({ name: 'id', description: 'Post UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Post published successfully',
    type: PostResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Post not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Post cannot be published',
  })
  async publish(@Param('id') id: string): Promise<ApiResponseType<PostResponseDto>> {
    const post = await this.publishPostUseCase.execute(id);
    const postDto = PostMapper.toDto(post);

    // Invalidate cache after publishing (status changed)
    await this.cacheService.invalidateAll(id, post.slug);

    return {
      status: 'success',
      data: postDto,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: '',
      },
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete post' })
  @ApiParam({ name: 'id', description: 'Post UUID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Post deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Post not found',
  })
  async remove(@Param('id') id: string): Promise<void> {
    const post = await this.getPostUseCase.execute(id);
    post.archive();
    // Note: In a real implementation, you'd have a DeletePostUseCase
  }
}
