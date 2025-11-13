import { v7 as uuid } from 'uuid';
import { PostStatus } from '../value-objects/post-status.vo';
import { PostPublishedEvent, PostArchivedEvent } from '../events/post.events';

export class Post {
  private domainEvents: any[] = [];

  private constructor(
    public readonly id: string,
    private _authorId: string,
    private _title: string,
    private _content: string,
    private _slug: string,
    private _status: PostStatus,
    private _publishedAt: Date | null,
    private _viewCount: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(authorId: string, title: string, content: string, slug?: string): Post {
    if (!title || title.trim().length === 0) {
      throw new Error('Post title cannot be empty');
    }

    if (title.length > 200) {
      throw new Error('Post title cannot exceed 200 characters');
    }

    if (!content || content.trim().length === 0) {
      throw new Error('Post content cannot be empty');
    }

    if (!authorId || authorId.trim().length === 0) {
      throw new Error('Author ID is required');
    }

    const generatedSlug = slug || Post.generateSlug(title);

    return new Post(
      uuid(),
      authorId,
      title.trim(),
      content.trim(),
      generatedSlug,
      PostStatus.DRAFT,
      null,
      0,
      new Date(),
      new Date(),
    );
  }

  static reconstitute(
    id: string,
    authorId: string,
    title: string,
    content: string,
    slug: string,
    status: PostStatus,
    publishedAt: Date | null,
    viewCount: number,
    createdAt: Date,
    updatedAt: Date,
  ): Post {
    return new Post(
      id,
      authorId,
      title,
      content,
      slug,
      status,
      publishedAt,
      viewCount,
      createdAt,
      updatedAt,
    );
  }

  private static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  publish(): void {
    if (this._status === PostStatus.PUBLISHED) {
      throw new Error('Post is already published');
    }

    if (this._status === PostStatus.ARCHIVED) {
      throw new Error('Cannot publish an archived post');
    }

    this._status = PostStatus.PUBLISHED;
    this._publishedAt = new Date();

    this.addDomainEvent(
      new PostPublishedEvent(this.id, this._authorId, this._title, this._slug, this._publishedAt),
    );
  }

  archive(): void {
    if (this._status === PostStatus.ARCHIVED) {
      throw new Error('Post is already archived');
    }

    this._status = PostStatus.ARCHIVED;
    this.addDomainEvent(new PostArchivedEvent(this.id));
  }

  incrementViewCount(): void {
    this._viewCount += 1;
  }

  updateContent(title: string, content: string, slug?: string): void {
    if (title && title.trim().length > 0) {
      if (title.length > 200) {
        throw new Error('Post title cannot exceed 200 characters');
      }
      this._title = title.trim();
      this._slug = slug || Post.generateSlug(title);
    }

    if (content && content.trim().length > 0) {
      this._content = content.trim();
    }
  }

  private addDomainEvent(event: any): void {
    this.domainEvents.push(event);
  }

  getDomainEvents(): any[] {
    return [...this.domainEvents];
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }

  // Getters
  get authorId(): string {
    return this._authorId;
  }

  get title(): string {
    return this._title;
  }

  get content(): string {
    return this._content;
  }

  get slug(): string {
    return this._slug;
  }

  get status(): PostStatus {
    return this._status;
  }

  get publishedAt(): Date | null {
    return this._publishedAt;
  }

  get viewCount(): number {
    return this._viewCount;
  }
}
