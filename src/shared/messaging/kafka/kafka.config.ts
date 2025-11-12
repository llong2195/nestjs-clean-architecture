import { Kafka, KafkaConfig, logLevel } from 'kafkajs';
import { AppConfigService } from '../../config/config.service';

/**
 * Kafka Configuration Factory
 */
export const createKafkaConfig = (configService: AppConfigService): KafkaConfig => {
  const brokers = configService.kafkaBrokers;

  return {
    clientId: configService.kafkaClientId,
    brokers: brokers.split(',').map((broker) => broker.trim()),
    logLevel: logLevel.INFO,
    retry: {
      initialRetryTime: 100,
      retries: 8,
    },
  };
};

/**
 * Create Kafka client instance
 */
export const createKafkaClient = (configService: AppConfigService): Kafka => {
  const config = createKafkaConfig(configService);
  return new Kafka(config);
};
