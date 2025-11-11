export class PostPublishedEvent {
  constructor(
    public readonly postId: string,
    public readonly authorId: string,
    public readonly title: string,
    public readonly slug: string,
    public readonly publishedAt: Date,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class PostArchivedEvent {
  constructor(
    public readonly postId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class PostViewIncrementedEvent {
  constructor(
    public readonly postId: string,
    public readonly newViewCount: number,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
