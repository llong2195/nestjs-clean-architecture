import { Post } from '../aggregates/post.aggregate';

export interface IPostRepository {
  save(post: Post): Promise<Post>;
  saveWithTransaction(post: Post): Promise<Post>;
  findById(id: string): Promise<Post | null>;
  findBySlug(slug: string): Promise<Post | null>;
  findByAuthorId(authorId: string, options?: { skip?: number; take?: number }): Promise<Post[]>;
  findAll(options?: { skip?: number; take?: number }): Promise<Post[]>;
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
  countByAuthorId(authorId: string): Promise<number>;
}
