import { IDomainEvent } from './domain-event.interface';

/**
 * Aggregate Root Base Class
 *
 * Base class for all aggregate roots in the domain layer.
 * Provides functionality for collecting and managing domain events.
 *
 * In DDD, only aggregate roots can publish domain events.
 */
export abstract class AggregateRoot {
  private _domainEvents: IDomainEvent[] = [];

  /**
   * Get all domain events that occurred on this aggregate
   */
  get domainEvents(): ReadonlyArray<IDomainEvent> {
    return this._domainEvents;
  }

  /**
   * Add a domain event to be published
   */
  protected addDomainEvent(event: IDomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * Clear all domain events (called after events are published)
   */
  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Check if this aggregate has any unpublished events
   */
  hasDomainEvents(): boolean {
    return this._domainEvents.length > 0;
  }
}
