import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Comment } from '../../domain/entities/comment.entity';
import type { ICommentRepository } from '../../domain/repositories/comment.repository.interface';
import type { IPostRepository } from '../../domain/repositories/post.repository.interface';

@Injectable()
export class CreateCommentUseCase {
  constructor(
    @Inject('ICommentRepository')
    private readonly commentRepository: ICommentRepository,
    @Inject('IPostRepository')
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(postId: string, authorId: string, content: string): Promise<Comment> {
    // Verify post exists
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    const comment = Comment.create(postId, authorId, content);
    return await this.commentRepository.save(comment);
  }
}
