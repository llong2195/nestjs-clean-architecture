export class UserCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly userName: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class UserUpdatedEvent {
  constructor(
    public readonly userId: string,
    public readonly updatedFields: {
      email?: string;
      userName?: string;
    },
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class UserDeletedEvent {
  constructor(
    public readonly userId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
