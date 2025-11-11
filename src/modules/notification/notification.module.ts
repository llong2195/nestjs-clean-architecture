import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationOrmEntity } from './infrastructure/persistence/notification.orm-entity';
import { NotificationRepository } from './infrastructure/persistence/notification.repository';
import { SendNotificationUseCase } from './application/use-cases/send-notification.use-case';
import { NotificationGateway } from './interface/websocket/notification.gateway';

/**
 * Notification Module
 *
 * Provides notification functionality including:
 * - Creating and storing notifications
 * - Real-time delivery via WebSocket
 * - Background processing for email/push notifications
 */
@Module({
  imports: [TypeOrmModule.forFeature([NotificationOrmEntity])],
  providers: [
    // Repository
    {
      provide: 'INotificationRepository',
      useClass: NotificationRepository,
    },
    // Use cases
    SendNotificationUseCase,
    // WebSocket gateway
    NotificationGateway,
  ],
  exports: [SendNotificationUseCase, NotificationGateway],
})
export class NotificationModule {}
