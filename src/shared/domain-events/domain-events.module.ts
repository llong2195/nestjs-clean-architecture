import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { DomainEventPublisher } from './domain-event-publisher.service';
import { DomainEventOutboxOrmEntity } from './outbox/outbox.orm-entity';
import { OutboxRepository } from './outbox/outbox.repository';
import { OutboxProcessor } from './outbox/outbox.processor';

/**
 * Domain Events Module
 *
 * Provides infrastructure for publishing domain events with Transactional Outbox pattern.
 * Marked as @Global() so DomainEventPublisher is available everywhere.
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([DomainEventOutboxOrmEntity]),
    BullModule.registerQueue({
      name: 'domain-events-outbox',
    }),
  ],
  providers: [DomainEventPublisher, OutboxRepository, OutboxProcessor],
  exports: [DomainEventPublisher, OutboxRepository],
})
export class DomainEventsModule {}
