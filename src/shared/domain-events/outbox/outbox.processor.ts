import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { KafkaProducerService } from '../../messaging/kafka/kafka-producer.service';
import { DomainEventOutboxOrmEntity } from './outbox.orm-entity';
import { OutboxRepository } from './outbox.repository';

/**
 * Outbox Queue Processor
 *
 * Background worker that polls the outbox table for unpublished events
 * and publishes them to message brokers (Kafka).
 *
 * Implements retry logic with exponential backoff for failed publishes.
 */
@Processor('domain-events-outbox')
export class OutboxProcessor extends WorkerHost {
  private readonly logger = new Logger(OutboxProcessor.name);

  constructor(
    private readonly outboxRepository: OutboxRepository,
    private readonly kafkaProducer: KafkaProducerService,
  ) {
    super();
  }

  async process(_job: Job<any, any, string>): Promise<void> {
    this.logger.debug('Processing outbox events polling job');

    try {
      const unpublishedEvents = await this.outboxRepository.findUnpublished(100);

      if (unpublishedEvents.length === 0) {
        this.logger.debug('No unpublished events found');
        return;
      }

      this.logger.log(`Found ${unpublishedEvents.length} unpublished events to process`);

      await Promise.allSettled(unpublishedEvents.map((event) => this.publishEvent(event)));
    } catch (error) {
      this.logger.error('Error processing outbox events', error);
      throw error;
    }
  }

  /**
   * Publish a single event to Kafka
   */
  private async publishEvent(event: DomainEventOutboxOrmEntity): Promise<void> {
    try {
      this.logger.log(`Publishing event ${event.eventType} for aggregate ${event.aggregateId}`);

      // Publish to Kafka topic named after event type
      await this.kafkaProducer.send(`domain-events.${event.eventType}`, {
        key: event.aggregateId,
        value: JSON.stringify({
          eventId: event.eventId,
          aggregateId: event.aggregateId,
          eventType: event.eventType,
          payload: event.payload,
          aggregateVersion: event.aggregateVersion,
          causedBy: event.causedBy,
          occurredOn: event.occurredOn,
        }),
      });

      await this.outboxRepository.markAsPublished(event.id);

      this.logger.log(`Event ${event.id} published successfully to Kafka`);
    } catch (error) {
      this.logger.error(
        `Failed to publish event ${event.id}: ${error instanceof Error ? error.message : String(error)}`,
      );

      await this.outboxRepository.recordFailure(
        event.id,
        error instanceof Error ? error.message : String(error),
      );

      // Re-throw to trigger BullMQ retry mechanism
      throw error;
    }
  }
}
