import KeyvRedis, { createClient } from '@keyv/redis';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { getCacheConfig } from './cache.config';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => {
        const config = getCacheConfig();
        // return {
        //   store: await redisStore({
        //     host: config.host,
        //     port: config.port,
        //     password: config.password,
        //     db: config.db,
        //     ttl: config.ttl * 1000, // Convert to milliseconds
        //   }),
        // };
        // const redisClient = new Redis({
        //   host: config.host,
        //   port: config.port,
        //   password: config.password,
        //   db: config.db,
        // });
        const redisClient = createClient({
          socket: {
            host: config.host,
            port: config.port,
          },
          password: config.password,
          database: config.db,
          url: `redis://${config.password ? `:${config.password}@` : ''}${config.host}:${config.port}/${config.db}`,
        });
        return {
          stores: [new KeyvRedis(redisClient)],
          ttl: config.ttl * 1000, // Convert to milliseconds
        };
      },
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
