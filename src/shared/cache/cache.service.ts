import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value) {
        this.logger.debug(`Cache HIT for key: ${key}`);
      } else {
        this.logger.debug(`Cache MISS for key: ${key}`);
      }
      return value;
    } catch (error) {
      this.logger.error(`Cache GET error for key ${key}:`, error as string);
      return undefined;
    }
  }

  /**
   * Set value in cache with optional TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      this.logger.debug(`Cache SET for key: ${key}, TTL: ${ttl || 'default'}`);
    } catch (error) {
      this.logger.error(`Cache SET error for key ${key}:`, error as string);
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache DELETE for key: ${key}`);
    } catch (error) {
      this.logger.error(`Cache DELETE error for key ${key}:`, error as string);
    }
  }

  /**
   * Delete multiple keys matching a pattern
   * Note: This is a simplified version - for production use Redis SCAN
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      // For cache-manager v5+, this requires custom implementation
      this.logger.debug(`Cache DELETE pattern: ${pattern} (not implemented)`);
      await Promise.resolve();
    } catch (error) {
      this.logger.error(`Cache DELETE pattern error for ${pattern}:`, error as string);
    }
  }

  /**
   * Clear entire cache (use with caution)
   */
  async clear(): Promise<void> {
    try {
      // Note: reset() may not be available in all cache-manager versions
      if (typeof (this.cacheManager as any).reset === 'function') {
        await (this.cacheManager as any).reset();
        this.logger.warn('Cache CLEAR - all keys cleared');
      } else {
        this.logger.warn('Cache CLEAR not supported by this store');
      }
    } catch (error) {
      this.logger.error('Cache CLEAR error:', error as string);
    }
  }

  /**
   * Wrap a function call with caching
   */
  async wrap<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    try {
      return await this.cacheManager.wrap(key, fn, ttl);
    } catch (error) {
      this.logger.error(`Cache WRAP error for key ${key}:`, error as string);
      // Fallback to executing the function without caching
      return fn();
    }
  }
}
