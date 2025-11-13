import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppConfigService } from '../../config/config.service';
import { createBullMQConfig } from './bullmq.config';
import { ConfigModule } from '../../config/config.module';

/**
 * BullMQ Module
 *
 * Configures BullMQ for job queue processing with Redis
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService) => createBullMQConfig(configService),
    }),
  ],
  exports: [BullModule],
})
export class BullMQModule {}
