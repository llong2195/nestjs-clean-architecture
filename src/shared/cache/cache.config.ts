import * as Joi from 'joi';

export interface CacheConfig {
  host: string;
  port: number;
  ttl: number;
  password?: string;
  db?: number;
}

export const cacheConfigSchema = Joi.object({
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional().allow(''),
  REDIS_DB: Joi.number().default(0),
  CACHE_TTL: Joi.number().default(3600), // 1 hour default
});

export const getCacheConfig = (): CacheConfig => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  ttl: parseInt(process.env.CACHE_TTL || '3600', 10),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0', 10),
});
