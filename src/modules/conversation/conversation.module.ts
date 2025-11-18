import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ConversationParticipantOrmEntity } from './infrastructure/persistence/conversation-participant.orm-entity';
import { ConversationOrmEntity } from './infrastructure/persistence/conversation.orm-entity';
import { MessageOrmEntity } from './infrastructure/persistence/message.orm-entity';
import { ConversationGateway } from './interface/websocket/conversation.gateway';
import { WebSocketModule } from '../../shared/websocket/websocket.module';
import { CacheModule } from '../../shared/cache/cache.module';
import { LoggerModule } from '../../shared/logger/logger.module';
import { ConversationRepository } from './infrastructure/persistence/conversation.repository';
import { ConversationMapper } from './infrastructure/mappers/conversation.mapper';
import { MessageMapper } from './infrastructure/mappers/message.mapper';
import { TypingIndicatorCache } from './infrastructure/cache/typing-indicator.cache';
import { ConversationCacheService } from './infrastructure/cache/conversation-cache.service';
import { ConversationController } from './interface/http/controllers/conversation.controller';
import { CreateConversationUseCase } from './application/use-cases/create-conversation.use-case';
import { SendMessageUseCase } from './application/use-cases/send-message.use-case';
import { GetMessageHistoryUseCase } from './application/use-cases/get-message-history.use-case';
import { AddParticipantUseCase } from './application/use-cases/add-participant.use-case';
import { MarkMessagesAsReadUseCase } from './application/use-cases/mark-messages-as-read.use-case';
import { GetConversationListUseCase } from './application/use-cases/get-conversation-list.use-case';
import { GetConversationUseCase } from './application/use-cases/get-conversation.use-case';
import { StartTypingUseCase } from './application/use-cases/start-typing.use-case';
import { SearchMessagesUseCase } from './application/use-cases/search-messages.use-case';
import { OFFLINE_DELIVERY_QUEUE } from './infrastructure/queues/offline-delivery.queue';
import { OfflineDeliveryWorker } from './infrastructure/workers/offline-delivery.worker';

/**
 * Conversation Module
 *
 * Provides real-time conversation and messaging functionality including:
 * - Direct messaging between two users (DIRECT conversations)
 * - Group conversations with multiple participants (GROUP conversations)
 * - Real-time message delivery via WebSocket with JWT authentication
 * - Typing indicators and read receipts
 * - Message status tracking (isDelivered, isRead)
 * - Full-text message search
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConversationOrmEntity,
      MessageOrmEntity,
      ConversationParticipantOrmEntity,
    ]),
    BullModule.registerQueue({
      name: OFFLINE_DELIVERY_QUEUE,
    }),
    WebSocketModule,
    CacheModule,
    LoggerModule,
  ],
  providers: [
    // WebSocket gateway
    ConversationGateway,
    // Repository implementation
    ConversationRepository,
    // Domain <-> ORM mappers
    ConversationMapper,
    MessageMapper,
    // Cache services
    TypingIndicatorCache,
    ConversationCacheService,
    // Use cases
    CreateConversationUseCase,
    SendMessageUseCase,
    GetMessageHistoryUseCase,
    AddParticipantUseCase,
    MarkMessagesAsReadUseCase,
    GetConversationListUseCase,
    GetConversationUseCase,
    StartTypingUseCase,
    SearchMessagesUseCase,
    // Background workers
    OfflineDeliveryWorker,
  ],
  controllers: [ConversationController],
  exports: [ConversationGateway, ConversationRepository],
})
export class ConversationModule {}
