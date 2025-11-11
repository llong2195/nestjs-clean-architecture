import { Injectable } from '@nestjs/common';
import type { IPostRepository } from '../../domain/repositories/post.repository.interface';
import { Post } from '../../domain/aggregates/post.aggregate';

export interface ListPostsOptions {
  page?: number;
  limit?: number;
  authorId?: string;
}

export interface PaginatedPostsResult {
  data: Post[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ListPostsUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(options?: ListPostsOptions): Promise<PaginatedPostsResult> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    let posts: Post[];
    let total: number;

    if (options?.authorId) {
      posts = await this.postRepository.findByAuthorId(options.authorId, {
        skip,
        take: limit,
      });
      total = await this.postRepository.countByAuthorId(options.authorId);
    } else {
      posts = await this.postRepository.findAll({ skip, take: limit });
      total = await this.postRepository.count();
    }

    return {
      data: posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
