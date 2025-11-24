import { Injectable, Inject } from '@nestjs/common';
import type { IPostRepository } from '../../domain/repositories/post.repository.interface';
import { CreatePostDto } from '../dtos/create-post.dto';
import { Post } from '../../domain/aggregates/post.aggregate';
import { DuplicateSlugException } from '../../../../common/exceptions/custom-exceptions';

@Injectable()
export class CreatePostUseCase {
  constructor(
    @Inject('IPostRepository')
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(dto: CreatePostDto): Promise<Post> {
    // Check if slug already exists
    if (dto.slug) {
      const existingPost = await this.postRepository.findBySlug(dto.slug);
      if (existingPost) {
        throw new DuplicateSlugException(dto.slug);
      }
    }

    // Create post aggregate
    const post = Post.create(dto.authorId, dto.title, dto.content, dto.slug);

    // Save to repository
    return this.postRepository.save(post);
  }
}
