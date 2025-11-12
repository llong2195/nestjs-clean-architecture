/**
 * Domain Event Interface
 *
 * Base interface for all domain events in the system.
 * Domain events represent something that happened in the domain
 * that domain experts care about.
 */
export interface IDomainEvent {
  /**
   * Unique identifier for this event instance
   */
  eventId: string;

  /**
   * ID of the aggregate that produced this event
   */
  aggregateId: string;

  /**
   * Type of the event (e.g., 'UserCreated', 'PostPublished')
   */
  eventType: string;

  /**
   * When the event occurred
   */
  occurredOn: Date;

  /**
   * Event payload - specific data for this event type
   */
  payload: Record<string, unknown>;

  /**
   * Version of the aggregate when this event was produced
   */
  aggregateVersion?: number;

  /**
   * User or system that caused this event
   */
  causedBy?: string;
}
