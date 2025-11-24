import { DomainException } from '../../../../shared/domain-events/exceptions/domain.exception';

/**
 * Invalid Email Exception
 * Thrown when email format validation fails
 */
export class InvalidEmailException extends DomainException {
  constructor(email: string) {
    super(`Invalid email format: ${email}`);
  }
}

/**
 * Weak Password Exception
 * Thrown when password doesn't meet complexity requirements
 */
export class WeakPasswordException extends DomainException {
  constructor(reason: string) {
    super(`Password does not meet security requirements: ${reason}`);
  }
}

/**
 * Password Too Short Exception
 * Thrown when password is shorter than minimum length
 */
export class PasswordTooShortException extends DomainException {
  constructor(minLength: number) {
    super(`Password must be at least ${minLength} characters long`);
  }
}

/**
 * User Name Too Short Exception
 * Thrown when username is shorter than minimum length
 */
export class UserNameTooShortException extends DomainException {
  constructor(provided: number, required: number) {
    super(`User name must be at least ${required} characters (provided: ${provided})`);
  }
}

/**
 * User Name Too Long Exception
 * Thrown when username exceeds maximum length
 */
export class UserNameTooLongException extends DomainException {
  constructor(provided: number, maximum: number) {
    super(`User name cannot exceed ${maximum} characters (provided: ${provided})`);
  }
}

/**
 * Empty User Name Exception
 * Thrown when username is empty or whitespace only
 */
export class EmptyUserNameException extends DomainException {
  constructor() {
    super('User name cannot be empty');
  }
}

/**
 * Password Required For Local Auth Exception
 * Thrown when attempting to create local user without password
 */
export class PasswordRequiredForLocalAuthException extends DomainException {
  constructor() {
    super('Password is required for local authentication');
  }
}

/**
 * Cannot Change Password For OAuth Exception
 * Thrown when attempting to change password for OAuth users
 */
export class CannotChangePasswordForOAuthException extends DomainException {
  constructor(provider: string) {
    super(`Cannot change password for ${provider} OAuth users`);
  }
}
