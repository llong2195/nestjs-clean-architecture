import { BullRootModuleOptions } from '@nestjs/bullmq';
import { AppConfigService } from '../../config/config.service';

/**
 * BullMQ Configuration Factory
 *
 * Provides Redis connection configuration for BullMQ job queues
 */
export const createBullMQConfig = (configService: AppConfigService): BullRootModuleOptions => ({
  connection: {
    host: configService.bullRedisHost,
    port: configService.bullRedisPort,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
