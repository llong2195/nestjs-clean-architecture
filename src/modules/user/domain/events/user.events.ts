import { v7 as uuid } from 'uuid';
import { IDomainEvent } from '../../../../shared/domain-events/domain-event.interface';
import { UserRole } from '../value-objects/user-role.vo';

export class UserCreatedEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly eventType = 'UserCreated';
  public readonly aggregateType = 'User';

  constructor(
    public readonly aggregateId: string,
    public readonly email: string,
    public readonly userName: string,
    public readonly role: UserRole,
    public readonly provider: string,
    public readonly occurredOn: Date = new Date(),
  ) {
    this.eventId = uuid();
  }

  get payload(): Record<string, unknown> {
    return {
      email: this.email,
      userName: this.userName,
      role: this.role,
      provider: this.provider,
    };
  }
}

export class UserProfileUpdatedEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly eventType = 'UserProfileUpdated';
  public readonly aggregateType = 'User';

  constructor(
    public readonly aggregateId: string,
    public readonly updatedFields: {
      email?: string;
      userName?: string;
    },
    public readonly occurredOn: Date = new Date(),
  ) {
    this.eventId = uuid();
  }

  get payload(): Record<string, unknown> {
    return {
      updatedFields: this.updatedFields,
    };
  }
}

export class UserDeactivatedEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly eventType = 'UserDeactivated';
  public readonly aggregateType = 'User';

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
