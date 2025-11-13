import { Injectable } from '@nestjs/common';
import { CacheService } from '../../../../shared/cache/cache.service';
import { LoggerService } from '../../../../shared/logger/logger.service';

/**
 * Interface for session data stored in cache
 */
export interface SessionData {
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Redis-based session cache service
 * Provides fast session lookups with automatic TTL expiration
 */
@Injectable()
export class SessionCacheService {
  private readonly SESSION_PREFIX = 'session';
  private readonly USER_SESSIONS_PREFIX = 'user:sessions';

  constructor(
    private readonly cacheService: CacheService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Generate cache key for session by token
   */
  private getSessionKey(token: string): string {
    return `${this.SESSION_PREFIX}:${token}`;
  }

  /**
   * Generate cache key for user sessions list
   */
  private getUserSessionsKey(userId: string): string {
    return `${this.USER_SESSIONS_PREFIX}:${userId}`;
  }

  /**
   * Save session to Redis with TTL
   * @param sessionData Session data to cache
   * @param ttl Time to live in seconds (defaults to session expiration)
   */
  async saveSession(sessionData: SessionData, ttl?: number): Promise<void> {
    const sessionKey = this.getSessionKey(sessionData.token);

    // Calculate TTL from expiration if not provided
    const cacheTtl = ttl || this.calculateTtl(sessionData.expiresAt);

    // Save session data
    await this.cacheService.set(sessionKey, sessionData, cacheTtl);

    // Also track this session under user's sessions
    const userSessionsKey = this.getUserSessionsKey(sessionData.userId);
    const userSessions = (await this.cacheService.get<string[]>(userSessionsKey)) || [];

    if (!userSessions.includes(sessionData.token)) {
      userSessions.push(sessionData.token);
      // User sessions list should expire after the longest session TTL
      await this.cacheService.set(userSessionsKey, userSessions, cacheTtl);
    }

    this.logger.log(`Session saved for user ${sessionData.userId}`, SessionCacheService.name);
  }

  /**
   * Get session from Redis
   * @param token Session token
   * @returns Session data or undefined if not found or expired
   */
  async getSession(token: string): Promise<SessionData | undefined> {
    const sessionKey = this.getSessionKey(token);
    const session = await this.cacheService.get<SessionData>(sessionKey);

    if (session) {
      // Check if session has expired
      if (new Date(session.expiresAt) < new Date()) {
        await this.deleteSession(token);
        return undefined;
      }
    }

    return session;
  }

  /**
   * Delete session from Redis
   * @param token Session token
   */
  async deleteSession(token: string): Promise<void> {
    const session = await this.getSession(token);
    const sessionKey = this.getSessionKey(token);

    await this.cacheService.delete(sessionKey);

    // Remove from user's sessions list
    if (session) {
      const userSessionsKey = this.getUserSessionsKey(session.userId);
      const userSessions = (await this.cacheService.get<string[]>(userSessionsKey)) || [];

      const updatedSessions = userSessions.filter((t) => t !== token);
      if (updatedSessions.length > 0) {
        await this.cacheService.set(userSessionsKey, updatedSessions);
      } else {
        await this.cacheService.delete(userSessionsKey);
      }
    }

    this.logger.log(`Session deleted: ${token}`, SessionCacheService.name);
  }

  /**
   * Delete all sessions for a user
   * @param userId User ID
   */
  async deleteUserSessions(userId: string): Promise<void> {
    const userSessionsKey = this.getUserSessionsKey(userId);
    const userSessions = (await this.cacheService.get<string[]>(userSessionsKey)) || [];

    // Delete each session
    for (const token of userSessions) {
      const sessionKey = this.getSessionKey(token);
      await this.cacheService.delete(sessionKey);
    }

    // Delete the user sessions list
    await this.cacheService.delete(userSessionsKey);

    this.logger.log(`All sessions deleted for user ${userId}`, SessionCacheService.name);
  }

  /**
   * Update session expiration
   * @param token Session token
   * @param newExpiresAt New expiration date
   */
  async updateSessionExpiration(token: string, newExpiresAt: Date): Promise<void> {
    const session = await this.getSession(token);
    if (session) {
      session.expiresAt = newExpiresAt;
      const ttl = this.calculateTtl(newExpiresAt);
      await this.saveSession(session, ttl);
    }
  }

  /**
   * Calculate TTL in seconds from expiration date
   */
  private calculateTtl(expiresAt: Date): number {
    const now = new Date();
    const expiration = new Date(expiresAt);
    const ttlMs = expiration.getTime() - now.getTime();
    return Math.max(Math.floor(ttlMs / 1000), 0);
  }
}
