import { Inject, Injectable } from '@nestjs/common';
import { Comment } from '../../domain/entities/comment.entity';
import type { ICommentRepository } from '../../domain/repositories/comment.repository.interface';

@Injectable()
export class GetCommentsByPostUseCase {
  constructor(
    @Inject('ICommentRepository')
    private readonly commentRepository: ICommentRepository,
  ) {}

  async execute(postId: string): Promise<Comment[]> {
    return await this.commentRepository.findByPostId(postId);
  }
}
