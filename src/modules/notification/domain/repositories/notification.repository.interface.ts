import { Notification } from '../entities/notification.entity';

/**
 * Notification Repository Interface (Port)
 *
 * Defines the contract for notification persistence operations.
 * This interface is part of the domain layer and must be
 * implemented by the infrastructure layer.
 */
export interface INotificationRepository {
  /**
   * Save a notification to the database
   */
  save(notification: Notification): Promise<Notification>;

  /**
   * Find a notification by ID
   */
  findById(id: string): Promise<Notification | null>;

  /**
   * Find all notifications for a specific user
   */
  findByUserId(userId: string, limit?: number): Promise<Notification[]>;

  /**
   * Find pending notifications (not yet sent)
   */
  findPending(limit?: number): Promise<Notification[]>;

  /**
   * Delete a notification
   */
  delete(id: string): Promise<void>;

  /**
   * Mark notification as sent
   */
  markAsSent(id: string): Promise<Notification>;

  /**
   * Mark notification as failed
   */
  markAsFailed(id: string, errorMessage: string): Promise<Notification>;
}
