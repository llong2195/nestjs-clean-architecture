import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConversationOrmEntity } from './infrastructure/persistence/conversation.orm-entity';
import { MessageOrmEntity } from './infrastructure/persistence/message.orm-entity';
import { ConversationParticipantOrmEntity } from './infrastructure/persistence/conversation-participant.orm-entity';
import { ConversationGateway } from './interface/websocket/conversation.gateway';
import { ConfigModule } from '../../shared/config/config.module';
import { AppConfigService } from '../../shared/config/config.service';

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
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: AppConfigService) => ({
        secret: configService.jwtSecret,
        signOptions: {
          expiresIn: configService.jwtExpiresIn as `${number}${'ms' | 's' | 'm' | 'h' | 'd'}`,
        },
      }),
      inject: [AppConfigService],
    }),
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
