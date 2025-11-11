import { Post } from '../../domain/aggregates/post.aggregate';
import { PostResponseDto } from '../dtos/post-response.dto';

export class PostMapper {
  static toDto(post: Post): PostResponseDto {
    return {
      id: post.id,
      authorId: post.authorId,
      title: post.title,
      content: post.content,
      slug: post.slug,
      status: post.status,
      publishedAt: post.publishedAt,
      viewCount: post.viewCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  static toDtoList(posts: Post[]): PostResponseDto[] {
    return posts.map((post) => this.toDto(post));
  }
}
