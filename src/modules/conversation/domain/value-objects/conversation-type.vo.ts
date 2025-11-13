/**
 * Conversation Type Value Object
 *
 * Types of conversations supported in the system
 */
export enum ConversationType {
  DIRECT = 'DIRECT', // One-to-one conversation between two users
  GROUP = 'GROUP', // Group conversation with multiple participants
  CHANNEL = 'CHANNEL', // Public channel open to all users
}
