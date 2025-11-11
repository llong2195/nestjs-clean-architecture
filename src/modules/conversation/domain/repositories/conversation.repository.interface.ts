import { Conversation } from '../aggregates/conversation.aggregate';
import { Message } from '../entities/message.entity';
import { ConversationType } from '../value-objects/conversation-type.vo';

/**
 * Conversation Repository Interface (Port)
 *
 * Defines the contract for conversation persistence operations.
 * Infrastructure layer will implement this interface.
 */
export interface IConversationRepository {
  /**
   * Save a conversation (create or update)
   */
  save(conversation: Conversation): Promise<Conversation>;

  /**
   * Find conversation by ID
   */
  findById(id: string): Promise<Conversation | null>;

  /**
   * Find all conversations for a user
   */
  findByUserId(userId: string): Promise<Conversation[]>;

  /**
   * Find direct conversation between two users
   */
  findDirectConversation(userId1: string, userId2: string): Promise<Conversation | null>;

  /**
   * Find conversations by type
   */
  findByType(type: ConversationType): Promise<Conversation[]>;

  /**
   * Save a message within a conversation
   */
  saveMessage(message: Message): Promise<Message>;

  /**
   * Find messages in a conversation with pagination
   */
  findMessages(conversationId: string, limit?: number, offset?: number): Promise<Message[]>;

  /**
   * Mark message as read
   */
  markMessageAsRead(messageId: string): Promise<void>;

  /**
   * Delete a conversation
   */
  delete(id: string): Promise<void>;
}
