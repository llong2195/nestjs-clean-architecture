/**
 * Message Delivered Event
 *
 * Domain event emitted when a message is successfully delivered to a recipient.
 * This triggers status updates and notifications to the sender.
 */
export class MessageDeliveredEvent {
  constructor(
    public readonly messageId: string,
    public readonly conversationId: string,
    public readonly recipientUserId: string,
    public readonly deliveredAt: Date,
  ) {}
}
