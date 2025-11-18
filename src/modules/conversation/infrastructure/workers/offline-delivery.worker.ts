import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { OfflineDeliveryJobData } from '../queues/offline-delivery.queue';

/**
 * Offline Delivery Worker
 *
 * Processes offline message delivery with exponential backoff.
 * Retries failed deliveries with increasing delays: 2s, 4s, 8s.
 *
 * Strategy:
 * 1. Check if recipient is now online
 * 2. If online, emit WebSocket event to deliver message
 * 3. If offline, retry with exponential backoff (max 3 attempts)
 */
@Processor('offline-delivery-queue', {
  concurrency: 5,
  limiter: {
    max: 100,
    duration: 1000, // 100 jobs per second
  },
})
export class OfflineDeliveryWorker extends WorkerHost {
  private readonly logger = new Logger(OfflineDeliveryWorker.name);

  /**
   * Process offline delivery job
   * Required signature from WorkerHost - must return Promise even without await
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async process(job: Job<OfflineDeliveryJobData>): Promise<void> {
    const { messageId, recipientUserId } = job.data;

    this.logger.log(
      `Processing offline delivery job ${job.id} for message ${messageId} to user ${recipientUserId} (attempt ${job.attemptsMade + 1})`,
    );

    // Check if user is now online
    const isOnline = this.checkUserOnline(recipientUserId);

    if (isOnline) {
      // User is online - deliver immediately
      this.deliverMessageViaWebSocket(job.data);
      this.logger.log(`Message ${messageId} delivered successfully to user ${recipientUserId}`);
      return;
    }

    // User still offline - retry with exponential backoff
    const delay = this.calculateBackoffDelay(job.attemptsMade);
    this.logger.debug(
      `User ${recipientUserId} still offline. Retrying in ${delay}ms (attempt ${job.attemptsMade + 1})`,
    );

    // If max attempts reached, message will be delivered when user next connects
    if (job.attemptsMade >= 2) {
      this.logger.warn(
        `Max retry attempts reached for message ${messageId}. Message will be delivered on next connection.`,
      );
      return; // Don't throw - mark as completed
    }

    throw new Error('User offline - retry required');
  }

  /**
   * TODO: Implement actual user online check using Redis SET
   * This should check if the user has an active WebSocket connection
   *
   * @param _userId The user ID to check
   * @returns Promise resolving to true if user is online
   */
  private checkUserOnline(_userId: string): boolean {
    // Placeholder: In production, check Redis SET for active connections
    // Example: return await this.redis.sismember('online_users', userId);
    return false; // Always return false to trigger retry mechanism
  }

  /**
   * TODO: Implement actual WebSocket delivery using Socket.IO server
   * This should emit a 'message:received' event to the user's socket
   *
   * @param _data The message data to deliver
   */
  private deliverMessageViaWebSocket(_data: OfflineDeliveryJobData): void {
    // Placeholder: In production, get Socket.IO server instance and emit
    // Example: this.socketServer.to(`user:${data.recipientUserId}`).emit('message:received', data);
    this.logger.log('Placeholder: Would deliver message via WebSocket');
  }

  /**
   * Calculate exponential backoff delay
   * Delays: 2s, 4s, 8s
   */
  private calculateBackoffDelay(attemptsMade: number): number {
    const baseDelay = 2000; // 2 seconds
    return baseDelay * Math.pow(2, attemptsMade);
  }
}
