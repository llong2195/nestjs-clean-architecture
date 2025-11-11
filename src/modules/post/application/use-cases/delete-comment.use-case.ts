import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ICommentRepository } from '../../domain/repositories/comment.repository.interface';

@Injectable()
export class DeleteCommentUseCase {
  constructor(
    @Inject('ICommentRepository')
    private readonly commentRepository: ICommentRepository,
  ) {}

  async execute(commentId: string): Promise<void> {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${commentId} not found`);
    }

    await this.commentRepository.delete(commentId);
  }
}
