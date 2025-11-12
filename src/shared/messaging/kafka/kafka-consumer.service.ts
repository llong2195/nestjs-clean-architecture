import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Consumer, Kafka, EachMessagePayload } from 'kafkajs';
import { AppConfigService } from '../../config/config.service';
import { createKafkaClient } from './kafka.config';

export type MessageHandler = (payload: EachMessagePayload) => Promise<void>;

/**
 * Kafka Consumer Service
 *
 * Subscribes to Kafka topics and processes messages
 */
@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private readonly kafka: Kafka;
  private consumer: Consumer;
  private readonly handlers = new Map<string, MessageHandler>();

  constructor(private readonly configService: AppConfigService) {
    this.kafka = createKafkaClient(configService);
    this.consumer = this.kafka.consumer({
      groupId: 'clean-architecture-consumer-group',
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.consumer.connect();
      this.logger.log('Kafka consumer connected successfully');

      // Start consuming if handlers are registered
      if (this.handlers.size > 0) {
        await this.startConsuming();
      }
    } catch (error) {
      this.logger.error('Failed to connect Kafka consumer', error);
      // Don't throw - allow app to start even if Kafka is unavailable
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.consumer.disconnect();
      this.logger.log('Kafka consumer disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting Kafka consumer', error);
    }
  }

  /**
   * Register a message handler for a specific topic
   */
  async subscribe(topic: string, handler: MessageHandler): Promise<void> {
    this.handlers.set(topic, handler);

    try {
      await this.consumer.subscribe({ topic, fromBeginning: false });
      this.logger.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to subscribe to topic ${topic}`, error);
      throw error;
    }
  }

  /**
   * Start consuming messages
   */
  private async startConsuming(): Promise<void> {
    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        const { topic, message } = payload;

        try {
          this.logger.debug(`Received message from topic ${topic}: ${message.value?.toString()}`);

          const handler = this.handlers.get(topic);

          if (handler) {
            await handler(payload);
            this.logger.debug(`Message processed successfully from topic ${topic}`);
          } else {
            this.logger.warn(`No handler registered for topic ${topic}`);
          }
        } catch (error) {
          this.logger.error(
            `Error processing message from topic ${topic}`,
            error instanceof Error ? error.stack : String(error),
          );
          // Don't throw - let consumer continue processing other messages
        }
      },
    });

    this.logger.log('Kafka consumer started processing messages');
  }
}
