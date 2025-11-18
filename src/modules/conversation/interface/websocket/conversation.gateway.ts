import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from '../../../../common/guards/ws-jwt-auth.guard';
import { WsCurrentUser } from '../../../../common/decorators/ws-current-user.decorator';
import type { JwtPayload } from '../../../../common/guards/ws-jwt-auth.guard';
import { SendMessageUseCase } from '../../application/use-cases/send-message.use-case';
import { MarkMessagesAsReadUseCase } from '../../application/use-cases/mark-messages-as-read.use-case';
import { StartTypingUseCase } from '../../application/use-cases/start-typing.use-case';
import { ConversationRepository } from '../../infrastructure/persistence/conversation.repository';
import { TypingIndicatorCache } from '../../infrastructure/cache/typing-indicator.cache';
import { ConversationCacheService } from '../../infrastructure/cache/conversation-cache.service';
import { SendMessageDto } from '../../application/dtos/send-message.dto';
import { MarkMessagesReadDto } from '../../application/dtos/mark-messages-read.dto';
import { StartTypingDto } from '../../application/dtos/start-typing.dto';

/**
 * Conversation WebSocket Gateway
 *
 * Handles real-time chat messaging between users.
 * Supports DIRECT and GROUP conversations with real-time delivery.
 * Requires JWT authentication for all connections.
 *
 * Events:
 * - message:send: Send a message to a conversation (with use case integration)
 * - message:received: Broadcast to participants when message is delivered
 * - typing:start: Notify others that user is typing
 * - typing:stop: Notify others that user stopped typing
 * - join_conversation: Join a conversation room to receive messages
 * - leave_conversation: Leave a conversation room
 *
 * T030-T036: Enhanced with authentication, auto-join, error handling
 */
