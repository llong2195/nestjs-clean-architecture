/**
 * Offline Delivery Job Data Interface
 *
 * Represents a message that needs to be delivered to an offline user.
 */
export interface OfflineDeliveryJobData {
  messageId: string;
  conversationId: string;
  recipientUserId: string;
  senderId: string;
  content: string;
  createdAt: Date;
}

/**
 * Offline Delivery Queue Name
 */
export const OFFLINE_DELIVERY_QUEUE = 'offline-delivery-queue';
