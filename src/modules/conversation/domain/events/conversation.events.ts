import { v7 as uuid } from 'uuid';
import { IDomainEvent } from '../../../../shared/domain-events/domain-event.interface';
import { ConversationType } from '../value-objects/conversation-type.vo';

/**
 * Conversation Created Event
 *
 * Emitted when a new conversation is created.
 */
export class ConversationCreatedEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly eventType = 'ConversationCreated';
  public readonly aggregateType = 'Conversation';

  constructor(
    public readonly aggregateId: string,
    public readonly type: ConversationType,
    public readonly createdBy: string,
    public readonly participantIds: string[],
    public readonly occurredOn: Date = new Date(),
  ) {
    this.eventId = uuid();
  }

  get payload(): Record<string, unknown> {
    return {
      type: this.type,
      createdBy: this.createdBy,
      participantIds: this.participantIds,
    };
  }
}

/**
 * Message Added Event
 *
 * Emitted when a new message is added to the conversation.
 */
export class MessageAddedEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly eventType = 'MessageAdded';
  public readonly aggregateType = 'Conversation';

  constructor(
    public readonly aggregateId: string,
    public readonly messageId: string,
    public readonly senderId: string,
    public readonly content: string,
    public readonly occurredOn: Date = new Date(),
  ) {
    this.eventId = uuid();
  }

  get payload(): Record<string, unknown> {
    return {
      messageId: this.messageId,
      senderId: this.senderId,
      content: this.content,
    };
  }
}

/**
 * Participant Added Event
 *
 * Emitted when a participant is added to the conversation.
 */
export class ParticipantAddedEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly eventType = 'ParticipantAdded';
  public readonly aggregateType = 'Conversation';

  constructor(
    public readonly aggregateId: string,
    public readonly participantId: string,
    public readonly addedBy: string,
    public readonly occurredOn: Date = new Date(),
  ) {
    this.eventId = uuid();
  }

  get payload(): Record<string, unknown> {
    return {
      participantId: this.participantId,
      addedBy: this.addedBy,
    };
  }
}

/**
 * Participant Removed Event
 *
 * Emitted when a participant is removed from the conversation.
 */
export class ParticipantRemovedEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly eventType = 'ParticipantRemoved';
  public readonly aggregateType = 'Conversation';

  constructor(
    public readonly aggregateId: string,
    public readonly participantId: string,
    public readonly removedBy: string,
    public readonly occurredOn: Date = new Date(),
  ) {
    this.eventId = uuid();
  }

  get payload(): Record<string, unknown> {
    return {
      participantId: this.participantId,
      removedBy: this.removedBy,
    };
  }
}

/**
 * Conversation Archived Event
 *
 * Emitted when a conversation is archived/deactivated.
 */
export class ConversationArchivedEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly eventType = 'ConversationArchived';
  public readonly aggregateType = 'Conversation';

  constructor(
    public readonly aggregateId: string,
    public readonly archivedBy: string,
    public readonly occurredOn: Date = new Date(),
  ) {
    this.eventId = uuid();
  }

  get payload(): Record<string, unknown> {
    return {
      archivedBy: this.archivedBy,
    };
  }
}
