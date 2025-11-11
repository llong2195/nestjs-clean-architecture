import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { INestApplicationContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Redis-powered Socket.IO adapter for horizontal scaling
 *
 * Enables WebSocket broadcasting across multiple application instances
 * using Redis pub/sub mechanism.
 *
 * @see https://socket.io/docs/v4/redis-adapter/
 */
export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor!: ReturnType<typeof createAdapter>;

  constructor(
    app: INestApplicationContext,
    private readonly configService: ConfigService,
  ) {
    super(app);
  }

  /**
   * Initialize Redis pub/sub clients for Socket.IO adapter
   * Must be called before server creation
   */
  async connectToRedis(): Promise<void> {
    const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get<number>('REDIS_PORT', 6379);
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD');

    const pubClient = createClient({
      socket: {
        host: redisHost,
        port: redisPort,
      },
      password: redisPassword || undefined,
    });

    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.adapterConstructor = createAdapter(pubClient, subClient);

    // Log successful connection
    console.log(`[WebSocket] Redis adapter connected to ${redisHost}:${redisPort}`);
  }

  /**
   * Create Socket.IO server with Redis adapter
   */
  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}
