import { v7 as uuidv7 } from 'uuid';

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
      throw new Error('Comment content cannot be empty');
    }

    if (content.length > 1000) {
      throw new Error('Comment content cannot exceed 1000 characters');
    }

    if (!postId || postId.trim().length === 0) {
      throw new Error('Post ID is required');
    }

    if (!authorId || authorId.trim().length === 0) {
      throw new Error('Author ID is required');
    }

    return new Comment(uuidv7(), postId, authorId, content.trim(), new Date());
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
      throw new Error('Comment content cannot be empty');
    }

    if (content.length > 1000) {
      throw new Error('Comment content cannot exceed 1000 characters');
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
