import Redis from 'ioredis';
import { Wait } from 'testcontainers';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';

export class RedisTestHelper {
  private static container: StartedRedisContainer;
  private static client: Redis;

  /**
   * Start Redis container and create client
   */
  static async setupRedis(): Promise<Redis> {
    // Start Redis container
    this.container = await new RedisContainer('redis:7-alpine')
      .withExposedPorts(6379)
      .withWaitStrategy(Wait.forLogMessage('Ready to accept connections'))
      .start();

    // Create Redis client
    this.client = new Redis({
      host: this.container.getHost(),
      port: this.container.getMappedPort(6379),
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) return null;
        return Math.min(times * 50, 2000);
      },
    });

    // Wait for connection
    await this.client.ping();

    return this.client;
  }

  /**
   * Get the current Redis client instance
   */
  static getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client not initialized. Call setupRedis() first.');
    }
    return this.client;
  }

  /**
   * Get Redis connection info
   */
  static getConnectionInfo(): { host: string; port: number } {
    if (!this.container) {
      throw new Error('Redis container not started. Call setupRedis() first.');
    }
    return {
      host: this.container.getHost(),
      port: this.container.getMappedPort(6379),
    };
  }

  /**
   * Flush all data from Redis
   */
  static async flushAll(): Promise<void> {
    await this.client.flushall();
  }

  /**
   * Flush current database only
   */
  static async flushDb(): Promise<void> {
    await this.client.flushdb();
  }

  /**
   * Close Redis client and stop container
   */
  static async teardownRedis(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }

    if (this.container) {
      await this.container.stop();
    }
  }

  /**
   * Set a key with optional TTL (in seconds)
   */
  static async setKey(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setex(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  /**
   * Get a key value
   */
  static async getKey(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  /**
   * Delete a key
   */
  static async deleteKey(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * Check if key exists
   */
  static async keyExists(key: string): Promise<boolean> {
    const exists = await this.client.exists(key);
    return exists === 1;
  }
}
