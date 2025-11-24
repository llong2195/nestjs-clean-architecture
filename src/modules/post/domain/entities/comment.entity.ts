import { v7 as uuid } from 'uuid';
import {
  EmptyCommentContentException,
  CommentContentTooLongException,
  PostIdRequiredException,
  AuthorIdRequiredException,
} from '../exceptions/post.exceptions';

export class Comment {
  private constructor(
    public readonly id: string,
    private _postId: string,
    private _authorId: string,
    private _content: string,
    public readonly createdAt: Date,
  ) {}

  static create(postId: string, authorId: string, content: string): Comment {
    if (!content || content.trim().length === 0) {
      throw new EmptyCommentContentException();
    }

    if (content.length > 1000) {
      throw new CommentContentTooLongException(content.length, 1000);
    }

    if (!postId || postId.trim().length === 0) {
      throw new PostIdRequiredException();
    }

    if (!authorId || authorId.trim().length === 0) {
      throw new AuthorIdRequiredException();
    }

    return new Comment(uuid(), postId, authorId, content.trim(), new Date());
  }

  static reconstitute(
    id: string,
    postId: string,
    authorId: string,
    content: string,
    createdAt: Date,
  ): Comment {
    return new Comment(id, postId, authorId, content, createdAt);
  }

  updateContent(content: string): void {
    if (!content || content.trim().length === 0) {
      throw new EmptyCommentContentException();
    }

    if (content.length > 1000) {
      throw new CommentContentTooLongException(content.length, 1000);
    }

    this._content = content.trim();
  }

  // Getters
  get postId(): string {
    return this._postId;
  }

  get authorId(): string {
    return this._authorId;
  }

  get content(): string {
    return this._content;
  }
}
