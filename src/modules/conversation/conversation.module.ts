import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationParticipantOrmEntity } from './infrastructure/persistence/conversation-participant.orm-entity';
import { ConversationOrmEntity } from './infrastructure/persistence/conversation.orm-entity';
import { MessageOrmEntity } from './infrastructure/persistence/message.orm-entity';
import { ConversationGateway } from './interface/websocket/conversation.gateway';

/**
 * Conversation Module
 *
 * Provides real-time conversation and messaging functionality including:
 * - Direct messaging between two users
 * - Group conversations with multiple participants
 * - Public channels
 * - Real-time message delivery via WebSocket with JWT authentication
 * - Typing indicators and read receipts
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConversationOrmEntity,
      MessageOrmEntity,
      ConversationParticipantOrmEntity,
    ]),
  ],
  providers: [
    // WebSocket gateway
    ConversationGateway,
    // TODO: Add repository implementations when needed
    // TODO: Add use cases for creating conversations, sending messages, etc.
  ],
  exports: [ConversationGateway],
})
export class ConversationModule {}
