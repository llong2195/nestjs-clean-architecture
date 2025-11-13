import { Job } from 'bullmq';
import { DataSource, Repository } from 'typeorm';
import { DomainEventOutboxOrmEntity } from '../../../src/shared/domain-events/outbox/outbox.orm-entity';
import { OutboxProcessor } from '../../../src/shared/domain-events/outbox/outbox.processor';
import { OutboxRepository } from '../../../src/shared/domain-events/outbox/outbox.repository';
import { KafkaProducerService } from '../../../src/shared/messaging/kafka/kafka-producer.service';
import { DatabaseTestHelper } from '../../helpers/database-test.helper';

describe('OutboxProcessor Integration Tests', () => {
  let dataSource: DataSource;
  let ormRepository: Repository<DomainEventOutboxOrmEntity>;
  let outboxRepository: OutboxRepository;
  let kafkaProducer: jest.Mocked<KafkaProducerService>;
  let outboxProcessor: OutboxProcessor;

  beforeAll(async () => {
    dataSource = await DatabaseTestHelper.setupDatabase();
    ormRepository = dataSource.getRepository(DomainEventOutboxOrmEntity);
    outboxRepository = new OutboxRepository(ormRepository);

    // Mock Kafka producer
    kafkaProducer = {
      send: jest.fn().mockResolvedValue(undefined),
    } as any;

    outboxProcessor = new OutboxProcessor(outboxRepository, kafkaProducer);
  }, 60000);

  afterAll(async () => {
    await DatabaseTestHelper.teardownDatabase();
  });

  beforeEach(async () => {
    await DatabaseTestHelper.cleanDatabase();
    jest.clearAllMocks();
  });

  describe('process', () => {
    it('should process unpublished events and mark them as published', async () => {
      // Create unpublished events
      const event1 = await outboxRepository.save({
        eventId: 'evt-1',
        aggregateId: 'agg-1',
        aggregateType: 'Post',
        eventType: 'PostPublishedEvent',
        payload: { postId: 'post-1' },
        aggregateVersion: 1,
        occurredOn: new Date(),
      });

      const event2 = await outboxRepository.save({
        eventId: 'evt-2',
        aggregateId: 'agg-2',
        aggregateType: 'User',
        eventType: 'UserCreatedEvent',
        payload: { userId: 'user-1' },
        aggregateVersion: 1,
        occurredOn: new Date(),
      });

      // Create a mock job (processor doesn't use it, but BullMQ requires it)
      const mockJob = {} as Job;

      await outboxProcessor.process(mockJob);

      // Verify Kafka producer was called for both events
      expect(kafkaProducer.send.bind(kafkaProducer)).toHaveBeenCalledTimes(2);
      expect(kafkaProducer.send.bind(kafkaProducer)).toHaveBeenCalledWith(
        'domain-events.PostPublishedEvent',
        expect.objectContaining({
          key: 'agg-1',
          value: expect.stringContaining('PostPublishedEvent'),
        }),
      );
      expect(kafkaProducer.send.bind(kafkaProducer)).toHaveBeenCalledWith(
        'domain-events.UserCreatedEvent',
        expect.objectContaining({
          key: 'agg-2',
          value: expect.stringContaining('UserCreatedEvent'),
        }),
      );

      // Verify events are marked as published
      const updatedEvent1 = await ormRepository.findOne({
        where: { id: event1.id },
      });
      const updatedEvent2 = await ormRepository.findOne({
        where: { id: event2.id },
      });

      expect(updatedEvent1?.publishedAt).toBeDefined();
      expect(updatedEvent2?.publishedAt).toBeDefined();
    });

    it('should do nothing when no unpublished events exist', async () => {
      const mockJob = {} as Job;

      await outboxProcessor.process(mockJob);

      expect(kafkaProducer.send.bind(kafkaProducer)).not.toHaveBeenCalled();
    });

    it('should record failure when Kafka publish fails', async () => {
      // Create unpublished event
      const event = await outboxRepository.save({
        eventId: 'evt-fail',
        aggregateId: 'agg-fail',
        aggregateType: 'Post',
        eventType: 'PostPublishedEvent',
        payload: { postId: 'post-1' },
        aggregateVersion: 1,
        occurredOn: new Date(),
      });

      // Mock Kafka failure
      kafkaProducer.send.mockRejectedValueOnce(new Error('Kafka connection timeout'));

      const mockJob = {} as Job;

      // Process should throw (to trigger BullMQ retry)
      await expect(outboxProcessor.process(mockJob)).rejects.toThrow();

      // Verify failure was recorded
      const failedEvent = await ormRepository.findOne({
        where: { id: event.id },
      });

      expect(failedEvent?.retryCount).toBe(1);
      expect(failedEvent?.lastError).toContain('Kafka connection timeout');
      expect(failedEvent?.publishedAt).toBeNull();
    });

    it('should handle mixed success and failure scenarios', async () => {
      // Create two events
      const successEvent = await outboxRepository.save({
        eventId: 'evt-success',
        aggregateId: 'agg-success',
        aggregateType: 'Post',
        eventType: 'PostPublishedEvent',
        payload: { postId: 'post-1' },
        aggregateVersion: 1,
        occurredOn: new Date(),
      });

      const failEvent = await outboxRepository.save({
        eventId: 'evt-fail',
        aggregateId: 'agg-fail',
        aggregateType: 'User',
        eventType: 'UserCreatedEvent',
        payload: { userId: 'user-1' },
        aggregateVersion: 1,
        occurredOn: new Date(),
      });

      // Mock: first call succeeds, second fails
      kafkaProducer.send
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Network error'));

      const mockJob = {} as Job;

      // Process will complete but with some failures
      await expect(outboxProcessor.process(mockJob)).rejects.toThrow();

      // Verify success event was published
      const successResult = await ormRepository.findOne({
        where: { id: successEvent.id },
      });
      expect(successResult?.publishedAt).toBeDefined();

      // Verify fail event recorded failure
      const failResult = await ormRepository.findOne({
        where: { id: failEvent.id },
      });
      expect(failResult?.publishedAt).toBeNull();
      expect(failResult?.retryCount).toBe(1);
    });

    it('should process up to 100 events per job', async () => {
      // Create 150 unpublished events
      const events = [];
      for (let i = 1; i <= 150; i++) {
        events.push({
          eventId: `evt-${i}`,
          aggregateId: `agg-${i}`,
          aggregateType: 'Post',
          eventType: 'PostPublishedEvent',
          payload: { postId: `post-${i}` },
          aggregateVersion: 1,
          occurredOn: new Date(),
        });
      }

      // Save all events
      for (const eventData of events) {
        await outboxRepository.save(eventData);
      }

      const mockJob = {} as Job;

      await outboxProcessor.process(mockJob);

      // Should only process 100 events (limit in findUnpublished)
      expect(kafkaProducer.send.bind(kafkaProducer)).toHaveBeenCalledTimes(100);

      // Verify 100 are published, 50 are still unpublished
      const remainingUnpublished = await outboxRepository.findUnpublished(100);
      expect(remainingUnpublished.length).toBe(50);
    });

    it('should include all event metadata in Kafka message', async () => {
      const occurredOn = new Date('2025-01-01T12:00:00Z');

      const _event = await outboxRepository.save({
        eventId: 'evt-metadata',
        aggregateId: 'agg-metadata',
        aggregateType: 'Post',
        eventType: 'PostPublishedEvent',
        payload: { postId: 'post-1', title: 'Test Post' },
        aggregateVersion: 5,
        causedBy: 'user-123',
        occurredOn,
      });

      const mockJob = {} as Job;

      await outboxProcessor.process(mockJob);

      expect(kafkaProducer.send.bind(kafkaProducer)).toHaveBeenCalledWith(
        'domain-events.PostPublishedEvent',
        {
          key: 'agg-metadata',
          value: expect.any(String),
        },
      );

      // Parse the JSON value to verify contents
      const callArgs = kafkaProducer.send.mock.calls[0];
      const messageValue = JSON.parse(callArgs[1].value);

      expect(messageValue).toMatchObject({
        eventId: 'evt-metadata',
        aggregateId: 'agg-metadata',
        eventType: 'PostPublishedEvent',
        payload: { postId: 'post-1', title: 'Test Post' },
        aggregateVersion: 5,
        causedBy: 'user-123',
        occurredOn: occurredOn.toISOString(),
      });
    });
  });

  describe('retry mechanism', () => {
    it('should increment retry count on failure', async () => {
      const event = await outboxRepository.save({
        eventId: 'evt-retry',
        aggregateId: 'agg-retry',
        aggregateType: 'Post',
        eventType: 'PostPublishedEvent',
        payload: { postId: 'post-1' },
        aggregateVersion: 1,
        occurredOn: new Date(),
      });

      kafkaProducer.send.mockRejectedValue(new Error('Temporary failure'));

      const mockJob = {} as Job;

      // First attempt
      await expect(outboxProcessor.process(mockJob)).rejects.toThrow();

      let failedEvent = await ormRepository.findOne({
        where: { id: event.id },
      });
      expect(failedEvent?.retryCount).toBe(1);

      // Second attempt (still failing)
      await expect(outboxProcessor.process(mockJob)).rejects.toThrow();

      failedEvent = await ormRepository.findOne({ where: { id: event.id } });
      expect(failedEvent?.retryCount).toBe(2);
    });

    it('should eventually succeed after retries', async () => {
      const event = await outboxRepository.save({
        eventId: 'evt-eventual-success',
        aggregateId: 'agg-eventual',
        aggregateType: 'Post',
        eventType: 'PostPublishedEvent',
        payload: { postId: 'post-1' },
        aggregateVersion: 1,
        occurredOn: new Date(),
      });

      // Fail twice, then succeed
      kafkaProducer.send
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce(undefined);

      const mockJob = {} as Job;

      // First two attempts fail
      await expect(outboxProcessor.process(mockJob)).rejects.toThrow('Fail 1');
      await expect(outboxProcessor.process(mockJob)).rejects.toThrow('Fail 2');

      // Third attempt succeeds
      await outboxProcessor.process(mockJob);

      const successEvent = await ormRepository.findOne({
        where: { id: event.id },
      });
      expect(successEvent?.publishedAt).toBeDefined();
      expect(successEvent?.retryCount).toBe(2); // Failed twice before success
    });
  });
});
