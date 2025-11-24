import { Injectable, Inject } from '@nestjs/common';
import type { IPostRepository } from '../../domain/repositories/post.repository.interface';
import { UpdatePostDto } from '../dtos/update-post.dto';
import { Post } from '../../domain/aggregates/post.aggregate';
import {
  PostNotFoundException,
  DuplicateSlugException,
} from '../../../../common/exceptions/custom-exceptions';

@Injectable()
export class UpdatePostUseCase {
  constructor(
    @Inject('IPostRepository')
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(id: string, dto: UpdatePostDto): Promise<Post> {
    const post = await this.postRepository.findById(id);

    if (!post) {
      throw new PostNotFoundException(id);
    }

    // Check if new slug conflicts with existing post
    if (dto.slug && dto.slug !== post.slug) {
      const existingPost = await this.postRepository.findBySlug(dto.slug);
      if (existingPost && existingPost.id !== id) {
        throw new DuplicateSlugException(dto.slug);
      }
    }

    // Update post content using domain method
    post.updateContent(dto.title || post.title, dto.content || post.content, dto.slug);

    // Save updated post
    return this.postRepository.save(post);
  }
}
