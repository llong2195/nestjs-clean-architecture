import { SetMetadata } from '@nestjs/common';

export const CACHEABLE_KEY = 'cacheable';

export interface CacheableOptions {
  /**
   * Cache key prefix
   */
  prefix?: string;

  /**
   * Time to live in seconds
   */
  ttl?: number;

  /**
   * Function to generate cache key from method arguments
   */
  keyGenerator?: (...args: any[]) => string;
}

/**
 * Decorator to mark a method as cacheable
 *
 * @example
 * ```typescript
 * @Cacheable({ prefix: 'user', ttl: 3600 })
 * async getUser(id: string): Promise<User> {
 *   return this.userRepository.findById(id);
 * }
 * ```
 */
export const Cacheable = (options: CacheableOptions = {}): MethodDecorator => {
  return SetMetadata(CACHEABLE_KEY, options);
};
