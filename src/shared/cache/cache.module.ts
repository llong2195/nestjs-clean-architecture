import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import { CacheService } from './cache.service';
import { getCacheConfig } from './cache.config';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const config = getCacheConfig();
        return {
          store: await redisStore({
            host: config.host,
            port: config.port,
            password: config.password,
            db: config.db,
            ttl: config.ttl * 1000, // Convert to milliseconds
          }),
        };
      },
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
