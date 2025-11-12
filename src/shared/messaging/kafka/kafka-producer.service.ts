import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Producer, Kafka } from 'kafkajs';
import { AppConfigService } from '../../config/config.service';
import { createKafkaClient } from './kafka.config';

/**
 * Kafka Producer Service
 *
 * Publishes messages to Kafka topics
 */
@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private readonly kafka: Kafka;
  private producer: Producer;

  constructor(private readonly configService: AppConfigService) {
    this.kafka = createKafkaClient(configService);
    this.producer = this.kafka.producer();
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.producer.connect();
      this.logger.log('Kafka producer connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect Kafka producer', error);
      // Don't throw - allow app to start even if Kafka is unavailable
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.producer.disconnect();
      this.logger.log('Kafka producer disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting Kafka producer', error);
    }
  }

  /**
   * Send a message to a Kafka topic
   */
  async send(topic: string, message: { key?: string; value: string }): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: message.key,
            value: message.value,
          },
        ],
      });

      this.logger.debug(`Message sent to topic ${topic}`);
    } catch (error) {
      this.logger.error(
        `Failed to send message to topic ${topic}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Send batch of messages to a Kafka topic
   */
  async sendBatch(topic: string, messages: Array<{ key?: string; value: string }>): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: messages.map((msg) => ({
          key: msg.key,
          value: msg.value,
        })),
      });

      this.logger.debug(`Batch of ${messages.length} messages sent to topic ${topic}`);
    } catch (error) {
      this.logger.error(
        `Failed to send batch to topic ${topic}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
