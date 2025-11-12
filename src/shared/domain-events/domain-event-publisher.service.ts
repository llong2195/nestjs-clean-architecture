import { Injectable, Logger } from '@nestjs/common';
import { IDomainEvent } from './domain-event.interface';
import { OutboxRepository } from './outbox/outbox.repository';

/**
 * Domain Event Publisher Service
 *
 * Responsible for publishing domain events to the outbox table
 * for eventual publishing to message brokers (Kafka, etc.).
 *
 * Uses the Transactional Outbox pattern to ensure events are
 * persisted atomically with the aggregate changes.
 */
@Injectable()
export class DomainEventPublisher {
  private readonly logger = new Logger(DomainEventPublisher.name);

  constructor(private readonly outboxRepository: OutboxRepository) {}

  /**
   * Publish a single domain event
   * In Transactional Outbox pattern, this saves to outbox table
   */
  async publish(event: IDomainEvent): Promise<void> {
    this.logger.log(
      `Publishing domain event: ${event.eventType} for aggregate ${event.aggregateId}`,
    );

    await this.outboxRepository.save(event);

    this.logger.debug(`Event saved to outbox: ${JSON.stringify(event)}`);
  }

  /**
   * Publish multiple domain events
   */
  async publishAll(events: IDomainEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    this.logger.log(`Publishing ${events.length} domain events`);

    await Promise.all(events.map((event) => this.publish(event)));
  }

  /**
   * Publish events from an aggregate root
   * Automatically clears events after publishing
   */
  async publishFromAggregate(aggregate: {
    domainEvents: ReadonlyArray<IDomainEvent>;
    clearDomainEvents: () => void;
  }): Promise<void> {
    const events = [...aggregate.domainEvents];

    if (events.length === 0) {
      return;
    }

    await this.publishAll(events);
    aggregate.clearDomainEvents();
  }
}
