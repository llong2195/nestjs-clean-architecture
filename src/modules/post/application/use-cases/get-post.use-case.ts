import { Injectable, NotFoundException } from '@nestjs/common';
import type { IPostRepository } from '../../domain/repositories/post.repository.interface';
import { Post } from '../../domain/aggregates/post.aggregate';

@Injectable()
export class GetPostUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(id: string): Promise<Post> {
    const post = await this.postRepository.findById(id);

    if (!post) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }

    return post;
  }

  async findBySlug(slug: string): Promise<Post> {
    const post = await this.postRepository.findBySlug(slug);

    if (!post) {
      throw new NotFoundException(`Post with slug "${slug}" not found`);
    }

    return post;
  }
}