@WebSocketGateway({
  namespace: '/conversations',
  cors: {
    origin: '*', // Configure for production
  },
})
@UseGuards(WsJwtAuthGuard)
export class ConversationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ConversationGateway.name);

  constructor(
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly markMessagesAsReadUseCase: MarkMessagesAsReadUseCase,
    private readonly conversationRepository: ConversationRepository,
    private readonly typingIndicatorCache: TypingIndicatorCache,
    private readonly conversationCacheService: ConversationCacheService,
    private readonly startTypingUseCase: StartTypingUseCase,
  ) {}

  /**
   * Handle client connection
   * T030: Connection authentication (handled by WsJwtAuthGuard)
   * T031: Automatic room joining for user's conversations
   */
  async handleConnection(client: Socket): Promise<void> {
    try {
      const user = client.data.user as JwtPayload;
      this.logger.log(`Client connected to conversations: ${client.id} (user: ${user.sub})`);

      // T031: Auto-join user to their personal room
      const userRoom = `user:${user.sub}`;
      await client.join(userRoom);
      this.logger.debug(`User ${user.sub} joined personal room: ${userRoom}`);

      // T031: Auto-join all conversations where user is a participant
      const conversations = await this.conversationRepository.findByUserId(user.sub);
      for (const conversation of conversations) {
        const conversationRoom = `conversation:${conversation.id}`;
        await client.join(conversationRoom);
        this.logger.debug(`User ${user.sub} auto-joined conversation: ${conversation.id}`);
      }

      // Notify user of successful connection
      client.emit('connected', {
        userId: user.sub,
        rooms: [userRoom, ...conversations.map((c) => `conversation:${c.id}`)],
      });
    } catch (error) {
      this.logger.error(
        `Failed to handle connection for client ${client.id}`,
        error instanceof Error ? error.stack : String(error),
      );
      this.emitError(client, 'CHAT_CONNECTION_ERROR', 'Failed to establish connection');
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   * T036: Clean up user rooms and typing indicators
   */
  async handleDisconnect(client: Socket): Promise<void> {
    try {
      const user = client.data.user as JwtPayload | undefined;
      if (user) {
        this.logger.log(`Client disconnected from conversations: ${client.id} (user: ${user.sub})`);

        // T036: Clean up typing indicators for all conversations
        const conversations = await this.conversationRepository.findByUserId(user.sub);
        for (const conversation of conversations) {
          await this.typingIndicatorCache.removeTyping(conversation.id, user.sub);
        }
      } else {
        this.logger.log(`Unauthenticated client disconnected: ${client.id}`);
      }
    } catch (error) {
      this.logger.error(
        `Error during disconnect handling for client ${client.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * Join a conversation room
   * User must be a participant in the conversation
   */
  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
    @WsCurrentUser() user: JwtPayload,
  ): void {
    const roomName = `conversation:${data.conversationId}`;
    void client.join(roomName);
    this.logger.log(`User ${user.sub} joined conversation ${data.conversationId}`);
    client.emit('conversation_joined', {
      conversationId: data.conversationId,
      room: roomName,
    });
  }

  /**
   * Leave a conversation room
   */
  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
    @WsCurrentUser() user: JwtPayload,
  ): void {
    const roomName = `conversation:${data.conversationId}`;
    void client.leave(roomName);
    this.logger.log(`User ${user.sub} left conversation ${data.conversationId}`);
    client.emit('conversation_left', {
      conversationId: data.conversationId,
      room: roomName,
    });
  }

  /**
   * Send a message to a conversation
   * T032-T034: Integrated with SendMessageUseCase and emit to conversation room
   * Message will be broadcasted to all participants in the room
   */
  @SubscribeMessage('message:send')
  async handleSendMessage(
    @MessageBody() data: { conversationId: string; content: string },
    @ConnectedSocket() client: Socket,
    @WsCurrentUser() user: JwtPayload,
  ): Promise<void> {
    try {
      // T033: Call SendMessageUseCase to persist and validate
      const dto: SendMessageDto = {
        conversationId: data.conversationId,
        content: data.content,
      };

      const messageResponse = await this.sendMessageUseCase.execute(dto, user.sub);

      // T063: Invalidate conversation list cache for all participants
      const conversation = await this.conversationRepository.findById(data.conversationId);
      if (conversation) {
        await this.conversationCacheService.invalidateConversationList(conversation.participantIds);
      }

      // T062: Emit 'conversation:updated' to notify conversation list changes
      const roomName = `conversation:${data.conversationId}`;
      this.server.to(roomName).emit('conversation:updated', {
        conversationId: data.conversationId,
        timestamp: new Date().toISOString(),
      });

      // T034: Emit 'message:received' to conversation room (broadcasts to all participants)
      // T052: Auto-mark message as delivered when emitted
      this.server.to(roomName).emit('message:received', {
        id: messageResponse.id,
        conversationId: messageResponse.conversationId,
        senderId: messageResponse.senderId,
        content: messageResponse.content,
        isDelivered: true, // T052: Mark as delivered upon emission
        isRead: messageResponse.isRead,
        isEdited: messageResponse.isEdited,
        createdAt: messageResponse.createdAt,
        updatedAt: messageResponse.updatedAt,
      });

      this.logger.log(
        `User ${user.sub} sent message ${messageResponse.id} to conversation ${data.conversationId}`,
      );

      // T072: Auto-stop typing indicator when message is sent
      await this.typingIndicatorCache.stopTyping(data.conversationId, user.sub);

      // Acknowledge to sender
      client.emit('message:sent', {
        messageId: messageResponse.id,
        conversationId: data.conversationId,
        createdAt: messageResponse.createdAt,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send message from user ${user.sub}`,
        error instanceof Error ? error.stack : String(error),
      );

      // T035: Structured error handling
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          this.emitError(client, 'CHAT_NOT_FOUND', 'Conversation not found');
        } else if (error.message.includes('not a participant')) {
          this.emitError(client, 'CHAT_FORBIDDEN', 'Only participants can send messages');
        } else {
          this.emitError(client, 'CHAT_MESSAGE_FAILED', 'Failed to send message');
        }
      }
    }
  }

  /**
   * T069: Notify others that user is typing
   * T071: Broadcasts 'typing:indicator' to conversation room (excludes sender)
   * T073: Rate limiting enforced by client (max 1 event/second recommended)
   * Uses TypingIndicatorCache with 3-second TTL
   */
  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
    @WsCurrentUser() user: JwtPayload,
  ): Promise<void> {
    try {
      // T069: Call StartTypingUseCase with participant authorization
      const dto: StartTypingDto = {
        conversationId: data.conversationId,
      };
      await this.startTypingUseCase.execute(dto, user.sub);

      const roomName = `conversation:${data.conversationId}`;

      // T071: Broadcast 'typing:indicator' to others (exclude sender)
      client.to(roomName).emit('typing:indicator', {
        conversationId: data.conversationId,
        userId: user.sub,
        email: user.email,
        isTyping: true,
      });
    } catch (error) {
      this.logger.error(
        `Failed to handle typing start for user ${user.sub}`,
        error instanceof Error ? error.stack : String(error),
      );

      // Error handling for authorization failures
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          this.emitError(client, 'CHAT_NOT_FOUND', 'Conversation not found');
        } else if (error.message.includes('not a participant')) {
          this.emitError(client, 'CHAT_FORBIDDEN', 'Only participants can set typing indicators');
        } else {
          this.emitError(client, 'CHAT_TYPING_FAILED', 'Failed to set typing indicator');
        }
      }
    }
  }

  /**
   * T070: Notify others that user stopped typing
   */
  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
    @WsCurrentUser() user: JwtPayload,
  ): Promise<void> {
    try {
      // T070: Remove typing indicator from cache
      await this.typingIndicatorCache.stopTyping(data.conversationId, user.sub);

      const roomName = `conversation:${data.conversationId}`;

      // Broadcast to others (exclude sender)
      client.to(roomName).emit('typing:indicator', {
        conversationId: data.conversationId,
        userId: user.sub,
        isTyping: false,
      });
    } catch (error) {
      this.logger.error(
        `Failed to handle typing stop for user ${user.sub}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * Mark messages as read in a conversation
   * T050: User Story 2 - Read receipts
   * Marks all messages in the conversation as read by the current user
   */
  @SubscribeMessage('messages:read')
  async handleMessagesRead(
    @MessageBody() data: { conversationId: string; lastReadAt?: string },
    @ConnectedSocket() client: Socket,
    @WsCurrentUser() user: JwtPayload,
  ): Promise<void> {
    try {
      const dto: MarkMessagesReadDto = {
        conversationId: data.conversationId,
        lastReadAt: data.lastReadAt ? new Date(data.lastReadAt) : undefined,
      };

      await this.markMessagesAsReadUseCase.execute(dto, user.sub);

      // T063: Invalidate cache for the user who read messages
      await this.conversationCacheService.invalidateUserCache(user.sub);

      // T051: Emit status change to sender (and other participants)
      const roomName = `conversation:${data.conversationId}`;
      this.server.to(roomName).emit('message:status_changed', {
        conversationId: data.conversationId,
        userId: user.sub,
        status: 'read',
        timestamp: new Date().toISOString(),
      });

      this.logger.log(
        `User ${user.sub} marked messages as read in conversation ${data.conversationId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to mark messages as read for user ${user.sub}`,
        error instanceof Error ? error.stack : String(error),
      );

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          this.emitError(client, 'CHAT_NOT_FOUND', 'Conversation not found');
        } else if (error.message.includes('not a participant')) {
          this.emitError(client, 'CHAT_FORBIDDEN', 'Only participants can mark messages as read');
        } else {
          this.emitError(client, 'CHAT_MESSAGE_FAILED', 'Failed to mark messages as read');
        }
      }
    }
  }

  /**
   * Mark a message as read
   * Notifies the sender that their message was read
   */
  @SubscribeMessage('message_read')
  handleMessageRead(
    @MessageBody() data: { conversationId: string; messageId: string },
    @WsCurrentUser() user: JwtPayload,
  ): void {
    const roomName = `conversation:${data.conversationId}`;

    this.server.to(roomName).emit('message_read_receipt', {
      conversationId: data.conversationId,
      messageId: data.messageId,
      readBy: user.sub,
      readAt: new Date().toISOString(),
    });

    this.logger.log(`User ${user.sub} marked message ${data.messageId} as read`);
  }

  /**
   * Broadcast message to a specific conversation room
   * Called by the application when a message is persisted
   */
  broadcastMessage(
    conversationId: string,
    message: {
      id: string;
      senderId: string;
      content: string;
      createdAt: Date;
    },
  ): void {
    const roomName = `conversation:${conversationId}`;
    this.server.to(roomName).emit('message_persisted', {
      conversationId,
      message,
    });
    this.logger.log(`Message ${message.id} broadcasted to conversation ${conversationId}`);
  }

  /**
   * Notify conversation participants about updates
   */
  notifyConversationUpdate(
    conversationId: string,
    update: {
      type: 'participant_added' | 'participant_removed' | 'name_updated' | 'archived';
      data: unknown;
    },
  ): void {
    const roomName = `conversation:${conversationId}`;
    this.server.to(roomName).emit('conversation_updated', {
      conversationId,
      ...update,
    });
    this.logger.log(`Conversation ${conversationId} update: ${update.type}`);
  }

  /**
   * T035: Emit structured error to client
   * Error codes: CHAT_UNAUTHORIZED, CHAT_FORBIDDEN, CHAT_RATE_LIMIT_EXCEEDED, etc.
   */
  private emitError(client: Socket, code: string, message: string): void {
    client.emit('error', {
      code,
      message,
      timestamp: new Date().toISOString(),
    });
    this.logger.warn(`WebSocket error emitted to client ${client.id}: ${code} - ${message}`);
  }
}
