import { Injectable, NotFoundException } from '@nestjs/common';
import type { IPostRepository } from '../../domain/repositories/post.repository.interface';
import { Post } from '../../domain/aggregates/post.aggregate';

@Injectable()
export class PublishPostUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(postId: string): Promise<Post> {
    const post = await this.postRepository.findById(postId);

    if (!post) {
      throw new NotFoundException(`Post with ID "${postId}" not found`);
    }

    // Call domain method to publish (generates domain events)
    post.publish();

    // Save updated post with transaction to ensure atomicity
    // When outbox pattern is implemented, events will be persisted atomically
    return this.postRepository.saveWithTransaction(post);
  }
}
