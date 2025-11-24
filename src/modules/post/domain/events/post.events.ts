import { v7 as uuid } from 'uuid';
import { IDomainEvent } from '../../../../shared/domain-events/domain-event.interface';

export class PostPublishedEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly eventType = 'PostPublished';
  public readonly aggregateType = 'Post';

  constructor(
    public readonly aggregateId: string,
    public readonly authorId: string,
    public readonly title: string,
    public readonly slug: string,
    public readonly publishedAt: Date,
    public readonly occurredOn: Date = new Date(),
  ) {
    this.eventId = uuid();
  }

  get payload(): Record<string, unknown> {
    return {
      authorId: this.authorId,
      title: this.title,
      slug: this.slug,
      publishedAt: this.publishedAt,
    };
  }
}

export class PostArchivedEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly eventType = 'PostArchived';
  public readonly aggregateType = 'Post';

  constructor(
    public readonly aggregateId: string,
    public readonly occurredOn: Date = new Date(),
  ) {
    this.eventId = uuid();
  }

  get payload(): Record<string, unknown> {
    return {};
  }
}

export class PostViewIncrementedEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly eventType = 'PostViewIncremented';
  public readonly aggregateType = 'Post';

  constructor(
    public readonly aggregateId: string,
    public readonly newViewCount: number,
    public readonly occurredOn: Date = new Date(),
  ) {
    this.eventId = uuid();
  }

  get payload(): Record<string, unknown> {
    return {
      newViewCount: this.newViewCount,
    };
  }
}
