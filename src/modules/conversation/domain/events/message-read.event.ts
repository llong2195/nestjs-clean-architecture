/**
 * Message Read Event
 *
 * Domain event emitted when a user marks messages as read in a conversation.
 * This triggers status updates and read receipts to message senders.
 */
export class MessageReadEvent {
  constructor(
    public readonly conversationId: string,
    public readonly userId: string,
    public readonly messageIds: string[],
    public readonly readAt: Date,
  ) {}
}
