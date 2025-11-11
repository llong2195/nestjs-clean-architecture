import { v7 as uuid } from 'uuid';

/**
 * Notification Domain Entity
 *
 * Represents a notification sent to a user through various channels
 * (email, push, WebSocket). This is a pure domain entity without
 * any framework dependencies.
 *
 * @domain
 */
export class Notification {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: string,
    public readonly title: string,
    public readonly message: string,
    public readonly status: 'pending' | 'sent' | 'failed',
    public readonly sentAt: Date | null,
    public readonly createdAt: Date,
    public readonly errorMessage?: string,
  ) {}

  /**
   * Factory method to create a new notification
   */
  static create(userId: string, type: string, title: string, message: string): Notification {
    return new Notification(uuid(), userId, type, title, message, 'pending', null, new Date());
  }

  /**
   * Mark notification as successfully sent
   */
  markAsSent(): Notification {
    return new Notification(
      this.id,
      this.userId,
      this.type,
      this.title,
      this.message,
      'sent',
      new Date(),
      this.createdAt,
    );
  }

  /**
   * Mark notification as failed with error message
   */
  markAsFailed(errorMessage: string): Notification {
    return new Notification(
      this.id,
      this.userId,
      this.type,
      this.title,
      this.message,
      'failed',
      null,
      this.createdAt,
      errorMessage,
    );
  }

  /**
   * Check if notification can be retried
   */
  canRetry(): boolean {
    return this.status === 'failed';
  }
}
