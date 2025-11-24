import { DomainException } from '../../../../shared/domain-events/exceptions/domain.exception';

/**
 * Invalid Participant Count Exception
 * Thrown when conversation participant count doesn't meet requirements
 */
export class InvalidParticipantCountException extends DomainException {
  constructor(type: string, required: string, provided: number) {
    super(`${type} conversations ${required} (provided: ${provided})`);
  }
}

/**
 * Not Participant Exception
 * Thrown when non-participant attempts an action
 */
export class NotParticipantException extends DomainException {
  constructor(userId: string, conversationId: string) {
    super(`User ${userId} is not a participant in conversation ${conversationId}`);
  }
}

/**
 * Conversation Inactive Exception
 * Thrown when attempting actions on archived conversation
 */
export class ConversationInactiveException extends DomainException {
  constructor(action: string) {
    super(`Cannot ${action} on inactive conversation`);
  }
}

/**
 * Empty Message Exception
 * Thrown when message content is empty
 */
export class EmptyMessageException extends DomainException {
  constructor() {
    super('Message content cannot be empty');
  }
}

/**
 * Already Participant Exception
 * Thrown when trying to add existing participant
 */
export class AlreadyParticipantException extends DomainException {
  constructor(userId: string) {
    super(`User ${userId} is already a participant`);
  }
}

/**
 * Cannot Remove From Direct Conversation Exception
 * Thrown when trying to remove participant from direct conversation
 */
export class CannotRemoveFromDirectConversationException extends DomainException {
  constructor() {
    super('Cannot remove participants from direct conversations');
  }
}

/**
 * Cannot Add To Direct Conversation Exception
 * Thrown when trying to add participant to direct conversation
 */
export class CannotAddToDirectConversationException extends DomainException {
  constructor() {
    super('Cannot add participants to direct conversations');
  }
}

/**
 * Minimum Participants Required Exception
 * Thrown when removing would violate minimum participant count
 */
export class MinimumParticipantsRequiredException extends DomainException {
  constructor(minimum: number) {
    super(`Cannot remove participant: conversation must have at least ${minimum} members`);
  }
}

/**
 * Cannot Update Direct Conversation Name Exception
 * Thrown when trying to update name of direct conversation
 */
export class CannotUpdateDirectConversationNameException extends DomainException {
  constructor() {
    super('Cannot update name of direct conversations');
  }
}
