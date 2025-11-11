import { Inject, Injectable } from '@nestjs/common';
import { Notification } from '../../domain/entities/notification.entity';
import type { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { NotificationType } from '../../domain/value-objects/notification-type.vo';

/**
 * Send Notification Use Case
 *
 * Handles the business logic for creating and sending notifications
 * to users through various channels (email, push, WebSocket).
 */
@Injectable()
export class SendNotificationUseCase {
  constructor(
    @Inject('INotificationRepository')
    private readonly notificationRepository: INotificationRepository,
  ) {}

  /**
   * Execute the use case
   */
  async execute(dto: SendNotificationDto): Promise<Notification> {
    // Create notification entity
    const notification = Notification.create(dto.userId, dto.type, dto.title, dto.message);

    // Save to database
    const savedNotification = await this.notificationRepository.save(notification);

    // TODO: In a real implementation, this would trigger the actual sending
    // via email service, push notification service, or WebSocket gateway
    // For now, we just save it to the database and mark it as pending

    return savedNotification;
  }
}

/**
 * DTO for sending a notification
 */
export interface SendNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
}
