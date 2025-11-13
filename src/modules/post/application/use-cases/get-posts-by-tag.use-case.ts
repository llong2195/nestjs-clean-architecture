import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Post } from '../../domain/aggregates/post.aggregate';
import type { IPostRepository } from '../../domain/repositories/post.repository.interface';
import type { ITagRepository } from '../../domain/repositories/tag.repository.interface';

@Injectable()
export class GetPostsByTagUseCase {
  constructor(
    @Inject('ITagRepository')
    private readonly tagRepository: ITagRepository,
    @Inject('IPostRepository')
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(tagSlug: string): Promise<Post[]> {
    // Verify tag exists
    const tag = await this.tagRepository.findBySlug(tagSlug);
    if (!tag) {
      throw new NotFoundException(`Tag with slug "${tagSlug}" not found`);
    }

    // For now, return empty array since post-tag relationship needs proper query
    // This will be fully implemented when we add proper join queries
    // TODO: Implement proper query to get posts by tag ID through junction table
    return [];
  }
}
