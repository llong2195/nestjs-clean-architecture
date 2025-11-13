import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * Domain Event Outbox ORM Entity
 *
 * Stores domain events temporarily before they are published to message brokers.
 * Implements the Transactional Outbox pattern for reliable event publishing.
 *
 * Events are saved in the same database transaction as aggregate changes,
 * then polled by a background worker and published to Kafka/other brokers.
 */
@Entity({ name: 'domain_event_outbox' })
export class DomainEventOutboxOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'event_id', type: 'uuid' })
  @Index('idx_outbox_event_id')
  eventId!: string;

  @Column({ name: 'aggregate_id', type: 'uuid' })
  @Index('idx_outbox_aggregate_id')
  aggregateId!: string;

  @Column({ name: 'event_type', type: 'varchar', length: 255 })
  @Index('idx_outbox_event_type')
  eventType!: string;

  @Column({ name: 'payload', type: 'jsonb' })
  payload!: Record<string, unknown>;

  @Column({ name: 'aggregate_version', type: 'int', nullable: true })
  aggregateVersion!: number | null;

  @Column({ name: 'caused_by', type: 'varchar', length: 255, nullable: true })
  causedBy!: string | null;

  @Column({ name: 'occurred_on', type: 'timestamp' })
  occurredOn!: Date;

  @Column({ name: 'published', type: 'boolean', default: false })
  @Index('idx_outbox_published')
  published!: boolean;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt!: Date | null;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount!: number;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
