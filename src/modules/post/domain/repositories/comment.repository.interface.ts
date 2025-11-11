import { Comment } from '../entities/comment.entity';

export interface ICommentRepository {
  save(comment: Comment): Promise<Comment>;
  findById(id: string): Promise<Comment | null>;
  findByPostId(postId: string): Promise<Comment[]>;
  delete(id: string): Promise<boolean>;
}
