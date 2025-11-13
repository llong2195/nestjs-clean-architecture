import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

/**
 * WebSocket Module
 *
 * Provides WebSocket infrastructure with Redis-based scaling support.
 * The Redis adapter enables message broadcasting across multiple instances.
 *
 * Usage:
 * 1. Import this module in your feature module
 * 2. Create a gateway class with @WebSocketGateway() decorator
 * 3. Use this.server.emit() for broadcasting events
 *
 * @see RedisIoAdapter for multi-instance configuration
 */
@Module({
  imports: [ConfigModule],
  exports: [],
})
export class WebSocketModule {}
