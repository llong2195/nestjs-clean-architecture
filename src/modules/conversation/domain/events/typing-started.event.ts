/**
 * Typing Started Domain Event
 *
 * Pure domain event (no framework dependencies) triggered when a user
 * starts typing in a conversation.
 *
 * Used for:
 * - WebSocket broadcast to conversation participants
 * - Redis cache with 3-second TTL (via infrastructure layer)
 * - Real-time typing indicator UI updates
 */
export class TypingStartedEvent {
  constructor(
    public readonly conversationId: string,
    public readonly userId: string,
    public readonly userName: string,
    public readonly timestamp: Date,
  ) {}
}
