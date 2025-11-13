import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DomainEventOutboxOrmEntity } from './outbox.orm-entity';
import { IDomainEvent } from '../domain-event.interface';

/**
 * Outbox Repository
 *
 * Handles persistence of domain events to the outbox table.
 * Part of the Transactional Outbox pattern implementation.
 */
@Injectable()
export class OutboxRepository {
  constructor(
    @InjectRepository(DomainEventOutboxOrmEntity)
    private readonly repository: Repository<DomainEventOutboxOrmEntity>,
  ) {}

  /**
   * Save a domain event to the outbox
   * Should be called within the same transaction as aggregate save
   */
  async save(event: IDomainEvent): Promise<DomainEventOutboxOrmEntity> {
    const outboxEntry = this.repository.create({
      eventId: event.eventId,
      aggregateId: event.aggregateId,
      eventType: event.eventType,
      payload: event.payload,
      aggregateVersion: event.aggregateVersion ?? null,
      causedBy: event.causedBy ?? null,
      occurredOn: event.occurredOn,
      published: false,
      publishedAt: null,
      retryCount: 0,
      lastError: null,
    });

    return this.repository.save(outboxEntry);
  }

  /**
   * Find unpublished events (for polling worker)
   */
  async findUnpublished(limit: number = 100): Promise<DomainEventOutboxOrmEntity[]> {
    return this.repository.find({
      where: { published: false },
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  /**
   * Mark an event as successfully published
   */
  async markAsPublished(id: string): Promise<void> {
    await this.repository.update(id, {
      published: true,
      publishedAt: new Date(),
    });
  }

  /**
   * Increment retry count and record error
   */
  async recordFailure(id: string, error: string): Promise<void> {
    const outboxEntry = await this.repository.findOne({ where: { id } });

    if (!outboxEntry) {
      return;
    }

    await this.repository.update(id, {
      retryCount: outboxEntry.retryCount + 1,
      lastError: error,
    });
  }

  /**
   * Find events that have failed multiple times (for manual investigation)
   */
  async findFailedEvents(minRetries: number = 3): Promise<DomainEventOutboxOrmEntity[]> {
    return this.repository
      .createQueryBuilder('outbox')
      .where('outbox.published = :published', { published: false })
      .andWhere('outbox.retry_count >= :minRetries', { minRetries })
      .orderBy('outbox.retry_count', 'DESC')
      .getMany();
  }

  /**
   * Delete old published events (cleanup job)
   */
  async deleteOldPublishedEvents(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .where('published = :published', { published: true })
      .andWhere('published_at < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected ?? 0;
  }
}
