/**
 * Message Sent Domain Event
 *
 * Pure domain event (no framework dependencies) triggered when a new message
 * is successfully sent to a conversation.
 *
 * Used for:
 * - WebSocket notification to online participants
 * - Offline message queue for unavailable users
 * - Updating conversation last_message timestamp
 * - Incrementing unread counts
 */
export class MessageSentEvent {
  constructor(
    public readonly messageId: string,
    public readonly conversationId: string,
    public readonly senderId: string,
    public readonly content: string,
    public readonly createdAt: Date,
    public readonly participantIds: string[],
  ) {}

  /**
   * Get recipient IDs (all participants except sender)
   */
  getRecipientIds(): string[] {
    return this.participantIds.filter((id) => id !== this.senderId);
  }
}
