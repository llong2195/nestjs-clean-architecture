import { v7 as uuid } from 'uuid';

/**
 * Message Domain Entity
 *
 * Represents a single message within a conversation.
 * Pure domain entity - no framework dependencies.
 */
export class Message {
  private constructor(
    public readonly id: string,
    public readonly conversationId: string,
    public readonly senderId: string,
    private _content: string,
    private _isDelivered: boolean,
    private _isRead: boolean,
    private _isEdited: boolean,
    public readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  /**
   * Factory method to create a new message
   */
  static create(conversationId: string, senderId: string, content: string): Message {
    const now = new Date();
    return new Message(uuid(), conversationId, senderId, content, false, false, false, now, now);
  }

  /**
   * Reconstitute message from persistence
   */
  static from(
    id: string,
    conversationId: string,
    senderId: string,
    content: string,
    isDelivered: boolean,
    isRead: boolean,
    isEdited: boolean,
    createdAt: Date,
    updatedAt: Date,
  ): Message {
    return new Message(
      id,
      conversationId,
      senderId,
      content,
      isDelivered,
      isRead,
      isEdited,
      createdAt,
      updatedAt,
    );
  }

  // Getters
  get content(): string {
    return this._content;
  }

  get isDelivered(): boolean {
    return this._isDelivered;
  }

  get isRead(): boolean {
    return this._isRead;
  }

  get isEdited(): boolean {
    return this._isEdited;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Mark message as delivered
   */
  markAsDelivered(): void {
    this._isDelivered = true;
    this._updatedAt = new Date();
  }

  /**
   * Mark message as read
   */
  markAsRead(): void {
    this._isRead = true;
    this._updatedAt = new Date();
  }

  /**
   * Edit message content
   */
  edit(newContent: string): void {
    if (newContent.trim().length === 0) {
      throw new Error('Message content cannot be empty');
    }
    this._content = newContent;
    this._isEdited = true;
    this._updatedAt = new Date();
  }

  /**
   * Check if message can be edited by user
   */
  canBeEditedBy(userId: string): boolean {
    return this.senderId === userId;
  }

  /**
   * Check if message was recently sent (within edit window)
   */
  canBeEdited(): boolean {
    const editWindow = 15 * 60 * 1000; // 15 minutes in milliseconds
    const timeSinceSent = Date.now() - this.createdAt.getTime();
    return timeSinceSent <= editWindow;
  }
}
