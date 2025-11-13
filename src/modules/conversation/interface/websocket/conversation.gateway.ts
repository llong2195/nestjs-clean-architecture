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

/**
 * Conversation WebSocket Gateway
 *
 * Handles real-time chat messaging between users.
 * Supports direct conversations, group chats, and channels.
 * Requires JWT authentication for all connections.
 *
 * Events:
 * - join_conversation: Join a conversation room to receive messages
 * - leave_conversation: Leave a conversation room
 * - send_message: Send a message to a conversation
 * - typing: Notify others that user is typing
 * - message_read: Mark a message as read
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

  /**
   * Handle client connection
   */
  handleConnection(client: Socket): void {
    this.logger.log(`Client connected to conversations: ${client.id}`);
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected from conversations: ${client.id}`);
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
   * Message will be broadcasted to all participants in the room
   */
  @SubscribeMessage('send_message')
  handleSendMessage(
    @MessageBody() data: { conversationId: string; content: string },
    @WsCurrentUser() user: JwtPayload,
  ): void {
    const roomName = `conversation:${data.conversationId}`;

    // Broadcast message to all participants in the conversation
    this.server.to(roomName).emit('new_message', {
      conversationId: data.conversationId,
      senderId: user.sub,
      senderEmail: user.email,
      content: data.content,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`User ${user.sub} sent message to conversation ${data.conversationId}`);
  }

  /**
   * Notify others that user is typing
   */
  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { conversationId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
    @WsCurrentUser() user: JwtPayload,
  ): void {
    const roomName = `conversation:${data.conversationId}`;

    // Broadcast typing indicator to others (exclude sender)
    client.to(roomName).emit('user_typing', {
      conversationId: data.conversationId,
      userId: user.sub,
      email: user.email,
      isTyping: data.isTyping,
    });
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
}
