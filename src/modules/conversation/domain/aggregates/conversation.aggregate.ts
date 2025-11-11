import { v7 as uuid } from 'uuid';
import { ConversationType } from '../value-objects/conversation-type.vo';
import { Message } from '../entities/message.entity';

/**
 * Conversation Aggregate Root
 *
 * Manages conversation lifecycle and ensures business rules.
 * Controls messages within the conversation boundary.
 */
export class Conversation {
  private _messages: Message[] = [];
  private _participantIds: Set<string>;

  private constructor(
    public readonly id: string,
    private _name: string | null,
    private _type: ConversationType,
    public readonly createdBy: string,
    public readonly createdAt: Date,
    private _updatedAt: Date,
    private _isActive: boolean,
    participantIds: string[],
  ) {
    this._participantIds = new Set(participantIds);
  }

  /**
   * Factory method to create a new conversation
   */
  static create(
    name: string | null,
    type: ConversationType,
    createdBy: string,
    participantIds: string[],
  ): Conversation {
    // Validation
    if (type === ConversationType.DIRECT && participantIds.length !== 2) {
      throw new Error('Direct conversations must have exactly 2 participants');
    }

    if (type === ConversationType.GROUP && participantIds.length < 2) {
      throw new Error('Group conversations must have at least 2 participants');
    }

    if (!participantIds.includes(createdBy)) {
      participantIds.push(createdBy);
    }

    const now = new Date();
    return new Conversation(uuid(), name, type, createdBy, now, now, true, participantIds);
  }

  /**
   * Reconstitute conversation from persistence
   */
  static from(
    id: string,
    name: string | null,
    type: ConversationType,
    createdBy: string,
    createdAt: Date,
    updatedAt: Date,
    isActive: boolean,
    participantIds: string[],
  ): Conversation {
    return new Conversation(
      id,
      name,
      type,
      createdBy,
      createdAt,
      updatedAt,
      isActive,
      participantIds,
    );
  }

  // Getters
  get name(): string | null {
    return this._name;
  }

  get type(): ConversationType {
    return this._type;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get participantIds(): string[] {
    return Array.from(this._participantIds);
  }

  get messages(): Message[] {
    return [...this._messages];
  }

  /**
   * Add a new message to the conversation
   */
  addMessage(senderId: string, content: string): Message {
    if (!this.isActive) {
      throw new Error('Cannot add message to inactive conversation');
    }

    if (!this.isParticipant(senderId)) {
      throw new Error('Only participants can send messages');
    }

    if (content.trim().length === 0) {
      throw new Error('Message content cannot be empty');
    }

    const message = Message.create(this.id, senderId, content);
    this._messages.push(message);
    this._updatedAt = new Date();

    return message;
  }

  /**
   * Add a participant to the conversation
   */
  addParticipant(userId: string, addedBy: string): void {
    if (!this.isParticipant(addedBy)) {
      throw new Error('Only participants can add new members');
    }

    if (this._type === ConversationType.DIRECT) {
      throw new Error('Cannot add participants to direct conversations');
    }

    if (this._participantIds.has(userId)) {
      throw new Error('User is already a participant');
    }

    this._participantIds.add(userId);
    this._updatedAt = new Date();
  }

  /**
   * Remove a participant from the conversation
   */
  removeParticipant(userId: string, removedBy: string): void {
    if (!this.isParticipant(removedBy)) {
      throw new Error('Only participants can remove members');
    }

    if (this._type === ConversationType.DIRECT) {
      throw new Error('Cannot remove participants from direct conversations');
    }

    if (!this._participantIds.has(userId)) {
      throw new Error('User is not a participant');
    }

    if (this._participantIds.size <= 2) {
      throw new Error('Cannot remove participant: conversation must have at least 2 members');
    }

    this._participantIds.delete(userId);
    this._updatedAt = new Date();
  }

  /**
   * Update conversation name
   */
  updateName(newName: string, updatedBy: string): void {
    if (!this.isParticipant(updatedBy)) {
      throw new Error('Only participants can update conversation name');
    }

    if (this._type === ConversationType.DIRECT) {
      throw new Error('Cannot update name of direct conversations');
    }

    this._name = newName;
    this._updatedAt = new Date();
  }

  /**
   * Archive/deactivate the conversation
   */
  archive(archivedBy: string): void {
    if (!this.isParticipant(archivedBy)) {
      throw new Error('Only participants can archive conversation');
    }

    this._isActive = false;
    this._updatedAt = new Date();
  }

  /**
   * Reactivate an archived conversation
   */
  reactivate(reactivatedBy: string): void {
    if (!this.isParticipant(reactivatedBy)) {
      throw new Error('Only participants can reactivate conversation');
    }

    this._isActive = true;
    this._updatedAt = new Date();
  }

  /**
   * Check if user is a participant
   */
  isParticipant(userId: string): boolean {
    return this._participantIds.has(userId);
  }

  /**
   * Get unread message count for a specific user
   */
  getUnreadCount(userId: string): number {
    if (!this.isParticipant(userId)) {
      return 0;
    }

    return this._messages.filter((msg) => msg.senderId !== userId && !msg.isRead).length;
  }
}
