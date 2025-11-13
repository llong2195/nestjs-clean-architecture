import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { ConversationModule } from './modules/conversation/conversation.module';
import { FileModule } from './modules/file/file.module';
import { NotificationModule } from './modules/notification/notification.module';
import { PostModule } from './modules/post/post.module';
import { UserModule } from './modules/user/user.module';
import { CacheModule } from './shared/cache/cache.module';
import { ConfigModule } from './shared/config/config.module';
import { DatabaseModule } from './shared/database/database.module';
import { DomainEventsModule } from './shared/domain-events/domain-events.module';
import { I18nModule } from './shared/i18n/i18n.module';
import { LoggerModule } from './shared/logger/logger.module';
import { BullMQModule } from './shared/messaging/bullmq/bullmq.module';
import { KafkaModule } from './shared/messaging/kafka/kafka.module';
import { StorageModule } from './shared/storage/storage.module';
import { WebSocketModule } from './shared/websocket/websocket.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    LoggerModule,
    CacheModule,
    BullMQModule,
    KafkaModule,
    DomainEventsModule,
    I18nModule,
    StorageModule,
    // Rate limiting: 100 requests per 60 seconds per IP
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests
      },
    ]),
    AuthModule,
    UserModule,
    PostModule,
    NotificationModule,
    ConversationModule,
    FileModule,
    WebSocketModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('{*splat}');
  }
}
