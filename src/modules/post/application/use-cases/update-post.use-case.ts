import { Injectable, NotFoundException } from '@nestjs/common';
import type { IPostRepository } from '../../domain/repositories/post.repository.interface';
import { UpdatePostDto } from '../dtos/update-post.dto';
import { Post } from '../../domain/aggregates/post.aggregate';

@Injectable()
export class UpdatePostUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(id: string, dto: UpdatePostDto): Promise<Post> {
    const post = await this.postRepository.findById(id);

    if (!post) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }

    // Check if new slug conflicts with existing post
    if (dto.slug && dto.slug !== post.slug) {
      const existingPost = await this.postRepository.findBySlug(dto.slug);
      if (existingPost && existingPost.id !== id) {
        throw new Error(`Post with slug "${dto.slug}" already exists`);
      }
    }

    // Update post content using domain method
    post.updateContent(dto.title || post.title, dto.content || post.content, dto.slug);

    // Save updated post
    return this.postRepository.save(post);
  }
}
