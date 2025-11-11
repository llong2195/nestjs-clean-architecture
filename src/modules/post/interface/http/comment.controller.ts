import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CreateCommentUseCase } from '../../application/use-cases/create-comment.use-case';
import { GetCommentsByPostUseCase } from '../../application/use-cases/get-comments-by-post.use-case';
import { DeleteCommentUseCase } from '../../application/use-cases/delete-comment.use-case';
import { CreateCommentDto } from '../../application/dtos/create-comment.dto';
import { CommentResponseDto } from '../../application/dtos/comment-response.dto';

@ApiTags('Comments')
@Controller('posts')
export class CommentController {
  constructor(
    private readonly createCommentUseCase: CreateCommentUseCase,
    private readonly getCommentsByPostUseCase: GetCommentsByPostUseCase,
    private readonly deleteCommentUseCase: DeleteCommentUseCase,
  ) {}

  @Post(':postId/comments')
  @ApiOperation({ summary: 'Add a comment to a post' })
  @ApiQuery({
    name: 'authorId',
    description: 'User ID of the comment author',
    required: true,
  })
  @ApiResponse({
    status: 201,
    description: 'Comment created successfully',
    type: CommentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async create(
    @Param('postId') postId: string,
    @Query('authorId') authorId: string,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    const comment = await this.createCommentUseCase.execute(
      postId,
      authorId,
      createCommentDto.content,
    );

    return {
      id: comment.id,
      postId: comment.postId,
      authorId: comment.authorId,
      content: comment.content,
      createdAt: comment.createdAt,
    };
  }

  @Get(':postId/comments')
  @ApiOperation({ summary: 'Get all comments for a post' })
  @ApiResponse({
    status: 200,
    description: 'Comments retrieved successfully',
    type: [CommentResponseDto],
  })
  async findByPost(@Param('postId') postId: string): Promise<CommentResponseDto[]> {
    const comments = await this.getCommentsByPostUseCase.execute(postId);

    return comments.map((comment) => ({
      id: comment.id,
      postId: comment.postId,
      authorId: comment.authorId,
      content: comment.content,
      createdAt: comment.createdAt,
    }));
  }

  @Delete('comments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({ status: 204, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteCommentUseCase.execute(id);
  }
}
