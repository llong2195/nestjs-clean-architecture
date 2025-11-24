/**
 * Domain Exception Base Class
 *
 * Base class for all domain-specific exceptions.
 * Domain exceptions represent business rule violations and validation errors
 * at the domain layer. They are framework-agnostic and do not depend on NestJS.
 *
 * Exception filters in the interface layer map these to appropriate HTTP responses.
 */
export abstract class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
