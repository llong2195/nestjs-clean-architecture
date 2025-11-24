import { DomainException } from '../../../../shared/domain-events/exceptions/domain.exception';

/**
 * Empty Post Title Exception
 * Thrown when post title is empty or whitespace only
 */
export class EmptyPostTitleException extends DomainException {
  constructor() {
    super('Post title cannot be empty');
  }
}

/**
 * Post Title Too Long Exception
 * Thrown when post title exceeds maximum length
 */
export class PostTitleTooLongException extends DomainException {
  constructor(provided: number, maximum: number) {
    super(`Post title cannot exceed ${maximum} characters (provided: ${provided})`);
  }
}

/**
 * Empty Post Content Exception
 * Thrown when post content is empty or whitespace only
 */
export class EmptyPostContentException extends DomainException {
  constructor() {
    super('Post content cannot be empty');
  }
}

/**
 * Invalid Post State Exception
 * Thrown when attempting invalid state transitions
 */
export class InvalidPostStateException extends DomainException {
  constructor(attemptedAction: string, currentState: string) {
    super(`Cannot ${attemptedAction} post in ${currentState} state`);
  }
}

/**
 * Author ID Required Exception
 * Thrown when author ID is missing
 */
export class AuthorIdRequiredException extends DomainException {
  constructor() {
    super('Author ID is required');
  }
}

/**
 * Empty Tag Name Exception
 * Thrown when tag name is empty
 */
export class EmptyTagNameException extends DomainException {
  constructor() {
    super('Tag name cannot be empty');
  }
}

/**
 * Tag Name Too Long Exception
 * Thrown when tag name exceeds maximum length
 */
export class TagNameTooLongException extends DomainException {
  constructor(provided: number, maximum: number) {
    super(`Tag name cannot exceed ${maximum} characters (provided: ${provided})`);
  }
}

/**
 * Empty Comment Content Exception
 * Thrown when comment content is empty
 */
export class EmptyCommentContentException extends DomainException {
  constructor() {
    super('Comment content cannot be empty');
  }
}

/**
 * Comment Content Too Long Exception
 * Thrown when comment content exceeds maximum length
 */
export class CommentContentTooLongException extends DomainException {
  constructor(provided: number, maximum: number) {
    super(`Comment content cannot exceed ${maximum} characters (provided: ${provided})`);
  }
}

/**
 * Post ID Required Exception
 * Thrown when post ID is missing for comment
 */
export class PostIdRequiredException extends DomainException {
  constructor() {
    super('Post ID is required');
  }
}
