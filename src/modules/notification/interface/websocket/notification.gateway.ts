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
import { Logger } from '@nestjs/common';

/**
 * Notification WebSocket Gateway
 *
 * Handles real-time notification delivery to connected clients.
 * Supports room-based messaging for user-specific notifications.
 *
 * Events:
 * - join_room: Client joins their user-specific notification room
 * - leave_room: Client leaves a notification room
 * - notification: Server broadcasts a notification to user's room
 */
@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: '*', // Configure for production
  },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  /**
   * Handle client connection
   */
  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Client joins their notification room
   * Room name format: `user:{userId}`
   */
  @SubscribeMessage('join_room')
  handleJoinRoom(@MessageBody() data: { userId: string }, @ConnectedSocket() client: Socket): void {
    const roomName = `user:${data.userId}`;
    void client.join(roomName);
    this.logger.log(`Client ${client.id} joined room: ${roomName}`);
    client.emit('room_joined', { room: roomName });
  }

  /**
   * Client leaves a notification room
   */
  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const roomName = `user:${data.userId}`;
    void client.leave(roomName);
    this.logger.log(`Client ${client.id} left room: ${roomName}`);
    client.emit('room_left', { room: roomName });
  }

  /**
   * Broadcast notification to a specific user's room
   * Called by the application when a notification is created
   */
  sendNotificationToUser(
    userId: string,
    notification: {
      id: string;
      type: string;
      title: string;
      message: string;
      createdAt: Date;
    },
  ): void {
    const roomName = `user:${userId}`;
    this.server.to(roomName).emit('notification', notification);
    this.logger.log(`Notification sent to room ${roomName}: ${notification.id}`);
  }

  /**
   * Broadcast notification to all connected clients
   */
  broadcastNotification(notification: {
    id: string;
    type: string;
    title: string;
    message: string;
  }): void {
    this.server.emit('notification', notification);
    this.logger.log(`Notification broadcasted: ${notification.id}`);
  }
}
